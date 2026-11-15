import { TtlCache, fetchWithTimeout } from '../lib/cache';
import { CmrDataset } from '../types';

const cmrCache = new TtlCache<CmrDataset[]>(15 * 60 * 1000);

interface RawCmrResponse {
  feed?: {
    entry?: Array<{
      id?: string;
      title?: string;
      short_name?: string;
      summary?: string;
      time_start?: string;
      updated?: string;
      links?: Array<{ href?: string; title?: string; rel?: string }>;
    }>;
  };
}

export async function searchCmrDatasets(keyword: string = 'POWER MODIS GPM EONET'): Promise<CmrDataset[]> {
  const cached = cmrCache.get(keyword);
  if (cached) return cached;

  const url = `https://cmr.earthdata.nasa.gov/search/collections.json?keyword=${encodeURIComponent(keyword)}&page_size=10`;
  const resp = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 10000);
  if (!resp.ok) {
    throw new Error(`NASA Earthdata CMR returned HTTP ${resp.status}`);
  }

  const json = (await resp.json()) as RawCmrResponse;
  const datasets: CmrDataset[] = (json.feed?.entry ?? []).map((e) => ({
    id: e.id ?? '',
    title: e.title ?? 'NASA Earthdata Collection',
    shortName: e.short_name ?? 'NASA',
    summary: e.summary ?? '',
    timeStart: e.time_start,
    updated: e.updated,
    links: (e.links ?? [])
      .filter((l) => l.href && l.href.startsWith('http'))
      .slice(0, 2)
      .map((l) => ({ href: l.href as string, title: l.title, rel: l.rel })),
  }));

  cmrCache.set(keyword, datasets);
  return datasets;
}
