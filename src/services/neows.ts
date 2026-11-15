import { TtlCache, fetchWithTimeout } from '../lib/cache';
import { NeoSummary } from '../types';

const neowsCache = new TtlCache<NeoSummary>(15 * 60 * 1000);

export async function fetchNeowsSummary(): Promise<NeoSummary> {
  const cached = neowsCache.get('today');
  if (cached) return cached;

  const resp = await fetchWithTimeout('/api/nasa/neows', {}, 10000);
  if (!resp.ok) {
    throw new Error(`NASA NeoWs returned HTTP ${resp.status}`);
  }
  const data = (await resp.json()) as NeoSummary;
  neowsCache.set('today', data);
  return data;
}
