import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Droplets,
  HeartHandshake,
  Leaf,
  Loader2,
  MapPin,
  MessageSquare,
  Sparkles,
  Sun,
  Thermometer,
  Trees,
  X,
} from 'lucide-react';
import {
  CropEntry,
  CropHealthResult,
  GeminiScoreOutput,
  GrowthStageKey,
  PlaceSelection,
  PowerClimateResult,
  SeasonKey,
  StepTimelineItem,
} from '../../types';
import { fetchNasaPowerRecent30Days } from '../../services/nasaPower';
import { streamCropHealthGeminiScore } from '../../services/gemini';
import { computeGrowScore } from '../../lib/growScore';
import { GrowthTimeline } from './GrowthTimeline';
import { ConditionChart } from './ConditionChart';
import { GrowScoreGauge } from './GrowScoreGauge';
import { ThinkingTimeline } from './ThinkingTimeline';
import { PlantChat } from './PlantChat';
import { DataBadge } from '../DataBadge';

export type ProfileTabId = 'overview' | 'ideal' | 'live' | 'score' | 'facts' | 'benefits';

interface PlantProfilePanelProps {
  crop: CropEntry;
  location: PlaceSelection;
  treeSeason: SeasonKey;
  onChangeTreeSeason: (cropId: string, season: SeasonKey) => void;
  onClose: () => void;
}

const TABS: Array<{ id: ProfileTabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'ideal', label: 'Ideal' },
  { id: 'live', label: 'Live NASA' },
  { id: 'score', label: 'Grow Score' },
  { id: 'facts', label: 'Facts & Uses' },
  { id: 'benefits', label: 'Benefits' },
];

const SEASONS: Array<{ key: SeasonKey; label: string; emoji: string }> = [
  { key: 'spring', label: 'Spring', emoji: '🌸' },
  { key: 'summer', label: 'Summer', emoji: '☀️' },
  { key: 'autumn', label: 'Autumn', emoji: '🍂' },
  { key: 'winter', label: 'Winter', emoji: '❄️' },
];

const INITIAL_GROW_STEPS: StepTimelineItem[] = [
  { id: 'fetch', label: 'Fetching NASA data', status: 'pending' },
  { id: 'compare', label: 'Comparing to ideal range', status: 'pending' },
  { id: 'gemini', label: 'Gemini reasoning', status: 'pending' },
  { id: 'score', label: 'Score', status: 'pending' },
];

export const PlantProfilePanel: React.FC<PlantProfilePanelProps> = ({
  crop,
  location,
  treeSeason,
  onChangeTreeSeason,
  onClose,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTabId>('overview');
  const [activeStage, setActiveStage] = useState<GrowthStageKey>('vegetative');
  const [chatOpen, setChatOpen] = useState(false);

  // Live NASA POWER 30-day & Grow Score state
  const [power30d, setPower30d] = useState<PowerClimateResult | null>(null);
  const [powerLoading, setPowerLoading] = useState(true);
  const [powerError, setPowerError] = useState<string | null>(null);
  const [growResult, setGrowResult] = useState<CropHealthResult | null>(null);
  const [aiOutput, setAiOutput] = useState<GeminiScoreOutput | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiFallbackNotice, setAiFallbackNotice] = useState<string | undefined>(undefined);
  const [thoughtSummary, setThoughtSummary] = useState('');
  const [isStreamingThoughts, setIsStreamingThoughts] = useState(false);
  const [steps, setSteps] = useState<StepTimelineItem[]>(INITIAL_GROW_STEPS);

  // Mobile bottom-sheet swipe-down gesture
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const dragStartY = useRef<number | null>(null);

  const updateStep = (id: string, patch: Partial<StepTimelineItem>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const loadPlantData = async () => {
      setPowerLoading(true);
      setPowerError(null);
      setAiOutput(null);
      setAiAvailable(false);
      setAiFallbackNotice(undefined);
      setThoughtSummary('');
      setSteps(INITIAL_GROW_STEPS.map((s) => ({ ...s, status: 'pending' })));

      updateStep('fetch', { status: 'running' });
      try {
        const res30 = await fetchNasaPowerRecent30Days(location.lat, location.lon);
        if (cancelled) return;
        setPower30d(res30);
        setPowerLoading(false);
        updateStep('fetch', {
          status: 'success',
          detail: `${res30.windowDays.length} days`,
        });

        updateStep('compare', { status: 'running' });
        const stage1 = computeGrowScore(crop, res30);
        setGrowResult(stage1);
        updateStep('compare', {
          status: 'success',
          detail: `${stage1.dataScore}/100`,
        });

        updateStep('gemini', { status: 'running' });
        setIsStreamingThoughts(true);
        let finalScoreVal = stage1.dataScore;

        await streamCropHealthGeminiScore(
          { crop, power30d: res30, deterministic: stage1 },
          {
            onThoughtChunk: (txt) => {
              if (!cancelled) setThoughtSummary((p) => p + txt);
            },
            onResult: (out) => {
              if (cancelled) return;
              setAiOutput(out);
              setAiAvailable(true);
              setIsStreamingThoughts(false);
              finalScoreVal = out.anchorScore;
              updateStep('gemini', { status: 'success', detail: `Adjusted to ${out.anchorScore}` });
            },
            onFallback: (reason) => {
              if (cancelled) return;
              setAiAvailable(false);
              setAiFallbackNotice(reason);
              setIsStreamingThoughts(false);
              updateStep('gemini', { status: 'success', detail: 'Data-only mode' });
            },
          },
          controller.signal
        );

        if (!cancelled) {
          updateStep('score', { status: 'success', detail: `${finalScoreVal}/100` });
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'NASA POWER unavailable';
        setPowerError(msg);
        setPowerLoading(false);
        updateStep('fetch', { status: 'error', detail: 'Failed' });
      }
    };

    loadPlantData();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [crop.id, location.lat, location.lon]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const dates = power30d?.windowDays.map((d) => d.date) ?? [];
  const tMaxSeries = power30d?.windowDays.map((d) => d.tMaxC) ?? [];
  const tMinSeries = power30d?.windowDays.map((d) => d.tMinC) ?? [];
  const precipSeries = power30d?.windowDays.map((d) => d.precipMm) ?? [];
  const sunSeries =
    power30d?.windowDays.map((d) => (d.solarKwhM2 !== null ? Number((d.solarKwhM2 * 1.45).toFixed(1)) : null)) ?? [];
  const humSeries = power30d?.windowDays.map((d) => d.humidityPct) ?? [];

  const handleCheckField = () => {
    const sp = new URLSearchParams({
      name: location.name,
      display: location.displayName,
      lat: location.lat.toFixed(4),
      lon: location.lon.toFixed(4),
      activity: 'farming',
    });
    navigate(`/analyze?${sp.toString()}`);
  };

  return (
    <aside
      role="dialog"
      aria-label={`${crop.name} profile panel`}
      style={{
        transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
        transition: dragStartY.current ? 'none' : 'transform 220ms ease-out',
      }}
      className="fixed bottom-0 left-0 right-0 md:left-auto md:top-16 md:bottom-0 md:w-[420px] max-h-[86vh] md:max-h-none z-40 rounded-t-[24px] md:rounded-t-none md:rounded-l-[20px] border-t md:border-t-0 md:border-l border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Mobile swipe-down handle */}
      <div
        className="md:hidden flex justify-center pt-2.5 pb-1 touch-none cursor-grab"
        onPointerDown={(e) => {
          dragStartY.current = e.clientY;
        }}
        onPointerMove={(e) => {
          if (dragStartY.current === null) return;
          const dy = Math.max(0, e.clientY - dragStartY.current);
          setDragOffsetY(dy);
        }}
        onPointerUp={() => {
          if (dragOffsetY > 95) {
            onClose();
          }
          dragStartY.current = null;
          setDragOffsetY(0);
        }}
        onPointerCancel={() => {
          dragStartY.current = null;
          setDragOffsetY(0);
        }}
      >
        <span className="w-11 h-1.5 rounded-full bg-[var(--border)]" />
      </div>

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">
              {crop.icon}
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-display font-bold text-[var(--text-primary)] truncate">
                {crop.name}
              </h2>
              <p className="text-[11px] italic text-[var(--text-secondary)] truncate">
                {crop.scientificName} · {crop.family}
              </p>
            </div>
          </div>
          <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-mono text-[var(--teal)]">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[280px]">{location.name}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close plant profile"
          className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tree Season Slider (only shown for trees) */}
      {(crop.kind === 'tree' || crop.treeDetails) && (
        <div className="px-5 py-2.5 bg-[var(--bg-elevated)] border-b border-[var(--border)] space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
              <Trees className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Tree Season Slider</span>
            </span>
            <span className="font-mono text-[var(--text-secondary)] capitalize">{treeSeason}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {SEASONS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onChangeTreeSeason(crop.id, s.key)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-medium border transition-colors cursor-pointer ${
                  treeSeason === s.key
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
                }`}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6 Tabs */}
      <div
        role="tablist"
        aria-label="Plant profile sections"
        className="px-4 py-2 border-b border-[var(--border)] flex items-center gap-1 overflow-x-auto shrink-0"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === t.id
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">
              {crop.description}
            </p>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 space-y-1">
              <div className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Highlights & Role</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {crop.nutritionHighlights}
              </p>
            </div>

            <GrowthTimeline
              stages={crop.growthStages}
              activeStage={activeStage}
              onSelectStage={setActiveStage}
              accentColor={crop.color}
            />
          </div>
        )}

        {activeTab === 'ideal' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                <div className="text-[11px] text-[var(--text-secondary)] inline-flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-[var(--sun)]" />
                  <span>Ideal Temp</span>
                </div>
                <div className="text-sm font-mono font-semibold text-[var(--text-primary)] mt-1">
                  {crop.idealConditions.tempMinC}–{crop.idealConditions.tempMaxC} °C
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                <div className="text-[11px] text-[var(--text-secondary)] inline-flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-[var(--sky)]" />
                  <span>Rainfall / yr</span>
                </div>
                <div className="text-sm font-mono font-semibold text-[var(--text-primary)] mt-1">
                  {crop.idealConditions.annualRainfallMmMin}–{crop.idealConditions.annualRainfallMmMax} mm
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                <div className="text-[11px] text-[var(--text-secondary)] inline-flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-[var(--sun)]" />
                  <span>Sunlight</span>
                </div>
                <div className="text-sm font-mono font-semibold text-[var(--text-primary)] mt-1">
                  {crop.idealConditions.sunlightHoursMin}–{crop.idealConditions.sunlightHoursMax} h/day
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                <div className="text-[11px] text-[var(--text-secondary)]">Water Need</div>
                <div className="text-sm font-semibold text-[var(--text-primary)] mt-1">
                  {crop.idealConditions.waterNeed}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 space-y-1.5 text-xs">
              <div>
                <span className="text-[var(--text-secondary)]">Soil: </span>
                <span className="font-medium text-[var(--text-primary)]">
                  {crop.idealConditions.soilType} (pH {crop.idealConditions.soilPhMin}–{crop.idealConditions.soilPhMax})
                </span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Season: </span>
                <span className="font-medium text-[var(--text-primary)]">
                  {crop.idealConditions.growingSeason}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Days to Maturity: </span>
                <span className="font-medium text-[var(--text-primary)]">
                  {crop.idealConditions.daysToHarvest}
                </span>
              </div>
            </div>

            {crop.treeDetails && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 space-y-2 text-xs">
                <div className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                  <Trees className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Tree Characteristics</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[11px] text-[var(--text-secondary)]">Mature Height</div>
                    <div className="font-medium text-[var(--text-primary)]">{crop.treeDetails.height}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--text-secondary)]">Lifespan</div>
                    <div className="font-medium text-[var(--text-primary)]">{crop.treeDetails.lifespan}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--text-secondary)]">Leaf Shape</div>
                    <div className="font-medium text-[var(--text-primary)]">{crop.treeDetails.leafShape}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--text-secondary)]">CO₂ Uptake</div>
                    <div className="font-medium text-[var(--accent)]">{crop.treeDetails.co2AbsorbedKgPerYear}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'live' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--text-secondary)]">
                Past 30 days at {location.name.split(',')[0]}
              </span>
              <DataBadge dataset="NASA POWER AG (30d)" />
            </div>

            {powerLoading ? (
              <div className="py-10 flex flex-col items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                <span>Fetching live NASA POWER 30-day agroclimatology...</span>
              </div>
            ) : powerError ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-xs text-[#DC2626]">
                {powerError}
              </div>
            ) : power30d ? (
              <div className="space-y-3">
                <ConditionChart
                  title="Daily Temperature (T2M_MAX / T2M_MIN)"
                  parameter="T2M_MAX / T2M_MIN"
                  unit="°C"
                  dates={dates}
                  values={tMaxSeries}
                  secondaryValues={tMinSeries}
                  idealMin={crop.idealConditions.tempMinC}
                  idealMax={crop.idealConditions.tempMaxC}
                  strokeColor="#EA580C"
                  latestSummary={`Avg high ${power30d.meanMaxC ?? '--'} °C · low ${power30d.meanMinC ?? '--'} °C`}
                />

                <ConditionChart
                  title="Daily Rainfall (PRECTOTCORR)"
                  parameter="PRECTOTCORR"
                  unit="mm/day"
                  dates={dates}
                  values={precipSeries}
                  idealMin={Number((crop.idealConditions.annualRainfallMmMin / 365).toFixed(1))}
                  idealMax={Number(((crop.idealConditions.annualRainfallMmMax / 365) * 2).toFixed(1))}
                  strokeColor="#38BDF8"
                  mode="bar"
                  latestSummary={`Avg ${power30d.meanPrecipMm ?? '--'} mm/day`}
                />

                <ConditionChart
                  title="Daily Sunlight (ALLSKY_SFC_SW_DWN)"
                  parameter="ALLSKY_SFC_SW_DWN"
                  unit="h/day"
                  dates={dates}
                  values={sunSeries}
                  idealMin={crop.idealConditions.sunlightHoursMin}
                  idealMax={crop.idealConditions.sunlightHoursMax}
                  strokeColor="#F4B942"
                  latestSummary={`Avg ${
                    power30d.meanSolarKwhM2 !== null
                      ? (power30d.meanSolarKwhM2 * 1.45).toFixed(1)
                      : '--'
                  } h/day`}
                />

                <ConditionChart
                  title="Relative Humidity (RH2M)"
                  parameter="RH2M"
                  unit="%"
                  dates={dates}
                  values={humSeries}
                  idealMin={crop.idealConditions.waterNeed === 'Low' ? 25 : 40}
                  idealMax={crop.idealConditions.waterNeed === 'High' ? 90 : 80}
                  strokeColor="#1F8A8A"
                  latestSummary={`Avg ${power30d.meanHumidityPct ?? '--'}%`}
                />
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'score' && (
          <div className="space-y-4">
            {powerLoading || !growResult ? (
              <div className="py-10 flex flex-col items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                <span>Computing Grow Score from NASA POWER...</span>
              </div>
            ) : (
              <>
                <GrowScoreGauge
                  cropName={crop.name}
                  deterministic={growResult}
                  aiOutput={aiOutput}
                  aiAvailable={aiAvailable}
                  aiFallbackNotice={aiFallbackNotice}
                />
                <ThinkingTimeline
                  steps={steps}
                  thoughtSummary={thoughtSummary}
                  isStreamingThoughts={isStreamingThoughts}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'facts' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-2">
              <div className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--sun)]" />
                <span>Fun Facts</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] list-disc pl-4">
                {crop.funFacts.map((fact, idx) => (
                  <li key={idx} className="leading-relaxed text-[var(--text-primary)]">
                    {fact}
                  </li>
                ))}
              </ul>
            </div>

            {crop.uses && crop.uses.length > 0 && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-2">
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  Practical Uses
                </div>
                <ul className="space-y-1 text-xs text-[var(--text-primary)] list-disc pl-4">
                  {crop.uses.map((u, idx) => (
                    <li key={idx}>{u}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--text-primary)]">
                  How NASA Satellites Track This
                </span>
                <DataBadge dataset="MODIS / SMAP / POWER" />
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">{crop.nasaMonitoring}</p>
            </div>
          </div>
        )}

        {activeTab === 'benefits' && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <HeartHandshake className="w-4 h-4 text-[var(--accent)]" />
                <span>Ecological & Farm Benefits</span>
              </div>

              {crop.benefits ? (
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
                    <div className="font-semibold text-[var(--text-primary)]">Shade & Microclimate</div>
                    <p className="text-[var(--text-secondary)] mt-0.5 leading-relaxed">{crop.benefits.shade}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
                    <div className="font-semibold text-[var(--text-primary)]">Soil Health & Erosion</div>
                    <p className="text-[var(--text-secondary)] mt-0.5 leading-relaxed">{crop.benefits.soilHealth}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
                    <div className="font-semibold text-[var(--text-primary)]">Pollinators & Biodiversity</div>
                    <p className="text-[var(--text-secondary)] mt-0.5 leading-relaxed">{crop.benefits.pollinators}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
                    <div className="font-semibold text-[var(--accent)]">Carbon & Climate Impact</div>
                    <p className="text-[var(--text-primary)] mt-0.5 leading-relaxed font-medium">{crop.benefits.co2PerYear}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {crop.nutritionHighlights}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Inline Grounded AI Plant Chat */}
        {chatOpen && (
          <PlantChat
            crop={crop}
            location={location}
            power30d={power30d}
            growScore={growResult}
            onClose={() => setChatOpen(false)}
          />
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => setChatOpen((v) => !v)}
          className="flex-1 min-h-[42px] px-3 rounded-xl border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Ask about this plant</span>
        </button>

        <button
          type="button"
          onClick={handleCheckField}
          className="flex-1 min-h-[42px] px-3 rounded-xl bg-[var(--accent)] text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:opacity-95 cursor-pointer"
        >
          <span>Check my field</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
