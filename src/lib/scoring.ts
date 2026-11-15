import {
  ActivityPresetId,
  DeterministicScoreResult,
  EonetFetchResult,
  FactorKey,
  FactorWeights,
  PowerClimateResult,
  ScoreVerdict,
  SubScore,
} from '../types';
import { ACTIVITY_PRESETS, FACTOR_KEYS, normalizeWeights } from './weights';

export function verdictFromScore(score: number): ScoreVerdict {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Caution';
  if (score >= 30) return 'Poor';
  return 'Avoid';
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Stage 1 Deterministic Scoring Engine (no AI involved).
 * Computes 6 transparent sub-scores (0-100) from NASA POWER 20+ yr daily climatology
 * and NASA EONET v3 natural hazard events within 300 km.
 * Contributions strictly sum to dataScore.
 */
export function computeDeterministicScore(
  power: PowerClimateResult | null,
  eonet: EonetFetchResult | null,
  activityId: ActivityPresetId,
  customWeights?: FactorWeights
): DeterministicScoreResult {
  const preset = ACTIVITY_PRESETS[activityId] ?? ACTIVITY_PRESETS.outdoor_event;
  const requestedWeights = normalizeWeights(customWeights ?? preset.defaultWeights);
  const dataGaps: string[] = [];

  const days = power?.windowDays ?? [];
  const validPrecip = days.filter((d) => d.precipMm !== null).map((d) => d.precipMm as number);
  const validTMax = days.filter((d) => d.tMaxC !== null).map((d) => d.tMaxC as number);
  const validTMin = days.filter((d) => d.tMinC !== null).map((d) => d.tMinC as number);
  const validWind = days.filter((d) => d.windMs !== null).map((d) => d.windMs as number);
  const validTMean = days.filter((d) => d.tMeanC !== null).map((d) => d.tMeanC as number);

  // 1. Rain Risk: % of days in ±3 day window across 20+ years with precip > rainThresholdMm
  let rainRaw: number | null = null;
  let rainRisk: number | null = null;
  if (validPrecip.length > 0) {
    const rainyCount = validPrecip.filter((p) => p > preset.rainThresholdMm).length;
    rainRaw = (rainyCount / validPrecip.length) * 100;
    // If 65%+ of historical days had >5mm rain, risk reaches ~100
    rainRisk = clamp((rainRaw / 65) * 100, 0, 100);
  } else {
    dataGaps.push('Precipitation records unavailable from NASA POWER for this coordinate.');
  }

  // 2. Heat Risk: % of days with T2M_MAX > heatThresholdC
  let heatRaw: number | null = null;
  let heatRisk: number | null = null;
  if (validTMax.length > 0) {
    const hotCount = validTMax.filter((t) => t > preset.heatThresholdC).length;
    heatRaw = (hotCount / validTMax.length) * 100;
    // 70% hot days -> 100 risk
    heatRisk = clamp((heatRaw / 70) * 100, 0, 100);
  } else {
    dataGaps.push('Daily maximum temperature unavailable from NASA POWER.');
  }

  // 3. Cold Risk: % of days with T2M_MIN < coldThresholdC
  let coldRaw: number | null = null;
  let coldRisk: number | null = null;
  if (validTMin.length > 0) {
    const coldCount = validTMin.filter((t) => t < preset.coldThresholdC).length;
    coldRaw = (coldCount / validTMin.length) * 100;
    coldRisk = clamp((coldRaw / 65) * 100, 0, 100);
  } else {
    dataGaps.push('Daily minimum temperature unavailable from NASA POWER.');
  }

  // 4. Wind Risk: % of days with WS10M > windThresholdMs
  let windRaw: number | null = null;
  let windRisk: number | null = null;
  if (validWind.length > 0) {
    const windyCount = validWind.filter((w) => w > preset.windThresholdMs).length;
    windRaw = (windyCount / validWind.length) * 100;
    windRisk = clamp((windRaw / 55) * 100, 0, 100);
  } else {
    dataGaps.push('10m wind speed unavailable from NASA POWER.');
  }

  // 5. Hazard Proximity: EONET v3 open events within 300 km in last 30 days
  let hazardRaw: number | null = null;
  let hazardRisk: number | null = null;
  if (eonet) {
    const nearby = eonet.nearbyEvents;
    hazardRaw = nearby.length;
    if (nearby.length === 0) {
      hazardRisk = 0;
    } else {
      // Closest event weight: 0 km => 60 pts, 300 km => 18 pts + 15 pts per extra event
      const closestKm = Math.min(...nearby.map((e) => e.distanceKm ?? 300));
      const proximityPenalty = clamp(62 * (1 - closestKm / 350), 15, 65);
      const countPenalty = Math.min(35, (nearby.length - 1) * 15);
      hazardRisk = clamp(proximityPenalty + countPenalty, 0, 100);
    }
  } else {
    dataGaps.push('NASA EONET active natural hazard feed unavailable.');
  }

  // 6. Historical Variability: inter-annual temperature & precipitation std-dev
  let variabilityRaw: number | null = null;
  let variabilityRisk: number | null = null;
  if (power && power.yearlySummaries.length >= 3 && validTMean.length > 0) {
    const yearlyMeans = power.yearlySummaries
      .map((y) => y.meanMaxC)
      .filter((v): v is number => v !== null);
    const yearlyPrecips = power.yearlySummaries
      .map((y) => y.totalPrecipMm)
      .filter((v): v is number => v !== null);

    const tempSd = stdDev(yearlyMeans);
    const precipSd = stdDev(yearlyPrecips);
    // Combine normalized temp SD (0-6°C) and precip SD (0-60mm)
    variabilityRaw = Number(tempSd.toFixed(1));
    const tempVarRisk = clamp((tempSd / 5.5) * 65, 0, 65);
    const precipVarRisk = clamp((precipSd / 55) * 35, 0, 35);
    variabilityRisk = clamp(tempVarRisk + precipVarRisk, 0, 100);
  } else {
    dataGaps.push('Insufficient multi-year records to quantify inter-annual climate variability.');
  }

  const rawDefs: Array<{
    key: FactorKey;
    label: string;
    rawMetricLabel: string;
    rawValue: number | null;
    unit: string;
    riskScore: number | null;
    datasetCitation: string;
    formulaDescription: string;
  }> = [
    {
      key: 'rain',
      label: 'Rain Risk',
      rawMetricLabel: `Days > ${preset.rainThresholdMm} mm/day`,
      rawValue: rainRaw !== null ? Number(rainRaw.toFixed(1)) : null,
      unit: '%',
      riskScore: rainRisk,
      datasetCitation: 'NASA POWER (PRECTOTCORR)',
      formulaDescription: `Share of days in target ±3d window across 20+ years with rainfall > ${preset.rainThresholdMm} mm/day.`,
    },
    {
      key: 'heat',
      label: 'Heat Risk',
      rawMetricLabel: `Days > ${preset.heatThresholdC} °C`,
      rawValue: heatRaw !== null ? Number(heatRaw.toFixed(1)) : null,
      unit: '%',
      riskScore: heatRisk,
      datasetCitation: 'NASA POWER (T2M_MAX)',
      formulaDescription: `Share of historical days with maximum 2m air temperature exceeding ${preset.heatThresholdC} °C.`,
    },
    {
      key: 'cold',
      label: 'Cold Risk',
      rawMetricLabel: `Days < ${preset.coldThresholdC} °C`,
      rawValue: coldRaw !== null ? Number(coldRaw.toFixed(1)) : null,
      unit: '%',
      riskScore: coldRisk,
      datasetCitation: 'NASA POWER (T2M_MIN)',
      formulaDescription: `Share of historical days with minimum 2m air temperature below ${preset.coldThresholdC} °C.`,
    },
    {
      key: 'wind',
      label: 'Wind Risk',
      rawMetricLabel: `Days > ${preset.windThresholdMs} m/s`,
      rawValue: windRaw !== null ? Number(windRaw.toFixed(1)) : null,
      unit: '%',
      riskScore: windRisk,
      datasetCitation: 'NASA POWER (WS10M)',
      formulaDescription: `Share of historical days with 10m wind speed exceeding ${preset.windThresholdMs} m/s.`,
    },
    {
      key: 'hazard',
      label: 'Hazard Proximity',
      rawMetricLabel: 'Active EONET events < 300 km',
      rawValue: hazardRaw,
      unit: 'events',
      riskScore: hazardRisk,
      datasetCitation: 'NASA EONET v3',
      formulaDescription: 'Distance-weighted penalty for active natural events within 300 km over the past 30 days.',
    },
    {
      key: 'variability',
      label: 'Historical Variability',
      rawMetricLabel: 'Inter-annual max temp σ',
      rawValue: variabilityRaw,
      unit: '°C',
      riskScore: variabilityRisk,
      datasetCitation: 'NASA POWER (20+ yr series)',
      formulaDescription: 'Year-to-year standard deviation of temperature and precipitation in this calendar window.',
    },
  ];

  // Re-normalize weights over factors that actually have data so contributions sum cleanly
  const availableWeightSum = rawDefs.reduce((sum, item) => {
    return item.riskScore !== null ? sum + requestedWeights[item.key] : sum;
  }, 0);

  const subScores: SubScore[] = rawDefs.map((item) => {
    const hasData = item.riskScore !== null;
    const risk = hasData ? Math.round(item.riskScore as number) : null;
    const suitability = hasData ? Math.round(100 - (item.riskScore as number)) : null;
    const effectiveWeight =
      hasData && availableWeightSum > 0
        ? requestedWeights[item.key] / availableWeightSum
        : 0;
    const contribution =
      hasData && suitability !== null
        ? Number((suitability * effectiveWeight).toFixed(2))
        : 0;

    return {
      key: item.key,
      label: item.label,
      rawMetricLabel: item.rawMetricLabel,
      rawValue: item.rawValue,
      unit: item.unit,
      riskScore: risk,
      suitabilityScore: suitability,
      weight: Number(effectiveWeight.toFixed(4)),
      contribution,
      hasData,
      datasetCitation: item.datasetCitation,
      formulaDescription: item.formulaDescription,
    };
  });

  const availableCount = subScores.filter((s) => s.hasData).length;
  const rawTotal = subScores.reduce((acc, s) => acc + s.contribution, 0);
  const dataScore = availableCount > 0 ? clamp(Math.round(rawTotal), 0, 100) : 0;

  // Confidence reflects factor coverage and sample depth
  const coverageRatio = availableCount / FACTOR_KEYS.length;
  const yearsRatio = power ? clamp(power.yearsAnalyzed.length / 20, 0.25, 1) : 0.25;
  const confidence = Number(clamp(coverageRatio * (0.45 + 0.55 * yearsRatio), 0.1, 0.96).toFixed(2));

  return {
    dataScore,
    verdict: verdictFromScore(dataScore),
    confidence,
    subScores,
    dataGaps,
    activityId,
  };
}
