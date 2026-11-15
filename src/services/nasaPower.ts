import { TtlCache, fetchWithTimeout } from '../lib/cache';
import {
  ActivityPresetId,
  PowerClimateResult,
  PowerDailyPoint,
  PowerSolarValidationSummary,
  PowerYearlySummary,
  SolarValidationStatus,
} from '../types';
import { ACTIVITY_PRESETS } from '../lib/weights';

const powerCache = new TtlCache<PowerClimateResult>(15 * 60 * 1000);
const power30Cache = new TtlCache<PowerClimateResult>(15 * 60 * 1000);

const BASE_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';

/** Exact physical SI conversion factor: 1 kWh = 3.6 MJ. */
export const NASA_MJ_PER_KWH = 3.6;

/**
 * Physical upper limit for daily surface solar irradiation on Earth (kWh/m²/day).
 * Derived from the top-of-atmosphere solar constant (~1.361 kW/m²): even at peak
 * 24-hour polar solstice insolation outside the atmosphere, daily top-of-atmosphere
 * irradiation is bounded near ~12.8–13.0 kWh/m²/day, and surface clear-sky values
 * remain lower after atmospheric attenuation (~12.0 kWh/m²/day / 43.2 MJ/m²/day).
 */
export const NASA_SOLAR_PHYSICAL_MAX_KWH_M2_DAY = 12.0;

export interface SolarConversionResult {
  valueKwhM2: number | null;
  status: SolarValidationStatus;
  rawValue: number | null;
  isZero: boolean;
  reason?: string;
}

function cleanVal(v: number | undefined): number | null {
  if (v === undefined || v === null || Number.isNaN(v) || !Number.isFinite(v) || v <= -900) {
    return null;
  }
  return Number(v.toFixed(2));
}

function resolveSolarDivisor(sourceUnit?: string | null): { divisor: number | null; recognizedUnit: string | null } {
  if (sourceUnit === undefined || sourceUnit === null || sourceUnit.trim() === '') {
    // NASA POWER community=AG documented default for ALLSKY_SFC_SW_DWN is MJ/m^2/day
    return { divisor: NASA_MJ_PER_KWH, recognizedUnit: 'MJ/m^2/day' };
  }
  const normalized = sourceUnit.trim().toLowerCase().replace(/\s+/g, '');
  if (normalized === 'mj/m^2/day' || normalized === 'mj/m2/day') {
    return { divisor: NASA_MJ_PER_KWH, recognizedUnit: sourceUnit.trim() };
  }
  if (
    normalized === 'kw-hr/m^2/day' ||
    normalized === 'kwh/m^2/day' ||
    normalized === 'kwh/m2/day' ||
    normalized === 'kw-hr/m2/day'
  ) {
    return { divisor: 1, recognizedUnit: sourceUnit.trim() };
  }
  return { divisor: null, recognizedUnit: sourceUnit.trim() };
}

/**
 * Dedicated validator and unit converter for NASA POWER daily ALLSKY_SFC_SW_DWN.
 * - Rejects null, undefined, NaN, Infinity, NASA sentinels (<= -900), and negative values.
 * - Preserves 0 as a valid daily solar irradiation reading.
 * - Converts MJ/m²/day to kWh/m²/day (÷ 3.6) before rounding.
 * - Flags values exceeding the physical Earth-surface upper bound (> 12.0 kWh/m²/day).
 */
export function validateAndConvertNasaSolar(
  rawValue: unknown,
  sourceUnit?: string | null
): SolarConversionResult {
  if (rawValue === null || rawValue === undefined) {
    return {
      valueKwhM2: null,
      status: 'missing',
      rawValue: null,
      isZero: false,
      reason: 'Missing solar irradiation value',
    };
  }
  if (typeof rawValue !== 'number' || Number.isNaN(rawValue) || !Number.isFinite(rawValue)) {
    return {
      valueKwhM2: null,
      status: 'invalid',
      rawValue: null,
      isZero: false,
      reason: 'Non-finite or non-numeric solar irradiation value',
    };
  }
  if (rawValue <= -900) {
    return {
      valueKwhM2: null,
      status: 'missing',
      rawValue,
      isZero: false,
      reason: `NASA missing-data sentinel (${rawValue}) excluded`,
    };
  }
  if (rawValue < 0) {
    return {
      valueKwhM2: null,
      status: 'invalid',
      rawValue,
      isZero: false,
      reason: `Negative solar irradiation (${rawValue}) rejected`,
    };
  }

  const { divisor, recognizedUnit } = resolveSolarDivisor(sourceUnit);
  if (divisor === null) {
    return {
      valueKwhM2: null,
      status: 'invalid',
      rawValue,
      isZero: false,
      reason: `Unrecognized NASA solar unit "${recognizedUnit ?? 'unknown'}"`,
    };
  }

  if (rawValue === 0) {
    return {
      valueKwhM2: 0,
      status: 'valid',
      rawValue: 0,
      isZero: true,
    };
  }

  const converted = rawValue / divisor;
  if (!Number.isFinite(converted) || converted > NASA_SOLAR_PHYSICAL_MAX_KWH_M2_DAY) {
    return {
      valueKwhM2: null,
      status: 'implausible',
      rawValue,
      isZero: false,
      reason: `Converted value (${converted.toFixed(2)} kWh/m²/day from ${rawValue} ${recognizedUnit ?? 'MJ/m^2/day'}) exceeds Earth-surface physical upper bound (${NASA_SOLAR_PHYSICAL_MAX_KWH_M2_DAY} kWh/m²/day)`,
    };
  }

  return {
    valueKwhM2: Number(converted.toFixed(2)),
    status: 'valid',
    rawValue,
    isZero: false,
  };
}

function summarizeSolarValidation(
  solarResults: SolarConversionResult[],
  sourceUnit: string | null
): { meanSolarKwhM2: number | null; validation: PowerSolarValidationSummary } {
  const { divisor, recognizedUnit } = resolveSolarDivisor(sourceUnit);
  let validDays = 0;
  let zeroDays = 0;
  let rejectedDays = 0;
  let implausibleDays = 0;
  const validValues: number[] = [];
  const flagSet = new Set<string>();

  for (const r of solarResults) {
    if (r.status === 'valid' && r.valueKwhM2 !== null) {
      validDays++;
      if (r.isZero) zeroDays++;
      validValues.push(r.valueKwhM2);
    } else if (r.status === 'implausible') {
      implausibleDays++;
      rejectedDays++;
      if (r.reason) flagSet.add(r.reason);
    } else {
      rejectedDays++;
      if (r.status === 'invalid' && r.reason) {
        flagSet.add(r.reason);
      }
    }
  }

  if (implausibleDays > 0) {
    flagSet.add(
      `${implausibleDays} daily solar irradiation value(s) exceeded ${NASA_SOLAR_PHYSICAL_MAX_KWH_M2_DAY} kWh/m²/day and were excluded from the mean.`
    );
  }

  const meanSolarKwhM2 =
    validValues.length > 0
      ? Number((validValues.reduce((s, n) => s + n, 0) / validValues.length).toFixed(2))
      : null;

  return {
    meanSolarKwhM2,
    validation: {
      sourceUnit: recognizedUnit,
      conversionFactor: divisor ?? NASA_MJ_PER_KWH,
      validDays,
      zeroDays,
      rejectedDays,
      implausibleDays,
      flags: Array.from(flagSet),
    },
  };
}

function formatYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function parsePowerKey(ymd: string): Date {
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(4, 6)) - 1;
  const d = Number(ymd.slice(6, 8));
  return new Date(Date.UTC(y, m, d));
}

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86400000);
}

function circularDoyDiff(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 366 - diff);
}

function avg(arr: Array<number | null>): number | null {
  const valid = arr.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return Number((valid.reduce((s, n) => s + n, 0) / valid.length).toFixed(2));
}

export interface PowerApiResponse {
  properties?: {
    parameter?: Record<string, Record<string, number>>;
  };
  parameters?: Record<string, { units?: string; longname?: string }>;
}

/**
 * Pure parser for NASA POWER daily climatology payloads (shared with tests).
 */
export function parseNasaPowerClimatologyPayload(
  json: PowerApiResponse,
  opts: {
    lat: number;
    lon: number;
    targetDate: string;
    endDate?: string;
    activityId?: ActivityPresetId;
    endpointUrl?: string;
    fetchedAt?: string;
  }
): PowerClimateResult {
  const params = json?.properties?.parameter;
  if (!params || !params.T2M) {
    throw new Error('NASA POWER returned an unexpected payload');
  }

  const solarSourceUnit = json?.parameters?.ALLSKY_SFC_SW_DWN?.units ?? null;
  const targetD = new Date(`${opts.targetDate}T00:00:00Z`);
  const targetDoy = dayOfYear(targetD);
  const endD = opts.endDate ? new Date(`${opts.endDate}T00:00:00Z`) : targetD;
  const endDoy = dayOfYear(endD);

  const preset = ACTIVITY_PRESETS[opts.activityId ?? 'outdoor_event'] ?? ACTIVITY_PRESETS.outdoor_event;
  const allDates = Object.keys(params.T2M).sort();
  const windowDays: PowerDailyPoint[] = [];
  const solarResults: SolarConversionResult[] = [];
  const byYear = new Map<number, PowerDailyPoint[]>();

  for (const key of allDates) {
    const dt = parsePowerKey(key);
    const doy = dayOfYear(dt);

    let inWindow = false;
    if (!opts.endDate || opts.endDate === opts.targetDate) {
      inWindow = circularDoyDiff(doy, targetDoy) <= 3;
    } else {
      if (targetDoy <= endDoy) {
        inWindow =
          (doy >= targetDoy - 3 && doy <= endDoy + 3) ||
          circularDoyDiff(doy, targetDoy) <= 3 ||
          circularDoyDiff(doy, endDoy) <= 3;
      } else {
        inWindow = doy >= targetDoy - 3 || doy <= endDoy + 3;
      }
    }

    if (!inWindow) continue;

    const solarRes = validateAndConvertNasaSolar(params.ALLSKY_SFC_SW_DWN?.[key], solarSourceUnit);
    solarResults.push(solarRes);

    const pt: PowerDailyPoint = {
      date: `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`,
      year: dt.getUTCFullYear(),
      doy,
      tMaxC: cleanVal(params.T2M_MAX?.[key]),
      tMinC: cleanVal(params.T2M_MIN?.[key]),
      tMeanC: cleanVal(params.T2M?.[key]),
      precipMm: cleanVal(params.PRECTOTCORR?.[key]),
      windMs: cleanVal(params.WS10M?.[key]),
      humidityPct: cleanVal(params.RH2M?.[key]),
      solarKwhM2: solarRes.valueKwhM2,
      solarStatus: solarRes.status,
      ...(solarRes.reason ? { solarValidationNote: solarRes.reason } : {}),
    };

    windowDays.push(pt);
    const arr = byYear.get(pt.year) ?? [];
    arr.push(pt);
    byYear.set(pt.year, arr);
  }

  const yearsAnalyzed = Array.from(byYear.keys()).sort((a, b) => a - b);
  const yearlySummaries: PowerYearlySummary[] = yearsAnalyzed.map((year) => {
    const pts = byYear.get(year) ?? [];
    const precips = pts.map((p) => p.precipMm).filter((v): v is number => v !== null);
    return {
      year,
      meanMaxC: avg(pts.map((p) => p.tMaxC)),
      meanMinC: avg(pts.map((p) => p.tMinC)),
      maxPrecipMm: precips.length ? Number(Math.max(...precips).toFixed(1)) : null,
      totalPrecipMm: precips.length ? Number(precips.reduce((a, b) => a + b, 0).toFixed(1)) : null,
      meanWindMs: avg(pts.map((p) => p.windMs)),
      rainyDaysOver5mm: pts.filter((p) => (p.precipMm ?? -1) > preset.rainThresholdMm).length,
      hotDaysOverThreshold: pts.filter((p) => (p.tMaxC ?? -99) > preset.heatThresholdC).length,
      coldDaysUnder2C: pts.filter((p) => (p.tMinC ?? 99) < preset.coldThresholdC).length,
      windyDaysOver10Ms: pts.filter((p) => (p.windMs ?? -1) > preset.windThresholdMs).length,
      sampleCount: pts.length,
    };
  });

  const { meanSolarKwhM2, validation } = summarizeSolarValidation(solarResults, solarSourceUnit);

  return {
    lat: Number(opts.lat.toFixed(3)),
    lon: Number(opts.lon.toFixed(3)),
    targetDate: opts.targetDate,
    endDate: opts.endDate,
    yearsAnalyzed,
    windowDays,
    yearlySummaries,
    datasetName: 'NASA POWER Daily Point Climatology (MERRA-2 / CERES)',
    endpointUrl: opts.endpointUrl ?? BASE_URL,
    fetchedAt: opts.fetchedAt ?? new Date().toISOString(),
    meanMaxC: avg(windowDays.map((p) => p.tMaxC)),
    meanMinC: avg(windowDays.map((p) => p.tMinC)),
    meanTempC: avg(windowDays.map((p) => p.tMeanC)),
    meanPrecipMm: avg(windowDays.map((p) => p.precipMm)),
    meanWindMs: avg(windowDays.map((p) => p.windMs)),
    meanHumidityPct: avg(windowDays.map((p) => p.humidityPct)),
    meanSolarKwhM2,
    solarUnit: 'kWh/m²/day',
    solarValidation: validation,
  };
}

/**
 * Pure parser for NASA POWER recent 30-day agroclimatology payloads (shared with tests).
 */
export function parseNasaPowerRecent30Payload(
  json: PowerApiResponse,
  opts: {
    lat: number;
    lon: number;
    targetDate: string;
    yearsAnalyzed: number[];
    endpointUrl?: string;
    fetchedAt?: string;
  }
): PowerClimateResult {
  const params = json?.properties?.parameter;
  if (!params || !params.T2M) {
    throw new Error('NASA POWER returned an unexpected 30-day payload');
  }

  const solarSourceUnit = json?.parameters?.ALLSKY_SFC_SW_DWN?.units ?? null;
  const keys = Object.keys(params.T2M).sort();
  const solarResults: SolarConversionResult[] = [];
  const windowDays: PowerDailyPoint[] = [];

  for (const key of keys) {
    const dt = parsePowerKey(key);
    const solarRes = validateAndConvertNasaSolar(params.ALLSKY_SFC_SW_DWN?.[key], solarSourceUnit);
    const pt: PowerDailyPoint = {
      date: `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`,
      year: dt.getUTCFullYear(),
      doy: dayOfYear(dt),
      tMaxC: cleanVal(params.T2M_MAX?.[key]),
      tMinC: cleanVal(params.T2M_MIN?.[key]),
      tMeanC: cleanVal(params.T2M?.[key]),
      precipMm: cleanVal(params.PRECTOTCORR?.[key]),
      windMs: cleanVal(params.WS10M?.[key]),
      humidityPct: cleanVal(params.RH2M?.[key]),
      solarKwhM2: solarRes.valueKwhM2,
      solarStatus: solarRes.status,
      ...(solarRes.reason ? { solarValidationNote: solarRes.reason } : {}),
    };

    if (pt.tMeanC !== null || pt.precipMm !== null || pt.solarKwhM2 !== null) {
      windowDays.push(pt);
      solarResults.push(solarRes);
    }
  }

  const { meanSolarKwhM2, validation } = summarizeSolarValidation(solarResults, solarSourceUnit);

  return {
    lat: Number(opts.lat.toFixed(3)),
    lon: Number(opts.lon.toFixed(3)),
    targetDate: opts.targetDate,
    yearsAnalyzed: opts.yearsAnalyzed,
    windowDays,
    yearlySummaries: [],
    datasetName: 'NASA POWER Recent 30-Day Agroclimatology',
    endpointUrl: opts.endpointUrl ?? BASE_URL,
    fetchedAt: opts.fetchedAt ?? new Date().toISOString(),
    meanMaxC: avg(windowDays.map((p) => p.tMaxC)),
    meanMinC: avg(windowDays.map((p) => p.tMinC)),
    meanTempC: avg(windowDays.map((p) => p.tMeanC)),
    meanPrecipMm: avg(windowDays.map((p) => p.precipMm)),
    meanWindMs: avg(windowDays.map((p) => p.windMs)),
    meanHumidityPct: avg(windowDays.map((p) => p.humidityPct)),
    meanSolarKwhM2,
    solarUnit: 'kWh/m²/day',
    solarValidation: validation,
  };
}

/**
 * Fetch 20+ years of NASA POWER daily climatology for a location and filter
 * to the matching calendar window (targetDate ±3 days, or date range ±3 days).
 */
export async function fetchNasaPowerClimatology(
  lat: number,
  lon: number,
  targetDate: string,
  endDate?: string,
  activityId: ActivityPresetId = 'outdoor_event'
): Promise<PowerClimateResult> {
  const roundedLat = Number(lat.toFixed(3));
  const roundedLon = Number(lon.toFixed(3));
  const cacheKey = `${roundedLat},${roundedLon},${targetDate},${endDate || ''},${activityId}`;
  const cached = powerCache.get(cacheKey);
  if (cached) return cached;

  const endYear = Math.min(new Date().getUTCFullYear() - 1, 2025);
  const startYear = endYear - 20; // 21-year span (20+ years)
  const startStr = `${startYear}0101`;
  const endStr = `${endYear}1231`;

  const endpointUrl =
    `${BASE_URL}?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,WS10M,RH2M,ALLSKY_SFC_SW_DWN` +
    `&community=AG&longitude=${roundedLon}&latitude=${roundedLat}&start=${startStr}&end=${endStr}&format=JSON`;

  const resp = await fetchWithTimeout(endpointUrl, { headers: { Accept: 'application/json' } }, 10000);
  if (!resp.ok) {
    throw new Error(`NASA POWER returned HTTP ${resp.status}`);
  }

  const json = (await resp.json()) as PowerApiResponse;
  const result = parseNasaPowerClimatologyPayload(json, {
    lat: roundedLat,
    lon: roundedLon,
    targetDate,
    endDate,
    activityId,
    endpointUrl,
  });

  powerCache.set(cacheKey, result);
  return result;
}

/**
 * Fetch the last 30 available days of NASA POWER data for a farm location.
 * Accounts for POWER's ~5 day satellite processing latency.
 */
export async function fetchNasaPowerRecent30Days(
  lat: number,
  lon: number
): Promise<PowerClimateResult> {
  const roundedLat = Number(lat.toFixed(3));
  const roundedLon = Number(lon.toFixed(3));
  const cacheKey = `recent30:${roundedLat},${roundedLon}`;
  const cached = power30Cache.get(cacheKey);
  if (cached) return cached;

  const endDt = new Date();
  endDt.setUTCDate(endDt.getUTCDate() - 5);
  const startDt = new Date(endDt);
  startDt.setUTCDate(startDt.getUTCDate() - 30);

  const startStr = formatYmd(startDt);
  const endStr = formatYmd(endDt);

  const endpointUrl =
    `${BASE_URL}?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,WS10M,RH2M,ALLSKY_SFC_SW_DWN` +
    `&community=AG&longitude=${roundedLon}&latitude=${roundedLat}&start=${startStr}&end=${endStr}&format=JSON`;

  const resp = await fetchWithTimeout(endpointUrl, { headers: { Accept: 'application/json' } }, 10000);
  if (!resp.ok) {
    throw new Error(`NASA POWER recent 30d returned HTTP ${resp.status}`);
  }

  const json = (await resp.json()) as PowerApiResponse;
  const result = parseNasaPowerRecent30Payload(json, {
    lat: roundedLat,
    lon: roundedLon,
    targetDate: endDt.toISOString().slice(0, 10),
    yearsAnalyzed: [endDt.getUTCFullYear()],
    endpointUrl,
  });

  power30Cache.set(cacheKey, result);
  return result;
}
