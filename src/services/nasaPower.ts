import { TtlCache, fetchWithTimeout } from '../lib/cache';
import {
  ActivityPresetId,
  PowerClimateResult,
  PowerDailyPoint,
  PowerYearlySummary,
} from '../types';
import { ACTIVITY_PRESETS } from '../lib/weights';

const powerCache = new TtlCache<PowerClimateResult>(15 * 60 * 1000);
const power30Cache = new TtlCache<PowerClimateResult>(15 * 60 * 1000);

const BASE_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';

function cleanVal(v: number | undefined): number | null {
  if (v === undefined || v === null || Number.isNaN(v) || v <= -900) {
    return null;
  }
  return Number(v.toFixed(2));
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

interface PowerApiResponse {
  properties?: {
    parameter?: Record<string, Record<string, number>>;
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
  const params = json?.properties?.parameter;
  if (!params || !params.T2M) {
    throw new Error('NASA POWER returned an unexpected payload');
  }

  const targetD = new Date(`${targetDate}T00:00:00Z`);
  const targetDoy = dayOfYear(targetD);
  const endD = endDate ? new Date(`${endDate}T00:00:00Z`) : targetD;
  const endDoy = dayOfYear(endD);

  const preset = ACTIVITY_PRESETS[activityId] ?? ACTIVITY_PRESETS.outdoor_event;
  const allDates = Object.keys(params.T2M).sort();
  const windowDays: PowerDailyPoint[] = [];
  const byYear = new Map<number, PowerDailyPoint[]>();

  for (const key of allDates) {
    const dt = parsePowerKey(key);
    const doy = dayOfYear(dt);

    let inWindow = false;
    if (!endDate || endDate === targetDate) {
      inWindow = circularDoyDiff(doy, targetDoy) <= 3;
    } else {
      // Check if doy falls within [targetDoy - 3, endDoy + 3] (handling year wrap)
      if (targetDoy <= endDoy) {
        inWindow = (doy >= targetDoy - 3 && doy <= endDoy + 3) || circularDoyDiff(doy, targetDoy) <= 3 || circularDoyDiff(doy, endDoy) <= 3;
      } else {
        inWindow = doy >= targetDoy - 3 || doy <= endDoy + 3;
      }
    }

    if (!inWindow) continue;

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
      solarKwhM2: cleanVal(params.ALLSKY_SFC_SW_DWN?.[key]),
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

  const result: PowerClimateResult = {
    lat: roundedLat,
    lon: roundedLon,
    targetDate,
    endDate,
    yearsAnalyzed,
    windowDays,
    yearlySummaries,
    datasetName: 'NASA POWER Daily Point Climatology (MERRA-2 / CERES)',
    endpointUrl,
    fetchedAt: new Date().toISOString(),
    meanMaxC: avg(windowDays.map((p) => p.tMaxC)),
    meanMinC: avg(windowDays.map((p) => p.tMinC)),
    meanTempC: avg(windowDays.map((p) => p.tMeanC)),
    meanPrecipMm: avg(windowDays.map((p) => p.precipMm)),
    meanWindMs: avg(windowDays.map((p) => p.windMs)),
    meanHumidityPct: avg(windowDays.map((p) => p.humidityPct)),
    meanSolarKwhM2: avg(windowDays.map((p) => p.solarKwhM2)),
  };

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
  const params = json?.properties?.parameter;
  if (!params || !params.T2M) {
    throw new Error('NASA POWER returned an unexpected 30-day payload');
  }

  const keys = Object.keys(params.T2M).sort();
  const windowDays: PowerDailyPoint[] = keys
    .map((key) => {
      const dt = parsePowerKey(key);
      return {
        date: `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`,
        year: dt.getUTCFullYear(),
        doy: dayOfYear(dt),
        tMaxC: cleanVal(params.T2M_MAX?.[key]),
        tMinC: cleanVal(params.T2M_MIN?.[key]),
        tMeanC: cleanVal(params.T2M?.[key]),
        precipMm: cleanVal(params.PRECTOTCORR?.[key]),
        windMs: cleanVal(params.WS10M?.[key]),
        humidityPct: cleanVal(params.RH2M?.[key]),
        solarKwhM2: cleanVal(params.ALLSKY_SFC_SW_DWN?.[key]),
      };
    })
    .filter((pt) => pt.tMeanC !== null || pt.precipMm !== null || pt.solarKwhM2 !== null);

  const result: PowerClimateResult = {
    lat: roundedLat,
    lon: roundedLon,
    targetDate: endDt.toISOString().slice(0, 10),
    yearsAnalyzed: [endDt.getUTCFullYear()],
    windowDays,
    yearlySummaries: [],
    datasetName: 'NASA POWER Recent 30-Day Agroclimatology',
    endpointUrl,
    fetchedAt: new Date().toISOString(),
    meanMaxC: avg(windowDays.map((p) => p.tMaxC)),
    meanMinC: avg(windowDays.map((p) => p.tMinC)),
    meanTempC: avg(windowDays.map((p) => p.tMeanC)),
    meanPrecipMm: avg(windowDays.map((p) => p.precipMm)),
    meanWindMs: avg(windowDays.map((p) => p.windMs)),
    meanHumidityPct: avg(windowDays.map((p) => p.humidityPct)),
    meanSolarKwhM2: avg(windowDays.map((p) => p.solarKwhM2)),
  };

  power30Cache.set(cacheKey, result);
  return result;
}
