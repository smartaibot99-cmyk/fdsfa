import React from 'react';
import { AlertCircle, Edit3, Loader2, Sparkles } from 'lucide-react';
import { FarmProfile } from '../../types';
import { getCropDisplayName } from '../../data/farmCropCatalog';
import {
  computeProfileCompleteness,
  formatSoilMoistureUnit,
  getMeasurementCaveats,
  getSoilMoistureProvenance,
  getSoilPhProvenance,
  getWaterQualityState,
} from '../../lib/farmStorage';

interface FarmProfileDashboardProps {
  profile: FarmProfile;
  generating: boolean;
  onEditStage: (stage: 1 | 2 | 3 | 4 | 5) => void;
  onGenerateAnalysis: () => void;
}

export const FarmProfileDashboard: React.FC<FarmProfileDashboardProps> = ({
  profile,
  generating,
  onEditStage,
  onGenerateAnalysis,
}) => {
  const completeness = computeProfileCompleteness(profile);
  const moistureProv = getSoilMoistureProvenance(profile);
  const phProv = getSoilPhProvenance(profile);
  const waterQualityState = getWaterQualityState(profile);
  const measurementCaveats = getMeasurementCaveats(profile);
  const moistureUnitLabel = formatSoilMoistureUnit(profile.soil.moistureUnit);

  const locationSummary =
    profile.location.locationLabel ||
    profile.location.regionOrAddress ||
    (profile.location.lat !== null && profile.location.lon !== null
      ? `${profile.location.lat.toFixed(4)}°, ${profile.location.lon.toFixed(4)}°`
      : 'Not specified');

  const coordsLabel =
    profile.location.lat !== null && profile.location.lon !== null
      ? `${profile.location.lat.toFixed(4)}°, ${profile.location.lon.toFixed(4)}°`
      : 'No coordinates (regional NASA data skipped)';

  const restrictedList = profile.crops.noRestrictions
    ? 'No restrictions'
    : [
        ...profile.crops.restrictedCrops.map(getCropDisplayName),
        ...(profile.crops.restrictedOther.trim() ? [profile.crops.restrictedOther.trim()] : []),
      ].join(', ') || 'Not declared';

  return (
    <div className="space-y-6">
      {/* Completeness & Primary Generate Banner */}
      <div className="anchor-card p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-[var(--teal)]">
              Farm Profile Summary · Saved locally in this browser
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[var(--text-primary)]">
              {profile.location.farmName.trim() || 'Unnamed Farm'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Profile input completeness:{' '}
              <span className="font-mono font-semibold tabular-nums text-[var(--text-primary)]">
                {completeness.overallPct}% ({completeness.answeredCount}/{completeness.totalChecks} fields)
              </span>{' '}
              — reflects questionnaire input coverage only, not scientific certainty, data quality, or measurement validity.
            </p>
          </div>

          <button
            type="button"
            onClick={onGenerateAnalysis}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-95 disabled:opacity-60 shrink-0 cursor-pointer"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Generating Farm Analysis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Generate Farm Analysis</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${completeness.overallPct}%` }}
          />
        </div>

        {/* Missing / Unknown Information */}
        {(completeness.missingOrUnknown.length > 0 || measurementCaveats.length > 0) && (
          <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-4 space-y-2">
            {completeness.missingOrUnknown.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--score-caution)]">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Unanswered or unknown questionnaire items ({completeness.missingOrUnknown.length})</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {completeness.missingOrUnknown.join(' · ')}
                </p>
              </div>
            )}
            {measurementCaveats.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-[var(--border)] first:border-t-0 first:pt-0">
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  Measurement detail & result gaps ({measurementCaveats.length})
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {measurementCaveats.join(' · ')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6 Main Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* 1. Farm Profile */}
        <article className="anchor-card p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
              <div>
                <h3 className="text-base font-display font-semibold text-[var(--text-primary)]">
                  1. Farm Profile
                </h3>
                <div className="text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
                  {completeness.byCategory.farm.pct}% complete
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditStage(1)}
                className="inline-flex items-center gap-1 px-3 min-h-[34px] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Edit</span>
              </button>
            </div>

            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-[var(--text-secondary)]">Farm name</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {profile.location.farmName.trim() || 'Not specified'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Location</dt>
                <dd className="font-medium text-[var(--text-primary)]">{locationSummary}</dd>
                <dd className="font-mono text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {coordsLabel}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Farming area</dt>
                <dd className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                  {profile.areaValue !== null
                    ? `${profile.areaValue} ${profile.areaUnit}`
                    : 'Not specified'}
                </dd>
              </div>
            </dl>
          </div>
        </article>

        {/* 2. Soil Profile */}
        <article className="anchor-card p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
              <div>
                <h3 className="text-base font-display font-semibold text-[var(--text-primary)]">
                  2. Soil Profile
                </h3>
                <div className="text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
                  {completeness.byCategory.soil.pct}% complete
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditStage(2)}
                className="inline-flex items-center gap-1 px-3 min-h-[34px] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Edit</span>
              </button>
            </div>

            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-[var(--text-secondary)]">Soil texture</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {profile.soil.texture || 'Not selected'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Soil moisture</dt>
                <dd className="font-medium text-[var(--text-primary)] font-mono tabular-nums">
                  {moistureProv !== 'Unknown' && profile.soil.moisturePct !== null
                    ? `${profile.soil.moisturePct}% (${[
                        moistureProv,
                        moistureUnitLabel || 'unit unspecified',
                        profile.soil.moistureMethod.trim() || 'method unspecified',
                        profile.soil.moistureDepth?.trim() || 'depth unspecified',
                        profile.soil.moistureDate || null,
                      ]
                        .filter(Boolean)
                        .join(' · ')})`
                    : 'Unknown / Not measured'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Soil pH</dt>
                <dd className="font-medium text-[var(--text-primary)] font-mono tabular-nums">
                  {phProv === 'Measured' && profile.soil.phValue !== null
                    ? `pH ${profile.soil.phValue.toFixed(1)} (Tested${profile.soil.phTestDate ? ` · ${profile.soil.phTestDate}` : ''})`
                    : 'Not tested'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Drainage</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {profile.soil.drainage || 'Not selected'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Preparation methods</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {profile.soil.preparationMethods.length > 0
                    ? profile.soil.preparationMethods.join(', ')
                    : 'None selected'}
                </dd>
              </div>
            </dl>
          </div>
        </article>

        {/* 3. Water Profile */}
        <article className="anchor-card p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
              <div>
                <h3 className="text-base font-display font-semibold text-[var(--text-primary)]">
                  3. Water Profile
                </h3>
                <div className="text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
                  {completeness.byCategory.water.pct}% complete
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditStage(3)}
                className="inline-flex items-center gap-1 px-3 min-h-[34px] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Edit</span>
              </button>
            </div>

            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-[var(--text-secondary)]">Water source(s)</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {profile.water.sources.length > 0 ? profile.water.sources.join(', ') : 'Not selected'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Water availability</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {profile.water.reliability || 'Not specified'}
                  {profile.water.availableQuantityKnown === 'Yes' &&
                  profile.water.availableQuantityValue !== null
                    ? ` · ${profile.water.availableQuantityValue} ${profile.water.availableQuantityUnit}`
                    : ''}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Water quality test</dt>
                <dd className="font-medium text-[var(--text-primary)] font-mono tabular-nums">
                  {waterQualityState === 'tested_with_results'
                    ? [
                        'Tested',
                        profile.water.ecValue !== null
                          ? `EC ${profile.water.ecValue} ${profile.water.ecUnit}`
                          : null,
                        profile.water.salinityValue !== null
                          ? `Salinity ${profile.water.salinityValue} ${profile.water.salinityUnit}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    : waterQualityState === 'tested_results_missing'
                      ? 'Tested — numeric results not entered'
                      : waterQualityState === 'not_tested'
                        ? 'Not tested (No)'
                        : waterQualityState === 'unknown'
                          ? 'Unknown'
                          : 'Not answered'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Watering system</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {profile.water.wateringMethod || 'Not selected'}
                </dd>
              </div>
              {(profile.water.wateringMethod === 'Artificial irrigation' ||
                profile.water.wateringMethod === 'Hybrid (rainfall and irrigation)') && (
                <div>
                  <dt className="text-[var(--text-secondary)]">Irrigation method & cadence</dt>
                  <dd className="font-medium text-[var(--text-primary)]">
                    {profile.water.irrigationMethod || 'Unspecified'} ·{' '}
                    {profile.water.irrigationFrequency || 'Unspecified'}
                  </dd>
                </div>
              )}
              {(profile.water.wateringMethod === 'Rain-fed agriculture' ||
                profile.water.wateringMethod === 'Hybrid (rainfall and irrigation)') && (
                <div>
                  <dt className="text-[var(--text-secondary)]">Reported rainfall frequency</dt>
                  <dd className="font-medium text-[var(--text-primary)]">
                    {profile.water.rainfallFrequency || 'Not specified'}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </article>

        {/* 4. Crop History */}
        <article className="anchor-card p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
              <div>
                <h3 className="text-base font-display font-semibold text-[var(--text-primary)]">
                  4. Crop History
                </h3>
                <div className="text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
                  {completeness.byCategory.crops.pct}% complete
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditStage(4)}
                className="inline-flex items-center gap-1 px-3 min-h-[34px] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Edit</span>
              </button>
            </div>

            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-[var(--text-secondary)]">Previous 3 growing cycles</dt>
                <dd className="text-[var(--text-primary)]">
                  1: {profile.crops.previousCycle1.map(getCropDisplayName).join(', ') || 'None'}
                </dd>
                <dd className="text-[var(--text-primary)]">
                  2: {profile.crops.previousCycle2.map(getCropDisplayName).join(', ') || 'None'}
                </dd>
                <dd className="text-[var(--text-primary)]">
                  3: {profile.crops.previousCycle3.map(getCropDisplayName).join(', ') || 'None'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Current crops</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {profile.crops.currentCrops.map(getCropDisplayName).join(', ') || 'None'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Planned crops</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {profile.crops.plannedCrops.map(getCropDisplayName).join(', ') || 'None'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Restricted crops</dt>
                <dd className="font-medium text-[var(--text-primary)]">{restrictedList}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Fertiliser management</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {profile.crops.fertiliserType || 'Not specified'}
                </dd>
              </div>
            </dl>
          </div>
        </article>

        {/* 5. Agricultural Priorities */}
        <article className="anchor-card p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
              <div>
                <h3 className="text-base font-display font-semibold text-[var(--text-primary)]">
                  5. Agricultural Priorities
                </h3>
                <div className="text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
                  {completeness.byCategory.priorities.pct}% complete
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditStage(5)}
                className="inline-flex items-center gap-1 px-3 min-h-[34px] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Edit</span>
              </button>
            </div>

            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-[var(--text-secondary)]">Selected objectives</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {profile.planning.priorities.length > 0
                    ? profile.planning.priorities.join(', ')
                    : 'None selected'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Main agricultural challenge</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {profile.planning.primaryChallenge || 'Not selected'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Additional challenges</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {profile.planning.challenges
                    .filter((c) => c !== profile.planning.primaryChallenge)
                    .join(', ') || 'None'}
                </dd>
              </div>
            </dl>
          </div>
        </article>

        {/* 6. Planning Horizon */}
        <article className="anchor-card p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
              <div>
                <h3 className="text-base font-display font-semibold text-[var(--text-primary)]">
                  6. Planning Horizon
                </h3>
                <div className="text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
                  {completeness.byCategory.horizon.pct}% complete
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditStage(5)}
                className="inline-flex items-center gap-1 px-3 min-h-[34px] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Edit</span>
              </button>
            </div>

            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-[var(--text-secondary)]">Planning period</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {profile.planning.horizon || 'Not selected'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Annual growing cycles</dt>
                <dd className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                  {profile.planning.annualCycles || 'Not selected'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Typical growing seasons</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {profile.planning.growingSeasons.length > 0
                    ? profile.planning.growingSeasons.join(', ')
                    : 'Not selected'}
                </dd>
              </div>
            </dl>
          </div>
        </article>
      </div>
    </div>
  );
};
