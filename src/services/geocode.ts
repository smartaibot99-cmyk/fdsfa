import { TtlCache, fetchWithTimeout } from '../lib/cache';
import { PlaceSelection } from '../types';

const searchCache = new TtlCache<PlaceSelection[]>(15 * 60 * 1000);
const reverseCache = new TtlCache<PlaceSelection>(15 * 60 * 1000);

let lastNominatimCall = 0;

async function respectRateLimit(): Promise<void> {
  const now = Date.now();
  const waitMs = 1050 - (now - lastNominatimCall);
  if (waitMs > 0) {
    await new Promise((r) => window.setTimeout(r, waitMs));
  }
  lastNominatimCall = Date.now();
}

interface NominatimItem {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  type?: string;
  class?: string;
  boundingbox?: [string, string, string, string]; // [south, north, west, east]
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

export interface GeocodePlaceResult extends PlaceSelection {
  type?: string;
  category?: string;
  boundingBox?: [number, number, number, number]; // [south, north, west, east]
}

const detailedSearchCache = new TtlCache<GeocodePlaceResult[]>(15 * 60 * 1000);

export async function searchPlacesDetailed(
  query: string,
  signal?: AbortSignal
): Promise<GeocodePlaceResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cached = detailedSearchCache.get(trimmed.toLowerCase());
  if (cached) return cached;

  await respectRateLimit();
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&addressdetails=1&q=${encodeURIComponent(trimmed)}`;
  const resp = await fetchWithTimeout(
    url,
    {
      headers: {
        Accept: 'application/json',
      },
      signal,
    },
    10000
  );

  if (!resp.ok) {
    throw new Error(`Place search returned HTTP ${resp.status}`);
  }

  const data = (await resp.json()) as NominatimItem[];
  const results: GeocodePlaceResult[] = data.map((item) => {
    const shortName =
      item.name ||
      item.address?.city ||
      item.address?.town ||
      item.address?.village ||
      item.display_name.split(',')[0];
    const bbox =
      Array.isArray(item.boundingbox) && item.boundingbox.length === 4
        ? ([
            Number(item.boundingbox[0]),
            Number(item.boundingbox[1]),
            Number(item.boundingbox[2]),
            Number(item.boundingbox[3]),
          ] as [number, number, number, number])
        : undefined;
    return {
      name: shortName,
      displayName: item.display_name,
      lat: Number(item.lat),
      lon: Number(item.lon),
      country: item.address?.country,
      type: item.type,
      category: item.class,
      boundingBox: bbox && bbox.every(Number.isFinite) ? bbox : undefined,
    };
  });

  detailedSearchCache.set(trimmed.toLowerCase(), results);
  return results;
}

export async function searchPlaces(query: string): Promise<PlaceSelection[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cached = searchCache.get(trimmed.toLowerCase());
  if (cached) return cached;

  const detailed = await searchPlacesDetailed(trimmed);
  const results: PlaceSelection[] = detailed.map(({ name, displayName, lat, lon, country }) => ({
    name,
    displayName,
    lat,
    lon,
    country,
  }));

  searchCache.set(trimmed.toLowerCase(), results);
  return results;
}

export async function reverseGeocode(lat: number, lon: number): Promise<PlaceSelection> {
  const rLat = Number(lat.toFixed(3));
  const rLon = Number(lon.toFixed(3));
  const key = `${rLat},${rLon}`;
  const cached = reverseCache.get(key);
  if (cached) return cached;

  try {
    await respectRateLimit();
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${rLat}&lon=${rLon}&zoom=8`;
    const resp = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 10000);
    if (!resp.ok) {
      throw new Error(`Reverse geocode returned HTTP ${resp.status}`);
    }
    const item = (await resp.json()) as NominatimItem;
    if (!item || !item.display_name) {
      throw new Error('Ocean or unnamed location');
    }
    const shortName =
      item.address?.city ||
      item.address?.town ||
      item.address?.village ||
      item.address?.state ||
      item.display_name.split(',')[0];
    const place: PlaceSelection = {
      name: shortName || `${rLat.toFixed(2)}, ${rLon.toFixed(2)}`,
      displayName: item.display_name,
      lat: rLat,
      lon: rLon,
      country: item.address?.country,
    };
    reverseCache.set(key, place);
    return place;
  } catch {
    const fallback: PlaceSelection = {
      name: `${Math.abs(rLat).toFixed(2)}°${rLat >= 0 ? 'N' : 'S'}, ${Math.abs(rLon).toFixed(2)}°${rLon >= 0 ? 'E' : 'W'}`,
      displayName: `Coordinates ${rLat.toFixed(3)}, ${rLon.toFixed(3)}`,
      lat: rLat,
      lon: rLon,
    };
    reverseCache.set(key, fallback);
    return fallback;
  }
}
