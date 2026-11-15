import { TtlCache, fetchWithTimeout } from '../lib/cache';
import { DonkiEvent } from '../types';

const donkiCache = new TtlCache<DonkiEvent[]>(15 * 60 * 1000);

export async function fetchDonkiNotifications(): Promise<DonkiEvent[]> {
  const cached = donkiCache.get('recent');
  if (cached) return cached;

  const resp = await fetchWithTimeout('/api/nasa/donki', {}, 10000);
  if (!resp.ok) {
    throw new Error(`NASA DONKI returned HTTP ${resp.status}`);
  }
  const data = (await resp.json()) as DonkiEvent[];
  donkiCache.set('recent', data);
  return data;
}
