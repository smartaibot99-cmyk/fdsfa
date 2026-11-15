import { CropEntry, CropHealthResult, CropSubScore, PowerClimateResult } from '../types';
import { verdictFromScore } from './scoring';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Computes % of observed days falling strictly inside [min, max],
 * blended gently with distance-to-range when days are near the boundary
 * so borderline climates score smoothly while exact ideal days score highest.
 */
function daysInRangeScore(
  values: number[],
  min: number,
  max: number,
  tolerance: number
): { score: number | null; pctInside: number; daysInside: number } {
  if (values.length === 0) return { score: null, pctInside: 0, daysInside: 0 };

  const inside = values.filter((v) => v >= min && v <= max).length;
  const pctInside = (inside / values.length) * 100;

  // Per-day proximity fit so 0% slightly outside range gets partial credit rather than harsh cliff
  const avgProximity =
    values.reduce((sum, v) => {
      if (v >= min && v <= max) return sum + 100;
      const dist = v < min ? min - v : v - max;
      return sum + clamp(85 * (1 - dist / Math.max(0.001, tolerance)), 0, 85);
    }, 0) / values.length;

  const score = Math.round(pctInside * 0.65 + avgProximity * 0.35);
  return {
    score: clamp(score, 0, 100),
    pctInside: Math.round(pctInside),
    daysInside: inside,
  };
}

/**
 * Stage 1 Deterministic Grow Score (0-100):
 * Evaluates recent 30-day NASA POWER daily observations (% of days inside ideal range)
 * across Temperature (35%), Rainfall/Moisture (30%), Sunlight (20%), and Humidity (15%).
 */
export function computeGrowScore(
  crop: CropEntry,
  power30d: PowerClimateResult | null
): CropHealthResult {
  const dataGaps: string[] = [];
  const tips: string[] = [];
  const ideal = crop.idealConditions;

  const days = power30d?.windowDays ?? [];
  const temps = days.map((d) => d.tMeanC).filter((v): v is number => v !== null);
  const precips = days.map((d) => d.precipMm).filter((v): v is number => v !== null);
  const sunHours = days
    .map((d) => (d.solarKwhM2 !== null ? d.solarKwhM2 * 1.45 : null))
    .filter((v): v is number => v !== null);
  const humidities = days.map((d) => d.humidityPct).filter((v): v is number => v !== null);

  const avgTemp = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null;
  const totalPrecip30d = precips.length ? precips.reduce((a, b) => a + b, 0) : null;
  const avgSunHours = sunHours.length ? sunHours.reduce((a, b) => a + b, 0) / sunHours.length : null;
  const avgHumidity = humidities.length
    ? humidities.reduce((a, b) => a + b, 0) / humidities.length
    : null;

  // 1. Temperature fit (% of days inside [tempMinC, tempMaxC])
  const tempRes = daysInRangeScore(temps, ideal.tempMinC, ideal.tempMaxC, 12);
  if (avgTemp === null) {
    dataGaps.push('30-day mean temperature (T2M) unavailable from NASA POWER.');
  } else if (avgTemp < ideal.tempMinC) {
    tips.push(
      `Only ${tempRes.pctInside}% of recent days met ${crop.name}'s ${ideal.tempMinC}–${ideal.tempMaxC} °C warmth (${avgTemp.toFixed(1)} °C avg); use mulch or wait for warmer mornings.`
    );
  } else if (avgTemp > ideal.tempMaxC) {
    tips.push(
      `Recent temperatures (${avgTemp.toFixed(1)} °C avg) exceeded the ${ideal.tempMaxC} °C ceiling; schedule early-morning irrigation to reduce heat stress.`
    );
  } else {
    tips.push(
      `${tempRes.pctInside}% of the past ${temps.length} days fell comfortably inside ${crop.name}'s ideal ${ideal.tempMinC}–${ideal.tempMaxC} °C window.`
    );
  }

  // 2. Daily rainfall/moisture fit (convert annual mm range to daily mm/day target with generous daily spread)
  const dailyRainMin = Math.max(0, Number((ideal.annualRainfallMmMin / 365 * 0.35).toFixed(1)));
  const dailyRainMax = Number(((ideal.annualRainfallMmMax / 365) * 2.5 + 8).toFixed(1));
  const rainRes = daysInRangeScore(precips, dailyRainMin, dailyRainMax, 18);
  // Also blend 30-day cumulative rainfall fit against expected 30-day target
  const target30Min = ideal.annualRainfallMmMin / 12;
  const target30Max = ideal.annualRainfallMmMax / 12;
  let precipScore = rainRes.score;
  let precipInRange: boolean | null = null;
  if (totalPrecip30d !== null && rainRes.score !== null) {
    const cumScore =
      totalPrecip30d >= target30Min && totalPrecip30d <= target30Max
        ? 95
        : totalPrecip30d < target30Min
          ? clamp(Math.round(85 * (1 - (target30Min - totalPrecip30d) / Math.max(40, target30Min))), 15, 85)
          : clamp(Math.round(85 * (1 - (totalPrecip30d - target30Max) / Math.max(60, target30Max))), 15, 85);
    precipScore = Math.round(rainRes.score * 0.45 + cumScore * 0.55);
    precipInRange = totalPrecip30d >= target30Min * 0.7 && totalPrecip30d <= target30Max * 1.3;

    if (totalPrecip30d < target30Min * 0.7) {
      tips.push(
        `30-day rainfall (${totalPrecip30d.toFixed(1)} mm) trails rainfed targets (${Math.round(target30Min)}–${Math.round(target30Max)} mm/mo); plan supplemental drip irrigation.`
      );
    } else if (totalPrecip30d > target30Max * 1.3) {
      tips.push(
        `30-day rainfall (${totalPrecip30d.toFixed(1)} mm) exceeds normal drainage thresholds; clear field furrows to prevent root waterlogging.`
      );
    }
  } else {
    dataGaps.push('30-day precipitation (PRECTOTCORR) unavailable from NASA POWER.');
  }

  // 3. Sunlight hours fit
  const sunRes = daysInRangeScore(sunHours, ideal.sunlightHoursMin, ideal.sunlightHoursMax, 4);
  if (avgSunHours === null) {
    dataGaps.push('Surface solar irradiance (ALLSKY_SFC_SW_DWN) unavailable.');
  }

  // 4. Relative Humidity balance
  const humMin = ideal.waterNeed === 'High' ? 55 : ideal.waterNeed === 'Low' ? 20 : 40;
  const humMax = ideal.waterNeed === 'High' ? 90 : ideal.waterNeed === 'Low' ? 68 : 80;
  const humRes = daysInRangeScore(humidities, humMin, humMax, 25);
  if (avgHumidity === null) {
    dataGaps.push('Relative humidity (RH2M) unavailable.');
  }

  if (tips.length < 3) {
    tips.push(
      `Maintain ${ideal.soilType.toLowerCase()} around pH ${ideal.soilPhMin}–${ideal.soilPhMax} and watch NASA MODIS vegetation trends.`
    );
  }
  if (tips.length < 3) {
    tips.push(
      `Pair NASA POWER daily updates with local soil moisture checks before fertilizing or transplanting.`
    );
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
      label: `Temperature (${tempRes.pctInside}% days in range)`,
      observed: avgTemp !== null ? Number(avgTemp.toFixed(1)) : null,
      idealRange: `${ideal.tempMinC}–${ideal.tempMaxC} °C`,
      unit: '°C',
      score: tempRes.score,
      inIdealRange: avgTemp !== null ? avgTemp >= ideal.tempMinC && avgTemp <= ideal.tempMaxC : null,
      datasetCitation: 'NASA POWER (T2M)',
    },
    {
      key: 'precipitation',
      label: `Rainfall (${rainRes.pctInside}% days in range)`,
      observed: totalPrecip30d !== null ? Number(totalPrecip30d.toFixed(1)) : null,
      idealRange: `${Math.round(target30Min)}–${Math.round(target30Max)} mm/30d`,
      unit: 'mm',
      score: precipScore,
      inIdealRange: precipInRange,
      datasetCitation: 'NASA POWER (PRECTOTCORR)',
    },
    {
      key: 'sunlight',
      label: `Sunlight (${sunRes.pctInside}% days in range)`,
      observed: avgSunHours !== null ? Number(avgSunHours.toFixed(1)) : null,
      idealRange: `${ideal.sunlightHoursMin}–${ideal.sunlightHoursMax} h/d`,
      unit: 'h/day',
      score: sunRes.score,
      inIdealRange:
        avgSunHours !== null
          ? avgSunHours >= ideal.sunlightHoursMin && avgSunHours <= ideal.sunlightHoursMax
          : null,
      datasetCitation: 'NASA POWER (ALLSKY_SFC_SW_DWN)',
    },
    {
      key: 'humidity',
      label: `Humidity (${humRes.pctInside}% days in range)`,
      observed: avgHumidity !== null ? Math.round(avgHumidity) : null,
      idealRange: `${humMin}–${humMax}%`,
      unit: '%',
      score: humRes.score,
      inIdealRange: avgHumidity !== null ? avgHumidity >= humMin && avgHumidity <= humMax : null,
      datasetCitation: 'NASA POWER (RH2M)',
    },
  ];

  const availableWeight = rawItems.reduce(
    (sum, item) => (item.score !== null ? sum + baseWeights[item.key] : sum),
    0
  );

  const subScores: CropSubScore[] = rawItems.map((item) => {
    const w =
      item.score !== null && availableWeight > 0 ? baseWeights[item.key] / availableWeight : 0;
    const contrib = item.score !== null ? Number((item.score * w).toFixed(2)) : 0;
    return {
      ...item,
      weight: Number(w.toFixed(3)),
      contribution: contrib,
    };
  });

  const availableCount = subScores.filter((s) => s.score !== null).length;
  const dataScore =
    availableCount > 0
      ? clamp(Math.round(subScores.reduce((a, s) => a + s.contribution, 0)), 0, 100)
      : 0;
  const confidence = Number(((availableCount / 4) * 0.92).toFixed(2));

  return {
    dataScore,
    verdict: verdictFromScore(dataScore),
    confidence,
    subScores,
    dataGaps,
    tips: tips.slice(0, 3),
  };
}
