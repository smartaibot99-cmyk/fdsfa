import { z } from 'zod';
import { AreaUnit, SoilMoistureStatus, SoilPhStatus } from '../types/farm';
import {
  FarmObservationItem,
  FarmTaskItem,
  MyFarmAssessment,
  MyFarmRecord,
  PortfolioFieldRecord,
  PortfolioStatus,
  SavedFarmSnapshot,
} from '../types/myFarms';

const STALE_DAYS_THRESHOLD = 14;

export function daysSinceIso(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.floor((Date.now() - ms) / 86400000));
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

export type SoilPhClassification =
  | 'acidic'
  | 'neutral_favorable'
  | 'alkaline'
  | 'untested'
  | 'invalid';

export interface SoilPhEvaluation {
  classification: SoilPhClassification;
  severity: 'strong' | 'moderate' | 'none' | 'missing' | 'invalid';
  shortLabel: string;
  isBalanced: boolean;
  scoreAdjustment: number;
  observation: string;
  recommendation: string;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Evaluates soil reaction (water pH) and whether buffer pH / lime requirement is available.
 * Thresholds are framed explicitly as general agricultural soil-chemistry reference windows
 * (crop cultivar tolerances and local soil buffering vary). Never fabricates a lime rate
 * when buffer pH / lime-requirement data is absent.
 */
export function evaluateSoilPhForSnapshot(
  phStatus: SoilPhStatus | string,
  phValue: number | null | undefined,
  bufferPh?: number | null
): SoilPhEvaluation {
  const hasValidPh = phStatus === 'tested' && isFiniteNumber(phValue);
  if (phStatus === 'tested' && phValue !== null && phValue !== undefined && !isFiniteNumber(phValue)) {
    return {
      classification: 'invalid',
      severity: 'invalid',
      shortLabel: 'Invalid pH value',
      isBalanced: false,
      scoreAdjustment: 0,
      observation: 'Recorded soil pH value is not a finite numeric measurement.',
      recommendation: 'Re-enter a valid laboratory soil pH value between 0.0 and 14.0 before scoring.',
    };
  }

  if (hasValidPh) {
    if (phValue < 0 || phValue > 14) {
      return {
        classification: 'invalid',
        severity: 'invalid',
        shortLabel: 'Out-of-range pH',
        isBalanced: false,
        scoreAdjustment: 0,
        observation: `Recorded soil pH (${phValue}) falls outside the physical 0–14 pH scale.`,
        recommendation: 'Verify laboratory units and enter a valid soil pH between 0.0 and 14.0.',
      };
    }

    const hasBuffer = isFiniteNumber(bufferPh) && bufferPh >= 0 && bufferPh <= 14;
    const bufferNote = hasBuffer
      ? ` Recorded buffer pH: ${bufferPh.toFixed(2)}.`
      : ' Buffer pH / lime requirement is not recorded.';

    if (phValue < 5.5) {
      return {
        classification: 'acidic',
        severity: 'strong',
        shortLabel: 'Strongly acidic (< 5.5)',
        isBalanced: false,
        scoreAdjustment: -12,
        observation: `Soil water pH is ${phValue.toFixed(1)} (strongly acidic under general agricultural soil-chemistry reference, below 5.5; aluminum/manganese solubility and phosphorus or legume-nodulation constraints become increasingly likely depending on crop tolerance and soil buffering).${bufferNote}`,
        recommendation: hasBuffer
          ? `Review measured water pH (${phValue.toFixed(1)}) alongside recorded buffer pH (${bufferPh!.toFixed(2)}), CEC/texture, and target crop pH with local extension to size agricultural lime accurately.`
          : 'Obtain a laboratory buffer-pH / lime-requirement test (e.g., SMP or Mehlich buffer) before selecting an agricultural lime rate — exact lime tonnage cannot be calculated from water pH alone. Verify acid-tolerant cultivar options or delay sensitive crops until buffered.',
      };
    }

    if (phValue < 5.8) {
      return {
        classification: 'acidic',
        severity: 'moderate',
        shortLabel: 'Moderately acidic (< 5.8)',
        isBalanced: false,
        scoreAdjustment: -6,
        observation: `Soil water pH is ${phValue.toFixed(1)} (moderately acidic, below the common 5.8–7.5 general nutrient-availability reference window; crop-specific tolerance varies).${bufferNote}`,
        recommendation: hasBuffer
          ? `Compare water pH (${phValue.toFixed(1)}) and recorded buffer pH (${bufferPh!.toFixed(2)}) against planned crop tolerance before scheduling lime.`
          : 'Submit a laboratory buffer-pH / lime-requirement test before deciding lime application rates — exact lime tonnage requires buffering capacity and target crop pH rather than water pH alone.',
      };
    }

    if (phValue <= 7.5) {
      return {
        classification: 'neutral_favorable',
        severity: 'none',
        shortLabel: 'General 5.8–7.5 window',
        isBalanced: true,
        scoreAdjustment: phValue >= 6.0 && phValue <= 7.2 ? 6 : 2,
        observation: `Soil water pH is ${phValue.toFixed(1)} (within the general 5.8–7.5 soil-chemistry window where macronutrient and micronutrient availability is broadly favorable for many field crops; crop-specific optima still apply).`,
        recommendation:
          'Confirm crop-specific pH tolerance for your active rotation (especially acid-loving or high-Ca specialty crops) and continue periodic 0–20 cm composite testing.',
      };
    }

    if (phValue <= 8.2) {
      return {
        classification: 'alkaline',
        severity: 'moderate',
        shortLabel: 'Moderately alkaline (> 7.5)',
        isBalanced: false,
        scoreAdjustment: -6,
        observation: `Soil water pH is ${phValue.toFixed(1)} (alkaline, above the common 5.8–7.5 general reference window; phosphorus, iron, zinc, and manganese availability may be reduced depending on free carbonates).`,
        recommendation:
          'Test free carbonates (CaCO3 %), saturated-paste EC, and micronutrients before planning elemental sulfur or micronutrient applications; acidification rates cannot be estimated from water pH alone.',
      };
    }

    return {
      classification: 'alkaline',
      severity: 'strong',
      shortLabel: 'Strongly alkaline (> 8.2)',
      isBalanced: false,
      scoreAdjustment: -12,
      observation: `Soil water pH is ${phValue.toFixed(1)} (strongly alkaline, above 8.2; elevated risk of micronutrient tie-up and potential sodicity/salinity stress).`,
      recommendation:
        'Obtain laboratory saturated-paste EC/SAR and carbonate analyses before selecting soil amendments or salt-sensitive crops; exact acidification rates cannot be derived from water pH alone.',
    };
  }

  return {
    classification: 'untested',
    severity: 'missing',
    shortLabel: 'Not tested',
    isBalanced: false,
    scoreAdjustment: 0,
    observation: 'Soil pH has not been laboratory-tested; soil reaction (acidity or alkalinity) is unverified.',
    recommendation:
      'Collect composite 0–20 cm soil cores for laboratory water-pH and buffer-pH analysis before finalizing fertilizer or lime decisions.',
  };
}

export interface ConfidenceEvidenceInput {
  soil: {
    texture: string;
    moistureStatus: SoilMoistureStatus | string;
    moisturePct: number | null;
    moistureMethod?: string;
    moistureDate?: string;
    phStatus: SoilPhStatus | string;
    phValue: number | null;
    phTestDate?: string;
    bufferPh?: number | null;
    organicMatterPct?: number | null;
    drainage: string;
  };
  water: {
    sources: string[];
    reliability: string;
    dailyCapacityKnown: boolean;
    dailyCapacityM3: number | null;
    qualityTested: string;
    ecDsM?: number | null;
    salinityPpm?: number | null;
  };
  hasCentroid: boolean;
  hasBoundary: boolean;
  hasPrimaryCrop: boolean;
  observations?: Array<{ provenance?: string; category?: string }>;
  dataAvailability?: {
    nasaPower: 'available' | 'cached' | 'unavailable';
    openMeteo: 'available' | 'cached' | 'unavailable';
    nasaEonet: 'available' | 'cached' | 'unavailable';
  };
  isStale?: boolean;
  hasFieldOverlapWarning?: boolean;
}

/**
 * Single evidence-based scientific confidence calculator (0-100%).
 * Intentionally separated from UI profile completeness and NEVER uses arbitrary
 * pre- vs post-assessment multipliers (such as 0.4 vs 0.85).
 */
export function computeScientificConfidence(input: ConfidenceEvidenceInput): number {
  let pts = 0;

  // 1. Soil moisture measurement quality (max 22 pts)
  const hasMoisture =
    isFiniteNumber(input.soil.moisturePct) &&
    input.soil.moisturePct >= 0 &&
    input.soil.moisturePct <= 100;
  if (input.soil.moistureStatus === 'measured' && hasMoisture) {
    pts += 16;
    if (input.soil.moistureMethod && input.soil.moistureMethod.trim().length > 0) pts += 3;
    if (input.soil.moistureDate && input.soil.moistureDate.trim().length > 0) pts += 3;
  } else if (input.soil.moistureStatus === 'estimated' && hasMoisture) {
    pts += 8;
  }

  // 2. Soil chemistry / laboratory testing depth (max 22 pts)
  const hasPh =
    input.soil.phStatus === 'tested' &&
    isFiniteNumber(input.soil.phValue) &&
    input.soil.phValue >= 0 &&
    input.soil.phValue <= 14;
  const hasBufferPh =
    isFiniteNumber(input.soil.bufferPh) &&
    input.soil.bufferPh >= 0 &&
    input.soil.bufferPh <= 14;
  const hasOm =
    isFiniteNumber(input.soil.organicMatterPct) && input.soil.organicMatterPct >= 0;

  if (hasPh) {
    pts += 12;
    if (input.soil.phTestDate && input.soil.phTestDate.trim().length > 0) pts += 2;
    if (hasBufferPh) pts += 5;
    if (hasOm) pts += 3;
  } else if (hasOm) {
    pts += 2;
  }

  // 3. Soil physical & water infrastructure evidence (max 16 pts)
  if (input.soil.texture && input.soil.texture !== 'Unknown') pts += 4;
  if (input.soil.drainage && input.soil.drainage !== 'Unknown') pts += 3;
  const hasWaterSource = input.water.sources.length > 0 && input.water.sources[0] !== 'Unknown';
  const hasWaterReliability = Boolean(input.water.reliability) && input.water.reliability !== 'Unknown';
  if (hasWaterSource && hasWaterReliability) pts += 4;
  if (
    input.water.dailyCapacityKnown &&
    isFiniteNumber(input.water.dailyCapacityM3) &&
    input.water.dailyCapacityM3 >= 0
  ) {
    pts += 3;
  }
  if (
    input.water.qualityTested === 'Yes' &&
    (isFiniteNumber(input.water.ecDsM) || isFiniteNumber(input.water.salinityPpm))
  ) {
    pts += 2;
  }

  // 4. Geospatial precision (max 14 pts)
  if (input.hasCentroid) pts += 8;
  if (input.hasBoundary) pts += 6;

  // 5. Empirical field / laboratory observations (max 8 pts)
  const obs = input.observations ?? [];
  if (obs.some((o) => o.provenance === 'Measured' || o.category === 'soil_lab')) {
    pts += 8;
  } else if (obs.length > 0) {
    pts += 4;
  }

  // 6. Retrieved climate / hazard telemetry & crop context (max 18 pts)
  const avail = input.dataAvailability ?? {
    nasaPower: 'unavailable',
    openMeteo: 'unavailable',
    nasaEonet: 'unavailable',
  };
  if (avail.nasaPower === 'available' || avail.nasaPower === 'cached') pts += 8;
  if (avail.openMeteo === 'available' || avail.openMeteo === 'cached') pts += 5;
  if (avail.nasaEonet === 'available' || avail.nasaEonet === 'cached') pts += 3;
  if (input.hasPrimaryCrop) pts += 2;

  // Evidence degradation adjustments (freshness & polygon conflict)
  if (input.isStale) pts -= 8;
  if (input.hasFieldOverlapWarning) pts -= 4;

  return Math.max(0, Math.min(100, Math.round(pts)));
}

/**
 * Profile completeness tracks which core onboarding/management fields have been filled (0-100%).
 * Preserves numeric 0 values cleanly without falsy dropping.
 */
export function computeProfileCompletenessPct(params: {
  hasCentroid: boolean;
  soil: {
    texture: string;
    moistureStatus: SoilMoistureStatus | string;
    moisturePct: number | null;
    phStatus: SoilPhStatus | string;
    phValue: number | null;
  };
  water: {
    sources: string[];
    reliability: string;
  };
  primaryCrop: string | null;
  hasBoundary: boolean;
  farmFields?: Array<{ cropName?: string }>;
}): { completenessPct: number; missingLabels: string[] } {
  const hasMoistureVal =
    params.soil.moistureStatus !== 'unknown' && isFiniteNumber(params.soil.moisturePct);
  const hasPhVal =
    params.soil.phStatus === 'tested' && isFiniteNumber(params.soil.phValue);

  const checks: Array<{ ok: boolean; label: string }> = [
    { ok: params.hasCentroid, label: 'Coordinates' },
    { ok: params.soil.texture !== 'Unknown' && Boolean(params.soil.texture), label: 'Soil texture' },
    { ok: hasMoistureVal, label: 'Soil moisture' },
    { ok: hasPhVal, label: 'Soil pH' },
    {
      ok: params.water.sources.length > 0 && params.water.sources[0] !== 'Unknown',
      label: 'Water source',
    },
    {
      ok: Boolean(params.water.reliability) && params.water.reliability !== 'Unknown',
      label: 'Water reliability',
    },
    {
      ok: Boolean(params.primaryCrop || params.farmFields?.some((f) => Boolean(f.cropName))),
      label: 'Primary crop',
    },
    { ok: params.hasBoundary, label: 'Mapped boundary' },
  ];

  const completenessPct = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  const missingLabels = checks.filter((c) => !c.ok).map((c) => c.label);
  return { completenessPct, missingLabels };
}

const availStatusSchema = z.enum(['available', 'cached', 'unavailable']);

export const snapshotCreateSchema = z.object({
  operationId: z.string().optional(),
  fieldId: z.string().nullable().optional(),
  fieldName: z.string().trim().min(1, 'Field name is required.').max(120),
  modelVersion: z.string().trim().min(1, 'Model version is required.').max(60),
  triggerReason: z.string().trim().min(1, 'Trigger reason is required.').max(200),
  suitabilityScore: z
    .number()
    .finite('Suitability score must be a finite number.')
    .min(0, 'Suitability score must be between 0 and 100.')
    .max(100, 'Suitability score must be between 0 and 100.')
    .nullable(),
  confidencePct: z
    .number()
    .finite('Scientific confidence must be a finite number.')
    .min(0, 'Scientific confidence must be between 0 and 100.')
    .max(100, 'Scientific confidence must be between 0 and 100.'),
  completenessPct: z
    .number()
    .finite('Profile completeness must be a finite number.')
    .min(0, 'Profile completeness must be between 0 and 100.')
    .max(100, 'Profile completeness must be between 0 and 100.'),
  weatherWindowSummary: z.string().trim().min(1, 'Weather window summary is required.').max(500),
  dataAvailability: z.object({
    nasaPower: availStatusSchema,
    openMeteo: availStatusSchema,
    nasaEonet: availStatusSchema,
    soilLab: z.enum(['measured', 'estimated', 'missing']),
  }),
  keyMetrics: z.object({
    meanTempC: z
      .number()
      .finite('Mean temperature must be a finite number.')
      .min(-60, 'Mean temperature out of physical bounds (-60 to 60 °C).')
      .max(60, 'Mean temperature out of physical bounds (-60 to 60 °C).')
      .nullable(),
    precipMmDay: z
      .number()
      .finite('Precipitation must be a finite number.')
      .min(0, 'Precipitation cannot be negative.')
      .max(500, 'Precipitation exceeds plausible daily range (0–500 mm/day).')
      .nullable(),
    et0MmDay: z
      .number()
      .finite('Reference ET0 must be a finite number.')
      .min(0, 'Reference ET0 cannot be negative.')
      .max(30, 'Reference ET0 exceeds plausible daily range (0–30 mm/day).')
      .nullable(),
    soilMoisturePct: z
      .number()
      .finite('Soil moisture must be a finite number.')
      .min(0, 'Soil moisture must be between 0% and 100%.')
      .max(100, 'Soil moisture must be between 0% and 100%.')
      .nullable(),
    phValue: z
      .number()
      .finite('Soil pH must be a finite number.')
      .min(0, 'Soil pH must be between 0 and 14.')
      .max(14, 'Soil pH must be between 0 and 14.')
      .nullable(),
    mappedAreaHa: z
      .number()
      .finite('Mapped area must be a finite number.')
      .min(0, 'Mapped area cannot be negative.')
      .max(1_000_000, 'Mapped area exceeds maximum limit.'),
  }),
  observations: z.array(z.string().trim().min(1).max(600)).max(20).optional(),
  recommendations: z
    .array(z.string().trim().min(1, 'Recommendation entries cannot be empty.').max(600))
    .min(1, 'At least one recommendation or verification step is required.')
    .max(20),
});

export type SnapshotCreateInput = z.infer<typeof snapshotCreateSchema>;

export function validateSnapshotPayload(
  input: unknown
): { ok: true; data: SnapshotCreateInput } | { ok: false; error: string; issues: string[] } {
  const parsed = snapshotCreateSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((iss) => {
      const pathStr = iss.path.length > 0 ? `${iss.path.join('.')}: ` : '';
      return `${pathStr}${iss.message}`;
    });
    return {
      ok: false,
      error: issues[0] || 'Invalid assessment snapshot payload.',
      issues,
    };
  }
  return { ok: true, data: parsed.data };
}

export interface BuildFreshSnapshotArgs {
  farm: MyFarmRecord;
  farmFields?: PortfolioFieldRecord[];
  farmObservations?: FarmObservationItem[];
  meanTempC: number | null;
  precipMmDay: number | null;
  et0MmDay: number | null;
  weatherWindowSummary: string;
  dataAvailability: {
    nasaPower: 'available' | 'cached' | 'unavailable';
    openMeteo: 'available' | 'cached' | 'unavailable';
    nasaEonet: 'available' | 'cached' | 'unavailable';
  };
  nearbyHazardCount?: number;
  triggerReason?: string;
  modelVersion?: string;
}

/**
 * Deterministic snapshot generator ensuring score, soil pH interpretation,
 * observations, recommendations, and evidence confidence strictly agree.
 */
export function buildFreshSnapshotPayload(args: BuildFreshSnapshotArgs): Omit<SavedFarmSnapshot, 'id' | 'farmId' | 'generatedAt'> {
  const { farm } = args;
  const farmFields = args.farmFields ?? [];
  const farmObs = args.farmObservations ?? [];

  const moisture =
    farm.soil.moistureStatus !== 'unknown' && isFiniteNumber(farm.soil.moisturePct)
      ? farm.soil.moisturePct
      : null;

  const ph =
    farm.soil.phStatus === 'tested' && isFiniteNumber(farm.soil.phValue)
      ? farm.soil.phValue
      : null;

  const bufferPh = isFiniteNumber(farm.soil.bufferPh) ? farm.soil.bufferPh : null;
  const phEval = evaluateSoilPhForSnapshot(farm.soil.phStatus, ph, bufferPh);

  const hazardCount = isFiniteNumber(args.nearbyHazardCount) ? Math.max(0, args.nearbyHazardCount) : 0;
  const hazardPenalty = hazardCount > 0 ? 10 : 0;

  const hasEnoughForScore =
    farm.centroid !== null &&
    (moisture !== null || ph !== null || (farm.soil.texture !== 'Unknown' && Boolean(farm.soil.texture)));

  let suitabilityScore: number | null = null;
  if (hasEnoughForScore) {
    let s = 74;
    if (moisture !== null) {
      if (moisture >= 24 && moisture <= 42) s += 10;
      else if (moisture < 19) s -= 24;
      else s -= 8;
    }
    s += phEval.scoreAdjustment;
    if (farm.water.reliability === 'Frequently limited' || farm.water.reliability === 'Highly unreliable') {
      s -= 16;
    } else if (farm.water.reliability === 'Always available') {
      s += 5;
    }
    s -= hazardPenalty;
    suitabilityScore = Math.max(0, Math.min(96, Math.round(s)));
  }

  const hasPrimaryCrop = Boolean(farm.primaryCrop || farmFields.some((f) => Boolean(f.cropName)));
  const confidencePct = computeScientificConfidence({
    soil: farm.soil,
    water: farm.water,
    hasCentroid: farm.centroid !== null,
    hasBoundary: farm.hasBoundary,
    hasPrimaryCrop,
    observations: farmObs,
    dataAvailability: args.dataAvailability,
    isStale: false,
    hasFieldOverlapWarning: farm.hasFieldOverlapWarning,
  });

  const { completenessPct } = computeProfileCompletenessPct({
    hasCentroid: farm.centroid !== null,
    soil: farm.soil,
    water: farm.water,
    primaryCrop: farm.primaryCrop,
    hasBoundary: farm.hasBoundary,
    farmFields,
  });

  const observations: string[] = [args.weatherWindowSummary];
  if (moisture !== null) {
    observations.push(
      `Observed soil moisture: ${moisture}% VWC (${farm.soil.moistureStatus}${farm.soil.moistureMethod ? `, ${farm.soil.moistureMethod}` : ''}).`
    );
  } else {
    observations.push('Soil volumetric moisture: not measured or estimated.');
  }
  observations.push(`Observed: ${phEval.observation}`);
  observations.push(`Water supply reliability: ${farm.water.reliability}.`);
  if (args.dataAvailability.nasaEonet !== 'unavailable') {
    observations.push(`NASA EONET nearby active hazards (30d): ${hazardCount}.`);
  }

  const recommendations: string[] = [];
  if (moisture !== null && moisture < 21) {
    recommendations.push(
      `Moisture deficit (${moisture}% VWC): prioritize drought-tolerant varieties or pre-dawn drip pulses.`
    );
  } else if (moisture === null) {
    recommendations.push('Measure baseline topsoil volumetric moisture before scheduling irrigation.');
  }

  if (!phEval.isBalanced) {
    recommendations.push(phEval.recommendation);
  }

  if (farm.water.reliability === 'Frequently limited' || farm.water.reliability === 'Highly unreliable') {
    recommendations.push('Align peak-ET crop stage outside constrained supply months.');
  }

  if (hazardPenalty > 0) {
    recommendations.push(
      `Active NASA EONET hazard (${hazardCount} nearby within 30d): verify field drainage and heat/fire buffers before field operations.`
    );
  }

  const allCheckedSignalsBalanced =
    recommendations.length === 0 &&
    farm.soil.moistureStatus === 'measured' &&
    moisture !== null &&
    moisture >= 24 &&
    moisture <= 42 &&
    phEval.isBalanced &&
    (farm.water.reliability === 'Always available' || farm.water.reliability === 'Usually available') &&
    (args.dataAvailability.nasaPower !== 'unavailable' ||
      args.dataAvailability.openMeteo !== 'unavailable') &&
    hazardPenalty === 0;

  if (allCheckedSignalsBalanced) {
    recommendations.push(
      'Measured moisture, tested soil pH (within general 5.8–7.5 window), and retrieved climate indicators remain within balanced operating bounds; verify crop-specific nutrient and cultivar targets before seeding.'
    );
  } else if (recommendations.length === 0) {
    recommendations.push(
      phEval.isBalanced && ph !== null
        ? `Soil pH (${ph.toFixed(1)}) lies within the general 5.8–7.5 window, though unmeasured moisture or offline climate feeds leave overall balance partially unverified; collect direct field measurements before major input commitments.`
        : 'Profile data remains incomplete for full agronomic verification; complete missing measurements before finalizing field prescriptions.'
    );
  }

  const soilLab: 'measured' | 'estimated' | 'missing' =
    farm.soil.moistureStatus === 'measured' || farm.soil.phStatus === 'tested'
      ? 'measured'
      : farm.soil.moistureStatus === 'estimated'
        ? 'estimated'
        : 'missing';

  return {
    fieldId: null,
    fieldName: 'Whole Farm',
    modelVersion: args.modelVersion ?? 'power-eonet-v2.1',
    triggerReason: args.triggerReason ?? 'Manual My Farms assessment refresh',
    suitabilityScore,
    confidencePct,
    completenessPct,
    weatherWindowSummary: args.weatherWindowSummary,
    dataAvailability: {
      nasaPower: args.dataAvailability.nasaPower,
      openMeteo: args.dataAvailability.openMeteo,
      nasaEonet: args.dataAvailability.nasaEonet,
      soilLab,
    },
    keyMetrics: {
      meanTempC: isFiniteNumber(args.meanTempC) ? args.meanTempC : null,
      precipMmDay: isFiniteNumber(args.precipMmDay) ? args.precipMmDay : null,
      et0MmDay: isFiniteNumber(args.et0MmDay) ? args.et0MmDay : null,
      soilMoisturePct: moisture,
      phValue: ph,
      mappedAreaHa: isFiniteNumber(farm.mappedAreaHa) && farm.mappedAreaHa >= 0 ? farm.mappedAreaHa : 0,
    },
    observations,
    recommendations,
  };
}

/**
 * Shared deterministic status + completeness + worst-field preservation engine.
 * Ensures a high score on 90% of a farm NEVER masks a severe soil/water/hazard alert on one field.
 */
export function buildAssessedFarmRecord(
  raw: ServerRawFarmDto,
  allFields: PortfolioFieldRecord[],
  observations: FarmObservationItem[],
  tasks: FarmTaskItem[],
  snapshots: SavedFarmSnapshot[] = []
): MyFarmRecord {
  const farmFields = allFields.filter((f) => f.farmId === raw.id);
  const farmObservations = observations.filter((o) => o.farmId === raw.id);
  const openTasks = tasks.filter((t) => t.farmId === raw.id && !t.completed);
  const highPriorityTasks = openTasks.filter((t) => t.priority === 'high');

  const { completenessPct, missingLabels } = computeProfileCompletenessPct({
    hasCentroid: Boolean(raw.centroid),
    soil: raw.soil,
    water: raw.water,
    primaryCrop: raw.primaryCrop,
    hasBoundary: raw.hasBoundary,
    farmFields,
  });

  const staleReasons: string[] = [];
  const ageDays = daysSinceIso(raw.lastAssessedAt);
  const isAgeStale = ageDays !== null && ageDays > STALE_DAYS_THRESHOLD;
  if (isAgeStale) {
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

  let activeAlertsCount = highPriorityTasks.length + (raw.hasFieldOverlapWarning ? 1 : 0);
  let criticalAlertsCount = 0;
  let worstFieldId: string | null = null;
  let worstFieldName: string | null = null;
  let worstFieldReason: string | null = null;

  if (raw.soil.moistureStatus !== 'unknown' && isFiniteNumber(raw.soil.moisturePct) && raw.soil.moisturePct < 19) {
    criticalAlertsCount++;
    activeAlertsCount++;
    worstFieldReason = `Low topsoil moisture (${raw.soil.moisturePct}% VWC)`;
  }

  const phEval = evaluateSoilPhForSnapshot(
    raw.soil.phStatus,
    raw.soil.phValue,
    raw.soil.bufferPh ?? null
  );
  if (phEval.classification === 'acidic' || phEval.classification === 'alkaline') {
    activeAlertsCount++;
    const phValStr = isFiniteNumber(raw.soil.phValue) ? ` (pH ${raw.soil.phValue.toFixed(1)})` : '';
    const bufferSuffix =
      phEval.classification === 'acidic' && !isFiniteNumber(raw.soil.bufferPh)
        ? ' — buffer pH test required before sizing lime'
        : '';
    const phReason = `${phEval.shortLabel}${phValStr}${bufferSuffix}`;
    worstFieldReason = worstFieldReason ? `${worstFieldReason}; ${phReason}` : phReason;
  }

  if (
    raw.water.dailyCapacityKnown &&
    isFiniteNumber(raw.water.dailyCapacityM3) &&
    isFiniteNumber(raw.water.estimatedDailyDemandM3) &&
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

  const latestSnapshot = snapshots
    .filter((s) => s.farmId === raw.id)
    .slice()
    .sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt))[0];

  const hasPrimaryCrop = Boolean(raw.primaryCrop || farmFields.some((f) => Boolean(f.cropName)));
  const confidencePct = computeScientificConfidence({
    soil: raw.soil,
    water: raw.water,
    hasCentroid: Boolean(raw.centroid),
    hasBoundary: raw.hasBoundary,
    hasPrimaryCrop,
    observations: farmObservations,
    dataAvailability: latestSnapshot?.dataAvailability
      ? {
          nasaPower: latestSnapshot.dataAvailability.nasaPower,
          openMeteo: latestSnapshot.dataAvailability.openMeteo,
          nasaEonet: latestSnapshot.dataAvailability.nasaEonet,
        }
      : undefined,
    isStale: isAgeStale,
    hasFieldOverlapWarning: raw.hasFieldOverlapWarning,
  });

  const summary =
    raw.mapExplanation ||
    (status === 'good'
      ? `Soil, moisture, and climate signals support ${raw.primaryCrop || 'current crop rotation'}.`
      : status === 'alert'
        ? worstFieldReason || 'Critical moisture or irrigation capacity constraint requires attention.'
        : status === 'needs_refresh'
          ? staleReasons[0] || 'Assessment exceeds freshness window; re-run recommended.'
          : status === 'needs_attention'
            ? worstFieldReason || 'Moderate soil, moisture, or supply variability detected.'
            : missingLabels.length > 0
              ? `Missing ${missingLabels.slice(0, 3).join(', ').toLowerCase()} before full scoring.`
              : phEval.classification === 'acidic' || phEval.classification === 'alkaline'
                ? `${worstFieldReason}. Ready to run climate and soil assessment.`
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
