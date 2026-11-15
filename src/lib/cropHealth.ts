import { CropEntry, CropHealthResult, CropSubScore, PowerClimateResult } from '../types';
import { verdictFromScore } from './scoring';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function rangeFitScore(val: number, min: number, max: number, tolerance: number): number {
  if (val >= min && val <= max) {
    // Centered in ideal range scores 92-100
    const mid = (min + max) / 2;
    const halfSpan = Math.max(0.001, (max - min) / 2);
    const distNorm = Math.abs(val - mid) / halfSpan;
    return Math.round(100 - distNorm * 10);
  }
  const dist = val < min ? min - val : val - max;
  return Math.round(clamp(90 * (1 - dist / Math.max(0.001, tolerance)), 0, 90));
}

/**
 * Stage 1 Deterministic Crop Health Score (0-100) comparing recent 30-day
 * NASA POWER observations against the curated idealConditions in crops.json.
 */
export function computeCropHealthScore(
  crop: CropEntry,
  power30d: PowerClimateResult | null
): CropHealthResult {
  const dataGaps: string[] = [];
  const tips: string[] = [];
  const ideal = crop.idealConditions;

  const days = power30d?.windowDays ?? [];
  const temps = days.map((d) => d.tMeanC).filter((v): v is number => v !== null);
  const precips = days.map((d) => d.precipMm).filter((v): v is number => v !== null);
  const solars = days.map((d) => d.solarKwhM2).filter((v): v is number => v !== null);
  const humidities = days.map((d) => d.humidityPct).filter((v): v is number => v !== null);

  const avgTemp = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null;
  const totalPrecip30d = precips.length ? precips.reduce((a, b) => a + b, 0) : null;
  // Convert 30d precip to annualized equivalent (mm/yr) for comparison against annualRainfallMm
  const annualizedPrecip = totalPrecip30d !== null ? (totalPrecip30d / precips.length) * 365 : null;
  // Approximate bright sunlight hours/day from solar irradiance (kWh/m2/day * 1.45)
  const avgSolarKwh = solars.length ? solars.reduce((a, b) => a + b, 0) / solars.length : null;
  const approxSunHours = avgSolarKwh !== null ? avgSolarKwh * 1.45 : null;
  const avgHumidity = humidities.length ? humidities.reduce((a, b) => a + b, 0) / humidities.length : null;

  // Temp fit
  let tempScore: number | null = null;
  let tempInRange: boolean | null = null;
  if (avgTemp !== null) {
    tempScore = rangeFitScore(avgTemp, ideal.tempMinC, ideal.tempMaxC, 12);
    tempInRange = avgTemp >= ideal.tempMinC && avgTemp <= ideal.tempMaxC;
    if (avgTemp < ideal.tempMinC) {
      tips.push(`Recent 30-day mean temperature (${avgTemp.toFixed(1)} °C) is cooler than ${crop.name}'s ${ideal.tempMinC}–${ideal.tempMaxC} °C optimum; delay seeding or use mulch to retain soil warmth.`);
    } else if (avgTemp > ideal.tempMaxC) {
      tips.push(`Heat above ${ideal.tempMaxC} °C (${avgTemp.toFixed(1)} °C mean) increases evapotranspiration; schedule irrigation early morning to protect pollination.`);
    } else {
      tips.push(`Temperatures (${avgTemp.toFixed(1)} °C) sit squarely within ${crop.name}'s ${ideal.tempMinC}–${ideal.tempMaxC} °C sweet spot.`);
    }
  } else {
    dataGaps.push('30-day mean temperature unavailable from NASA POWER.');
  }

  // Moisture / Rainfall fit
  let precipScore: number | null = null;
  let precipInRange: boolean | null = null;
  if (annualizedPrecip !== null) {
    // Allow generous tolerance because arid crops like Date Palm & Cotton often rely on river/oasis irrigation
    const tol = ideal.waterNeed === 'Low' ? 900 : 1200;
    precipScore = rangeFitScore(annualizedPrecip, ideal.annualRainfallMmMin, ideal.annualRainfallMmMax, tol);
    precipInRange = annualizedPrecip >= ideal.annualRainfallMmMin && annualizedPrecip <= ideal.annualRainfallMmMax;
    if (annualizedPrecip < ideal.annualRainfallMmMin) {
      tips.push(`Recent rainfall rate (${Math.round(totalPrecip30d ?? 0)} mm over 30 days) is below rainfed targets; verify supplemental irrigation capacity.`);
    } else if (annualizedPrecip > ideal.annualRainfallMmMax) {
      tips.push(`Heavy recent precipitation (${Math.round(totalPrecip30d ?? 0)} mm/30d) elevates waterlogging and fungal pressure; inspect field drainage channels.`);
    }
  } else {
    dataGaps.push('30-day precipitation series unavailable from NASA POWER.');
  }

  // Sunlight fit
  let sunScore: number | null = null;
  let sunInRange: boolean | null = null;
  if (approxSunHours !== null) {
    sunScore = rangeFitScore(approxSunHours, ideal.sunlightHoursMin, ideal.sunlightHoursMax, 5);
    sunInRange = approxSunHours >= ideal.sunlightHoursMin && approxSunHours <= ideal.sunlightHoursMax;
  } else {
    dataGaps.push('Surface solar irradiance (ALLSKY_SFC_SW_DWN) unavailable.');
  }

  // Humidity / fungal vs desiccation balance (general healthy crop range 40-80%, higher for cocoa/rice/tea)
  let humScore: number | null = null;
  let humInRange: boolean | null = null;
  const humMin = ideal.waterNeed === 'High' ? 55 : ideal.waterNeed === 'Low' ? 20 : 40;
  const humMax = ideal.waterNeed === 'High' ? 90 : ideal.waterNeed === 'Low' ? 65 : 80;
  if (avgHumidity !== null) {
    humScore = rangeFitScore(avgHumidity, humMin, humMax, 30);
    humInRange = avgHumidity >= humMin && avgHumidity <= humMax;
  } else {
    dataGaps.push('Relative humidity (RH2M) unavailable.');
  }

  if (tips.length < 3) {
    tips.push(`Target ${ideal.soilType.toLowerCase()} with pH ${ideal.soilPhMin}–${ideal.soilPhMax} and monitor canopy vigor via NASA MODIS NDVI.`);
  }

  const baseWeights = {
    temperature: 0.35,
    precipitation: 0.30,
    sunlight: 0.20,
    humidity: 0.15,
  };

  const rawItems: Array<{
    key: CropSubScore['key'];
    label: string;
    observed: number | null;
    idealRange: string;
    unit: string;
    score: number | null;
    inIdealRange: boolean | null;
    datasetCitation: string;
  }> = [
    {
      key: 'temperature',
      label: 'Temperature Fit',
      observed: avgTemp !== null ? Number(avgTemp.toFixed(1)) : null,
      idealRange: `${ideal.tempMinC}–${ideal.tempMaxC} °C`,
      unit: '°C',
      score: tempScore,
      inIdealRange: tempInRange,
      datasetCitation: 'NASA POWER (T2M)',
    },
    {
      key: 'precipitation',
      label: 'Moisture / Rain Fit',
      observed: totalPrecip30d !== null ? Number(totalPrecip30d.toFixed(1)) : null,
      idealRange: `${Math.round(ideal.annualRainfallMmMin / 12)}–${Math.round(ideal.annualRainfallMmMax / 12)} mm/30d`,
      unit: 'mm',
      score: precipScore,
      inIdealRange: precipInRange,
      datasetCitation: 'NASA POWER (PRECTOTCORR)',
    },
    {
      key: 'sunlight',
      label: 'Sunlight / Solar',
      observed: approxSunHours !== null ? Number(approxSunHours.toFixed(1)) : null,
      idealRange: `${ideal.sunlightHoursMin}–${ideal.sunlightHoursMax} h/d`,
      unit: 'h/day',
      score: sunScore,
      inIdealRange: sunInRange,
      datasetCitation: 'NASA POWER (ALLSKY_SFC_SW_DWN)',
    },
    {
      key: 'humidity',
      label: 'Humidity Balance',
      observed: avgHumidity !== null ? Math.round(avgHumidity) : null,
      idealRange: `${humMin}–${humMax}%`,
      unit: '%',
      score: humScore,
      inIdealRange: humInRange,
      datasetCitation: 'NASA POWER (RH2M)',
    },
  ];

  const availableWeight = rawItems.reduce(
    (sum, item) => (item.score !== null ? sum + baseWeights[item.key] : sum),
    0
  );

  const subScores: CropSubScore[] = rawItems.map((item) => {
    const w = item.score !== null && availableWeight > 0 ? baseWeights[item.key] / availableWeight : 0;
    const contrib = item.score !== null ? Number((item.score * w).toFixed(2)) : 0;
    return {
      ...item,
      weight: Number(w.toFixed(3)),
      contribution: contrib,
    };
  });

  const availableCount = subScores.filter((s) => s.score !== null).length;
  const dataScore = availableCount > 0 ? clamp(Math.round(subScores.reduce((a, s) => a + s.contribution, 0)), 0, 100) : 0;
  const confidence = Number((availableCount / 4 * 0.92).toFixed(2));

  return {
    dataScore,
    verdict: verdictFromScore(dataScore),
    confidence,
    subScores,
    dataGaps,
    tips: tips.slice(0, 3),
  };
}
