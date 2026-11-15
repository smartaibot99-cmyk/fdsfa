import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Save } from 'lucide-react';
import {
  AgriculturalChallenge,
  AgriculturalPriority,
  AnnualGrowingCycles,
  DrainageRate,
  FarmProfile,
  FertiliserType,
  GrowingSeasonOption,
  IrrigationFrequency,
  IrrigationMethod,
  PlanningHorizon,
  RainfallFrequency,
  SoilMoistureStatus,
  SoilMoistureUnit,
  SoilPhStatus,
  SoilPreparationMethod,
  SoilTexture,
  WateringMethod,
  WaterQualityTestStatus,
  WaterReliability,
  WaterSource,
} from '../../types';
import {
  getChallengesOverview,
  getCropHistoryOverview,
  getCyclesAndSeasonOverview,
  getDrainageOverview,
  getFertiliserOverview,
  getIrrigationFrequencyOverview,
  getIrrigationMethodOverview,
  getPlannedCropsOverview,
  getPlanningHorizonOverview,
  getPrioritiesOverview,
  getRainfallFrequencyOverview,
  getRestrictedCropsOverview,
  getSoilMoistureOverview,
  getSoilPhOverview,
  getSoilPrepOverview,
  getSoilTextureOverview,
  getStage1AreaOverview,
  getStage1LocationOverview,
  getWateringMethodOverview,
  getWaterQualityOverview,
  getWaterSourceAndAvailabilityOverview,
} from '../../lib/farmContextOverviews';
import { ContextualOverviewPanel } from './ContextualOverviewPanel';
import { CropSearchSelector } from './CropSearchSelector';
import { FarmLocationPicker } from './FarmLocationPicker';

interface FarmQuestionnaireProps {
  profile: FarmProfile;
  onChange: (next: FarmProfile) => void;
  onSaveProgress: () => void;
  onFinishToDashboard: () => void;
}

const STAGES = [
  { num: 1 as const, title: 'Farm Information', subtitle: 'Name, location & total area' },
  { num: 2 as const, title: 'Soil Characteristics', subtitle: 'Texture, moisture, pH & drainage' },
  { num: 3 as const, title: 'Water & Irrigation', subtitle: 'Sources, reliability & system' },
  { num: 4 as const, title: 'Crop History & Rotation', subtitle: 'Past 3 cycles, planned & restrictions' },
  { num: 5 as const, title: 'Planning & Priorities', subtitle: 'Horizon, cycles, seasons & challenges' },
];

const SOIL_TEXTURES: SoilTexture[] = [
  'Sandy',
  'Loamy sand',
  'Sandy loam',
  'Loam',
  'Silt loam',
  'Clay loam',
  'Clay',
  'Unknown',
];

const DRAINAGE_OPTIONS: DrainageRate[] = [
  'Very slowly',
  'Slowly',
  'Moderately',
  'Quickly',
  'Very quickly',
  'Unknown',
];

const PREP_METHODS: SoilPreparationMethod[] = [
  'Ploughing / Tilling',
  'Harrowing',
  'Compost / Organic fertiliser',
  'Chemical fertilisers',
  'Raised beds',
  'No regular preparation',
  'Other',
];

const WATER_SOURCES: WaterSource[] = [
  'Groundwater / Well',
  'River / Stream',
  'Reservoir',
  'Canal',
  'Rainwater collection',
  'Recycled water',
  'Other',
  'Unknown',
];

const RELIABILITY_OPTIONS: WaterReliability[] = [
  'Always available',
  'Usually available',
  'Sometimes limited',
  'Frequently limited',
  'Highly unreliable',
  'Unknown',
];

const WATERING_METHODS: WateringMethod[] = [
  'Rain-fed agriculture',
  'Artificial irrigation',
  'Hybrid (rainfall and irrigation)',
];

const IRRIGATION_METHODS: IrrigationMethod[] = [
  'Drip irrigation',
  'Sprinkler irrigation',
  'Flood irrigation',
  'Furrow irrigation',
  'Manual watering',
  'Other',
  'Unknown',
];

const IRRIGATION_FREQUENCIES: IrrigationFrequency[] = [
  'Multiple times daily',
  'Once daily',
  'Every 2–3 days',
  'Weekly',
  'Every two weeks',
  'Seasonally / Irregularly',
  'Only when required',
  'Unknown',
];

const RAINFALL_FREQUENCIES: RainfallFrequency[] = [
  'Almost daily',
  'Several times weekly',
  'Weekly',
  'Several times monthly',
  'Monthly',
  'Rarely',
  'Almost never',
  'Unknown',
];

const FERTILISER_TYPES: FertiliserType[] = [
  'Organic fertilisers',
  'Chemical fertilisers',
  'Both',
  'Neither',
  'Unknown',
];

const PLANNING_HORIZONS: PlanningHorizon[] = [
  'Next growing cycle',
  'Next season',
  'Next 6 months',
  'Next year',
  'Next 2–3 years',
  'Next 5 years',
];

const PRIORITIES: AgriculturalPriority[] = [
  'Water conservation',
  'Improving soil health',
  'Climate resistance',
  'Crop suitability',
  'Maximising crop yield',
  'Reducing farming costs',
  'Long-term sustainability',
];

const ANNUAL_CYCLES: AnnualGrowingCycles[] = ['1', '2', '3', '4+', 'Not fixed'];

const GROWING_SEASONS: GrowingSeasonOption[] = [
  'Winter',
  'Spring',
  'Summer',
  'Autumn',
  'Year-round',
  'Depends on the crop',
];

const CHALLENGES: AgriculturalChallenge[] = [
  'Water scarcity',
  'Poor soil fertility',
  'Unpredictable rainfall',
  'Extreme temperatures',
  'Soil drainage problems',
  'Low crop yields',
  'Pest and disease management',
  'High irrigation costs',
  'Other',
];

function toggleMulti<T extends string>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export const FarmQuestionnaire: React.FC<FarmQuestionnaireProps> = ({
  profile,
  onChange,
  onSaveProgress,
  onFinishToDashboard,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const stage = profile.currentStage;
  const activeStageMeta = STAGES.find((s) => s.num === stage) ?? STAGES[0];

  const setStage = (nextStage: 1 | 2 | 3 | 4 | 5) => {
    setValidationError(null);
    const completed = Array.from(new Set([...profile.completedStages, stage]));
    onChange({
      ...profile,
      currentStage: nextStage,
      completedStages: completed,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateCurrentStage = (): string | null => {
    if (stage === 1) {
      if (!profile.location.farmName.trim()) {
        return 'Please enter a farm or field name before continuing.';
      }
      if (profile.areaValue !== null && profile.areaValue < 0) {
        return 'Farming area cannot be negative.';
      }
    }
    if (stage === 2) {
      if (profile.soil.preparationMethods.includes('Other') && !profile.soil.preparationOther.trim()) {
        return 'Please specify your "Other" soil preparation method.';
      }
    }
    if (stage === 3) {
      if (profile.water.sources.includes('Other') && !profile.water.sourcesOther.trim()) {
        return 'Please specify your "Other" water source.';
      }
      if (
        profile.water.irrigationMethod === 'Other' &&
        !profile.water.irrigationMethodOther.trim()
      ) {
        return 'Please specify your "Other" irrigation method.';
      }
    }
    if (stage === 5) {
      if (profile.planning.challenges.length > 0 && !profile.planning.primaryChallenge) {
        return 'Please identify one Primary Challenge from your selected challenges.';
      }
      if (profile.planning.challenges.includes('Other') && !profile.planning.challengeOther.trim()) {
        return 'Please describe your "Other" agricultural challenge.';
      }
    }
    return null;
  };

  const handleContinue = () => {
    const err = validateCurrentStage();
    if (err) {
      setValidationError(err);
      return;
    }
    if (stage < 5) {
      setStage((stage + 1) as 1 | 2 | 3 | 4 | 5);
    } else {
      const completed = Array.from(new Set([...profile.completedStages, 5]));
      onChange({ ...profile, completedStages: completed });
      onFinishToDashboard();
    }
  };

  const handleBack = () => {
    setValidationError(null);
    if (stage > 1) {
      onChange({ ...profile, currentStage: (stage - 1) as 1 | 2 | 3 | 4 | 5 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const showIrrigation =
    profile.water.wateringMethod === 'Artificial irrigation' ||
    profile.water.wateringMethod === 'Hybrid (rainfall and irrigation)';
  const showRainfall =
    profile.water.wateringMethod === 'Rain-fed agriculture' ||
    profile.water.wateringMethod === 'Hybrid (rainfall and irrigation)';

  return (
    <div className="space-y-6">
      {/* 5-Stage Progress Indicator */}
      <nav aria-label="Questionnaire stages" className="anchor-card p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {STAGES.map((st) => {
            const isCurrent = st.num === stage;
            const isDone = profile.completedStages.includes(st.num) && !isCurrent;
            return (
              <button
                key={st.num}
                type="button"
                onClick={() => {
                  setValidationError(null);
                  onChange({ ...profile, currentStage: st.num });
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-[var(--bg-elevated)] border-[var(--accent)] text-[var(--text-primary)]'
                    : isDone
                      ? 'bg-[var(--bg-surface)] border-[var(--teal)]/50 text-[var(--text-primary)] hover:border-[var(--accent)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-semibold shrink-0 ${
                    isCurrent
                      ? 'bg-[var(--accent)] text-white'
                      : isDone
                        ? 'bg-[var(--teal)] text-white'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : st.num}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{st.title}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] truncate">{st.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Stage Heading */}
      <div className="anchor-card p-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div>
            <div className="text-xs font-mono text-[var(--teal)]">
              Stage {stage} of 5
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[var(--text-primary)] mt-0.5">
              {activeStageMeta.title}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {stage === 1 && 'Identify your farm and its approximate location and cultivated size.'}
              {stage === 2 && 'Share what you know about your topsoil, moisture, pH, drainage, and field prep.'}
              {stage === 3 && 'Describe water sources, reliability, quality tests, and how water reaches your crops.'}
              {stage === 4 && 'List your past three growing cycles, active/planned crops, restrictions, and fertiliser practices.'}
              {stage === 5 && 'Set your planning timeframe, priorities, seasonal cadence, and biggest farming challenges.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onSaveProgress}
            className="inline-flex items-center justify-center gap-1.5 px-4 min-h-[42px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-primary)] shrink-0 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Save progress</span>
          </button>
        </div>

        {/* STAGE 1 */}
        {stage === 1 && (
          <div className="space-y-8">
            {/* Q1 */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="farm-name-input" className="block text-sm font-semibold text-[var(--text-primary)]">
                    1. Farm name & location
                  </label>
                  <input
                    id="farm-name-input"
                    type="text"
                    value={profile.location.farmName}
                    onChange={(e) =>
                      onChange({
                        ...profile,
                        location: { ...profile.location, farmName: e.target.value },
                      })
                    }
                    placeholder="e.g. North Valley Plot A, Green Ridge Farm..."
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
                  />
                </div>

                <FarmLocationPicker
                  value={profile.location}
                  onChange={(loc) => onChange({ ...profile, location: loc })}
                />
              </div>

              <ContextualOverviewPanel overview={getStage1LocationOverview(profile)} />
            </div>

            <hr className="border-[var(--border)]" />

            {/* Q2 */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="farm-area-number" className="block text-sm font-semibold text-[var(--text-primary)]">
                    2. Total farming area
                  </label>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Use the slider for 0–100+ or type any exact figure for larger farms.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    id="farm-area-number"
                    type="number"
                    min={0}
                    step="0.1"
                    value={profile.areaValue ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? null : Math.max(0, Number(e.target.value));
                      onChange({ ...profile, areaValue: v !== null && Number.isNaN(v) ? null : v });
                    }}
                    placeholder="e.g. 12.5"
                    className="w-36 min-h-[44px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm font-mono tabular-nums text-[var(--text-primary)]"
                  />

                  <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1">
                    {(['acres', 'hectares'] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => onChange({ ...profile, areaUnit: u })}
                        className={`px-3.5 min-h-[36px] rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          profile.areaUnit === u
                            ? 'bg-[var(--accent)] text-white'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <input
                    type="range"
                    aria-label="Farming area slider"
                    min={0}
                    max={100}
                    step={0.5}
                    value={Math.min(100, profile.areaValue ?? 0)}
                    onChange={(e) => onChange({ ...profile, areaValue: Number(e.target.value) })}
                    className="w-full accent-[var(--accent)] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
                    <span>0 {profile.areaUnit}</span>
                    <span>50 {profile.areaUnit}</span>
                    <span>100+ {profile.areaUnit}</span>
                  </div>
                </div>
              </div>

              <ContextualOverviewPanel overview={getStage1AreaOverview(profile)} />
            </div>
          </div>
        )}

        {/* STAGE 2 */}
        {stage === 2 && (
          <div className="space-y-8">
            {/* Q3: Soil Texture */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">3. Primary soil texture</div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Select the texture closest to your topsoil. Descriptions show general texture traits, not farm-specific lab results.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SOIL_TEXTURES.map((tx) => {
                    const active = profile.soil.texture === tx;
                    return (
                      <button
                        key={tx}
                        type="button"
                        onClick={() =>
                          onChange({ ...profile, soil: { ...profile.soil, texture: tx } })
                        }
                        className={`px-3 min-h-[44px] rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                          active
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                            : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]'
                        }`}
                      >
                        {tx}
                      </button>
                    );
                  })}
                </div>
              </div>
              <ContextualOverviewPanel overview={getSoilTextureOverview(profile)} />
            </div>

            <hr className="border-[var(--border)]" />

            {/* Q4: Current soil moisture */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">4. Current soil moisture</div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Specify whether moisture was measured with an instrument, estimated by feel, or not measured.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'measured', label: 'Measured (sensor / lab)' },
                      { id: 'estimated', label: 'Estimated (by hand / feel)' },
                      { id: 'unknown', label: 'Unknown / Not measured' },
                    ] as Array<{ id: SoilMoistureStatus; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...profile,
                          soil: {
                            ...profile.soil,
                            moistureStatus: opt.id,
                            moisturePct: opt.id === 'unknown' ? null : profile.soil.moisturePct ?? 35,
                          },
                        })
                      }
                      className={`px-3.5 min-h-[42px] rounded-xl border text-xs font-medium cursor-pointer ${
                        profile.soil.moistureStatus === opt.id
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {profile.soil.moistureStatus !== 'unknown' && (
                  <div className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">Reported moisture percentage</span>
                        <span className="font-mono font-semibold tabular-nums text-[var(--teal)]">
                          {profile.soil.moisturePct ?? 0}%
                        </span>
                      </div>
                      <input
                        type="range"
                        aria-label="Soil moisture percentage"
                        min={0}
                        max={100}
                        value={profile.soil.moisturePct ?? 0}
                        onChange={(e) =>
                          onChange({
                            ...profile,
                            soil: { ...profile.soil, moisturePct: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-[var(--accent)] cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="moisture-unit" className="block text-xs text-[var(--text-secondary)]">
                          Moisture unit / basis (optional)
                        </label>
                        <select
                          id="moisture-unit"
                          value={profile.soil.moistureUnit ?? 'unspecified'}
                          onChange={(e) =>
                            onChange({
                              ...profile,
                              soil: {
                                ...profile.soil,
                                moistureUnit: e.target.value as SoilMoistureUnit,
                              },
                            })
                          }
                          className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)]"
                        >
                          <option value="unspecified">Unspecified / Not sure</option>
                          <option value="volumetric_vwc">Volumetric (% VWC)</option>
                          <option value="gravimetric">Gravimetric (% dry weight)</option>
                          <option value="available_water_pct">% Available water capacity</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="moisture-depth" className="block text-xs text-[var(--text-secondary)]">
                          Sampling depth (optional)
                        </label>
                        <input
                          id="moisture-depth"
                          type="text"
                          value={profile.soil.moistureDepth ?? ''}
                          onChange={(e) =>
                            onChange({
                              ...profile,
                              soil: { ...profile.soil, moistureDepth: e.target.value },
                            })
                          }
                          placeholder="e.g. 0–15 cm, 15–30 cm"
                          className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="moisture-method" className="block text-xs text-[var(--text-secondary)]">
                          Measurement method (optional)
                        </label>
                        <input
                          id="moisture-method"
                          type="text"
                          value={profile.soil.moistureMethod}
                          onChange={(e) =>
                            onChange({
                              ...profile,
                              soil: { ...profile.soil, moistureMethod: e.target.value },
                            })
                          }
                          placeholder="e.g. Tensiometer, hand-squeeze, TDR probe"
                          className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="moisture-date" className="block text-xs text-[var(--text-secondary)]">
                          Measurement date (optional)
                        </label>
                        <input
                          id="moisture-date"
                          type="date"
                          value={profile.soil.moistureDate}
                          onChange={(e) =>
                            onChange({
                              ...profile,
                              soil: { ...profile.soil, moistureDate: e.target.value },
                            })
                          }
                          className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <ContextualOverviewPanel overview={getSoilMoistureOverview(profile)} />
            </div>

            <hr className="border-[var(--border)]" />

            {/* Q5: Soil pH */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">5. Soil pH</div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Enter your tested soil pH (0–14) or select Not tested.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'tested', label: 'Soil pH tested' },
                      { id: 'not_tested', label: 'Not tested' },
                    ] as Array<{ id: SoilPhStatus; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...profile,
                          soil: {
                            ...profile.soil,
                            phStatus: opt.id,
                            phValue: opt.id === 'not_tested' ? null : profile.soil.phValue ?? 6.5,
                          },
                        })
                      }
                      className={`px-3.5 min-h-[42px] rounded-xl border text-xs font-medium cursor-pointer ${
                        profile.soil.phStatus === opt.id
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {profile.soil.phStatus === 'tested' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">Soil pH reading</span>
                        <span className="font-mono font-semibold tabular-nums text-[var(--teal)]">
                          pH {(profile.soil.phValue ?? 6.5).toFixed(1)}
                        </span>
                      </div>
                      <input
                        type="range"
                        aria-label="Soil pH slider"
                        min={0}
                        max={14}
                        step={0.1}
                        value={profile.soil.phValue ?? 6.5}
                        onChange={(e) =>
                          onChange({
                            ...profile,
                            soil: { ...profile.soil, phValue: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-[var(--accent)] cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
                        <span>0 (Acidic)</span>
                        <span>7.0 (Neutral)</span>
                        <span>14 (Alkaline)</span>
                      </div>
                    </div>

                    <div className="max-w-xs space-y-1">
                      <label htmlFor="ph-test-date" className="block text-xs text-[var(--text-secondary)]">
                        Test date (optional)
                      </label>
                      <input
                        id="ph-test-date"
                        type="date"
                        value={profile.soil.phTestDate}
                        onChange={(e) =>
                          onChange({
                            ...profile,
                            soil: { ...profile.soil, phTestDate: e.target.value },
                          })
                        }
                        className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                )}
              </div>
              <ContextualOverviewPanel overview={getSoilPhOverview(profile)} />
            </div>

            <hr className="border-[var(--border)]" />

            {/* Q6: Field water drainage */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-[var(--text-primary)]">6. Field water drainage</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DRAINAGE_OPTIONS.map((dr) => (
                    <button
                      key={dr}
                      type="button"
                      onClick={() =>
                        onChange({ ...profile, soil: { ...profile.soil, drainage: dr } })
                      }
                      className={`px-3 min-h-[44px] rounded-xl border text-xs font-medium cursor-pointer ${
                        profile.soil.drainage === dr
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {dr}
                    </button>
                  ))}
                </div>
              </div>
              <ContextualOverviewPanel overview={getDrainageOverview(profile)} />
            </div>

            <hr className="border-[var(--border)]" />

            {/* Q7: Soil preparation methods */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    7. Soil preparation methods (select all that apply)
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PREP_METHODS.map((pm) => {
                    const active = profile.soil.preparationMethods.includes(pm);
                    return (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => {
                          const next = toggleMulti(profile.soil.preparationMethods, pm);
                          onChange({
                            ...profile,
                            soil: {
                              ...profile.soil,
                              preparationMethods: next,
                              preparationOther: next.includes('Other') ? profile.soil.preparationOther : '',
                            },
                          });
                        }}
                        className={`flex items-center justify-between px-3.5 min-h-[44px] rounded-xl border text-xs font-medium text-left cursor-pointer ${
                          active
                            ? 'bg-[var(--bg-elevated)] border-[var(--accent)] text-[var(--text-primary)]'
                            : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <span>{pm}</span>
                        {active && <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {profile.soil.preparationMethods.includes('Other') && (
                  <input
                    type="text"
                    value={profile.soil.preparationOther}
                    onChange={(e) =>
                      onChange({
                        ...profile,
                        soil: { ...profile.soil, preparationOther: e.target.value },
                      })
                    }
                    placeholder="Describe other soil preparation method..."
                    className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
                  />
                )}
              </div>
              <ContextualOverviewPanel overview={getSoilPrepOverview(profile)} />
            </div>
          </div>
        )}

        {/* STAGE 3 */}
        {stage === 3 && (
          <div className="space-y-8">
            {/* Q8 + Additional Water Availability */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-5">
                <div className="space-y-2.5">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    8. Primary water source(s) (select all that apply)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {WATER_SOURCES.map((src) => {
                      const active = profile.water.sources.includes(src);
                      return (
                        <button
                          key={src}
                          type="button"
                          onClick={() => {
                            const next = toggleMulti(profile.water.sources, src);
                            onChange({
                              ...profile,
                              water: {
                                ...profile.water,
                                sources: next,
                                sourcesOther: next.includes('Other') ? profile.water.sourcesOther : '',
                              },
                            });
                          }}
                          className={`flex items-center justify-between px-3.5 min-h-[44px] rounded-xl border text-xs font-medium text-left cursor-pointer ${
                            active
                              ? 'bg-[var(--bg-elevated)] border-[var(--accent)] text-[var(--text-primary)]'
                              : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]'
                          }`}
                        >
                          <span>{src}</span>
                          {active && <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {profile.water.sources.includes('Other') && (
                    <input
                      type="text"
                      value={profile.water.sourcesOther}
                      onChange={(e) =>
                        onChange({
                          ...profile,
                          water: { ...profile.water, sourcesOther: e.target.value },
                        })
                      }
                      placeholder="Specify other water source..."
                      className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
                    />
                  )}
                </div>

                {/* Additional Question: Water availability */}
                <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    How reliable is your water supply?
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {RELIABILITY_OPTIONS.map((rel) => (
                      <button
                        key={rel}
                        type="button"
                        onClick={() =>
                          onChange({ ...profile, water: { ...profile.water, reliability: rel } })
                        }
                        className={`px-3 min-h-[42px] rounded-xl border text-xs font-medium cursor-pointer ${
                          profile.water.reliability === rel
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                            : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]'
                        }`}
                      >
                        {rel}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-medium text-[var(--text-secondary)]">
                    Do you know the approximate available water quantity?
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['Yes', 'No', 'Unknown'] as const).map((ans) => (
                      <button
                        key={ans}
                        type="button"
                        onClick={() =>
                          onChange({
                            ...profile,
                            water: {
                              ...profile.water,
                              availableQuantityKnown: ans,
                              availableQuantityValue: ans === 'Yes' ? profile.water.availableQuantityValue : null,
                            },
                          })
                        }
                        className={`px-4 min-h-[40px] rounded-xl border text-xs font-medium cursor-pointer ${
                          profile.water.availableQuantityKnown === ans
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                            : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]'
                        }`}
                      >
                        {ans}
                      </button>
                    ))}
                  </div>

                  {profile.water.availableQuantityKnown === 'Yes' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={profile.water.availableQuantityValue ?? ''}
                        onChange={(e) =>
                          onChange({
                            ...profile,
                            water: {
                              ...profile.water,
                              availableQuantityValue:
                                e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                            },
                          })
                        }
                        placeholder="Amount"
                        className="w-36 min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm font-mono tabular-nums text-[var(--text-primary)]"
                      />
                      <select
                        value={profile.water.availableQuantityUnit}
                        onChange={(e) =>
                          onChange({
                            ...profile,
                            water: {
                              ...profile.water,
                              availableQuantityUnit: e.target.value as typeof profile.water.availableQuantityUnit,
                            },
                          })
                        }
                        className="min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)]"
                      >
                        <option value="litres/day">litres/day</option>
                        <option value="m³/day">m³/day</option>
                        <option value="m³/season">m³/season</option>
                        <option value="acre-feet/year">acre-feet/year</option>
                        <option value="gallons/day">gallons/day</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <ContextualOverviewPanel overview={getWaterSourceAndAvailabilityOverview(profile)} />
            </div>

            <hr className="border-[var(--border)]" />

            {/* Additional Question: Irrigation Water Quality */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-4">
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  Has your irrigation water been tested?
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['Yes', 'No', 'Unknown'] as WaterQualityTestStatus[]).map((ans) => (
                    <button
                      key={ans}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...profile,
                          water: { ...profile.water, qualityTested: ans },
                        })
                      }
                      className={`px-4 min-h-[42px] rounded-xl border text-xs font-medium cursor-pointer ${
                        profile.water.qualityTested === ans
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]'
                      }`}
                    >
                      {ans}
                    </button>
                  ))}
                </div>

                {profile.water.qualityTested === 'Yes' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label htmlFor="water-ec" className="block text-xs text-[var(--text-secondary)]">
                        Electrical conductivity (EC, optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="water-ec"
                          type="number"
                          step="any"
                          min={0}
                          value={profile.water.ecValue ?? ''}
                          onChange={(e) =>
                            onChange({
                              ...profile,
                              water: {
                                ...profile.water,
                                ecValue: e.target.value === '' ? null : Number(e.target.value),
                              },
                            })
                          }
                          placeholder="e.g. 1.2"
                          className="flex-1 min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm font-mono tabular-nums text-[var(--text-primary)]"
                        />
                        <select
                          value={profile.water.ecUnit}
                          onChange={(e) =>
                            onChange({
                              ...profile,
                              water: { ...profile.water, ecUnit: e.target.value as 'dS/m' | 'µS/cm' | 'mS/cm' },
                            })
                          }
                          className="min-h-[42px] px-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)]"
                        >
                          <option value="dS/m">dS/m</option>
                          <option value="µS/cm">µS/cm</option>
                          <option value="mS/cm">mS/cm</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="water-salinity" className="block text-xs text-[var(--text-secondary)]">
                        Salinity / TDS (optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="water-salinity"
                          type="number"
                          step="any"
                          min={0}
                          value={profile.water.salinityValue ?? ''}
                          onChange={(e) =>
                            onChange({
                              ...profile,
                              water: {
                                ...profile.water,
                                salinityValue: e.target.value === '' ? null : Number(e.target.value),
                              },
                            })
                          }
                          placeholder="e.g. 640"
                          className="flex-1 min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm font-mono tabular-nums text-[var(--text-primary)]"
                        />
                        <select
                          value={profile.water.salinityUnit}
                          onChange={(e) =>
                            onChange({
                              ...profile,
                              water: { ...profile.water, salinityUnit: e.target.value as 'ppm' | 'mg/L' | 'ppt' },
                            })
                          }
                          className="min-h-[42px] px-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)]"
                        >
                          <option value="ppm">ppm</option>
                          <option value="mg/L">mg/L</option>
                          <option value="ppt">ppt</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="water-test-date" className="block text-xs text-[var(--text-secondary)]">
                        Water test date (optional)
                      </label>
                      <input
                        id="water-test-date"
                        type="date"
                        value={profile.water.qualityTestDate}
                        onChange={(e) =>
                          onChange({
                            ...profile,
                            water: { ...profile.water, qualityTestDate: e.target.value },
                          })
                        }
                        className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                )}
              </div>
              <ContextualOverviewPanel overview={getWaterQualityOverview(profile)} />
            </div>

            <hr className="border-[var(--border)]" />

            {/* Q9: Primary Watering Method */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-[var(--text-primary)]">9. Primary watering method</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {WATERING_METHODS.map((wm) => (
                    <button
                      key={wm}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...profile,
                          water: { ...profile.water, wateringMethod: wm },
                        })
                      }
                      className={`px-3.5 min-h-[46px] rounded-xl border text-xs font-medium cursor-pointer ${
                        profile.water.wateringMethod === wm
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]'
                      }`}
                    >
                      {wm}
                    </button>
                  ))}
                </div>
              </div>
              <ContextualOverviewPanel overview={getWateringMethodOverview(profile)} />
            </div>

            {/* Q10 & Q11 (Conditional on Artificial or Hybrid) */}
            {showIrrigation && (
              <>
                <hr className="border-[var(--border)]" />
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">10. Irrigation method</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {IRRIGATION_METHODS.map((im) => (
                        <button
                          key={im}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...profile,
                              water: {
                                ...profile.water,
                                irrigationMethod: im,
                                irrigationMethodOther:
                                  im === 'Other' ? profile.water.irrigationMethodOther : '',
                              },
                            })
                          }
                          className={`px-3 min-h-[44px] rounded-xl border text-xs font-medium cursor-pointer ${
                            profile.water.irrigationMethod === im
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                              : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]'
                          }`}
                        >
                          {im}
                        </button>
                      ))}
                    </div>
                    {profile.water.irrigationMethod === 'Other' && (
                      <input
                        type="text"
                        value={profile.water.irrigationMethodOther}
                        onChange={(e) =>
                          onChange({
                            ...profile,
                            water: { ...profile.water, irrigationMethodOther: e.target.value },
                          })
                        }
                        placeholder="Describe your irrigation method..."
                        className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
                      />
                    )}
                  </div>
                  <ContextualOverviewPanel overview={getIrrigationMethodOverview(profile)} />
                </div>

                <hr className="border-[var(--border)]" />
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">11. Irrigation frequency</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {IRRIGATION_FREQUENCIES.map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...profile,
                              water: { ...profile.water, irrigationFrequency: freq },
                            })
                          }
                          className={`px-3 min-h-[44px] rounded-xl border text-xs font-medium cursor-pointer ${
                            profile.water.irrigationFrequency === freq
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                              : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]'
                          }`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ContextualOverviewPanel overview={getIrrigationFrequencyOverview(profile)} />
                </div>
              </>
            )}

            {/* Q12 (Conditional on Rain-fed or Hybrid) */}
            {showRainfall && (
              <>
                <hr className="border-[var(--border)]" />
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      12. Typical rainfall frequency (your on-farm experience)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {RAINFALL_FREQUENCIES.map((rf) => (
                        <button
                          key={rf}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...profile,
                              water: { ...profile.water, rainfallFrequency: rf },
                            })
                          }
                          className={`px-3 min-h-[44px] rounded-xl border text-xs font-medium cursor-pointer ${
                            profile.water.rainfallFrequency === rf
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                              : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]'
                          }`}
                        >
                          {rf}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ContextualOverviewPanel overview={getRainfallFrequencyOverview(profile)} />
                </div>
              </>
            )}
          </div>
        )}

        {/* STAGE 4 */}
        {stage === 4 && (
          <div className="space-y-8">
            {/* Q13: Previous 3 growing cycles */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-6">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    13. Previous three growing cycles
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Select one or more crops for each past cycle. Anchor inspects rotation patterns across crop families.
                  </p>
                </div>

                <CropSearchSelector
                  id="cycle-1-search"
                  label="Previous growing cycle"
                  selected={profile.crops.previousCycle1}
                  onChange={(next) =>
                    onChange({ ...profile, crops: { ...profile.crops, previousCycle1: next } })
                  }
                />

                <CropSearchSelector
                  id="cycle-2-search"
                  label="Second previous growing cycle"
                  selected={profile.crops.previousCycle2}
                  onChange={(next) =>
                    onChange({ ...profile, crops: { ...profile.crops, previousCycle2: next } })
                  }
                />

                <CropSearchSelector
                  id="cycle-3-search"
                  label="Third previous growing cycle"
                  selected={profile.crops.previousCycle3}
                  onChange={(next) =>
                    onChange({ ...profile, crops: { ...profile.crops, previousCycle3: next } })
                  }
                />
              </div>

              <ContextualOverviewPanel overview={getCropHistoryOverview(profile)} />
            </div>

            <hr className="border-[var(--border)]" />

            {/* Q14: Current or planned crops */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-6">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    14. Current & planned crops
                  </div>
                </div>
                <CropSearchSelector
                  id="current-crops-search"
                  label="Currently growing crops"
                  selected={profile.crops.currentCrops}
                  excludedIds={profile.crops.noRestrictions ? [] : profile.crops.restrictedCrops}
                  onChange={(next) =>
                    onChange({ ...profile, crops: { ...profile.crops, currentCrops: next } })
                  }
                />
                <CropSearchSelector
                  id="planned-crops-search"
                  label="Planned next crops"
                  selected={profile.crops.plannedCrops}
                  excludedIds={profile.crops.noRestrictions ? [] : profile.crops.restrictedCrops}
                  onChange={(next) =>
                    onChange({ ...profile, crops: { ...profile.crops, plannedCrops: next } })
                  }
                />
              </div>
              <ContextualOverviewPanel overview={getPlannedCropsOverview(profile)} />
            </div>

            <hr className="border-[var(--border)]" />

            {/* Q15: Restricted crops */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <CropSearchSelector
                id="restricted-crops-search"
                label="15. Crops that cannot or should not be grown"
                helperText="Excluded from all future suitability and rotation suggestions. Selecting 'No restrictions' clears specific exclusions."
                selected={profile.crops.restrictedCrops}
                onChange={(next) =>
                  onChange({
                    ...profile,
                    crops: { ...profile.crops, noRestrictions: false, restrictedCrops: next },
                  })
                }
                allowNoRestrictions
                noRestrictions={profile.crops.noRestrictions}
                onToggleNoRestrictions={(val) =>
                  onChange({
                    ...profile,
                    crops: {
                      ...profile.crops,
                      noRestrictions: val,
                      restrictedCrops: val ? [] : profile.crops.restrictedCrops,
                      restrictedOther: val ? '' : profile.crops.restrictedOther,
                    },
                  })
                }
                allowOther
                otherText={profile.crops.restrictedOther}
                onOtherTextChange={(txt) =>
                  onChange({
                    ...profile,
                    crops: { ...profile.crops, noRestrictions: false, restrictedOther: txt },
                  })
                }
              />
              <ContextualOverviewPanel overview={getRestrictedCropsOverview(profile)} />
            </div>

            <hr className="border-[var(--border)]" />

            {/* Additional Q: Fertiliser management */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  What types of fertilisers do you currently use?
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FERTILISER_TYPES.map((ft) => (
                    <button
                      key={ft}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...profile,
                          crops: { ...profile.crops, fertiliserType: ft },
                        })
                      }
                      className={`px-3 min-h-[44px] rounded-xl border text-xs font-medium cursor-pointer ${
                        profile.crops.fertiliserType === ft
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]'
                      }`}
                    >
                      {ft}
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  <label htmlFor="fertiliser-details" className="block text-xs text-[var(--text-secondary)]">
                    Additional fertiliser details (optional)
                  </label>
                  <input
                    id="fertiliser-details"
                    type="text"
                    value={profile.crops.fertiliserDetails}
                    onChange={(e) =>
                      onChange({
                        ...profile,
                        crops: { ...profile.crops, fertiliserDetails: e.target.value },
                      })
                    }
                    placeholder="e.g. Farmyard manure before planting, split urea top-dress"
                    className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
                  />
                </div>
              </div>
              <ContextualOverviewPanel overview={getFertiliserOverview(profile)} />
            </div>
          </div>
        )}

        {/* STAGE 5 */}
        {stage === 5 && (
          <div className="space-y-8">
            {/* Q16: Planning horizon */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-[var(--text-primary)]">16. Farming planning horizon</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PLANNING_HORIZONS.map((ph) => (
                    <button
                      key={ph}
                      type="button"
                      onClick={() =>
                        onChange({ ...profile, planning: { ...profile.planning, horizon: ph } })
                      }
                      className={`px-3 min-h-[44px] rounded-xl border text-xs font-medium cursor-pointer ${
                        profile.planning.horizon === ph
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]'
                      }`}
                    >
                      {ph}
                    </button>
                  ))}
                </div>
              </div>
              <ContextualOverviewPanel overview={getPlanningHorizonOverview(profile)} />
            </div>

            <hr className="border-[var(--border)]" />

            {/* Q17: Agricultural priorities */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  17. Agricultural priorities (select all that apply)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRIORITIES.map((pr) => {
                    const active = profile.planning.priorities.includes(pr);
                    return (
                      <button
                        key={pr}
                        type="button"
                        onClick={() =>
                          onChange({
                            ...profile,
                            planning: {
                              ...profile.planning,
                              priorities: toggleMulti(profile.planning.priorities, pr),
                            },
                          })
                        }
                        className={`flex items-center justify-between px-3.5 min-h-[44px] rounded-xl border text-xs font-medium text-left cursor-pointer ${
                          active
                            ? 'bg-[var(--bg-elevated)] border-[var(--accent)] text-[var(--text-primary)]'
                            : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]'
                        }`}
                      >
                        <span>{pr}</span>
                        {active && <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <ContextualOverviewPanel overview={getPrioritiesOverview(profile)} />
            </div>

            <hr className="border-[var(--border)]" />

            {/* Q18 & Q19: Annual cycles & Typical growing season */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">18. Annual growing cycles</div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {ANNUAL_CYCLES.map((cy) => (
                      <button
                        key={cy}
                        type="button"
                        onClick={() =>
                          onChange({ ...profile, planning: { ...profile.planning, annualCycles: cy } })
                        }
                        className={`px-3 min-h-[44px] rounded-xl border text-xs font-medium cursor-pointer ${
                          profile.planning.annualCycles === cy
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                            : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]'
                        }`}
                      >
                        {cy}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    19. Typical growing season(s) (select all that apply)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GROWING_SEASONS.map((gs) => {
                      const active = profile.planning.growingSeasons.includes(gs);
                      return (
                        <button
                          key={gs}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...profile,
                              planning: {
                                ...profile.planning,
                                growingSeasons: toggleMulti(profile.planning.growingSeasons, gs),
                              },
                            })
                          }
                          className={`flex items-center justify-between px-3.5 min-h-[44px] rounded-xl border text-xs font-medium text-left cursor-pointer ${
                            active
                              ? 'bg-[var(--bg-elevated)] border-[var(--accent)] text-[var(--text-primary)]'
                              : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]'
                          }`}
                        >
                          <span>{gs}</span>
                          {active && <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <ContextualOverviewPanel overview={getCyclesAndSeasonOverview(profile)} />
            </div>

            <hr className="border-[var(--border)]" />

            {/* Q20: Biggest agricultural challenge (multi + 1 required primary) */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    20. Agricultural challenges & single Primary Challenge
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Select all challenges affecting your farm, then mark one as your Primary Challenge.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CHALLENGES.map((ch) => {
                    const active = profile.planning.challenges.includes(ch);
                    const isPrimary = profile.planning.primaryChallenge === ch;
                    return (
                      <div
                        key={ch}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border ${
                          isPrimary
                            ? 'bg-[var(--bg-elevated)] border-[var(--accent)]'
                            : active
                              ? 'bg-[var(--bg-elevated)] border-[var(--teal)]/60'
                              : 'bg-[var(--bg-surface)] border-[var(--border)]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const next = toggleMulti(profile.planning.challenges, ch);
                            let nextPrimary = profile.planning.primaryChallenge;
                            if (!next.includes(ch) && nextPrimary === ch) {
                              nextPrimary = next[0] ?? '';
                            } else if (next.length === 1 && !nextPrimary) {
                              nextPrimary = ch;
                            }
                            onChange({
                              ...profile,
                              planning: {
                                ...profile.planning,
                                challenges: next,
                                primaryChallenge: nextPrimary,
                                challengeOther: next.includes('Other') ? profile.planning.challengeOther : '',
                              },
                            });
                          }}
                          className="flex-1 text-left text-xs font-medium text-[var(--text-primary)] min-h-[36px] flex items-center gap-2 cursor-pointer"
                        >
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              active ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)]'
                            }`}
                          >
                            {active && <Check className="w-3 h-3" />}
                          </span>
                          <span>{ch}</span>
                        </button>

                        {active && (
                          <button
                            type="button"
                            onClick={() =>
                              onChange({
                                ...profile,
                                planning: { ...profile.planning, primaryChallenge: ch },
                              })
                            }
                            className={`px-2.5 min-h-[28px] rounded-lg text-[11px] font-medium shrink-0 cursor-pointer ${
                              isPrimary
                                ? 'bg-[var(--accent)] text-white'
                                : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {isPrimary ? 'Primary' : 'Set primary'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {profile.planning.challenges.includes('Other') && (
                  <input
                    type="text"
                    value={profile.planning.challengeOther}
                    onChange={(e) =>
                      onChange({
                        ...profile,
                        planning: { ...profile.planning, challengeOther: e.target.value },
                      })
                    }
                    placeholder="Describe other farming challenge..."
                    className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
                  />
                )}
              </div>

              <ContextualOverviewPanel overview={getChallengesOverview(profile)} />
            </div>
          </div>
        )}

        {/* Validation Banner */}
        {validationError && (
          <div
            role="alert"
            className="rounded-xl border border-[var(--score-avoid)] bg-[var(--bg-elevated)] px-4 py-3 text-xs text-[var(--score-avoid)] font-medium"
          >
            {validationError}
          </div>
        )}

        {/* Stage Footer Navigation */}
        <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={stage === 1}
            className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent)] disabled:opacity-40 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onFinishToDashboard}
              className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] cursor-pointer"
            >
              <span>Review Farm Summary</span>
            </button>

            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center gap-2 px-5 min-h-[44px] rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-95 cursor-pointer"
            >
              {stage === 5 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>Review & Generate Analysis</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
