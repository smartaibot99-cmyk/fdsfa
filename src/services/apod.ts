import { TtlCache, fetchWithTimeout } from '../lib/cache';
import { ApodData } from '../types';

const apodCache = new TtlCache<ApodData>(15 * 60 * 1000);

export async function fetchApod(): Promise<ApodData> {
  const cached = apodCache.get('today');
  if (cached) return cached;

  const resp = await fetchWithTimeout('/api/nasa/apod', {}, 10000);
  if (!resp.ok) {
    throw new Error(`NASA APOD returned HTTP ${resp.status}`);
  }
  const data = (await resp.json()) as ApodData;
  apodCache.set('today', data);
  return data;
}
