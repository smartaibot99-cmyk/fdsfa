import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
import {
  CropEntry,
  CropHealthResult,
  GeminiScoreOutput,
  GrowthStageKey,
  PowerClimateResult,
  StepTimelineItem,
} from '../../types';
import { fetchNasaPowerRecent30Days } from '../../services/nasaPower';
import { computeCropHealthScore } from '../../lib/cropHealth';
import { streamCropHealthGeminiScore } from '../../services/gemini';
import { GrowthTimeline } from './GrowthTimeline';
import { ConditionChart } from './ConditionChart';
import { CropHealthGauge } from './CropHealthGauge';
import { PlantChat } from './PlantChat';
import { DataBadge } from '../DataBadge';
import { ErrorCard } from '../ErrorCard';
import { ChartSkeleton } from '../Skeleton';

interface PlantProfilePanelProps {
  crop: CropEntry;
  activeStage: GrowthStageKey;
  onSelectStage: (stage: GrowthStageKey) => void;
  onClose: () => void;
}

type ProfileTab = 'overview' | 'ideal' | 'nasa' | 'health' | 'facts' | 'chat';

export const PlantProfilePanel: React.FC<PlantProfilePanelProps> = ({
  crop,
  activeStage,
  onSelectStage,
  onClose,
}) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProfileTab>('overview');
  const [power30d, setPower30d] = useState<PowerClimateResult | null>(null);
  const [powerError, setPowerError] = useState<string | null>(null);
  const [loadingPower, setLoadingPower] = useState(true);
  const [health, setHealth] = useState<CropHealthResult | null>(null);
  const [aiOutput, setAiOutput] = useState<GeminiScoreOutput | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | undefined>(undefined);
  const [thoughtSummary, setThoughtSummary] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [steps, setSteps] = useState<StepTimelineItem[]>([
    { id: 'power', label: 'Fetching NASA POWER 30d', status: 'running' },
    { id: 'score', label: 'Computing Crop Health sub-scores', status: 'pending' },
    { id: 'gemini', label: 'Gemini reasoning', status: 'pending' },
  ]);

  const loadFarmData = async () => {
    setLoadingPower(true);
    setPowerError(null);
    setAiOutput(null);
    setAiAvailable(false);
    setAiNotice(undefined);
    setThoughtSummary('');

    const t0 = performance.now();
    setSteps([
      { id: 'power', label: 'Fetching NASA POWER 30d', status: 'running' },
      { id: 'score', label: 'Computing Crop Health sub-scores', status: 'pending' },
      { id: 'gemini', label: 'Gemini reasoning', status: 'pending' },
    ]);

    try {
      const p30 = await fetchNasaPowerRecent30Days(crop.lat, crop.lon);
      setPower30d(p30);
      const tPower = Math.round(performance.now() - t0);

      const t1 = performance.now();
      const det = computeCropHealthScore(crop, p30);
      setHealth(det);
      const tScore = Math.round(performance.now() - t1);

      setSteps([
        {
          id: 'power',
          label: 'Fetching NASA POWER 30d',
          status: 'success',
          elapsedMs: tPower,
          detail: `${p30.windowDays.length} days loaded`,
        },
        {
          id: 'score',
          label: 'Computing Crop Health sub-scores',
          status: 'success',
          elapsedMs: tScore,
          detail: `Data Score ${det.dataScore}/100`,
        },
        { id: 'gemini', label: 'Gemini reasoning', status: 'running' },
      ]);

      setIsStreaming(true);
      const t2 = performance.now();
      await streamCropHealthGeminiScore(
        { crop, power30d: p30, deterministic: det },
        {
          onThoughtChunk: (chunk) => setThoughtSummary((prev) => prev + chunk),
          onResult: (res) => {
            setAiOutput(res);
            setAiAvailable(true);
            setIsStreaming(false);
            setSteps((prev) =>
              prev.map((s) =>
                s.id === 'gemini'
                  ? {
                      ...s,
                      status: 'success',
                      elapsedMs: Math.round(performance.now() - t2),
                      detail: `AI-Adjusted ${res.anchorScore}/100`,
                    }
                  : s
              )
            );
          },
          onFallback: (reason) => {
            setAiAvailable(false);
            setAiNotice(reason);
            setIsStreaming(false);
            setSteps((prev) =>
              prev.map((s) =>
                s.id === 'gemini'
                  ? {
                      ...s,
                      status: 'success',
                      elapsedMs: Math.round(performance.now() - t2),
                      detail: 'Data-only score active',
                    }
                  : s
              )
            );
          },
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to reach NASA POWER';
      setPowerError(msg);
      const det = computeCropHealthScore(crop, null);
      setHealth(det);
      setSteps([
        { id: 'power', label: 'Fetching NASA POWER 30d', status: 'error', error: msg },
        { id: 'score', label: 'Computing Crop Health sub-scores', status: 'error', error: 'No NASA POWER data' },
        { id: 'gemini', label: 'Gemini reasoning', status: 'pending' },
      ]);
    } finally {
      setLoadingPower(false);
    }
  };

  useEffect(() => {
    loadFarmData();
  }, [crop.id]);

  const handleAnalyzeMyFarm = () => {
    const sp = new URLSearchParams({
      name: `${crop.regionName} (${crop.name})`,
      display: `${crop.regionName}, ${crop.country}`,
      lat: crop.lat.toFixed(4),
      lon: crop.lon.toFixed(4),
      activity: 'farming',
    });
    navigate(`/analyze?${sp.toString()}`);
  };

  const tabs: Array<{ id: ProfileTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'ideal', label: 'Ideal' },
    { id: 'nasa', label: 'Live NASA' },
    { id: 'health', label: 'Health Score' },
    { id: 'facts', label: 'Facts & Uses' },
    { id: 'chat', label: 'Ask' },
  ];

  const tempData = (power30d?.windowDays ?? []).map((d) => ({ date: d.date, value: d.tMeanC }));
  const precipData = (power30d?.windowDays ?? []).map((d) => ({ date: d.date, value: d.precipMm }));
  const solarData = (power30d?.windowDays ?? []).map((d) => ({
    date: d.date,
    value: d.solarKwhM2 !== null ? Number((d.solarKwhM2 * 1.45).toFixed(1)) : null,
  }));
  const humData = (power30d?.windowDays ?? []).map((d) => ({ date: d.date, value: d.humidityPct }));

  return (
    <aside
      aria-label="Plant Profile panel"
      className="fixed z-30 bottom-0 left-0 right-0 md:left-auto md:top-16 md:bottom-0 md:w-[420px] max-h-[74vh] md:max-h-none bg-[var(--bg-surface)] border-t md:border-t-0 md:border-l border-[var(--border)] shadow-2xl flex flex-col rounded-t-2xl md:rounded-none"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">{crop.icon}</span>
            <h2 className="text-lg font-display font-bold text-[var(--text-primary)]">
              {crop.name}
            </h2>
          </div>
          <p className="text-xs italic text-[var(--text-secondary)]">
            {crop.scientificName} · {crop.regionName}, {crop.country}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Plant Profile"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 border-b border-[var(--border)] flex items-center gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              tab === t.id
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="text-xs text-[var(--text-secondary)] space-y-1">
              <p><strong className="text-[var(--text-primary)]">Family:</strong> {crop.family}</p>
              <p><strong className="text-[var(--text-primary)]">Origin:</strong> {crop.origin}</p>
            </div>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{crop.description}</p>
            <GrowthTimeline
              stages={crop.growthStages}
              activeStage={activeStage}
              onSelectStage={onSelectStage}
            />
          </div>
        )}

        {tab === 'ideal' && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3">
              <div className="text-[var(--text-secondary)]">Ideal Temperature</div>
              <div className="font-mono font-semibold text-sm text-[var(--text-primary)] mt-1">
                {crop.idealConditions.tempMinC}–{crop.idealConditions.tempMaxC} °C
              </div>
            </div>
            <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3">
              <div className="text-[var(--text-secondary)]">Annual Rainfall</div>
              <div className="font-mono font-semibold text-sm text-[var(--text-primary)] mt-1">
                {crop.idealConditions.annualRainfallMmMin}–{crop.idealConditions.annualRainfallMmMax} mm
              </div>
            </div>
            <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3">
              <div className="text-[var(--text-secondary)]">Daily Sunlight</div>
              <div className="font-mono font-semibold text-sm text-[var(--text-primary)] mt-1">
                {crop.idealConditions.sunlightHoursMin}–{crop.idealConditions.sunlightHoursMax} hrs/day
              </div>
            </div>
            <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3">
              <div className="text-[var(--text-secondary)]">Water Need</div>
              <div className="font-semibold text-sm text-[var(--text-primary)] mt-1">
                {crop.idealConditions.waterNeed}
              </div>
            </div>
            <div className="col-span-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3 space-y-1">
              <div className="text-[var(--text-secondary)]">Soil & pH</div>
              <div className="font-medium text-[var(--text-primary)]">
                {crop.idealConditions.soilType} · pH {crop.idealConditions.soilPhMin}–{crop.idealConditions.soilPhMax}
              </div>
            </div>
            <div className="col-span-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3 space-y-1">
              <div className="text-[var(--text-secondary)]">Season & Maturity</div>
              <div className="font-medium text-[var(--text-primary)]">
                {crop.idealConditions.growingSeason} · {crop.idealConditions.daysToHarvest}
              </div>
            </div>
          </div>
        )}

        {tab === 'nasa' && (
          <div className="space-y-3">
            {loadingPower && <ChartSkeleton />}
            {powerError && (
              <ErrorCard
                title="NASA POWER unavailable"
                message={powerError}
                onRetry={loadFarmData}
              />
            )}
            {!loadingPower && power30d && (
              <>
                <ConditionChart
                  title="Mean Temperature (30 days)"
                  unit="°C"
                  data={tempData}
                  idealMin={crop.idealConditions.tempMinC}
                  idealMax={crop.idealConditions.tempMaxC}
                  color="#F97316"
                />
                <ConditionChart
                  title="Daily Precipitation (30 days)"
                  unit="mm"
                  data={precipData}
                  idealMin={Number((crop.idealConditions.annualRainfallMmMin / 365).toFixed(1))}
                  idealMax={Number((crop.idealConditions.annualRainfallMmMax / 365).toFixed(1))}
                  color="#22C7B8"
                />
                <ConditionChart
                  title="Estimated Sunlight Hours (from Solar)"
                  unit="h"
                  data={solarData}
                  idealMin={crop.idealConditions.sunlightHoursMin}
                  idealMax={crop.idealConditions.sunlightHoursMax}
                  color="#F5B83D"
                />
                <ConditionChart
                  title="Relative Humidity (30 days)"
                  unit="%"
                  data={humData}
                  idealMin={40}
                  idealMax={80}
                  color="#4C8DFF"
                />
              </>
            )}
          </div>
        )}

        {tab === 'health' && (
          <div>
            {loadingPower && <ChartSkeleton />}
            {!loadingPower && health && (
              <CropHealthGauge
                cropName={crop.name}
                deterministic={health}
                ai={aiOutput}
                aiAvailable={aiAvailable}
                aiFallbackNotice={aiNotice}
                steps={steps}
                thoughtSummary={thoughtSummary}
                isStreaming={isStreaming}
              />
            )}
          </div>
        )}

        {tab === 'facts' && (
          <div className="space-y-4 text-xs">
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">3 Curated Facts</h3>
              <ul className="space-y-2 list-disc pl-4 text-[var(--text-secondary)]">
                {crop.funFacts.map((f, i) => (
                  <li key={i} className="leading-relaxed">{f}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3.5 space-y-1.5">
              <div className="font-semibold text-[var(--text-primary)]">Main Producing Countries</div>
              <p className="text-[var(--text-secondary)]">{crop.producingCountries.join(' · ')}</p>
            </div>

            <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3.5 space-y-1.5">
              <div className="font-semibold text-[var(--text-primary)]">Nutrition Highlights</div>
              <p className="text-[var(--text-secondary)] leading-relaxed">{crop.nutritionHighlights}</p>
            </div>

            <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--text-primary)]">NASA Satellite Monitoring</span>
                <DataBadge dataset="MODIS / Landsat / SMAP / GPM" />
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">{crop.nasaMonitoring}</p>
            </div>
          </div>
        )}

        {tab === 'chat' && (
          <PlantChat crop={crop} power30d={power30d} health={health} />
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={handleAnalyzeMyFarm}
          className="w-full inline-flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-95 transition-opacity cursor-pointer"
        >
          <span>Analyze my farm ({crop.regionName})</span>
          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};
