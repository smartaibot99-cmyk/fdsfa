import * as satellite from 'satellite.js';
import { TtlCache, fetchWithTimeout } from '../lib/cache';
import { SatelliteCatalogMeta, SatelliteLiveState, SatelliteOmmRecord } from '../types';

export const SATELLITE_CATALOG: SatelliteCatalogMeta[] = [
  {
    noradId: 25544,
    name: 'ISS (ZARYA)',
    agency: 'NASA / Roscosmos / ESA / JAXA / CSA',
    measures: 'Crew Earth observations, lightning (LIS), ECOSTRESS plant water stress',
    anchorContribution: 'Thermal stress & atmospheric optics validation',
    color: '#F5B83D',
  },
  {
    noradId: 25994,
    name: 'Terra',
    agency: 'NASA',
    measures: 'MODIS true-color reflectance, land surface temperature, CERES radiation',
    anchorContribution: 'MODIS True Color map layer & POWER solar radiation',
    color: '#22C7B8',
  },
  {
    noradId: 27424,
    name: 'Aqua',
    agency: 'NASA',
    measures: 'MODIS afternoon reflectance, AIRS atmospheric temperature & humidity',
    anchorContribution: 'Afternoon cloud/thermal imagery & atmospheric profiles',
    color: '#22C7B8',
  },
  {
    noradId: 28376,
    name: 'Aura',
    agency: 'NASA',
    measures: 'Ozone, NO₂, SO₂, and aerosol air-quality columns (OMI / MLS)',
    anchorContribution: 'Smoke plume & air-quality hazard context',
    color: '#38BDF8',
  },
  {
    noradId: 37849,
    name: 'Suomi NPP',
    agency: 'NASA / NOAA',
    measures: 'VIIRS Day/Night Band (Black Marble city lights) & active fire thermal hotspots',
    anchorContribution: 'VIIRS True Color layer & EONET wildfire detection',
    color: '#22C7B8',
  },
  {
    noradId: 43013,
    name: 'NOAA-20 (JPSS-1)',
    agency: 'NOAA / NASA',
    measures: 'VIIRS high-resolution multispectral imagery & CrIS atmospheric soundings',
    anchorContribution: 'Global severe storm & wildfire tracking',
    color: '#4C8DFF',
  },
  {
    noradId: 39084,
    name: 'Landsat 8',
    agency: 'USGS / NASA',
    measures: '30m optical & thermal infrared land imaging (OLI / TIRS)',
    anchorContribution: 'Crop vegetation vigor & field thermal baselines',
    color: '#34D399',
  },
  {
    noradId: 49260,
    name: 'Landsat 9',
    agency: 'USGS / NASA',
    measures: '30m multispectral land & coastal water monitoring (16-bit radiometry)',
    anchorContribution: '8-day paired revisit with Landsat 8 for farm monitoring',
    color: '#34D399',
  },
  {
    noradId: 39574,
    name: 'GPM Core',
    agency: 'NASA / JAXA',
    measures: 'Dual-frequency Precipitation Radar & microwave rainfall imaging',
    anchorContribution: 'NASA GIBS IMERG Precipitation map layer & rainfall calibration',
    color: '#60A5FA',
  },
  {
    noradId: 40376,
    name: 'SMAP',
    agency: 'NASA',
    measures: 'L-band radar/radiometer topsoil moisture & freeze-thaw state',
    anchorContribution: 'Agricultural soil moisture & drought context',
    color: '#A78BFA',
  },
  {
    noradId: 43613,
    name: 'ICESat-2',
    agency: 'NASA',
    measures: 'Photon-counting laser altimetry (ice sheets, canopy height, water level)',
    anchorContribution: 'Elevation, snowpack & coastal flood hazard baselines',
    color: '#22C7B8',
  },
];

export const EARTH_RADIUS_KM = 6371;
export const GLOBE_RADIUS = 2.0;

/**
 * Convert geographic coordinates (latDeg, lonDeg, radius) into Three.js SphereGeometry coordinates.
 */
export function latLonToVec3(latDeg: number, lonDeg: number, radius: number = GLOBE_RADIUS): [number, number, number] {
  const phi = (90 - latDeg) * (Math.PI / 180);
  const theta = (lonDeg + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

/**
 * Convert a 3D unit-normal or surface point back into geographic (latDeg, lonDeg).
 */
export function vec3ToLatLon(x: number, y: number, z: number): { lat: number; lon: number } {
  const len = Math.hypot(x, y, z) || 1;
  const nx = x / len;
  const ny = Math.max(-1, Math.min(1, y / len));
  const nz = z / len;
  const lat = 90 - Math.acos(ny) * (180 / Math.PI);
  let theta = Math.atan2(nz, -nx);
  if (theta < 0) theta += Math.PI * 2;
  const lon = theta * (180 / Math.PI) - 180;
  return { lat, lon };
}

export interface TleBundle {
  records: SatelliteOmmRecord[];
  isFallback: boolean;
  fetchedAt: string;
}

const tleCache = new TtlCache<TleBundle>(15 * 60 * 1000);

export async function fetchSatelliteTles(): Promise<TleBundle> {
  const cached = tleCache.get('bundle');
  if (cached) return cached;

  try {
    const resp = await fetchWithTimeout('/api/tle', {}, 10000);
    if (resp.ok) {
      const data = (await resp.json()) as TleBundle;
      if (Array.isArray(data.records) && data.records.length > 0) {
        tleCache.set('bundle', data);
        return data;
      }
    }
  } catch {
    // Fall through to bundled fallback
  }

  const fbResp = await fetch('/tle-fallback.json');
  const records = (await fbResp.json()) as SatelliteOmmRecord[];
  const bundle: TleBundle = {
    records,
    isFallback: true,
    fetchedAt: new Date().toISOString(),
  };
  tleCache.set('bundle', bundle);
  return bundle;
}

export interface CompiledSatellite {
  meta: SatelliteCatalogMeta;
  satrec: satellite.SatRec;
  periodMinutes: number;
}

export function compileSatellites(records: SatelliteOmmRecord[]): CompiledSatellite[] {
  const compiled: CompiledSatellite[] = [];
  for (const meta of SATELLITE_CATALOG) {
    const rec = records.find((r) => Number(r.NORAD_CAT_ID) === meta.noradId);
    if (!rec) continue;
    try {
      const satrec = satellite.json2satrec(rec as unknown as satellite.OMMJsonObject);
      const meanMotionRevPerDay = rec.MEAN_MOTION || 14.5;
      const periodMinutes = 1440 / meanMotionRevPerDay;
      compiled.push({ meta, satrec, periodMinutes });
    } catch {
      // Skip malformed record
    }
  }
  return compiled;
}

export function propagateSatelliteAt(
  sat: CompiledSatellite,
  date: Date,
  includeOrbitTrail: boolean = true
): SatelliteLiveState | null {
  const pv = satellite.propagate(sat.satrec, date);
  if (!pv || !pv.position || typeof pv.position === 'boolean') return null;

  const gmst = satellite.gstime(date);
  const geo = satellite.eciToGeodetic(pv.position, gmst);
  const lat = satellite.degreesLat(geo.latitude);
  const lon = satellite.degreesLong(geo.longitude);
  const altitudeKm = Math.max(180, geo.height);

  let velocityKmS = 7.5;
  if (pv.velocity && typeof pv.velocity !== 'boolean') {
    velocityKmS = Math.hypot(pv.velocity.x, pv.velocity.y, pv.velocity.z);
  }

  // Visual altitude exaggerated subtly so LEO satellites clear the cloud layer cleanly
  const visualRadius = GLOBE_RADIUS * (1 + Math.min(0.28, 0.08 + (altitudeKm / EARTH_RADIUS_KM) * 1.1));
  const position3D = latLonToVec3(lat, lon, visualRadius);

  const orbitPoints: [number, number, number][] = [];
  if (includeOrbitTrail) {
    const steps = 64;
    const stepMs = (sat.periodMinutes * 60 * 1000) / steps;
    for (let i = -steps / 2; i <= steps / 2; i++) {
      const t = new Date(date.getTime() + i * stepMs);
      const opv = satellite.propagate(sat.satrec, t);
      if (!opv || !opv.position || typeof opv.position === 'boolean') continue;
      const ogmst = satellite.gstime(t);
      const ogeo = satellite.eciToGeodetic(opv.position, ogmst);
      const olat = satellite.degreesLat(ogeo.latitude);
      const olon = satellite.degreesLong(ogeo.longitude);
      const oAlt = Math.max(180, ogeo.height);
      const oRad = GLOBE_RADIUS * (1 + Math.min(0.28, 0.08 + (oAlt / EARTH_RADIUS_KM) * 1.1));
      orbitPoints.push(latLonToVec3(olat, olon, oRad));
    }
  }

  return {
    meta: sat.meta,
    lat: Number(lat.toFixed(3)),
    lon: Number(lon.toFixed(3)),
    altitudeKm: Math.round(altitudeKm),
    velocityKmS: Number(velocityKmS.toFixed(2)),
    position3D,
    orbitPoints,
  };
}

export function computeGroundTrack(
  sat: CompiledSatellite,
  date: Date,
  minutesAhead: number = 95
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const steps = 90;
  for (let i = 0; i <= steps; i++) {
    const t = new Date(date.getTime() + (i / steps) * minutesAhead * 60 * 1000);
    const pv = satellite.propagate(sat.satrec, t);
    if (!pv || !pv.position || typeof pv.position === 'boolean') continue;
    const gmst = satellite.gstime(t);
    const geo = satellite.eciToGeodetic(pv.position, gmst);
    const lat = satellite.degreesLat(geo.latitude);
    const lon = satellite.degreesLong(geo.longitude);
    points.push(latLonToVec3(lat, lon, GLOBE_RADIUS + 0.015));
  }
  return points;
}
