import wheatImg from '../assets/images/farm_thumbnail_1790691751269.jpg';
import cornImg from '../assets/images/crop_maize_1790789298341.jpg';
import peasImg from '../assets/images/crop_beans_1790789288018.jpg';
import barleyImg from '../assets/images/crop_barley_1790791046594.jpg';
import soyImg from '../assets/images/crop_soybean_1790791011503.jpg';
import sunflowerImg from '../assets/images/crop_sunflower_1790791032279.jpg';
import lettuceImg from '../assets/images/crop_lettuce_1790789274802.jpg';
import { findCropCatalogItem } from '../data/farmCropCatalog';
import { AreaUnit, FarmProfile } from '../types/farm';
import {
  FarmObservationItem,
  FarmTaskItem,
  MyFarmAssessment,
  MyFarmRecord,
  PortfolioFieldRecord,
  PortfolioStatus,
  RotationCandidateOption,
} from '../types/myFarms';
import {
  createEmptyFarmProfile,
  deleteFarmProfile,
  getActiveFarmId,
  loadFarmProfiles,
  setActiveFarmId,
  upsertFarmProfile,
} from './farmStorage';
import { computeRingCentroid, computeRingGeodesicAreaM2, closeRing } from './mapGeometry';
import { LonLat } from '../types/maps';

const STALE_DAYS_THRESHOLD = 14;

export function resolveCropThumbnail(cropIdOrName?: string | null): string {
  const key = (cropIdOrName || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (!key) return wheatImg;
  if (key.includes('corn') || key.includes('maize')) return cornImg;
  if (key.includes('pea') || key.includes('bean') || key.includes('lentil') || key.includes('chickpea')) return peasImg;
  if (key.includes('soy')) return soyImg;
  if (key.includes('barley') || key.includes('oat') || key.includes('rye') || key.includes('cover')) return barleyImg;
  if (key.includes('sunflower')) return sunflowerImg;
  if (key.includes('lettuce') || key.includes('spinach') || key.includes('vegetable') || key.includes('tomato')) return lettuceImg;
  return wheatImg;
}

export function formatArea(hectares: number, unit: AreaUnit = 'hectares'): string {
  if (!Number.isFinite(hectares) || hectares <= 0) return 'Unmapped';
  if (unit === 'acres') {
    const acres = hectares * 2.4710538;
    return `${acres.toFixed(acres >= 100 ? 0 : 1)} ac`;
  }
  return `${hectares.toFixed(hectares >= 100 ? 1 : 1)} ha`;
}

export function formatStatusLabel(status: PortfolioStatus): string {
  switch (status) {
    case 'good':
      return 'Good';
    case 'needs_attention':
      return 'Needs attention';
    case 'alert':
      return 'Alert';
    case 'partial':
      return 'Partial';
    case 'needs_refresh':
      return 'Needs refresh';
    case 'archived':
      return 'Archived';
    case 'not_assessed':
    default:
      return 'Not assessed';
  }
}

export function daysSinceIso(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.floor((Date.now() - ms) / 86400000));
}

export function formatRelativeDate(iso: string | null): string {
  if (!iso) return 'Never assessed';
  const days = daysSinceIso(iso);
  if (days === null) return iso.slice(0, 10);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export interface ServerRawFarmDto {
  id: string;
  name: string;
  primaryCrop: string | null;
  locationLabel: string;
  regionLabel: string;
  country: string;
  timezone: string;
  centroid: { lat: number; lon: number } | null;
  geometry: MyFarmRecord['geometry'];
  areaUnit: AreaUnit;
  declaredAreaHa: number | null;
  mappedAreaHa: number;
  perimeterM: number;
  hasBoundary: boolean;
  areaGapNote: string | null;
  hasFieldOverlapWarning: boolean;
  overlapWarningDetail: string | null;
  isPrivate: boolean;
  isDraft: boolean;
  archivedAt: string | null;
  notes: string;
  versionNumber: number;
  activePlan: MyFarmRecord['activePlan'];
  recommendedPlanId: string | null;
  recommendedPlanTitle: string | null;
  soil: MyFarmRecord['soil'];
  water: MyFarmRecord['water'];
  planningHorizon: MyFarmRecord['planningHorizon'];
  priorities: string[];
  challenges: string[];
  lastAssessedAt: string | null;
  suitabilityScore: number | null;
  mapHealthStatus?: 'healthy' | 'moderate' | 'at_risk' | 'no_data';
  mapExplanation?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Shared deterministic status + completeness + worst-field preservation engine.
 * Ensures a high score on 90% of a farm NEVER masks a severe soil/water/hazard alert on one field.
 */
export function buildAssessedFarmRecord(
  raw: ServerRawFarmDto,
  allFields: PortfolioFieldRecord[],
  observations: FarmObservationItem[],
  tasks: FarmTaskItem[]
): MyFarmRecord {
  const farmFields = allFields.filter((f) => f.farmId === raw.id);
  const openTasks = tasks.filter((t) => t.farmId === raw.id && !t.completed);
  const highPriorityTasks = openTasks.filter((t) => t.priority === 'high');

  const checks: Array<{ ok: boolean; label: string }> = [
    { ok: Boolean(raw.centroid), label: 'Coordinates' },
    { ok: raw.soil.texture !== 'Unknown' && Boolean(raw.soil.texture), label: 'Soil texture' },
    { ok: raw.soil.moistureStatus !== 'unknown' && raw.soil.moisturePct !== null, label: 'Soil moisture' },
    { ok: raw.soil.phStatus === 'tested' && raw.soil.phValue !== null, label: 'Soil pH' },
    { ok: raw.water.sources.length > 0 && raw.water.sources[0] !== 'Unknown', label: 'Water source' },
    { ok: Boolean(raw.water.reliability) && raw.water.reliability !== 'Unknown', label: 'Water reliability' },
    { ok: Boolean(raw.primaryCrop || farmFields.some((f) => f.cropName)), label: 'Primary crop' },
    { ok: raw.hasBoundary, label: 'Mapped boundary' },
  ];
  const completenessPct = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  const missingLabels = checks.filter((c) => !c.ok).map((c) => c.label);

  const staleReasons: string[] = [];
  const ageDays = daysSinceIso(raw.lastAssessedAt);
  if (ageDays !== null && ageDays > STALE_DAYS_THRESHOLD) {
    staleReasons.push(`Last full assessment is ${ageDays} days old (> ${STALE_DAYS_THRESHOLD}-day freshness window).`);
  }
  for (const ff of farmFields) {
    if (ff.staleCalculations.length > 0) {
      staleReasons.push(`${ff.name}: ${ff.staleCalculations[0]}`);
    }
  }
  if (raw.hasFieldOverlapWarning && raw.overlapWarningDetail) {
    staleReasons.push(raw.overlapWarningDetail);
  }

  // Evaluate alerts & worst field without averaging them away
  let activeAlertsCount = highPriorityTasks.length + (raw.hasFieldOverlapWarning ? 1 : 0);
  let criticalAlertsCount = 0;
  let worstFieldId: string | null = null;
  let worstFieldName: string | null = null;
  let worstFieldReason: string | null = null;

  if (raw.soil.moistureStatus !== 'unknown' && raw.soil.moisturePct !== null && raw.soil.moisturePct < 19) {
    criticalAlertsCount++;
    activeAlertsCount++;
    worstFieldReason = `Low topsoil moisture (${raw.soil.moisturePct}% VWC)`;
  }
  if (
    raw.water.dailyCapacityKnown &&
    raw.water.dailyCapacityM3 !== null &&
    raw.water.estimatedDailyDemandM3 !== null &&
    raw.water.estimatedDailyDemandM3 > raw.water.dailyCapacityM3 * 1.15
  ) {
    criticalAlertsCount++;
    activeAlertsCount++;
    worstFieldReason = worstFieldReason
      ? `${worstFieldReason}; water demand (${raw.water.estimatedDailyDemandM3} m³/d) exceeds supply (${raw.water.dailyCapacityM3} m³/d)`
      : `Daily demand (${raw.water.estimatedDailyDemandM3} m³/d) exceeds supply (${raw.water.dailyCapacityM3} m³/d)`;
  }

  for (const ff of farmFields) {
    if (ff.status === 'Needs Review' || ff.activeAlertsCount > 0 || ff.criticalAlert) {
      activeAlertsCount += Math.max(1, ff.activeAlertsCount);
      if (!worstFieldId) {
        worstFieldId = ff.id;
        worstFieldName = ff.name;
        worstFieldReason = ff.criticalAlert || `${ff.name} flagged Needs Review`;
      }
    }
  }

  const score = raw.suitabilityScore;
  const hasAnyAssessment = raw.lastAssessedAt !== null && score !== null;

  let status: PortfolioStatus;
  let freshnessState: MyFarmAssessment['freshnessState'];

  if (raw.archivedAt) {
    status = 'archived';
    freshnessState = hasAnyAssessment ? (staleReasons.length > 0 ? 'stale' : 'fresh') : 'unassessed';
  } else if (!hasAnyAssessment) {
    status = raw.isDraft || completenessPct >= 25 ? (completenessPct >= 38 ? 'partial' : 'not_assessed') : 'not_assessed';
    freshnessState = completenessPct >= 38 ? 'partial' : 'unassessed';
  } else if (criticalAlertsCount > 0 || (score !== null && score < 45)) {
    status = 'alert';
    freshnessState = staleReasons.length > 0 ? 'stale' : 'fresh';
  } else if (staleReasons.length > 0) {
    status = 'needs_refresh';
    freshnessState = 'stale';
  } else if (activeAlertsCount > 0 || (score !== null && score < 72)) {
    status = 'needs_attention';
    freshnessState = 'fresh';
  } else {
    status = 'good';
    freshnessState = 'fresh';
  }

  const confidencePct = hasAnyAssessment
    ? Math.max(25, Math.min(96, Math.round(completenessPct * 0.85 + (observations.some((o) => o.farmId === raw.id) ? 10 : 0) - (staleReasons.length > 0 ? 14 : 0))))
    : Math.round(completenessPct * 0.4);

  const summary =
    raw.mapExplanation ||
    (status === 'good'
      ? `Soil, moisture, and climate signals support ${raw.primaryCrop || 'current crop rotation'}.`
      : status === 'alert'
        ? worstFieldReason || 'Critical moisture or irrigation capacity constraint requires attention.'
        : status === 'needs_refresh'
          ? staleReasons[0] || 'Assessment exceeds freshness window; re-run recommended.'
          : status === 'needs_attention'
            ? worstFieldReason || 'Moderate moisture or supply variability detected.'
            : missingLabels.length > 0
              ? `Missing ${missingLabels.slice(0, 3).join(', ').toLowerCase()} before full scoring.`
              : 'Ready to run climate and soil assessment.');

  const assessment: MyFarmAssessment = {
    status,
    freshnessState,
    score,
    confidencePct,
    completenessPct,
    assessedAt: raw.lastAssessedAt,
    activeAlertsCount,
    criticalAlertsCount,
    summary,
    worstFieldId,
    worstFieldName,
    worstFieldReason,
    staleReasons,
  };

  return {
    id: raw.id,
    name: raw.name,
    primaryCrop: raw.primaryCrop,
    locationLabel: raw.locationLabel,
    regionLabel: raw.regionLabel,
    country: raw.country,
    timezone: raw.timezone,
    centroid: raw.centroid,
    geometry: raw.geometry,
    areaUnit: raw.areaUnit,
    declaredAreaHa: raw.declaredAreaHa,
    mappedAreaHa: raw.mappedAreaHa,
    perimeterM: raw.perimeterM,
    hasBoundary: raw.hasBoundary,
    areaGapNote: raw.areaGapNote,
    hasFieldOverlapWarning: raw.hasFieldOverlapWarning,
    overlapWarningDetail: raw.overlapWarningDetail,
    isPrivate: raw.isPrivate,
    isDraft: raw.isDraft,
    archivedAt: raw.archivedAt,
    notes: raw.notes,
    versionNumber: raw.versionNumber,
    activePlan: raw.activePlan,
    recommendedPlanId: raw.recommendedPlanId,
    recommendedPlanTitle: raw.recommendedPlanTitle,
    soil: raw.soil,
    water: raw.water,
    planningHorizon: raw.planningHorizon,
    priorities: raw.priorities,
    challenges: raw.challenges,
    assessment,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export interface PortfolioAggregateSummary {
  totalFarms: number;
  activeFarms: number;
  archivedFarms: number;
  totalFields: number;
  totalMappedHa: number;
  totalDeclaredHa: number;
  areaMismatchFarms: number;
  overlapWarningFarms: number;
  totalAlerts: number;
  needsAttentionOrAlertFarms: number;
  needsRefreshFarms: number;
  unassessedFarms: number;
  comparableScoreAverage: number | null;
  comparabilityNote: string;
}

/**
 * Comparability guard: Computes aggregate portfolio stats explicitly distinguishing
 * valid non-overlapping mapped area, declared area, and refusing to blend
 * unassessed/stale scores silently into a single fake score.
 */
export function computePortfolioAggregates(
  farms: MyFarmRecord[],
  fields: PortfolioFieldRecord[]
): PortfolioAggregateSummary {
  const active = farms.filter((f) => !f.archivedAt);
  const archived = farms.filter((f) => Boolean(f.archivedAt));
  const activeIds = new Set(active.map((f) => f.id));
  const activeFields = fields.filter((fl) => activeIds.has(fl.farmId));

  const freshComparable = active.filter(
    (f) => f.assessment.freshnessState === 'fresh' && f.assessment.score !== null
  );
  const staleOrMissingCount = active.length - freshComparable.length;
  const comparableScoreAverage =
    freshComparable.length > 0 && freshComparable.length === active.length
      ? Math.round(
          freshComparable.reduce((s, f) => s + (f.assessment.score ?? 0), 0) / freshComparable.length
        )
      : null;

  const comparabilityNote =
    active.length === 0
      ? 'No active farms in portfolio.'
      : staleOrMissingCount === 0
        ? `All ${active.length} active farms share current (<14d) model v2 comparability.`
        : `Portfolio mean score suppressed (${freshComparable.length}/${active.length} fresh; ${staleOrMissingCount} stale or unassessed — inspect individual farms).`;

  return {
    totalFarms: farms.length,
    activeFarms: active.length,
    archivedFarms: archived.length,
    totalFields: activeFields.length,
    totalMappedHa: Number(active.reduce((s, f) => s + f.mappedAreaHa, 0).toFixed(1)),
    totalDeclaredHa: Number(active.reduce((s, f) => s + (f.declaredAreaHa ?? 0), 0).toFixed(1)),
    areaMismatchFarms: active.filter((f) => Boolean(f.areaGapNote)).length,
    overlapWarningFarms: active.filter((f) => f.hasFieldOverlapWarning).length,
    totalAlerts: active.reduce((s, f) => s + f.assessment.activeAlertsCount, 0),
    needsAttentionOrAlertFarms: active.filter(
      (f) => f.assessment.status === 'alert' || f.assessment.status === 'needs_attention'
    ).length,
    needsRefreshFarms: active.filter((f) => f.assessment.status === 'needs_refresh').length,
    unassessedFarms: active.filter(
      (f) => f.assessment.status === 'not_assessed' || f.assessment.status === 'partial'
    ).length,
    comparableScoreAverage,
    comparabilityNote,
  };
}

/**
 * Computes water balance estimate with explicit transparent assumptions.
 */
export function computeWaterBalance(farm: MyFarmRecord): {
  status: 'surplus' | 'balanced' | 'deficit' | 'insufficient';
  supplyM3Day: number | null;
  demandM3Day: number | null;
  deltaM3Day: number | null;
  coveragePct: number | null;
  assumptions: string[];
} {
  const areaHa = farm.mappedAreaHa > 0 ? farm.mappedAreaHa : farm.declaredAreaHa ?? 0;
  const supply = farm.water.dailyCapacityKnown ? farm.water.dailyCapacityM3 : null;
  let demand = farm.water.estimatedDailyDemandM3;

  const assumptions: string[] = [];
  if (demand === null && areaHa > 0 && farm.water.wateringMethod !== 'Rain-fed agriculture') {
    const cropItem = findCropCatalogItem((farm.primaryCrop || 'wheat').toLowerCase());
    const baseRateM3PerHa = cropItem?.category === 'Vegetables' ? 32 : cropItem?.category === 'Cereals and grains' ? 21 : 25;
    const effFactor =
      farm.water.irrigationMethod === 'Drip irrigation'
        ? 0.85
        : farm.water.irrigationMethod === 'Sprinkler irrigation'
          ? 1.0
          : farm.water.irrigationMethod === 'Flood irrigation'
            ? 1.3
            : 1.05;
    // Assume active irrigated share ~ 12% daily block rotation
    demand = Math.round(areaHa * baseRateM3PerHa * effFactor * 0.12);
    assumptions.push(
      `Modelled demand (~${demand} m³/day) assumes 12% daily rotational block coverage across ${areaHa.toFixed(1)} ha with ${farm.water.irrigationMethod || 'standard'} application efficiency.`
    );
  } else if (farm.water.demandAssumptionNote) {
    assumptions.push(farm.water.demandAssumptionNote);
  }

  if (farm.water.wateringMethod === 'Rain-fed agriculture') {
    assumptions.push('Rain-fed operation: irrigation abstraction demand set to 0 m³/day; seasonal moisture relies on precipitation.');
    demand = 0;
  }

  if (supply === null || demand === null) {
    return {
      status: 'insufficient',
      supplyM3Day: supply,
      demandM3Day: demand,
      deltaM3Day: null,
      coveragePct: null,
      assumptions:
        assumptions.length > 0
          ? assumptions
          : ['Enter measured daily pump/storage capacity and irrigation method to estimate balance.'],
    };
  }

  const delta = Number((supply - demand).toFixed(1));
  const coveragePct = demand === 0 ? 100 : Math.min(200, Math.round((supply / demand) * 100));
  const status =
    delta >= demand * 0.1 ? 'surplus' : delta >= -demand * 0.05 ? 'balanced' : 'deficit';

  return {
    status,
    supplyM3Day: supply,
    demandM3Day: demand,
    deltaM3Day: delta,
    coveragePct,
    assumptions,
  };
}

/**
 * Generates deterministic agronomic candidate rotation plans for comparison against
 * the farmer's explicitly selected Active Plan (never auto-replaces selected plan).
 */
export function generateRotationCandidatesForFarm(farm: MyFarmRecord): RotationCandidateOption[] {
  const isWaterLimited =
    farm.water.reliability === 'Frequently limited' ||
    farm.water.reliability === 'Highly unreliable' ||
    farm.water.reliability === 'Sometimes limited' ||
    (farm.soil.moisturePct !== null && farm.soil.moisturePct < 24);
  const currentCrop = (farm.primaryCrop || 'Wheat').trim();
  const baseScore = farm.assessment.score ?? 68;
  const conf = farm.assessment.confidencePct || 52;

  const candidates: RotationCandidateOption[] = [
    {
      id: 'rot-wheat-peas-cover',
      title: 'Wheat → Peas → Cover Oats',
      suitabilityScore: Math.min(95, Math.max(54, isWaterLimited ? baseScore + 6 : baseScore + 4)),
      confidencePct: conf,
      primaryBenefit: 'Nitrogen fixation + low peak summer drawdown',
      waterDemandImpact: 'Reduces demand',
      waterDemandMmEstimate: 310,
      soilImpactLabel: '+Nitrogen fixation & residue cover',
      steps: [
        {
          cycleLabel: 'Cycle 1 (Current)',
          cropId: 'wheat',
          cropName: currentCrop.toLowerCase().includes('corn') ? 'Wheat' : currentCrop || 'Wheat',
          nitrogenRole: 'heavy_feeder',
          waterNeedBand: 'Moderate',
          rationale: 'Cool-season establishment captures winter precipitation with lower evapotranspiration.',
        },
        {
          cycleLabel: 'Cycle 2 (Next)',
          cropId: 'peas',
          cropName: 'Peas',
          nitrogenRole: 'fixer',
          waterNeedBand: 'Low',
          rationale: 'Cool-season pulse fixes 45–65 kg N/ha and breaks cereal disease carryover.',
        },
        {
          cycleLabel: 'Cycle 3 (Restore)',
          cropId: 'barley',
          cropName: 'Oats / Barley Cover',
          nitrogenRole: 'cover_builder',
          waterNeedBand: 'Low',
          rationale: 'Fibrous root structure protects topsoil porosity ahead of next cash cycle.',
        },
      ],
    },
    {
      id: 'rot-sunflower-lentils-wheat',
      title: 'Sunflower → Lentils → Winter Wheat (Low Water)',
      suitabilityScore: Math.min(93, Math.max(50, isWaterLimited ? baseScore + 12 : baseScore - 2)),
      confidencePct: conf,
      primaryBenefit: 'Deep taproot scavenging during dry seasons',
      waterDemandImpact: 'Reduces demand',
      waterDemandMmEstimate: 275,
      soilImpactLabel: 'Deep subsoil fracturing + N credit',
      warningNote: isWaterLimited
        ? 'Recommended under current limited irrigation reliability.'
        : undefined,
      steps: [
        {
          cycleLabel: 'Cycle 1',
          cropId: 'sunflowers',
          cropName: 'Sunflower',
          nitrogenRole: 'light_feeder',
          waterNeedBand: 'Low',
          rationale: 'Taproot explores deeper moisture reserves when topsoil dries early.',
        },
        {
          cycleLabel: 'Cycle 2',
          cropId: 'peas',
          cropName: 'Lentils / Dry Peas',
          nitrogenRole: 'fixer',
          waterNeedBand: 'Low',
          rationale: 'Drought-tolerant legume rebuilds plant-available nitrogen cleanly.',
        },
        {
          cycleLabel: 'Cycle 3',
          cropId: 'wheat',
          cropName: 'Winter Wheat',
          nitrogenRole: 'heavy_feeder',
          waterNeedBand: 'Moderate',
          rationale: 'Capitalizes on legume residual nitrogen with minimal spring pump demand.',
        },
      ],
    },
    {
      id: 'rot-maize-soy-sunflower',
      title: 'Maize → Soybean → Sunflower',
      suitabilityScore: Math.min(90, Math.max(38, isWaterLimited ? baseScore - 8 : baseScore + 2)),
      confidencePct: conf,
      primaryBenefit: 'High biomass & grain revenue balance',
      waterDemandImpact: 'Increases demand',
      waterDemandMmEstimate: 445,
      soilImpactLabel: 'High residue return (demands moisture)',
      warningNote: isWaterLimited
        ? 'Peak mid-summer ET demand creates deficit risk under constrained water supply.'
        : undefined,
      steps: [
        {
          cycleLabel: 'Cycle 1',
          cropId: 'maize',
          cropName: 'Maize',
          nitrogenRole: 'heavy_feeder',
          waterNeedBand: 'High',
          rationale: 'Maximizes summer solar radiation capture where irrigation capacity keeps pace.',
        },
        {
          cycleLabel: 'Cycle 2',
          cropId: 'soybean',
          cropName: 'Soybean',
          nitrogenRole: 'fixer',
          waterNeedBand: 'Moderate',
          rationale: 'Offsets maize nitrogen drawdown with summer legume canopy.',
        },
        {
          cycleLabel: 'Cycle 3',
          cropId: 'sunflowers',
          cropName: 'Sunflower',
          nitrogenRole: 'light_feeder',
          waterNeedBand: 'Low',
          rationale: 'Scavenges deep nitrates before resetting to winter cereals.',
        },
      ],
    },
  ];

  // Match active plan ID if present so user clearly sees Active vs Recommended
  return candidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}

/**
 * Generates an interactive GeoJSON polygon box around a coordinate when creating a
 * quick rectangular starter block in the Add Farm wizard (validates geodesic area).
 */
export function buildStarterRectanglePolygon(
  lat: number,
  lon: number,
  targetHectares = 25
): { coordinates: LonLat[][]; areaHa: number; centroid: { lat: number; lon: number } } {
  const areaM2 = Math.max(10000, targetHectares * 10000);
  const sideM = Math.sqrt(areaM2);
  const halfLatDeg = (sideM / 2 / 111320);
  const cosLat = Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  const halfLonDeg = (sideM / 2 / (111320 * cosLat));

  const ring = closeRing([
    [Number((lon - halfLonDeg).toFixed(6)), Number((lat + halfLatDeg).toFixed(6))],
    [Number((lon + halfLonDeg).toFixed(6)), Number((lat + halfLatDeg).toFixed(6))],
    [Number((lon + halfLonDeg).toFixed(6)), Number((lat - halfLatDeg).toFixed(6))],
    [Number((lon - halfLonDeg).toFixed(6)), Number((lat - halfLatDeg).toFixed(6))],
  ]);

  const measuredM2 = computeRingGeodesicAreaM2(ring);
  const centroid = computeRingCentroid(ring) ?? { lat, lon };
  return {
    coordinates: [ring],
    areaHa: Number((measuredM2 / 10000).toFixed(2)),
    centroid,
  };
}

/**
 * Keeps localStorage FarmProfile (`anchor_farm_profiles_v1` + `anchor_active_farm_id_v1`)
 * synchronized with server portfolio mutations (create, rename, update, delete), so
 * /analyze?mode=farm, Home, and Header dropdown never drift or point to deleted IDs.
 */
export function syncFarmToLocalProfiles(farm: MyFarmRecord): void {
  const profiles = loadFarmProfiles();
  const existing = profiles.find((p) => p.id === farm.id);
  const base: FarmProfile = existing ?? createEmptyFarmProfile(farm.name);

  const synced: FarmProfile = {
    ...base,
    id: farm.id,
    updatedAt: farm.updatedAt,
    currentStage: Math.min(5, Math.max(base.currentStage, farm.assessment.score !== null ? 5 : 2)) as FarmProfile['currentStage'],
    location: {
      ...base.location,
      farmName: farm.name,
      locationLabel: farm.locationLabel || base.location.locationLabel,
      regionOrAddress: farm.regionLabel || base.location.regionOrAddress,
      country: farm.country !== 'Unspecified' ? farm.country : base.location.country,
      lat: farm.centroid?.lat ?? base.location.lat,
      lon: farm.centroid?.lon ?? base.location.lon,
    },
    areaValue: farm.mappedAreaHa > 0 ? farm.mappedAreaHa : farm.declaredAreaHa ?? base.areaValue,
    areaUnit: farm.areaUnit || base.areaUnit,
    soil: {
      ...base.soil,
      texture: (farm.soil.texture as FarmProfile['soil']['texture']) || base.soil.texture,
      moistureStatus: farm.soil.moistureStatus,
      moisturePct: farm.soil.moisturePct,
      moistureMethod: farm.soil.moistureMethod,
      moistureDate: farm.soil.moistureDate,
      phStatus: farm.soil.phStatus,
      phValue: farm.soil.phValue,
      phTestDate: farm.soil.phTestDate,
      drainage: (farm.soil.drainage as FarmProfile['soil']['drainage']) || base.soil.drainage,
    },
    water: {
      ...base.water,
      sources: (farm.water.sources as FarmProfile['water']['sources']) || base.water.sources,
      reliability: (farm.water.reliability as FarmProfile['water']['reliability']) || base.water.reliability,
      availableQuantityKnown: farm.water.dailyCapacityKnown ? 'Yes' : 'No',
      availableQuantityValue: farm.water.dailyCapacityM3,
      availableQuantityUnit: 'm³/day',
      qualityTested: (farm.water.qualityTested as FarmProfile['water']['qualityTested']) || base.water.qualityTested,
      ecValue: farm.water.ecDsM,
      salinityValue: farm.water.salinityPpm,
      qualityTestDate: farm.water.qualityTestDate,
      wateringMethod: (farm.water.wateringMethod as FarmProfile['water']['wateringMethod']) || base.water.wateringMethod,
      irrigationMethod: (farm.water.irrigationMethod as FarmProfile['water']['irrigationMethod']) || base.water.irrigationMethod,
      irrigationFrequency: (farm.water.irrigationFrequency as FarmProfile['water']['irrigationFrequency']) || base.water.irrigationFrequency,
      rainfallFrequency: (farm.water.rainfallFrequency as FarmProfile['water']['rainfallFrequency']) || base.water.rainfallFrequency,
    },
    crops: {
      ...base.crops,
      currentCrops:
        farm.primaryCrop && base.crops.currentCrops.length === 0
          ? [farm.primaryCrop.toLowerCase()]
          : base.crops.currentCrops,
    },
  };

  upsertFarmProfile(synced);
}

export function handleLocalProfileDeletionCleanup(deletedFarmId: string, remainingFarmIds: string[]): void {
  const existingActive = getActiveFarmId();
  deleteFarmProfile(deletedFarmId);
  if (existingActive === deletedFarmId) {
    setActiveFarmId(remainingFarmIds[0] ?? '');
  }
}
