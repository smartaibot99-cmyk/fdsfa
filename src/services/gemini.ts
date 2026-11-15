import { z } from 'zod';
import {
  ActivityPresetId,
  CropEntry,
  CropHealthResult,
  DeterministicScoreResult,
  EonetEvent,
  GeminiScoreOutput,
  PlaceSelection,
  PowerClimateResult,
} from '../types';
import { ACTIVITY_PRESETS } from '../lib/weights';
import { TtlCache } from '../lib/cache';

const geminiScoreCache = new TtlCache<{ thought: string; result: GeminiScoreOutput }>(
  15 * 60 * 1000
);

export const GeminiScoreSchema = z.object({
  anchorScore: z.number().min(0).max(100),
  verdict: z.enum(['Excellent', 'Good', 'Caution', 'Poor', 'Avoid']),
  confidence: z.number().min(0).max(1),
  adjustments: z.array(
    z.object({
      factor: z.string(),
      delta: z.number().min(-10).max(10),
      reason: z.string(),
    })
  ),
  summary: z.string(),
  keyDrivers: z.array(z.string()).min(1).max(5),
  recommendations: z.array(z.string()).min(1).max(6),
  dataGaps: z.array(z.string()),
});

export interface StreamGeminiCallbacks {
  onThoughtChunk: (text: string) => void;
  onResult: (output: GeminiScoreOutput) => void;
  onFallback: (reason: string) => void;
}

export async function streamAnchorGeminiScore(
  params: {
    place: PlaceSelection;
    targetDate: string;
    endDate?: string;
    activityId: ActivityPresetId;
    deterministic: DeterministicScoreResult;
    power: PowerClimateResult | null;
    nearbyEvents: EonetEvent[];
  },
  callbacks: StreamGeminiCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const cacheKey = `anchor:${params.place.lat.toFixed(2)},${params.place.lon.toFixed(2)}:${params.targetDate}:${params.endDate || ''}:${params.activityId}:${params.deterministic.dataScore}`;
  const cached = geminiScoreCache.get(cacheKey);
  if (cached) {
    if (cached.thought) callbacks.onThoughtChunk(cached.thought);
    callbacks.onResult(cached.result);
    return;
  }

  const preset = ACTIVITY_PRESETS[params.activityId];
  const payload = {
    mode: 'anchor',
    place: params.place,
    targetDate: params.targetDate,
    endDate: params.endDate,
    activityLabel: preset.label,
    deterministic: params.deterministic,
    powerSummary: params.power
      ? {
          yearsCount: params.power.yearsAnalyzed.length,
          yearsRange: `${params.power.yearsAnalyzed[0]}-${params.power.yearsAnalyzed[params.power.yearsAnalyzed.length - 1]}`,
          sampleDays: params.power.windowDays.length,
          meanMaxC: params.power.meanMaxC,
          meanMinC: params.power.meanMinC,
          meanPrecipMm: params.power.meanPrecipMm,
          meanWindMs: params.power.meanWindMs,
          meanHumidityPct: params.power.meanHumidityPct,
          meanSolarKwhM2: params.power.meanSolarKwhM2,
        }
      : null,
    nearbyEvents: params.nearbyEvents.slice(0, 6).map((e) => ({
      title: e.title,
      category: e.categories[0]?.title || 'Hazard',
      distanceKm: e.distanceKm,
      date: e.date,
    })),
  };

  try {
    const resp = await fetch('/api/gemini/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (!resp.ok || !resp.body) {
      callbacks.onFallback('AI unavailable — showing data-only score.');
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let gotFinal = false;
    let thoughtAcc = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        const lines = block.split('\n');
        let eventName = 'message';
        let dataLine = '';
        for (const line of lines) {
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          if (line.startsWith('data:')) dataLine += line.slice(5).trim();
        }
        if (!dataLine) continue;
        try {
          const parsed = JSON.parse(dataLine);
          if (eventName === 'thought' && parsed.text) {
            thoughtAcc += parsed.text;
            callbacks.onThoughtChunk(parsed.text);
          } else if (eventName === 'result') {
            const validated = GeminiScoreSchema.safeParse(parsed);
            if (validated.success) {
              gotFinal = true;
              geminiScoreCache.set(cacheKey, { thought: thoughtAcc, result: validated.data });
              callbacks.onResult(validated.data);
            } else {
              callbacks.onFallback('AI unavailable — showing data-only score.');
              gotFinal = true;
            }
          } else if (eventName === 'fallback') {
            gotFinal = true;
            callbacks.onFallback(parsed.reason || 'AI unavailable — showing data-only score.');
          }
        } catch {
          // Ignore partial JSON lines
        }
      }
    }

    if (!gotFinal) {
      callbacks.onFallback('AI unavailable — showing data-only score.');
    }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    callbacks.onFallback('AI unavailable — showing data-only score.');
  }
}

export async function streamCropHealthGeminiScore(
  params: {
    crop: CropEntry;
    power30d: PowerClimateResult | null;
    deterministic: CropHealthResult;
  },
  callbacks: StreamGeminiCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const cacheKey = `crop:${params.crop.id}:${params.power30d?.lat?.toFixed(2) ?? '0'},${params.power30d?.lon?.toFixed(2) ?? '0'}:${params.deterministic.dataScore}`;
  const cached = geminiScoreCache.get(cacheKey);
  if (cached) {
    if (cached.thought) callbacks.onThoughtChunk(cached.thought);
    callbacks.onResult(cached.result);
    return;
  }

  const payload = {
    mode: 'crop',
    crop: {
      name: params.crop.name,
      scientificName: params.crop.scientificName,
      regionName: params.crop.regionName,
      country: params.crop.country,
      idealConditions: params.crop.idealConditions,
    },
    deterministic: params.deterministic,
    powerSummary: params.power30d
      ? {
          days: params.power30d.windowDays.length,
          meanMaxC: params.power30d.meanMaxC,
          meanMinC: params.power30d.meanMinC,
          meanPrecipMm: params.power30d.meanPrecipMm,
          meanHumidityPct: params.power30d.meanHumidityPct,
          meanSolarKwhM2: params.power30d.meanSolarKwhM2,
        }
      : null,
  };

  try {
    const resp = await fetch('/api/gemini/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    if (!resp.ok || !resp.body) {
      callbacks.onFallback('AI unavailable — showing data-only score.');
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let gotFinal = false;
    let thoughtAcc = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        const lines = block.split('\n');
        let eventName = 'message';
        let dataLine = '';
        for (const line of lines) {
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          if (line.startsWith('data:')) dataLine += line.slice(5).trim();
        }
        if (!dataLine) continue;
        try {
          const parsed = JSON.parse(dataLine);
          if (eventName === 'thought' && parsed.text) {
            thoughtAcc += parsed.text;
            callbacks.onThoughtChunk(parsed.text);
          } else if (eventName === 'result') {
            const validated = GeminiScoreSchema.safeParse(parsed);
            if (validated.success) {
              gotFinal = true;
              geminiScoreCache.set(cacheKey, { thought: thoughtAcc, result: validated.data });
              callbacks.onResult(validated.data);
            } else {
              gotFinal = true;
              callbacks.onFallback('AI unavailable — showing data-only score.');
            }
          } else if (eventName === 'fallback') {
            gotFinal = true;
            callbacks.onFallback(parsed.reason || 'AI unavailable — showing data-only score.');
          }
        } catch {
          // Ignore
        }
      }
    }
    if (!gotFinal) {
      callbacks.onFallback('AI unavailable — showing data-only score.');
    }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    callbacks.onFallback('AI unavailable — showing data-only score.');
  }
}

export async function askAnchorChat(params: {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
  context: Record<string, unknown>;
  mode: 'anchor' | 'plant' | 'farm';
}): Promise<{ reply: string; isFallback?: boolean }> {
  const resp = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!resp.ok) {
    return {
      reply: "I don't have live AI access right now. Check the NASA POWER and EONET metrics shown in the panels.",
      isFallback: true,
    };
  }
  return (await resp.json()) as { reply: string; isFallback?: boolean };
}

export async function explainFarmAnalysis(params: {
  profile: Record<string, unknown>;
  report: Record<string, unknown>;
}): Promise<{
  available: boolean;
  reason?: string;
  explanation: import('../types').FarmGeminiExplanation | null;
}> {
  try {
    const resp = await fetch('/api/gemini/farm-explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!resp.ok) {
      return {
        available: false,
        reason: 'AI explanation unavailable — deterministic farm analysis remains complete.',
        explanation: null,
      };
    }
    return (await resp.json()) as {
      available: boolean;
      reason?: string;
      explanation: import('../types').FarmGeminiExplanation | null;
    };
  } catch {
    return {
      available: false,
      reason: 'AI explanation unavailable — deterministic farm analysis remains complete.',
      explanation: null,
    };
  }
}

