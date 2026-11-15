import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createMapsRouter } from './server/mapsRouter';
import { createMyFarmsRouter } from './server/myFarmsRouter';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Simple server-side 15-minute in-memory TTL cache
const serverCache = new Map<string, { value: unknown; expiresAt: number }>();
function getCached<T>(key: string): T | null {
  const hit = serverCache.get(key);
  if (!hit || Date.now() > hit.expiresAt) {
    serverCache.delete(key);
    return null;
  }
  return hit.value as T;
}
function setCached(key: string, value: unknown, ttlMs = 15 * 60 * 1000) {
  serverCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

const GeminiOutputSchema = z.object({
  anchorScore: z.number().min(0).max(100),
  verdict: z.enum(['Excellent', 'Good', 'Caution', 'Poor', 'Avoid']),
  confidence: z.number().min(0).max(1),
  adjustments: z.array(
    z.object({
      factor: z.string(),
      delta: z.number(),
      reason: z.string(),
    })
  ),
  summary: z.string(),
  keyDrivers: z.array(z.string()),
  recommendations: z.array(z.string()),
  dataGaps: z.array(z.string()),
});

function clampVerdict(score: number): 'Excellent' | 'Good' | 'Caution' | 'Poor' | 'Avoid' {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Caution';
  if (score >= 30) return 'Poor';
  return 'Avoid';
}

const SCORE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    anchorScore: { type: Type.NUMBER, description: 'Final score 0-100 within +/- 10 of deterministic dataScore.' },
    verdict: { type: Type.STRING, description: 'One of Excellent, Good, Caution, Poor, Avoid' },
    confidence: { type: Type.NUMBER, description: '0 to 1 confidence score' },
    adjustments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          factor: { type: Type.STRING },
          delta: { type: Type.NUMBER, description: 'Adjustment points (-10 to +10)' },
          reason: { type: Type.STRING },
        },
        required: ['factor', 'delta', 'reason'],
      },
    },
    summary: { type: Type.STRING, description: 'Plain-language summary, max 60 words.' },
    keyDrivers: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    dataGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    'anchorScore',
    'verdict',
    'confidence',
    'adjustments',
    'summary',
    'keyDrivers',
    'recommendations',
    'dataGaps',
  ],
};

// Track per-model 429 quota cooldowns so exhausted models aren't hammered repeatedly
const modelCooldownUntil = new Map<string, number>();

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.toLowerCase().includes('quota')
  );
}

function getAvailableScoreModels(): Array<{ model: string; withThoughts: boolean }> {
  const now = Date.now();
  const candidates: Array<{ model: string; withThoughts: boolean }> = [
    { model: 'gemini-4-hydrogen', withThoughts: true },
    { model: 'gemini-3.1-flash-lite', withThoughts: false },
  ];
  return candidates.filter((c) => (modelCooldownUntil.get(c.model) ?? 0) <= now);
}

function buildScoreCacheKey(body: Record<string, unknown>): string {
  const mode = String(body.mode ?? 'anchor');
  if (mode === 'crop') {
    const crop = (body.crop ?? {}) as Record<string, unknown>;
    const det = (body.deterministic ?? {}) as Record<string, unknown>;
    const ps = (body.powerSummary ?? {}) as Record<string, unknown>;
    return `gemini-score:crop:${crop.name}:${det.dataScore}:${ps.meanMaxC}:${ps.meanPrecipMm}`;
  }
  const place = (body.place ?? {}) as Record<string, unknown>;
  const det = (body.deterministic ?? {}) as Record<string, unknown>;
  return `gemini-score:anchor:${place.lat}:${place.lon}:${body.targetDate}:${body.endDate ?? ''}:${body.activityLabel}:${det.dataScore}`;
}

const QUOTA_FALLBACK_REASON =
  'AI free-tier daily quota reached — showing verified NASA data-only score. Attach a billing-enabled API key in Settings > Secrets for unlimited AI reasoning.';

// Stage 2 Gemini Reasoning (streaming SSE with thought summaries + zod validation + model fallback + cache)
app.post('/api/gemini/score', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const body = (req.body || {}) as Record<string, unknown>;
  const cacheKey = buildScoreCacheKey(body);
  const cachedScore = getCached<{ thoughts: string; output: Record<string, unknown> }>(cacheKey);
  if (cachedScore) {
    if (cachedScore.thoughts) {
      sendEvent('thought', { text: cachedScore.thoughts });
    }
    sendEvent('result', cachedScore.output);
    res.end();
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    sendEvent('fallback', { reason: 'AI unavailable — showing data-only score.' });
    res.end();
    return;
  }

  const availableModels = getAvailableScoreModels();
  if (availableModels.length === 0) {
    sendEvent('fallback', { reason: QUOTA_FALLBACK_REASON });
    res.end();
    return;
  }

  const detObj = (body.deterministic ?? {}) as Record<string, unknown>;
  const dataScore = Number(detObj.dataScore ?? 50);

  const systemInstruction =
    body.mode === 'crop'
      ? `You are Anchor, an agricultural Earth-observation explainer grounded strictly in the provided NASA POWER data and curated crop biology.
Rules:
1. NEVER invent numbers or cite measurements not present in the input JSON.
2. You may adjust deterministic.dataScore by at most +/- 10 points total, and every adjustment must state a specific data-backed reason.
3. Keep "summary" under 60 words in plain, calm language.
4. Provide 3 keyDrivers and 3-5 practical recommendations for the farmer.`
      : `You are Anchor, a transparent Earth-observation decision analyst grounded strictly in the provided NASA POWER 20+ year climatology and NASA EONET v3 natural hazard events.
Rules:
1. NEVER invent weather numbers, locations, or events not present in the input JSON.
2. You may adjust deterministic.dataScore by at most +/- 10 points total (for interactions like combined heat+humidity, extreme nearby hazard compounding, or activity sensitivity), and every adjustment must cite a specific metric from the input.
3. Keep "summary" under 60 words in plain language answering how suitable the place and date are and why.
4. Provide top 3 keyDrivers and 3-5 actionable recommendations.`;

  const promptText = `Evaluate this NASA Earth observation payload and Stage 1 deterministic sub-scores:\n${JSON.stringify(body)}`;

  const runModel = async (model: string, streamThoughts: boolean) => {
    const config: Record<string, unknown> = {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: SCORE_RESPONSE_SCHEMA,
    };

    if (model === 'gemini-4-hydrogen') {
      config.thinkingConfig = {
        includeThoughts: streamThoughts,
        thinkingLevel: ThinkingLevel.LOW,
      };
    }

    let streamedThoughts = '';

    if (streamThoughts && model === 'gemini-4-hydrogen') {
      const stream = await ai.models.generateContentStream({
        model,
        contents: promptText,
        config,
      });

      let fullText = '';
      for await (const chunk of stream) {
        const parts = chunk.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          const p = part as { thought?: boolean; text?: string };
          if (p.thought && p.text) {
            streamedThoughts += p.text;
            sendEvent('thought', { text: p.text });
          } else if (p.text) {
            fullText += p.text;
          }
        }
        if (parts.length === 0 && chunk.text) {
          fullText += chunk.text;
        }
      }
      return { rawJsonText: fullText, streamedThoughts };
    }

    const resp = await ai.models.generateContent({
      model,
      contents: promptText,
      config,
    });
    return { rawJsonText: resp.text ?? '', streamedThoughts };
  };

  let parsed: z.infer<typeof GeminiOutputSchema> | null = null;
  let capturedThoughts = '';
  let hitQuota = false;

  for (const candidate of availableModels) {
    try {
      const { rawJsonText, streamedThoughts } = await runModel(candidate.model, candidate.withThoughts);
      capturedThoughts = streamedThoughts;
      try {
        const obj = JSON.parse(rawJsonText.trim());
        const check = GeminiOutputSchema.safeParse(obj);
        if (check.success) {
          parsed = check.data;
          break;
        }
      } catch {
        // Retry once cleanly without streaming thoughts
        const retryRes = await runModel(candidate.model, false);
        try {
          const obj2 = JSON.parse(retryRes.rawJsonText.trim());
          const check2 = GeminiOutputSchema.safeParse(obj2);
          if (check2.success) {
            parsed = check2.data;
            break;
          }
        } catch {
          // Move on to next model
        }
      }
    } catch (err) {
      if (isQuotaError(err)) {
        hitQuota = true;
        // Put exhausted model into 15-minute cooldown so we avoid repeated 429s
        modelCooldownUntil.set(candidate.model, Date.now() + 15 * 60 * 1000);
        continue;
      }
      console.warn(
        `Gemini score fallback (${candidate.model}):`,
        err instanceof Error ? err.message.slice(0, 180) : 'unavailable'
      );
    }
  }

  if (!parsed) {
    sendEvent('fallback', {
      reason: hitQuota ? QUOTA_FALLBACK_REASON : 'AI unavailable — showing data-only score.',
    });
    res.end();
    return;
  }

  // Clamp adjustments & anchorScore strictly within +/-10 of Stage 1 dataScore
  const clampedAdjustments = parsed.adjustments.slice(0, 4).map((adj) => ({
    factor: adj.factor,
    delta: Math.max(-10, Math.min(10, Math.round(adj.delta))),
    reason: adj.reason,
  }));
  const rawTotalDelta = clampedAdjustments.reduce((s, a) => s + a.delta, 0);
  const boundedDelta = Math.max(-10, Math.min(10, rawTotalDelta));
  const requestedScore = Math.round(parsed.anchorScore);
  const finalClampedScore = Math.max(
    0,
    Math.min(100, Math.max(dataScore - 10, Math.min(dataScore + 10, requestedScore || dataScore + boundedDelta)))
  );

  const finalOutput = {
    ...parsed,
    anchorScore: finalClampedScore,
    verdict: clampVerdict(finalClampedScore),
    confidence: Math.max(0.1, Math.min(1, Number(parsed.confidence.toFixed(2)))),
    adjustments: clampedAdjustments,
    keyDrivers: parsed.keyDrivers.slice(0, 3),
    recommendations: parsed.recommendations.slice(0, 5),
  };

  setCached(cacheKey, { thoughts: capturedThoughts, output: finalOutput }, 30 * 60 * 1000);
  sendEvent('result', finalOutput);
  res.end();
});

const FarmExplanationSchema = z.object({
  plainLanguageSummary: z.string(),
  questionnaireRecap: z.string(),
  sectionHighlights: z.array(
    z.object({
      sectionKey: z.string(),
      plainLanguageExplanation: z.string(),
    })
  ),
  questionsForLocalAdvisor: z.array(z.string()),
});

const FARM_EXPLAIN_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    plainLanguageSummary: { type: Type.STRING },
    questionnaireRecap: { type: Type.STRING },
    sectionHighlights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sectionKey: { type: Type.STRING },
          plainLanguageExplanation: { type: Type.STRING },
        },
        required: ['sectionKey', 'plainLanguageExplanation'],
      },
    },
    questionsForLocalAdvisor: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'plainLanguageSummary',
    'questionnaireRecap',
    'sectionHighlights',
    'questionsForLocalAdvisor',
  ],
};

// Bounded Gemini explanation endpoint for Smart Farm Analysis (never modifies deterministic findings)
app.post('/api/gemini/farm-explain', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    res.json({
      available: false,
      reason: 'Gemini AI unavailable — showing deterministic farm analysis.',
      explanation: null,
    });
    return;
  }

  const availableModels = getAvailableScoreModels();
  if (availableModels.length === 0) {
    res.json({
      available: false,
      reason: QUOTA_FALLBACK_REASON,
      explanation: null,
    });
    return;
  }

  const body = (req.body || {}) as Record<string, unknown>;
  const cacheKey = `farm-explain:${JSON.stringify(body).slice(0, 320)}:${JSON.stringify(body).length}`;
  const cached = getCached<z.infer<typeof FarmExplanationSchema>>(cacheKey);
  if (cached) {
    res.json({ available: true, explanation: cached });
    return;
  }

  const systemInstruction = `You are Anchor's educational agricultural explainer.
STRICT SCIENTIFIC INTEGRITY RULES:
1. You are ONLY explaining the pre-computed deterministic farm analysis and farmer-provided profile JSON below.
2. NEVER invent soil measurements, pH numbers, water quantities, crop yields, suitability scores, or scientific thresholds not explicitly present in the input.
3. NEVER recommend any crop listed in excludedRestrictedCrops.
4. NEVER contradict deterministic findings or claim missing/unknown data is favourable.
5. Keep language calm, clear, and easy for any farmer to understand.
6. Provide plainLanguageSummary (max 90 words), questionnaireRecap (max 70 words), sectionHighlights for sections A-H (1-2 concise sentences each), and 3 practical questionsForLocalAdvisor.`;

  const promptText = `Explain this saved farmer profile and deterministic farm analysis without changing any deterministic facts:\n${JSON.stringify(body)}`;

  let hitQuota = false;
  for (const candidate of availableModels) {
    try {
      const config: Record<string, unknown> = {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: FARM_EXPLAIN_RESPONSE_SCHEMA,
      };
      if (candidate.model === 'gemini-4-hydrogen') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      const response = await ai.models.generateContent({
        model: candidate.model,
        contents: promptText,
        config,
      });

      const obj = JSON.parse((response.text ?? '{}').trim());
      const validated = FarmExplanationSchema.safeParse(obj);
      if (validated.success) {
        const clean: z.infer<typeof FarmExplanationSchema> = {
          plainLanguageSummary: validated.data.plainLanguageSummary,
          questionnaireRecap: validated.data.questionnaireRecap,
          sectionHighlights: validated.data.sectionHighlights.slice(0, 8),
          questionsForLocalAdvisor: validated.data.questionsForLocalAdvisor.slice(0, 4),
        };
        setCached(cacheKey, clean, 20 * 60 * 1000);
        res.json({ available: true, explanation: clean });
        return;
      }
    } catch (err) {
      if (isQuotaError(err)) {
        hitQuota = true;
        modelCooldownUntil.set(candidate.model, Date.now() + 15 * 60 * 1000);
        continue;
      }
      console.warn(
        `Gemini farm-explain fallback (${candidate.model}):`,
        err instanceof Error ? err.message.slice(0, 180) : 'unavailable'
      );
    }
  }

  res.json({
    available: false,
    reason: hitQuota
      ? QUOTA_FALLBACK_REASON
      : 'AI explanation temporarily unavailable — deterministic farm analysis remains complete.',
    explanation: null,
  });
});

// Grounded Ask Anchor / Plant / Farm Chat endpoint
app.post('/api/gemini/chat', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    res.json({
      reply:
        "I don't have live Gemini AI access right now. You can inspect all verified NASA POWER climatology, EONET hazard numbers, and deterministic farm recommendations directly in the panels.",
      isFallback: true,
    });
    return;
  }

  const availableModels = getAvailableScoreModels();
  if (availableModels.length === 0) {
    res.json({
      reply:
        'Live AI chat reached the free-tier daily request quota. You can continue exploring all verified NASA data and deterministic farm recommendations in the interface, or select a billing-enabled API key in Settings > Secrets.',
      isFallback: true,
    });
    return;
  }

  const { message, history, context, mode } = req.body || {};
  const systemInstruction =
    mode === 'farm'
      ? `You are Anchor's Smart Farm educational assistant.
STRICT GROUNDING RULES:
1. Answer ONLY from the farmer's saved profile, deterministic Farm Analysis sections (A-H), and NASA POWER/EONET context provided below.
2. Distinguish clearly between farmer-reported inputs, NASA regional data, and general agricultural guidance.
3. NEVER invent soil measurements, nutrient levels, crop yields, irrigation quantities, or recommend any restricted crop.
4. If information is missing or untested in the context, state clearly what is missing and suggest verifying via testing rather than guessing.
5. Keep answers clear, farmer-friendly, and under 130 words.

VERIFIED FARM CONTEXT:
${JSON.stringify(context ?? {})}`
      : mode === 'plant'
        ? `You are Anchor's agricultural assistant.
STRICT GROUNDING RULES:
1. Answer ONLY from the provided curated crop biology and NASA POWER 30-day data context below.
2. Cite which dataset or source each claim comes from (e.g., "NASA POWER (T2M)", "Curated Crop Profile").
3. If the user asks about something not covered by the context (e.g., local market prices, unlisted chemicals, or missing telemetry), say "I don't have data for that" instead of guessing.
4. Keep answers concise (under 110 words).

VERIFIED CONTEXT:
${JSON.stringify(context ?? {})}`
        : `You are Ask Anchor, a decision-support assistant grounded strictly in NASA Earth observation data.
STRICT GROUNDING RULES:
1. Answer ONLY from the provided NASA POWER climatology, NASA EONET natural hazard events, and Anchor Score breakdown below.
2. Cite which NASA dataset each numeric claim comes from (e.g., "NASA POWER (PRECTOTCORR)", "NASA EONET v3").
3. If asked about data outside the provided context (e.g. hourly forecasts, local venue rules, unmeasured pollutants), explicitly say "I don't have data for that" instead of guessing.
4. Keep answers clear, direct, and under 120 words.

VERIFIED ANALYSIS CONTEXT:
${JSON.stringify(context ?? {})}`;

  const contents = [
    ...(Array.isArray(history) ? history : []).map((h: { role: string; text: string }) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    })),
    { role: 'user', parts: [{ text: String(message || '') }] },
  ];

  for (const candidate of availableModels) {
    try {
      const config: Record<string, unknown> = { systemInstruction };
      if (candidate.model === 'gemini-4-hydrogen') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      const response = await ai.models.generateContent({
        model: candidate.model,
        contents,
        config,
      });

      res.json({
        reply: response.text || "I don't have data for that.",
        isFallback: false,
      });
      return;
    } catch (err) {
      if (isQuotaError(err)) {
        modelCooldownUntil.set(candidate.model, Date.now() + 15 * 60 * 1000);
        continue;
      }
      console.warn(
        `Gemini chat fallback (${candidate.model}):`,
        err instanceof Error ? err.message.slice(0, 180) : 'unavailable'
      );
    }
  }

  res.json({
    reply:
      "I couldn't reach live Gemini AI right now (or the free-tier daily quota was reached). Please refer to the verified NASA POWER, EONET, and deterministic farm analysis cards.",
    isFallback: true,
  });
});

// NASA APOD proxy (keeps NASA_API_KEY server-side, falls back to DEMO_KEY)
app.get('/api/nasa/apod', async (_req, res) => {
  const cached = getCached('apod');
  if (cached) return res.json(cached);

  try {
    const resp = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) throw new Error(`APOD HTTP ${resp.status}`);
    const data = await resp.json();
    const payload = { ...data, fetchedAt: new Date().toISOString() };
    setCached('apod', payload);
    res.json(payload);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'APOD unavailable' });
  }
});

// NASA NeoWs proxy
app.get('/api/nasa/neows', async (_req, res) => {
  const cached = getCached('neows');
  if (cached) return res.json(cached);

  try {
    const today = new Date().toISOString().slice(0, 10);
    const resp = await fetch(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_API_KEY}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!resp.ok) throw new Error(`NeoWs HTTP ${resp.status}`);
    const data = await resp.json();
    const list = (data?.near_earth_objects?.[today] ?? []) as Array<{
      name?: string;
      is_potentially_hazardous_asteroid?: boolean;
      close_approach_data?: Array<{ miss_distance?: { kilometers?: string } }>;
    }>;
    let closestName: string | undefined;
    let closestKm: number | undefined;
    for (const neo of list) {
      const dist = Number(neo.close_approach_data?.[0]?.miss_distance?.kilometers);
      if (!Number.isNaN(dist) && (closestKm === undefined || dist < closestKm)) {
        closestKm = Math.round(dist);
        closestName = neo.name;
      }
    }
    const summary = {
      elementCount: Number(data?.element_count ?? list.length),
      hazardousCount: list.filter((n) => n.is_potentially_hazardous_asteroid).length,
      closestApproachName: closestName,
      closestDistanceKm: closestKm,
      fetchedAt: new Date().toISOString(),
    };
    setCached('neows', summary);
    res.json(summary);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'NeoWs unavailable' });
  }
});

// NASA DONKI notifications proxy
app.get('/api/nasa/donki', async (_req, res) => {
  const cached = getCached('donki');
  if (cached) return res.json(cached);

  try {
    const end = new Date().toISOString().slice(0, 10);
    const startDt = new Date();
    startDt.setUTCDate(startDt.getUTCDate() - 14);
    const start = startDt.toISOString().slice(0, 10);
    const resp = await fetch(
      `https://api.nasa.gov/DONKI/notifications?startDate=${start}&endDate=${end}&type=all&api_key=${NASA_API_KEY}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!resp.ok) throw new Error(`DONKI HTTP ${resp.status}`);
    const data = await resp.json();
    const sliced = Array.isArray(data) ? data.slice(0, 6) : [];
    setCached('donki', sliced);
    res.json(sliced);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'DONKI unavailable' });
  }
});

// CelesTrak GP JSON proxy with bundled fallback
const TRACKED_NORAD_IDS = new Set([
  25544, 25994, 27424, 28376, 37849, 43013, 39084, 49260, 39574, 40376, 43613,
]);

app.get('/api/tle', async (_req, res) => {
  const cached = getCached('tle');
  if (cached) return res.json(cached);

  try {
    const resp = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json', {
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) throw new Error(`CelesTrak HTTP ${resp.status}`);
    const all = (await resp.json()) as Array<{ NORAD_CAT_ID?: number }>;
    const filtered = all.filter((r) => TRACKED_NORAD_IDS.has(Number(r.NORAD_CAT_ID)));
    if (filtered.length < 5) throw new Error('Incomplete CelesTrak list');
    const bundle = {
      records: filtered,
      isFallback: false,
      fetchedAt: new Date().toISOString(),
    };
    setCached('tle', bundle);
    res.json(bundle);
  } catch {
    try {
      const fbPath = path.resolve(__dirname, 'public', 'tle-fallback.json');
      const raw = fs.readFileSync(fbPath, 'utf8');
      const records = JSON.parse(raw);
      res.json({
        records,
        isFallback: true,
        fetchedAt: new Date().toISOString(),
      });
    } catch {
      res.status(502).json({ error: 'Satellite orbital data unavailable' });
    }
  }
});

// Field Shift Maps & Geospatial Workspace backend routes
app.use('/api/maps', createMapsRouter());
app.use('/api/my-farms', createMyFarmsRouter());

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

if (!isProduction) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Anchor server running on http://0.0.0.0:${PORT}`);
});
