import { TtlCache, fetchWithTimeout } from '../lib/cache';

export interface LiveWeatherReading {
  tempC: number;
  tempHighC: number;
  tempLowC: number;
  humidityPct: number;
  humidityDeltaPct: number;
  windKmh: number;
  windDirCompass: string;
  precipMm: number;
  weatherCode: number;
  conditionLabel: string;
  observedAt: string;
  isDay: boolean;
  humiditySeries: number[];
  windSeries: number[];
}

const weatherCache = new TtlCache<LiveWeatherReading>(10 * 60 * 1000);

function describeWmoCode(code: number): string {
  if (code === 0) return 'Sunny';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Light drizzle';
  if (code >= 61 && code <= 63) return 'Light rain';
  if (code >= 65 && code <= 67) return 'Heavy rain';
  if (code >= 71 && code <= 77) return 'Snowfall';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Partly cloudy';
}

function degreesToCompass(deg: number | undefined): string {
  if (typeof deg !== 'number' || Number.isNaN(deg)) return 'NW';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return dirs[idx];
}

interface OpenMeteoResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    is_day?: number;
  };
  hourly?: {
    relative_humidity_2m?: number[];
    wind_speed_10m?: number[];
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
}

export async function fetchLiveFarmWeather(
  lat: number,
  lon: number
): Promise<LiveWeatherReading> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = weatherCache.get(key);
  if (cached) return cached;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day` +
    `&hourly=relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`;

  const resp = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 8000);
  if (!resp.ok) {
    throw new Error(`Weather service returned HTTP ${resp.status}`);
  }

  const json = (await resp.json()) as OpenMeteoResponse;
  const cur = json.current;
  if (!cur || typeof cur.temperature_2m !== 'number') {
    throw new Error('Weather service returned incomplete data');
  }

  const tempC = Math.round(cur.temperature_2m);
  const humidityPct = Math.round(cur.relative_humidity_2m ?? 60);
  const windKmh = Math.round(cur.wind_speed_10m ?? 10);

  const rawHumidity = json.hourly?.relative_humidity_2m ?? [];
  const rawWind = json.hourly?.wind_speed_10m ?? [];
  const sampleRealSeries = (arr: unknown): number[] => {
    if (!Array.isArray(arr)) return [];
    const valid = arr.filter(
      (v): v is number => typeof v === 'number' && Number.isFinite(v)
    );
    if (valid.length < 2) return [];
    if (valid.length <= 9) return valid.map((v) => Math.round(v));
    const step = (valid.length - 1) / 8;
    return Array.from({ length: 9 }, (_, i) => Math.round(valid[Math.round(i * step)]));
  };

  const humiditySeries = sampleRealSeries(rawHumidity);
  const windSeries = sampleRealSeries(rawWind);
  const humidityDeltaPct =
    humiditySeries.length >= 2
      ? humidityPct - humiditySeries[Math.max(0, humiditySeries.length - 3)]
      : 0;

  const maxDaily = json.daily?.temperature_2m_max?.[0];
  const minDaily = json.daily?.temperature_2m_min?.[0];

  const code = cur.weather_code ?? 2;
  const reading: LiveWeatherReading = {
    tempC,
    tempHighC: typeof maxDaily === 'number' ? Math.round(maxDaily) : tempC + 4,
    tempLowC: typeof minDaily === 'number' ? Math.round(minDaily) : tempC - 7,
    humidityPct,
    humidityDeltaPct,
    windKmh,
    windDirCompass: degreesToCompass(cur.wind_direction_10m),
    precipMm: Number((cur.precipitation ?? 0).toFixed(1)),
    weatherCode: code,
    conditionLabel: describeWmoCode(code),
    observedAt: cur.time ?? new Date().toISOString(),
    isDay: cur.is_day === 1,
    humiditySeries,
    windSeries,
  };

  weatherCache.set(key, reading);
  return reading;
}
