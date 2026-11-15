import { TtlCache, fetchWithTimeout } from '../lib/cache';
import { EonetEvent, EonetFetchResult } from '../types';

const eonetCache = new TtlCache<EonetEvent[]>(15 * 60 * 1000);
const EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30&limit=150';

interface RawEonetGeometry {
  magnitudeValue?: number;
  magnitudeUnit?: string;
  date: string;
  type: string;
  coordinates: number[] | number[][][];
}

interface RawEonetResponse {
  events?: Array<{
    id: string;
    title: string;
    description?: string | null;
    link: string;
    categories: Array<{ id: string; title: string }>;
    geometry: RawEonetGeometry[];
  }>;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function extractPoint(geom: RawEonetGeometry | undefined): { lat: number; lon: number } | null {
  if (!geom || !geom.coordinates) return null;
  if (geom.type === 'Point' && Array.isArray(geom.coordinates) && typeof geom.coordinates[0] === 'number') {
    const [lon, lat] = geom.coordinates as number[];
    return { lat, lon };
  }
  if (geom.type === 'Polygon' && Array.isArray(geom.coordinates)) {
    const ring = (geom.coordinates as number[][][])[0];
    if (ring && ring.length > 0) {
      let sumLat = 0;
      let sumLon = 0;
      for (const pair of ring) {
        sumLon += pair[0];
        sumLat += pair[1];
      }
      return { lat: sumLat / ring.length, lon: sumLon / ring.length };
    }
  }
  return null;
}

export async function fetchEonetEvents(
  targetLat?: number,
  targetLon?: number,
  radiusKm: number = 300
): Promise<EonetFetchResult> {
  let events = eonetCache.get('open_30d');
  let fetchedAt = new Date().toISOString();

  if (!events) {
    const resp = await fetchWithTimeout(EONET_URL, { headers: { Accept: 'application/json' } }, 10000);
    if (!resp.ok) {
      throw new Error(`NASA EONET returned HTTP ${resp.status}`);
    }
    const json = (await resp.json()) as RawEonetResponse;
    const parsed: EonetEvent[] = [];

    for (const raw of json.events ?? []) {
      const latestGeom = raw.geometry?.[raw.geometry.length - 1];
      const pt = extractPoint(latestGeom);
      if (!pt) continue;
      parsed.push({
        id: raw.id,
        title: raw.title,
        description: raw.description ?? undefined,
        link: raw.link,
        categories: raw.categories ?? [],
        date: latestGeom?.date ?? new Date().toISOString(),
        lat: pt.lat,
        lon: pt.lon,
        magnitudeValue: latestGeom?.magnitudeValue,
        magnitudeUnit: latestGeom?.magnitudeUnit,
      });
    }

    eonetCache.set('open_30d', parsed);
    events = parsed;
  } else {
    const ts = eonetCache.getTimestamp('open_30d');
    if (ts) fetchedAt = new Date(ts).toISOString();
  }

  const withDistances = events.map((ev) => ({
    ...ev,
    distanceKm:
      targetLat !== undefined && targetLon !== undefined
        ? Math.round(haversineKm(targetLat, targetLon, ev.lat, ev.lon))
        : undefined,
  }));

  const nearbyEvents =
    targetLat !== undefined && targetLon !== undefined
      ? withDistances
          .filter((ev) => (ev.distanceKm ?? Infinity) <= radiusKm)
          .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      : [];

  return {
    events: withDistances,
    nearbyEvents,
    datasetName: 'NASA EONET v3 (Earth Observatory Natural Event Tracker)',
    endpointUrl: EONET_URL,
    fetchedAt,
  };
}
