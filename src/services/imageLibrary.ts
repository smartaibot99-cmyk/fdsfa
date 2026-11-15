import { TtlCache, fetchWithTimeout } from '../lib/cache';
import { NasaImageItem } from '../types';

const imageCache = new TtlCache<NasaImageItem[]>(15 * 60 * 1000);

interface RawImageSearchResponse {
  collection?: {
    items?: Array<{
      data?: Array<{
        nasa_id?: string;
        title?: string;
        description?: string;
        date_created?: string;
        center?: string;
      }>;
      links?: Array<{ href?: string; rel?: string }>;
    }>;
  };
}

export async function searchNasaImages(query: string = 'Earth observation climate'): Promise<NasaImageItem[]> {
  const cached = imageCache.get(query);
  if (cached) return cached;

  const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&page_size=8`;
  const resp = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 10000);
  if (!resp.ok) {
    throw new Error(`NASA Image Library returned HTTP ${resp.status}`);
  }

  const json = (await resp.json()) as RawImageSearchResponse;
  const items: NasaImageItem[] = [];
  for (const raw of json.collection?.items ?? []) {
    const meta = raw.data?.[0];
    const thumb = raw.links?.find((l) => l.rel === 'preview')?.href ?? raw.links?.[0]?.href;
    if (!meta?.nasa_id || !meta.title || !thumb) continue;
    items.push({
      nasaId: meta.nasa_id,
      title: meta.title,
      description: meta.description ?? '',
      dateCreated: meta.date_created ?? '',
      thumbnailUrl: thumb,
      center: meta.center,
    });
  }

  imageCache.set(query, items);
  return items;
}
