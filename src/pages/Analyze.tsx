import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Copy,
  Download,
  History,
  Leaf,
  Loader2,
  MessageSquare,
  Play,
  Printer,
  Search,
  SlidersHorizontal,
  Sprout,
} from 'lucide-react';
import {
  ActivityPresetId,
  AnchorAnalysis,
  EonetFetchResult,
  FactorWeights,
  GeminiScoreOutput,
  PlaceSelection,
  PowerClimateResult,
  SavedAnalysisSummary,
  StepTimelineItem,
} from '../types';
import { ACTIVITY_LIST, ACTIVITY_PRESETS, FACTOR_KEYS, FACTOR_LABELS, normalizeWeights } from '../lib/weights';
import { computeDeterministicScore } from '../lib/scoring';
import { buildCsvExport, formatCoord, getDefaultTargetDate } from '../lib/format';
import { decodeAnalysisUrl, encodeAnalysisUrl } from '../lib/urlState';
import {
  clearRecentAnalyses,
  isTourDismissed,
  loadRecentAnalyses,
  saveRecentAnalysis,
} from '../lib/storage';
import { reverseGeocode, searchPlaces } from '../services/geocode';
import { fetchNasaPowerClimatology } from '../services/nasaPower';
import { fetchEonetEvents } from '../services/eonet';
import { streamAnchorGeminiScore } from '../services/gemini';
import { ScoreGauge } from '../components/ScoreGauge';
import { ThinkingTimeline } from '../components/ThinkingTimeline';
import { FactorBars } from '../components/FactorBars';
import { MapView } from '../components/MapView';
import { ChartPanel } from '../components/ChartPanel';
import { ChatDrawer } from '../components/ChatDrawer';
import { ErrorCard } from '../components/ErrorCard';
import { ChartSkeleton, ScoreCardSkeleton } from '../components/Skeleton';
import { OnboardingTour } from '../components/OnboardingTour';
import { AIBadge } from '../components/AIBadge';
import { DataBadge } from '../components/DataBadge';
import { useToast } from '../components/Toast';
import { useMode } from '../context/ModeContext';
import { SmartFarmWorkspace } from '../components/farmAnalysis/SmartFarmWorkspace';

const DEMO_PLACE: PlaceSelection = {
  name: 'Austin, Texas',
  displayName: 'Austin, Travis County, Texas, United States',
  lat: 30.2672,
  lon: -97.7431,
  country: 'United States',
};

const INITIAL_STEPS: StepTimelineItem[] = [
  { id: 'locate', label: 'Locating place', status: 'pending' },
  { id: 'power', label: 'Fetching NASA POWER', status: 'pending' },
  { id: 'eonet', label: 'Checking EONET events', status: 'pending' },
  { id: 'subscores', label: 'Computing sub-scores', status: 'pending' },
  { id: 'gemini', label: 'Gemini reasoning', status: 'pending' },
  { id: 'final', label: 'Final score', status: 'pending' },
];

export const Analyze: React.FC = () => {
  const location = useLocation();
  const { showToast } = useToast();
  const { isPlantMode } = useMode();
  const [analysisMode, setAnalysisMode] = useState<'site' | 'farm'>(() => {
    const sp = new URLSearchParams(location.search);
    if (sp.get('mode') === 'farm') return 'farm';
    return isPlantMode ? 'farm' : 'site';
  });
  const prevPlantModeRef = useRef(isPlantMode);

  useEffect(() => {
    if (prevPlantModeRef.current !== isPlantMode) {
      prevPlantModeRef.current = isPlantMode;
      setAnalysisMode(isPlantMode ? 'farm' : 'site');
    }
  }, [isPlantMode]);

  // Inputs state
  const [place, setPlace] = useState<PlaceSelection>(DEMO_PLACE);
  const [searchInput, setSearchInput] = useState(DEMO_PLACE.name);
  const [suggestions, setSuggestions] = useState<PlaceSelection[]>([]);
  const [searchingPlace, setSearchingPlace] = useState(false);
  const [locating, setLocating] = useState(false);
  const [targetDate, setTargetDate] = useState(getDefaultTargetDate);
  const [endDate, setEndDate] = useState('');
  const [activityId, setActivityId] = useState<ActivityPresetId>('outdoor_event');
  const [weights, setWeights] = useState<FactorWeights>({
    ...ACTIVITY_PRESETS.outdoor_event.defaultWeights,
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Mobile column tab
  const [mobileTab, setMobileTab] = useState<'inputs' | 'map' | 'score'>('score');

  // Execution state
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<StepTimelineItem[]>(INITIAL_STEPS);
  const [powerData, setPowerData] = useState<PowerClimateResult | null>(null);
  const [powerError, setPowerError] = useState<string | null>(null);
  const [eonetData, setEonetData] = useState<EonetFetchResult | null>(null);
  const [eonetError, setEonetError] = useState<string | null>(null);
  const [aiOutput, setAiOutput] = useState<GeminiScoreOutput | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | undefined>(undefined);
  const [thoughtSummary, setThoughtSummary] = useState('');
  const [isStreamingThoughts, setIsStreamingThoughts] = useState(false);
  const [analysis, setAnalysis] = useState<AnchorAnalysis | null>(null);

  // Drawers, tours, recent
  const [chatOpen, setChatOpen] = useState(false);
  const [showTour, setShowTour] = useState(() => !isTourDismissed());
  const [recentList, setRecentList] = useState<SavedAnalysisSummary[]>(() => loadRecentAnalyses());

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Keyboard shortcuts: "/" focuses search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Recompute Stage 1 live whenever weights or activity change after initial fetch
  const liveDeterministic = React.useMemo(() => {
    if (!powerData && !eonetData) return null;
    return computeDeterministicScore(powerData, eonetData, activityId, weights);
  }, [powerData, eonetData, activityId, weights]);

  useEffect(() => {
    if (!analysis || !liveDeterministic) return;
    const boundedScore = analysis.ai
      ? Math.max(
          0,
          Math.min(
            100,
            Math.max(
              liveDeterministic.dataScore - 10,
              Math.min(liveDeterministic.dataScore + 10, analysis.ai.anchorScore)
            )
          )
        )
      : liveDeterministic.dataScore;

    setAnalysis((prev) =>
      prev
        ? {
            ...prev,
            activityId,
            weights: normalizeWeights(weights),
            deterministic: liveDeterministic,
            finalScore: analysis.aiAvailable ? boundedScore : liveDeterministic.dataScore,
            finalVerdict: liveDeterministic.verdict,
          }
        : null
    );
  }, [liveDeterministic]);

  const updateStep = (id: string, patch: Partial<StepTimelineItem>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const runAnalysis = async (
    targetPlace: PlaceSelection = place,
    tDate: string = targetDate,
    eDate: string = endDate,
    actId: ActivityPresetId = activityId,
    w: FactorWeights = weights
  ) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRunning(true);
    setPowerError(null);
    setEonetError(null);
    setAiOutput(null);
    setAiAvailable(false);
    setAiNotice(undefined);
    setThoughtSummary('');
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'pending' })));

    // Step 1: Locate
    const t0 = performance.now();
    updateStep('locate', { status: 'running' });
    updateStep('locate', {
      status: 'success',
      elapsedMs: Math.round(performance.now() - t0),
      detail: `${targetPlace.lat.toFixed(2)}°, ${targetPlace.lon.toFixed(2)}°`,
    });

    // Step 2 & 3: Fetch NASA POWER & EONET concurrently
    updateStep('power', { status: 'running' });
    updateStep('eonet', { status: 'running' });
    const tFetchStart = performance.now();

    let fetchedPower: PowerClimateResult | null = null;
    let fetchedEonet: EonetFetchResult | null = null;

    const [powerRes, eonetRes] = await Promise.allSettled([
      fetchNasaPowerClimatology(targetPlace.lat, targetPlace.lon, tDate, eDate || undefined, actId),
      fetchEonetEvents(targetPlace.lat, targetPlace.lon, 300),
    ]);

    const fetchMs = Math.round(performance.now() - tFetchStart);

    if (powerRes.status === 'fulfilled') {
      fetchedPower = powerRes.value;
      setPowerData(fetchedPower);
      updateStep('power', {
        status: 'success',
        elapsedMs: fetchMs,
        detail: `${fetchedPower.yearsAnalyzed.length} years · ${fetchedPower.windowDays.length} days`,
      });
    } else {
      const msg = powerRes.reason instanceof Error ? powerRes.reason.message : 'NASA POWER failed';
      setPowerData(null);
      setPowerError(msg);
      updateStep('power', { status: 'error', elapsedMs: fetchMs, error: msg });
    }

    if (eonetRes.status === 'fulfilled') {
      fetchedEonet = eonetRes.value;
      setEonetData(fetchedEonet);
      updateStep('eonet', {
        status: 'success',
        elapsedMs: fetchMs,
        detail: `${fetchedEonet.nearbyEvents.length} events within 300 km`,
      });
    } else {
      const msg = eonetRes.reason instanceof Error ? eonetRes.reason.message : 'NASA EONET failed';
      setEonetData(null);
      setEonetError(msg);
      updateStep('eonet', { status: 'error', elapsedMs: fetchMs, error: msg });
    }

    // Step 4: Deterministic Sub-scores
    const tSubStart = performance.now();
    updateStep('subscores', { status: 'running' });
    const det = computeDeterministicScore(fetchedPower, fetchedEonet, actId, w);
    updateStep('subscores', {
      status: 'success',
      elapsedMs: Math.round(performance.now() - tSubStart),
      detail: `Data Score ${det.dataScore}/100`,
    });

    const baseAnalysis: AnchorAnalysis = {
      id: `an-${Date.now()}`,
      place: targetPlace,
      targetDate: tDate,
      endDate: eDate || undefined,
      activityId: actId,
      weights: normalizeWeights(w),
      power: fetchedPower,
      eonet: fetchedEonet,
      deterministic: det,
      ai: null,
      aiThoughtSummary: '',
      aiAvailable: false,
      finalScore: det.dataScore,
      finalVerdict: det.verdict,
      finalConfidence: det.confidence,
      createdAt: new Date().toISOString(),
    };
    setAnalysis(baseAnalysis);

    // Step 5: Gemini Reasoning (SSE streaming thoughts)
    updateStep('gemini', { status: 'running' });
    setIsStreamingThoughts(true);
    const tGemStart = performance.now();

    let finalAnalysis = { ...baseAnalysis };

    await streamAnchorGeminiScore(
      {
        place: targetPlace,
        targetDate: tDate,
        endDate: eDate || undefined,
        activityId: actId,
        deterministic: det,
        power: fetchedPower,
        nearbyEvents: fetchedEonet?.nearbyEvents ?? [],
      },
      {
        onThoughtChunk: (txt) => setThoughtSummary((prev) => prev + txt),
        onResult: (out) => {
          setAiOutput(out);
          setAiAvailable(true);
          setIsStreamingThoughts(false);
          updateStep('gemini', {
            status: 'success',
            elapsedMs: Math.round(performance.now() - tGemStart),
            detail: `Adjusted to ${out.anchorScore}/100`,
          });
          finalAnalysis = {
            ...baseAnalysis,
            ai: out,
            aiAvailable: true,
            finalScore: out.anchorScore,
            finalVerdict: out.verdict,
            finalConfidence: out.confidence,
          };
          setAnalysis(finalAnalysis);
        },
        onFallback: (reason) => {
          setAiAvailable(false);
          setAiNotice(reason);
          setIsStreamingThoughts(false);
          updateStep('gemini', {
            status: 'success',
            elapsedMs: Math.round(performance.now() - tGemStart),
            detail: 'Data-only score active',
          });
          finalAnalysis = {
            ...baseAnalysis,
            aiAvailable: false,
            aiFallbackNotice: reason,
          };
          setAnalysis(finalAnalysis);
        },
      },
      controller.signal
    );

    // Step 6: Final Score
    updateStep('final', {
      status: 'success',
      elapsedMs: Math.round(performance.now() - t0),
      detail: `${finalAnalysis.finalScore}/100 (${finalAnalysis.finalVerdict})`,
    });

    const updatedRecent = saveRecentAnalysis({
      id: finalAnalysis.id,
      place: targetPlace,
      targetDate: tDate,
      endDate: eDate || undefined,
      activityId: actId,
      finalScore: finalAnalysis.finalScore,
      dataScore: det.dataScore,
      verdict: finalAnalysis.finalVerdict,
      createdAt: finalAnalysis.createdAt,
    });
    setRecentList(updatedRecent);
    setRunning(false);
  };

  // Decode URL params on mount / URL change
  useEffect(() => {
    const decoded = decodeAnalysisUrl(location.search);
    const nextPlace = decoded.place ?? DEMO_PLACE;
    const nextDate = decoded.targetDate ?? getDefaultTargetDate();
    const nextEnd = decoded.endDate ?? '';
    const nextAct = decoded.activityId ?? (isPlantMode ? 'farming' : 'outdoor_event');
    const nextWeights = decoded.weights ?? { ...ACTIVITY_PRESETS[nextAct].defaultWeights };

    setPlace(nextPlace);
    setSearchInput(nextPlace.name);
    setTargetDate(nextDate);
    setEndDate(nextEnd);
    setActivityId(nextAct);
    setWeights(nextWeights);

    if (analysisMode === 'site') {
      runAnalysis(nextPlace, nextDate, nextEnd, nextAct, nextWeights);
    }
  }, [location.search]);

  useEffect(() => {
    if (analysisMode === 'site' && !analysis && !running) {
      runAnalysis(place, targetDate, endDate, activityId, weights);
    }
  }, [analysisMode]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setSearchingPlace(true);
      try {
        const res = await searchPlaces(val);
        setSuggestions(res);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchingPlace(false);
      }
    }, 800);
  };

  const handleActivityChange = (nextId: ActivityPresetId) => {
    setActivityId(nextId);
    setWeights({ ...ACTIVITY_PRESETS[nextId].defaultWeights });
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported.', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const p = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setPlace(p);
        setSearchInput(p.name);
        setLocating(false);
        runAnalysis(p, targetDate, endDate, activityId, weights);
      },
      () => {
        setLocating(false);
        showToast('Could not read your location.', 'error');
      },
      { timeout: 8000 }
    );
  };

  const handleCopyLink = async () => {
    const url = encodeAnalysisUrl({ place, targetDate, endDate: endDate || undefined, activityId, weights });
    try {
      await navigator.clipboard.writeText(url);
      showToast('Copied analysis link!', 'success');
    } catch {
      showToast('Copy failed — use the browser address bar.', 'error');
    }
  };

  const handleExportCsv = () => {
    if (!analysis) return;
    const csv = buildCsvExport(analysis);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anchor-${place.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${targetDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported NASA data CSV!', 'success');
  };

  const handleLoadDemo = () => {
    const nextAct: ActivityPresetId = 'outdoor_event';
    const nextWeights = { ...ACTIVITY_PRESETS[nextAct].defaultWeights };
    const nextDate = getDefaultTargetDate();
    setPlace(DEMO_PLACE);
    setSearchInput(DEMO_PLACE.name);
    setTargetDate(nextDate);
    setEndDate('');
    setActivityId(nextAct);
    setWeights(nextWeights);
    runAnalysis(DEMO_PLACE, nextDate, '', nextAct, nextWeights);
  };

  const normalizedWeights = normalizeWeights(weights);

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Workspace Mode Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4 no-print">
        <div className="inline-flex p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] self-start">
          <button
            type="button"
            onClick={() => setAnalysisMode('site')}
            className={`px-4 min-h-[38px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              analysisMode === 'site'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            NASA Site Score
          </button>
          <button
            type="button"
            onClick={() => setAnalysisMode('farm')}
            className={`inline-flex items-center gap-1.5 px-4 min-h-[38px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              analysisMode === 'farm'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Smart Farm Analysis</span>
          </button>
        </div>

        <div className="text-xs text-[var(--text-secondary)]">
          {analysisMode === 'farm'
            ? '5-stage agricultural questionnaire · Profile dashboard · Evidence-grounded report'
            : '20+ year NASA POWER climatology & EONET hazard suitability score'}
        </div>
      </div>

      {analysisMode === 'farm' ? (
        <SmartFarmWorkspace />
      ) : (
        <>
      {/* Top Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)]">
            {place.name}
          </h1>
          <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
            {formatCoord(place.lat, true)} · {formatCoord(place.lon, false)} · Target {targetDate}
            {endDate ? ` to ${endDate}` : ''} · {ACTIVITY_PRESETS[activityId].label}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)] cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy link</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Download report</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!analysis}
            className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)] disabled:opacity-45 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export data</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] no-print">
        {(
          [
            { id: 'inputs', label: 'Inputs' },
            { id: 'map', label: 'Map & Charts' },
            { id: 'score', label: 'Score & AI' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMobileTab(t.id)}
            className={`min-h-[40px] rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              mobileTab === t.id
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 3-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_360px] gap-6 items-start">
        {/* LEFT COLUMN (320px): Inputs, Weights, Recent */}
        <aside
          className={`space-y-5 no-print ${mobileTab === 'inputs' ? 'block' : 'hidden lg:block'}`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runAnalysis();
            }}
            className="anchor-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-display font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                {isPlantMode && <Leaf className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />}
                <span>{isPlantMode ? 'Field Parameters' : 'Plan Parameters'}</span>
              </h2>
              <button
                type="button"
                onClick={handleLoadDemo}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Demo</span>
              </button>
            </div>

            {/* Place Search */}
            <div className="space-y-1.5 relative">
              <label htmlFor="analyze-place" className="text-xs font-medium text-[var(--text-secondary)]">
                Location <span className="font-mono text-[10px] opacity-70">(Press / to focus)</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  id="analyze-place"
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="City, park, farm, trail..."
                  className="w-full min-h-[44px] pl-9 pr-9 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
                />
                {searchingPlace && (
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)] absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-[74px] z-30 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl max-h-52 overflow-y-auto divide-y divide-[var(--border)]">
                  {suggestions.map((s, idx) => (
                    <li key={`${s.lat}-${s.lon}-${idx}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setPlace(s);
                          setSearchInput(s.name);
                          setSuggestions([]);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] cursor-pointer"
                      >
                        <div className="font-medium">{s.name}</div>
                        <div className="text-[11px] text-[var(--text-secondary)] truncate">
                          {s.displayName}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locating}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--teal)] hover:underline pt-1 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{locating ? 'Locating...' : 'Use my location'}</span>
              </button>
            </div>

            {/* Target Date & Optional End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="target-date" className="text-xs font-medium text-[var(--text-secondary)]">
                  Target Date
                </label>
                <input
                  id="target-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm font-mono text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="end-date" className="text-xs font-medium text-[var(--text-secondary)]">
                  End Date (optional range)
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  min={targetDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm font-mono text-[var(--text-primary)]"
                />
              </div>
            </div>

            {/* Activity Preset */}
            <div className="space-y-1.5">
              <label htmlFor="activity-select" className="text-xs font-medium text-[var(--text-secondary)]">
                Activity Preset
              </label>
              <select
                id="activity-select"
                value={activityId}
                onChange={(e) => handleActivityChange(e.target.value as ActivityPresetId)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] cursor-pointer"
              >
                {ACTIVITY_LIST.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
                {ACTIVITY_PRESETS[activityId].description}
              </p>
            </div>

            {/* Advanced Weight Sliders Accordion */}
            <div className="border-t border-[var(--border)] pt-3">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                aria-expanded={advancedOpen}
                className="w-full flex items-center justify-between py-1.5 text-xs font-medium text-[var(--text-primary)] cursor-pointer"
              >
                <span className="inline-flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Advanced Factor Weights</span>
                </span>
                {advancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {advancedOpen && (
                <div className="mt-3 space-y-3">
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Adjust sliders to live-update the deterministic Data Score. Weights normalize to 100%.
                  </p>
                  {FACTOR_KEYS.map((key) => {
                    const pct = Math.round(normalizedWeights[key] * 100);
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-primary)]">{FACTOR_LABELS[key]}</span>
                          <span className="font-mono tabular-nums text-[var(--teal)]">{pct}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(weights[key] * 100)}
                          onChange={(e) => {
                            const v = Number(e.target.value) / 100;
                            setWeights((prev) => ({ ...prev, [key]: v }));
                          }}
                          className="w-full accent-[var(--accent)] cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={running}
              className="w-full min-h-[44px] rounded-xl bg-[var(--accent)] text-white text-sm font-medium inline-flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-60 cursor-pointer"
            >
              {running && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {running
                  ? 'Analyzing NASA Data...'
                  : isPlantMode
                    ? 'Check my field'
                    : 'Analyze'}
              </span>
            </button>
          </form>

          {/* Recent Analyses */}
          {recentList.length > 0 && (
            <div className="anchor-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span>Recent Analyses</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    clearRecentAnalyses();
                    setRecentList([]);
                  }}
                  className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1.5">
                {recentList.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const nextW = { ...ACTIVITY_PRESETS[item.activityId].defaultWeights };
                      setPlace(item.place);
                      setSearchInput(item.place.name);
                      setTargetDate(item.targetDate);
                      setEndDate(item.endDate || '');
                      setActivityId(item.activityId);
                      setWeights(nextW);
                      runAnalysis(item.place, item.targetDate, item.endDate || '', item.activityId, nextW);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] flex items-center justify-between gap-2 text-xs cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-[var(--text-primary)] truncate">
                        {item.place.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                        {item.targetDate} · {ACTIVITY_PRESETS[item.activityId].label}
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-[var(--teal)] shrink-0">
                      {item.finalScore}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* CENTER COLUMN: Map + Charts */}
        <section
          className={`space-y-6 min-w-0 ${
            mobileTab === 'map' ? 'block' : 'hidden lg:block'
          }`}
        >
          <MapView place={place} events={eonetData?.events ?? []} />

          {eonetError && (
            <ErrorCard
              title="NASA EONET hazard feed failed"
              message={eonetError}
              onRetry={() => runAnalysis()}
            />
          )}

          {running && !powerData ? (
            <ChartSkeleton />
          ) : powerError ? (
            <ErrorCard
              title="NASA POWER climatology failed"
              message={powerError}
              onRetry={() => runAnalysis()}
            />
          ) : powerData ? (
            <ChartPanel power={powerData} activityId={activityId} />
          ) : null}

          {/* Nearby EONET Events List */}
          {eonetData && (
            <div className="anchor-card p-6 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-base font-display font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                  {isPlantMode && <Leaf className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />}
                  <span>Active Hazards Within 300 km (Last 30 Days)</span>
                </h3>
                <DataBadge dataset="NASA EONET v3" />
              </div>

              {eonetData.nearbyEvents.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  No active wildfires, severe storms, floods, or volcanic events reported within 300 km in the past 30 days.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {eonetData.nearbyEvents.map((ev) => (
                    <li key={ev.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--text-primary)] truncate">{ev.title}</div>
                        <div className="text-[var(--text-secondary)]">
                          {ev.categories.map((c) => c.title).join(', ')} ·{' '}
                          {new Date(ev.date).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="font-mono tabular-nums text-[var(--score-caution)] shrink-0">
                        {ev.distanceKm} km
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* RIGHT COLUMN (360px): Anchor Score, AI Thinking, Factor Bars, Recommendations, Ask Anchor */}
        <aside
          className={`space-y-6 ${mobileTab === 'score' ? 'block' : 'hidden lg:block'}`}
        >
          {!analysis && running ? (
            <ScoreCardSkeleton />
          ) : analysis ? (
            <>
              <ScoreGauge
                score={analysis.finalScore}
                dataScore={analysis.deterministic.dataScore}
                verdict={analysis.finalVerdict}
                confidence={analysis.finalConfidence}
                aiAvailable={analysis.aiAvailable}
                aiFallbackNotice={analysis.aiFallbackNotice}
              />

              {/* Plain-language Summary & Key Drivers */}
              <div className="anchor-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-display font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                    {isPlantMode && <Leaf className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />}
                    <span>{isPlantMode ? 'Field Summary' : 'Decision Summary'}</span>
                  </h3>
                  {analysis.aiAvailable ? <AIBadge /> : <DataBadge dataset="NASA POWER + EONET" />}
                </div>

                <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                  {analysis.ai?.summary ??
                    `Based on ${analysis.power?.yearsAnalyzed.length ?? 0} years of NASA POWER records around ${analysis.targetDate}, ${analysis.place.name} scores ${analysis.finalScore}/100 (${analysis.finalVerdict}) for ${ACTIVITY_PRESETS[analysis.activityId].label}.`}
                </p>

                {analysis.ai?.keyDrivers && analysis.ai.keyDrivers.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-[var(--text-secondary)]">
                      Key Drivers
                    </div>
                    <ul className="space-y-1 text-xs text-[var(--text-primary)] list-disc pl-4">
                      {analysis.ai.keyDrivers.map((d, idx) => (
                        <li key={idx}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setChatOpen(true)}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors text-sm font-medium inline-flex items-center justify-center gap-2 cursor-pointer no-print"
                >
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                  <span>{isPlantMode ? 'Ask Grow Guide about this field' : 'Ask Anchor about this place'}</span>
                </button>
              </div>
            </>
          ) : null}

          <ThinkingTimeline
            steps={steps}
            thoughtSummary={thoughtSummary}
            isStreamingThoughts={isStreamingThoughts}
          />

          {analysis && (
            <>
              <FactorBars
                subScores={analysis.deterministic.subScores}
                dataScore={analysis.deterministic.dataScore}
                adjustments={analysis.ai?.adjustments ?? []}
              />

              {/* Recommendations & Data Gaps */}
              <div className="anchor-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-display font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                    {isPlantMode && <Leaf className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />}
                    <span>Recommendations & Data Gaps</span>
                  </h3>
                  {analysis.aiAvailable && <AIBadge />}
                </div>

                <ul className="space-y-2 text-xs text-[var(--text-secondary)] list-disc pl-4">
                  {(analysis.ai?.recommendations ?? [
                    'Review the 20-year precipitation and wind distribution chart before finalizing outdoor logistics.',
                    'Re-check short-range local forecasts 3–5 days ahead of your target date.',
                    'Prepare shade, hydration, or rain shelter aligned with the dominant historical risk factor.',
                  ]).map((rec, i) => (
                    <li key={i} className="leading-relaxed text-[var(--text-primary)]">
                      {rec}
                    </li>
                  ))}
                </ul>

                {(analysis.ai?.dataGaps?.length || analysis.deterministic.dataGaps.length) ? (
                  <div className="pt-3 border-t border-[var(--border)] space-y-1.5">
                    <div className="text-xs font-semibold text-[var(--text-secondary)]">
                      Noted Data Gaps
                    </div>
                    <ul className="space-y-1 text-xs text-[var(--text-secondary)] list-disc pl-4">
                      {[
                        ...new Set([
                          ...analysis.deterministic.dataGaps,
                          ...(analysis.ai?.dataGaps ?? []),
                        ]),
                      ].map((gap, i) => (
                        <li key={i}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </aside>
      </div>

      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} analysis={analysis} />
      {showTour && <OnboardingTour onClose={() => setShowTour(false)} />}
        </>
      )}
    </div>
  );
};
