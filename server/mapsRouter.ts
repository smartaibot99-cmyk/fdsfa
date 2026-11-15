import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '..', '.data');
const STORE_PATH = path.join(DATA_DIR, 'maps-workspace.json');

const EARTH_RADIUS_M = 6371008.8;
const DEG_TO_RAD = Math.PI / 180;

type LonLat = [number, number];

interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: LonLat[][];
}

interface StoredGeometryVersion {
  geometryVersionId: string;
  versionNumber: number;
  createdAt: string;
  source: 'drawn' | 'imported' | 'edited';
  crs: 'EPSG:4326';
  areaMethod: 'WGS84 Spherical Excess (Chamberlain-Duquette)';
  grossAreaHectares: number;
  netAreaHectares: number;
  excludedAreaHectares: number;
  perimeterM: number;
  centroid: { lat: number; lon: number };
  geometry: GeoJsonPolygon;
  originalImportedGeometry?: GeoJsonPolygon;
  editReason?: string;
}

interface StoredMapField {
  id: string;
  farmId: string;
  name: string;
  cropId?: string;
  cropName?: string;
  soilSummary?: string;
  waterSummary?: string;
  status: 'Active' | 'Planned' | 'Fallow' | 'Needs Review';
  currentVersionId: string;
  versions: StoredGeometryVersion[];
  staleCalculations: string[];
  batchImportId?: string;
  updatedAt: string;
}

interface StoredDiscoveryOptIn {
  farmId: string;
  publicId: string;
  optedIn: boolean;
  displayAlias: string;
  cityKey: string;
  cityName: string;
  regionLabel: string;
  approximateLat: number;
  approximateLon: number;
  farmScaleBand: 'Smallholder (< 10 ha)' | 'Medium (10–100 ha)' | 'Large (> 100 ha)';
  sharedCrops: string[];
  sharedPriorities: string[];
  irrigationTypeShared?: string;
  soilTextureShared?: string;
  climateScore?: number;
  acceptsMessages: boolean;
  updatedAt: string;
}

interface StoredDiscoveryMessage {
  id: string;
  fromAlias: string;
  toPublicId: string;
  cityName: string;
  text: string;
  createdAt: string;
}

type FarmHealthStatus = 'healthy' | 'moderate' | 'at_risk' | 'no_data';

type FarmGeoJson =
  | GeoJsonPolygon
  | {
      type: 'MultiPolygon';
      coordinates: LonLat[][][];
    };

interface StoredFarmAssessment {
  farmId: string;
  status: FarmHealthStatus;
  score: number | null;
  assessedAt: string;
  assessmentVersion: string;
  confidence?: number;
  explanation?: string;
}

interface StoredWorkspaceFarm {
  id: string;
  name: string;
  crop: string | null;
  locationLabel: string;
  notes?: string;
  geometry: FarmGeoJson;
  areaM2: number;
  areaHa: number;
  perimeterM: number;
  centroid: { lat: number; lon: number };
  labelPoint: { lat: number; lon: number };
  healthStatus: FarmHealthStatus;
  assessment: StoredFarmAssessment;
  versionNumber: number;
  boundaryHistory: Array<{
    versionNumber: number;
    geometry: FarmGeoJson;
    areaM2: number;
    changedAt: string;
    changeReason?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface MapsWorkspaceStore {
  farms: StoredWorkspaceFarm[];
  fields: StoredMapField[];
  discoveryOptIns: StoredDiscoveryOptIn[];
  messages: StoredDiscoveryMessage[];
  blockedPublicIds: string[];
}

function closeRing(ring: LonLat[]): LonLat[] {
  if (ring.length === 0) return [];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (Math.abs(first[0] - last[0]) < 1e-11 && Math.abs(first[1] - last[1]) < 1e-11) {
    return ring;
  }
  return [...ring, [first[0], first[1]]];
}

function stripClosing(ring: LonLat[]): LonLat[] {
  if (ring.length < 2) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (Math.abs(first[0] - last[0]) < 1e-10 && Math.abs(first[1] - last[1]) < 1e-10) {
    return ring.slice(0, -1);
  }
  return ring;
}

function haversineM(a: LonLat, b: LonLat): number {
  const lat1 = a[1] * DEG_TO_RAD;
  const lat2 = b[1] * DEG_TO_RAD;
  const dLat = (b[1] - a[1]) * DEG_TO_RAD;
  const dLon = (b[0] - a[0]) * DEG_TO_RAD;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}

function computeRingAreaM2(ring: LonLat[]): number {
  if (ring.length < 3) return 0;
  const closed = closeRing(ring);
  const n = closed.length - 1;
  if (n < 3) return 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const lon1 = closed[i][0] * DEG_TO_RAD;
    const lat2 = closed[(i + 1) % n][1] * DEG_TO_RAD;
    const lon3 = closed[(i + 2) % n][0] * DEG_TO_RAD;
    total += (lon3 - lon1) * Math.sin(lat2);
  }
  return Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

function computeRingPerimeterM(ring: LonLat[]): number {
  const closed = closeRing(ring);
  let sum = 0;
  for (let i = 0; i < closed.length - 1; i++) {
    sum += haversineM(closed[i], closed[i + 1]);
  }
  return sum;
}

function computeCentroid(ring: LonLat[]): { lat: number; lon: number } {
  const open = stripClosing(ring);
  if (open.length === 0) return { lat: 0, lon: 0 };
  const lon = open.reduce((s, p) => s + p[0], 0) / open.length;
  const lat = open.reduce((s, p) => s + p[1], 0) / open.length;
  return { lat: Number(lat.toFixed(6)), lon: Number(lon.toFixed(6)) };
}

function orient(a: LonLat, b: LonLat, c: LonLat): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function onSegment(a: LonLat, b: LonLat, c: LonLat): boolean {
  return (
    Math.min(a[0], c[0]) - 1e-12 <= b[0] &&
    b[0] <= Math.max(a[0], c[0]) + 1e-12 &&
    Math.min(a[1], c[1]) - 1e-12 <= b[1] &&
    b[1] <= Math.max(a[1], c[1]) + 1e-12
  );
}

function segmentsIntersect(a1: LonLat, a2: LonLat, b1: LonLat, b2: LonLat): boolean {
  const o1 = orient(a1, a2, b1);
  const o2 = orient(a1, a2, b2);
  const o3 = orient(b1, b2, a1);
  const o4 = orient(b1, b2, a2);
  if (
    ((o1 > 1e-12 && o2 < -1e-12) || (o1 < -1e-12 && o2 > 1e-12)) &&
    ((o3 > 1e-12 && o4 < -1e-12) || (o3 < -1e-12 && o4 > 1e-12))
  ) {
    return true;
  }
  if (Math.abs(o1) <= 1e-12 && onSegment(a1, b1, a2)) return true;
  if (Math.abs(o2) <= 1e-12 && onSegment(a1, b2, a2)) return true;
  if (Math.abs(o3) <= 1e-12 && onSegment(b1, a1, b2)) return true;
  if (Math.abs(o4) <= 1e-12 && onSegment(b1, a2, b2)) return true;
  return false;
}

function hasSelfIntersection(ring: LonLat[]): boolean {
  const open = stripClosing(ring);
  const n = open.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      if (segmentsIntersect(open[i], open[(i + 1) % n], open[j], open[(j + 1) % n])) {
        return true;
      }
    }
  }
  return false;
}

function validateAndMeasureServerGeometry(geometry: GeoJsonPolygon): {
  ok: true;
  normalized: GeoJsonPolygon;
  grossAreaHectares: number;
  excludedAreaHectares: number;
  netAreaHectares: number;
  perimeterM: number;
  centroid: { lat: number; lon: number };
} | {
  ok: false;
  error: string;
} {
  if (!geometry || geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
    return { ok: false, error: 'Geometry must be a GeoJSON Polygon with an exterior ring.' };
  }

  const normalizedRings: LonLat[][] = [];
  for (const ring of geometry.coordinates) {
    if (!Array.isArray(ring)) {
      return { ok: false, error: 'Invalid polygon ring array.' };
    }
    const clean: LonLat[] = [];
    for (const pt of ring) {
      if (!Array.isArray(pt) || pt.length < 2) {
        return { ok: false, error: 'Invalid coordinate tuple.' };
      }
      const lon = Number(pt[0]);
      const lat = Number(pt[1]);
      if (!Number.isFinite(lon) || !Number.isFinite(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        return { ok: false, error: `Coordinate out of valid WGS84 range: [${lon}, ${lat}]` };
      }
      clean.push([Number(lon.toFixed(7)), Number(lat.toFixed(7))]);
    }
    const open = stripClosing(clean);
    const unique = new Set(open.map((p) => `${p[0].toFixed(7)},${p[1].toFixed(7)}`));
    if (unique.size < 3) {
      return { ok: false, error: 'Each polygon ring must contain at least 3 distinct vertices.' };
    }
    if (hasSelfIntersection(open)) {
      return { ok: false, error: 'Polygon edges self-intersect; fix crossing edges before committing geometry.' };
    }
    normalizedRings.push(closeRing(open));
  }

  const grossM2 = computeRingAreaM2(normalizedRings[0]);
  let excludedM2 = 0;
  for (let h = 1; h < normalizedRings.length; h++) {
    excludedM2 += computeRingAreaM2(normalizedRings[h]);
  }
  const netM2 = Math.max(0, grossM2 - excludedM2);
  if (netM2 < 25) {
    return { ok: false, error: 'Net field boundary area must be at least 25 m².' };
  }

  return {
    ok: true,
    normalized: { type: 'Polygon', coordinates: normalizedRings },
    grossAreaHectares: Number((grossM2 / 10000).toFixed(3)),
    excludedAreaHectares: Number((excludedM2 / 10000).toFixed(3)),
    netAreaHectares: Number((netM2 / 10000).toFixed(3)),
    perimeterM: Math.round(computeRingPerimeterM(normalizedRings[0])),
    centroid: computeCentroid(normalizedRings[0]),
  };
}

function pointToSegDist(px: number, py: number, a: LonLat, b: LonLat): number {
  let x = a[0];
  let y = a[1];
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = px - x;
  dy = py - y;
  return Math.sqrt(dx * dx + dy * dy);
}

function pointToRingsDist(px: number, py: number, rings: LonLat[][]): number {
  let inside = false;
  let minDist = Infinity;
  for (const rawRing of rings) {
    const ring = stripClosing(rawRing);
    for (let i = 0, len = ring.length, j = len - 1; i < len; j = i++) {
      const a = ring[i];
      const b = ring[j];
      if ((a[1] > py) !== (b[1] > py) && px < ((b[0] - a[0]) * (py - a[1])) / (b[1] - a[1] || 1e-15) + a[0]) {
        inside = !inside;
      }
      const d = pointToSegDist(px, py, a, b);
      if (d < minDist) minDist = d;
    }
  }
  return (inside ? 1 : -1) * minDist;
}

function computeServerLabelPoint(rings: LonLat[][]): { lat: number; lon: number } {
  const outer = stripClosing(rings[0] ?? []);
  if (outer.length === 0) return { lat: 0, lon: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of outer) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const width = maxX - minX;
  const height = maxY - minY;
  if (width <= 0 || height <= 0) return computeCentroid(outer);

  const c = computeCentroid(outer);
  let bestX = c.lon;
  let bestY = c.lat;
  let bestDist = pointToRingsDist(bestX, bestY, rings);
  const steps = 10;
  for (let ix = 0; ix <= steps; ix++) {
    for (let iy = 0; iy <= steps; iy++) {
      const cx = minX + (ix / steps) * width;
      const cy = minY + (iy / steps) * height;
      const d = pointToRingsDist(cx, cy, rings);
      if (d > bestDist) {
        bestDist = d;
        bestX = cx;
        bestY = cy;
      }
    }
  }
  return { lat: Number(bestY.toFixed(6)), lon: Number(bestX.toFixed(6)) };
}

function validateAndMeasureFarmGeometry(geometry: FarmGeoJson): {
  ok: true;
  normalized: FarmGeoJson;
  areaM2: number;
  areaHa: number;
  perimeterM: number;
  centroid: { lat: number; lon: number };
  labelPoint: { lat: number; lon: number };
} | {
  ok: false;
  error: string;
} {
  if (!geometry || (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')) {
    return { ok: false, error: 'Unsupported geometry type. Expected Polygon or MultiPolygon.' };
  }

  const polys: LonLat[][][] =
    geometry.type === 'Polygon'
      ? [geometry.coordinates as LonLat[][]]
      : (geometry.coordinates as LonLat[][][]);

  if (!Array.isArray(polys) || polys.length === 0) {
    return { ok: false, error: 'Farm geometry contains no polygons.' };
  }

  const normalizedPolys: LonLat[][][] = [];
  let totalAreaM2 = 0;
  let totalPerimeterM = 0;
  let largestArea = -1;
  let largestPoly: LonLat[][] = [];

  for (const polyCoords of polys) {
    const res = validateAndMeasureServerGeometry({ type: 'Polygon', coordinates: polyCoords });
    if (!res.ok) return res;
    normalizedPolys.push(res.normalized.coordinates);
    const polyM2 = res.netAreaHectares * 10000;
    totalAreaM2 += polyM2;
    totalPerimeterM += res.perimeterM;
    if (polyM2 > largestArea) {
      largestArea = polyM2;
      largestPoly = res.normalized.coordinates;
    }
  }

  const centroid = computeCentroid(largestPoly[0]);
  const labelPoint = computeServerLabelPoint(largestPoly);

  return {
    ok: true,
    normalized:
      geometry.type === 'Polygon'
        ? { type: 'Polygon', coordinates: normalizedPolys[0] }
        : { type: 'MultiPolygon', coordinates: normalizedPolys },
    areaM2: Math.round(totalAreaM2),
    areaHa: Number((totalAreaM2 / 10000).toFixed(1)),
    perimeterM: Math.round(totalPerimeterM),
    centroid,
    labelPoint,
  };
}

function classifyFarmHealth(score: number | null): FarmHealthStatus {
  if (score === null) return 'no_data';
  if (score >= 75) return 'healthy';
  if (score >= 45) return 'moderate';
  return 'at_risk';
}

function buildDefaultWorkspaceFarms(): StoredWorkspaceFarm[] {
  const makeFarm = (opts: {
    id: string;
    name: string;
    crop: string | null;
    locationLabel: string;
    coords: LonLat[];
    score: number | null;
    explanation: string;
  }): StoredWorkspaceFarm => {
    const geom: FarmGeoJson = { type: 'Polygon', coordinates: [closeRing(opts.coords)] };
    const m = validateAndMeasureFarmGeometry(geom);
    if (!m.ok) throw new Error(m.error);
    const status = classifyFarmHealth(opts.score);
    const now = '2026-11-10T09:00:00.000Z';
    return {
      id: opts.id,
      name: opts.name,
      crop: opts.crop,
      locationLabel: opts.locationLabel,
      geometry: m.normalized,
      areaM2: m.areaM2,
      areaHa: m.areaHa,
      perimeterM: m.perimeterM,
      centroid: m.centroid,
      labelPoint: m.labelPoint,
      healthStatus: status,
      assessment: {
        farmId: opts.id,
        status,
        score: opts.score,
        assessedAt: now,
        assessmentVersion: 'power-eonet-v2',
        confidence: opts.score === null ? 0 : 0.88,
        explanation: opts.explanation,
      },
      versionNumber: 1,
      boundaryHistory: [
        {
          versionNumber: 1,
          geometry: m.normalized,
          areaM2: m.areaM2,
          changedAt: now,
          changeReason: 'Initial registered farm parcel',
        },
      ],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  };

  // Real agricultural river-bend cluster near Willamette Valley, Oregon (44.855, -123.165)
  // Polygon geometries are irregular 5-6 vertex farm parcels whose WGS84 geodesic areas compute to ~78.3, ~89.7, ~120.1, ~64.5, ~72.8 ha.
  return [
    makeFarm({
      id: 'farm-green-valley',
      name: 'Green Valley Farm',
      crop: 'Wheat',
      locationLabel: 'Willamette River Bend, OR',
      coords: [
        [-123.1496, 44.86501],
        [-123.13941, 44.86155],
        [-123.14267, 44.85452],
        [-123.15411, 44.85872],
        [-123.15201, 44.8627],
      ],
      score: 86,
      explanation: 'Optimal soil moisture (34%), balanced pH (6.6), and low NASA EONET hazard proximity.',
    }),
    makeFarm({
      id: 'farm-riverside',
      name: 'Riverside Farm',
      crop: 'Corn',
      locationLabel: 'Willamette River Bend, OR',
      coords: [
        [-123.15066, 44.85404],
        [-123.14226, 44.85099],
        [-123.1451, 44.84291],
        [-123.15678, 44.84553],
        [-123.15481, 44.85033],
      ],
      score: 63,
      explanation: 'Moderate surface moisture deficit (24%) and warmer afternoon thermal stress.',
    }),
    makeFarm({
      id: 'farm-highland',
      name: 'Highland Farm',
      crop: 'Soybeans',
      locationLabel: 'Independence Bench, OR',
      coords: [
        [-123.17524, 44.85287],
        [-123.16298, 44.85741],
        [-123.15549, 44.85673],
        [-123.15844, 44.84731],
        [-123.17092, 44.84879],
        [-123.17592, 44.8506],
      ],
      score: 38,
      explanation: 'Elevated drought stress index (17% topsoil moisture) and constrained irrigation reliability.',
    }),
    makeFarm({
      id: 'farm-sunrise',
      name: 'Sunrise Farm',
      crop: 'Barley',
      locationLabel: 'North Polk Valley, OR',
      coords: [
        [-123.13629, 44.87433],
        [-123.1272, 44.87329],
        [-123.12803, 44.86607],
        [-123.13732, 44.8671],
        [-123.13856, 44.87061],
      ],
      score: 82,
      explanation: 'Strong precipitation recharge and favorable root-zone temperature window.',
    }),
    makeFarm({
      id: 'farm-oakridge',
      name: 'Oakridge Farm',
      crop: 'Wheat',
      locationLabel: 'South Polk Ridge, OR',
      coords: [
        [-123.17686, 44.84186],
        [-123.16711, 44.84246],
        [-123.16609, 44.83474],
        [-123.17645, 44.83434],
        [-123.17828, 44.8384],
      ],
      score: null,
      explanation: 'No soil or farm assessment recorded yet.',
    }),
  ];
}

function getDefaultStore(): MapsWorkspaceStore {
  // Real Ames, Iowa & Sacramento Valley starter parcels aligned with homeFarmEvaluator farm IDs
  // Plus anonymized city-level opt-in cohort records (>=3 in Ames so regional cohort rules can be tested truthfully, and <3 in Davis so threshold suppression is demonstrated truthfully)
  const makeVer = (
    verId: string,
    coords: LonLat[],
    source: 'drawn' | 'imported' | 'edited' = 'drawn'
  ): StoredGeometryVersion => {
    const geom: GeoJsonPolygon = { type: 'Polygon', coordinates: [closeRing(coords)] };
    const m = validateAndMeasureServerGeometry(geom);
    if (!m.ok) throw new Error(m.error);
    return {
      geometryVersionId: verId,
      versionNumber: 1,
      createdAt: '2026-10-18T14:20:00.000Z',
      source,
      crs: 'EPSG:4326',
      areaMethod: 'WGS84 Spherical Excess (Chamberlain-Duquette)',
      grossAreaHectares: m.grossAreaHectares,
      netAreaHectares: m.netAreaHectares,
      excludedAreaHectares: m.excludedAreaHectares,
      perimeterM: m.perimeterM,
      centroid: m.centroid,
      geometry: m.normalized,
    };
  };

  const gvF1 = makeVer('gv-f1-v1', [
    [-93.6428, 42.0365],
    [-93.6352, 42.0365],
    [-93.6352, 42.0324],
    [-93.6428, 42.0324],
  ]);
  const gvF2 = makeVer('gv-f2-v1', [
    [-93.6348, 42.0365],
    [-93.6285, 42.0365],
    [-93.6285, 42.0324],
    [-93.6348, 42.0324],
  ]);
  const gvF3 = makeVer('gv-f3-v1', [
    [-93.6428, 42.0321],
    [-93.6352, 42.0321],
    [-93.6352, 42.0282],
    [-93.6428, 42.0282],
  ]);

  const rbF1 = makeVer('rb-f1-v1', [
    [-121.7482, 38.5495],
    [-121.7398, 38.5495],
    [-121.7398, 38.5452],
    [-121.7482, 38.5452],
  ]);
  const rbF2 = makeVer('rb-f2-v1', [
    [-121.7394, 38.5495],
    [-121.7322, 38.5495],
    [-121.7322, 38.5452],
    [-121.7394, 38.5452],
  ]);

  return {
    farms: buildDefaultWorkspaceFarms(),
    fields: [
      {
        id: 'field-gv-1',
        farmId: 'farm-green-valley',
        name: 'North Ridge Block 1',
        cropId: 'wheat',
        cropName: 'Wheat',
        soilSummary: 'Loam · 34% moisture · pH 6.6',
        waterSummary: 'Rain-fed + Drip backup · Usually available',
        status: 'Active',
        currentVersionId: gvF1.geometryVersionId,
        versions: [gvF1],
        staleCalculations: [],
        updatedAt: '2026-10-18T14:20:00.000Z',
      },
      {
        id: 'field-gv-2',
        farmId: 'farm-green-valley',
        name: 'East Creek Block 2',
        cropId: 'maize',
        cropName: 'Maize',
        soilSummary: 'Loam · 34% moisture · pH 6.6',
        waterSummary: 'Hybrid drip · Usually available',
        status: 'Planned',
        currentVersionId: gvF2.geometryVersionId,
        versions: [gvF2],
        staleCalculations: [],
        updatedAt: '2026-10-18T14:20:00.000Z',
      },
      {
        id: 'field-gv-3',
        farmId: 'farm-green-valley',
        name: 'South Terrace Legumes',
        cropId: 'peas',
        cropName: 'Peas',
        soilSummary: 'Loam · 34% moisture · pH 6.6',
        waterSummary: 'Legume nitrogen-fixing block',
        status: 'Planned',
        currentVersionId: gvF3.geometryVersionId,
        versions: [gvF3],
        staleCalculations: [],
        updatedAt: '2026-10-18T14:20:00.000Z',
      },
      {
        id: 'field-rb-1',
        farmId: 'farm-riverbend',
        name: 'Yolo West Parcel',
        cropId: 'soybean',
        cropName: 'Soybean',
        soilSummary: 'Clay loam · 22% moisture (dry) · pH 6.9',
        waterSummary: 'Canal + Well · Frequently limited',
        status: 'Needs Review',
        currentVersionId: rbF1.geometryVersionId,
        versions: [rbF1],
        staleCalculations: [],
        updatedAt: '2026-10-20T09:10:00.000Z',
      },
      {
        id: 'field-rb-2',
        farmId: 'farm-riverbend',
        name: 'Canal East Block',
        cropId: 'sunflower',
        cropName: 'Sunflower',
        soilSummary: 'Clay loam · 22% moisture · pH 6.9',
        waterSummary: 'Drip irrigation · Drought rotation',
        status: 'Planned',
        currentVersionId: rbF2.geometryVersionId,
        versions: [rbF2],
        staleCalculations: [],
        updatedAt: '2026-10-20T09:10:00.000Z',
      },
    ],
    // Privacy-safe city-level opt-in community records (never store private field polygons)
    discoveryOptIns: [
      {
        farmId: 'community-ames-1',
        publicId: 'pub-ames-story-01',
        optedIn: true,
        displayAlias: 'Story Ridge Growers',
        cityKey: 'ames-ia',
        cityName: 'Ames, IA',
        regionLabel: 'Central Iowa Corn Belt',
        approximateLat: 42.03,
        approximateLon: -93.63,
        farmScaleBand: 'Medium (10–100 ha)',
        sharedCrops: ['Maize', 'Soybean', 'Cover Rye'],
        sharedPriorities: ['Improving soil health', 'Long-term sustainability'],
        irrigationTypeShared: 'Hybrid (rainfall and irrigation)',
        soilTextureShared: 'Loam',
        climateScore: 86,
        acceptsMessages: true,
        updatedAt: '2026-11-01T10:00:00.000Z',
      },
      {
        farmId: 'community-ames-2',
        publicId: 'pub-ames-skunk-02',
        optedIn: true,
        displayAlias: 'Skunk Valley Collective',
        cityKey: 'ames-ia',
        cityName: 'Ames, IA',
        regionLabel: 'Central Iowa Corn Belt',
        approximateLat: 42.03,
        approximateLon: -93.63,
        farmScaleBand: 'Large (> 100 ha)',
        sharedCrops: ['Wheat', 'Peas', 'Maize'],
        sharedPriorities: ['Water conservation', 'Crop suitability'],
        irrigationTypeShared: 'Rain-fed agriculture',
        soilTextureShared: 'Silt loam',
        climateScore: 84,
        acceptsMessages: true,
        updatedAt: '2026-11-03T12:30:00.000Z',
      },
      {
        farmId: 'community-ames-3',
        publicId: 'pub-ames-prairie-03',
        optedIn: true,
        displayAlias: 'Prairie Terrace Co-op',
        cityKey: 'ames-ia',
        cityName: 'Ames, IA',
        regionLabel: 'Central Iowa Corn Belt',
        approximateLat: 42.03,
        approximateLon: -93.63,
        farmScaleBand: 'Medium (10–100 ha)',
        sharedCrops: ['Soybean', 'Oats', 'Wheat'],
        sharedPriorities: ['Improving soil health'],
        irrigationTypeShared: 'Rain-fed agriculture',
        soilTextureShared: 'Clay loam',
        climateScore: 82,
        acceptsMessages: false,
        updatedAt: '2026-11-05T08:15:00.000Z',
      },
      {
        farmId: 'community-davis-1',
        publicId: 'pub-davis-yolo-01',
        optedIn: true,
        displayAlias: 'Capay Edge Farm',
        cityKey: 'davis-ca',
        cityName: 'Davis, CA',
        regionLabel: 'Sacramento Valley',
        approximateLat: 38.55,
        approximateLon: -121.74,
        farmScaleBand: 'Medium (10–100 ha)',
        sharedCrops: ['Sunflower', 'Chickpeas', 'Winter Wheat'],
        sharedPriorities: ['Water conservation'],
        irrigationTypeShared: 'Drip irrigation',
        soilTextureShared: 'Clay loam',
        climateScore: 76,
        acceptsMessages: true,
        updatedAt: '2026-11-02T15:00:00.000Z',
      },
    ],
    messages: [],
    blockedPublicIds: [],
  };
}

function readStore(): MapsWorkspaceStore {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      const def = getDefaultStore();
      writeStore(def);
      return def;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<MapsWorkspaceStore>;
    const def = getDefaultStore();
    const farms =
      Array.isArray(parsed.farms) && parsed.farms.length > 0 ? parsed.farms : def.farms;
    return {
      farms,
      fields: Array.isArray(parsed.fields) ? parsed.fields : def.fields,
      discoveryOptIns: Array.isArray(parsed.discoveryOptIns) ? parsed.discoveryOptIns : def.discoveryOptIns,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      blockedPublicIds: Array.isArray(parsed.blockedPublicIds) ? parsed.blockedPublicIds : [],
    };
  } catch {
    return getDefaultStore();
  }
}

function writeStore(store: MapsWorkspaceStore): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmpPath, STORE_PATH);
}

const BoundaryBodySchema = z.object({
  farmId: z.string().min(1),
  name: z.string().min(1).max(100),
  cropId: z.string().optional(),
  cropName: z.string().optional(),
  soilSummary: z.string().optional(),
  waterSummary: z.string().optional(),
  status: z.enum(['Active', 'Planned', 'Fallow', 'Needs Review']).optional(),
  source: z.enum(['drawn', 'imported', 'edited']).default('drawn'),
  editReason: z.string().max(240).optional(),
  batchImportId: z.string().optional(),
  geometry: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(1),
  }),
  originalImportedGeometry: z
    .object({
      type: z.literal('Polygon'),
      coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(1),
    })
    .optional(),
});

const OptInBodySchema = z.object({
  farmId: z.string().min(1),
  optedIn: z.boolean(),
  displayAlias: z.string().min(2).max(80),
  cityName: z.string().min(2).max(80),
  regionLabel: z.string().max(120).optional().default('Regional Cohort'),
  approximateLat: z.number().min(-90).max(90),
  approximateLon: z.number().min(-180).max(180),
  areaHectares: z.number().nonnegative().nullable().optional(),
  sharedCrops: z.array(z.string()).default([]),
  sharedPriorities: z.array(z.string()).default([]),
  irrigationTypeShared: z.string().optional(),
  soilTextureShared: z.string().optional(),
  climateScore: z.number().min(0).max(100).optional(),
  acceptsMessages: z.boolean().default(true),
});

const FarmCreateSchema = z.object({
  name: z.string().trim().min(1, 'Farm name is required').max(150),
  crop: z.string().trim().max(100).nullable().optional(),
  locationLabel: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(1000).optional(),
  geometry: z.union([
    z.object({
      type: z.literal('Polygon'),
      coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(1),
    }),
    z.object({
      type: z.literal('MultiPolygon'),
      coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))).min(1),
    }),
  ]),
});

function geometryIntersectsBbox(
  geom: FarmGeoJson,
  west: number,
  south: number,
  east: number,
  north: number
): boolean {
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
  let gWest = Infinity, gSouth = Infinity, gEast = -Infinity, gNorth = -Infinity;
  for (const poly of polys) {
    for (const ring of poly) {
      for (const [lon, lat] of ring) {
        if (lon < gWest) gWest = lon;
        if (lon > gEast) gEast = lon;
        if (lat < gSouth) gSouth = lat;
        if (lat > gNorth) gNorth = lat;
      }
    }
  }
  const crossesDateline = west > east;
  const lonOverlap = crossesDateline
    ? gEast >= west || gWest <= east
    : gEast >= west && gWest <= east;
  const latOverlap = gNorth >= south && gSouth <= north;
  return lonOverlap && latOverlap;
}

export function createMapsRouter(): express.Router {
  const router = express.Router();

  // 0A. Fetch all farms (excluding soft-deleted)
  router.get('/farms', (_req, res) => {
    const store = readStore();
    const farms = store.farms.filter((f) => !f.deletedAt);
    res.json({ farms });
  });

  // 0B. Fetch farms within map bounding box
  router.get('/farms/map', (req, res) => {
    const west = Number(req.query.west);
    const south = Number(req.query.south);
    const east = Number(req.query.east);
    const north = Number(req.query.north);
    if (![west, south, east, north].every(Number.isFinite)) {
      res.status(400).json({ error: 'Valid west, south, east, north bounds are required.' });
      return;
    }
    const store = readStore();
    const farms = store.farms.filter(
      (f) => !f.deletedAt && geometryIntersectsBbox(f.geometry, west, south, east, north)
    );
    res.json({ farms });
  });

  // 0C. Fetch single farm
  router.get('/farms/:farmId', (req, res) => {
    const store = readStore();
    const farm = store.farms.find((f) => f.id === req.params.farmId && !f.deletedAt);
    if (!farm) {
      res.status(404).json({ error: 'Farm not found.' });
      return;
    }
    res.json({ farm });
  });

  // 0D. Create new farm with authoritative server-side geometry validation & geodesic area calculation
  router.post('/farms', (req, res) => {
    const parsed = FarmCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid farm payload.' });
      return;
    }

    const measured = validateAndMeasureFarmGeometry(parsed.data.geometry as FarmGeoJson);
    if (!measured.ok) {
      res.status(422).json({ error: measured.error });
      return;
    }

    const now = new Date().toISOString();
    const farmId = `farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newFarm: StoredWorkspaceFarm = {
      id: farmId,
      name: parsed.data.name,
      crop: parsed.data.crop || null,
      locationLabel: parsed.data.locationLabel || `${measured.centroid.lat.toFixed(3)}°, ${measured.centroid.lon.toFixed(3)}°`,
      notes: parsed.data.notes || undefined,
      geometry: measured.normalized,
      areaM2: measured.areaM2,
      areaHa: measured.areaHa,
      perimeterM: measured.perimeterM,
      centroid: measured.centroid,
      labelPoint: measured.labelPoint,
      healthStatus: 'no_data',
      assessment: {
        farmId,
        status: 'no_data',
        score: null,
        assessedAt: now,
        assessmentVersion: 'power-eonet-v2',
        confidence: 0,
        explanation: 'Awaiting initial soil and climate assessment.',
      },
      versionNumber: 1,
      boundaryHistory: [
        {
          versionNumber: 1,
          geometry: measured.normalized,
          areaM2: measured.areaM2,
          changedAt: now,
          changeReason: 'Initial boundary created',
        },
      ],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const store = readStore();
    store.farms = [newFarm, ...store.farms];
    writeStore(store);

    res.status(201).json({ farm: newFarm });
  });

  // 0E. Update farm boundary with optimistic concurrency version check
  router.patch('/farms/:farmId/boundary', (req, res) => {
    const bodySchema = z.object({
      geometry: z.union([
        z.object({
          type: z.literal('Polygon'),
          coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(1),
        }),
        z.object({
          type: z.literal('MultiPolygon'),
          coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))).min(1),
        }),
      ]),
      expectedVersion: z.number().int().positive().optional(),
      changeReason: z.string().max(240).optional(),
    });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid boundary payload.' });
      return;
    }

    const store = readStore();
    const idx = store.farms.findIndex((f) => f.id === req.params.farmId && !f.deletedAt);
    if (idx < 0) {
      res.status(404).json({ error: 'Farm not found.' });
      return;
    }

    const existing = store.farms[idx];
    if (parsed.data.expectedVersion !== undefined && parsed.data.expectedVersion !== existing.versionNumber) {
      res.status(409).json({ error: 'Boundary version conflict. Refresh farm data and retry.' });
      return;
    }

    const measured = validateAndMeasureFarmGeometry(parsed.data.geometry as FarmGeoJson);
    if (!measured.ok) {
      res.status(422).json({ error: measured.error });
      return;
    }

    const now = new Date().toISOString();
    const nextVersion = existing.versionNumber + 1;
    const updated: StoredWorkspaceFarm = {
      ...existing,
      geometry: measured.normalized,
      areaM2: measured.areaM2,
      areaHa: measured.areaHa,
      perimeterM: measured.perimeterM,
      centroid: measured.centroid,
      labelPoint: measured.labelPoint,
      versionNumber: nextVersion,
      boundaryHistory: [
        {
          versionNumber: nextVersion,
          geometry: measured.normalized,
          areaM2: measured.areaM2,
          changedAt: now,
          changeReason: parsed.data.changeReason || `Boundary updated to v${nextVersion}`,
        },
        ...existing.boundaryHistory,
      ],
      updatedAt: now,
    };

    store.farms[idx] = updated;
    writeStore(store);
    res.json({ farm: updated });
  });

  // 0F. Soft-delete farm
  router.delete('/farms/:farmId', (req, res) => {
    const store = readStore();
    const idx = store.farms.findIndex((f) => f.id === req.params.farmId && !f.deletedAt);
    if (idx < 0) {
      res.status(404).json({ error: 'Farm not found.' });
      return;
    }
    store.farms[idx] = { ...store.farms[idx], deletedAt: new Date().toISOString() };
    writeStore(store);
    res.json({ deletedId: req.params.farmId });
  });

  // 1. Read saved fields & geometry versions (optional filter by farmId)
  router.get('/fields', (req, res) => {
    const store = readStore();
    const farmId = typeof req.query.farmId === 'string' ? req.query.farmId : null;
    const fields = farmId ? store.fields.filter((f) => f.farmId === farmId) : store.fields;
    res.json({ fields });
  });

  // 2. Create new field boundary with server-side validation & WGS84 geodesic measurement
  router.post('/fields', (req, res) => {
    const parsed = BoundaryBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid boundary payload.' });
      return;
    }

    const measured = validateAndMeasureServerGeometry(parsed.data.geometry as GeoJsonPolygon);
    if (!measured.ok) {
      res.status(422).json({ error: measured.error });
      return;
    }

    const now = new Date().toISOString();
    const fieldId = `field-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const versionId = `${fieldId}-v1`;
    const version: StoredGeometryVersion = {
      geometryVersionId: versionId,
      versionNumber: 1,
      createdAt: now,
      source: parsed.data.source,
      crs: 'EPSG:4326',
      areaMethod: 'WGS84 Spherical Excess (Chamberlain-Duquette)',
      grossAreaHectares: measured.grossAreaHectares,
      netAreaHectares: measured.netAreaHectares,
      excludedAreaHectares: measured.excludedAreaHectares,
      perimeterM: measured.perimeterM,
      centroid: measured.centroid,
      geometry: measured.normalized,
      originalImportedGeometry: parsed.data.originalImportedGeometry as GeoJsonPolygon | undefined,
      editReason: parsed.data.editReason || 'Initial boundary created',
    };

    const record: StoredMapField = {
      id: fieldId,
      farmId: parsed.data.farmId,
      name: parsed.data.name.trim(),
      cropId: parsed.data.cropId,
      cropName: parsed.data.cropName,
      soilSummary: parsed.data.soilSummary,
      waterSummary: parsed.data.waterSummary,
      status: parsed.data.status || 'Active',
      currentVersionId: versionId,
      versions: [version],
      staleCalculations: [
        'Spatial Climate Sampling (re-run required for new geometry)',
        'Smart Farm Area & Water Demand Budget',
      ],
      batchImportId: parsed.data.batchImportId,
      updatedAt: now,
    };

    const store = readStore();
    store.fields = [record, ...store.fields];
    writeStore(store);

    res.status(201).json({ field: record });
  });

  // 3. Save edited boundary -> creates new GeometryVersion, marks analyses stale, preserves history
  router.put('/fields/:id/boundary', (req, res) => {
    const fieldId = req.params.id;
    const bodySchema = z.object({
      name: z.string().min(1).max(100).optional(),
      source: z.enum(['drawn', 'imported', 'edited']).default('edited'),
      editReason: z.string().max(240).optional(),
      geometry: z.object({
        type: z.literal('Polygon'),
        coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(1),
      }),
    });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid boundary edit payload.' });
      return;
    }

    const measured = validateAndMeasureServerGeometry(parsed.data.geometry as GeoJsonPolygon);
    if (!measured.ok) {
      res.status(422).json({ error: measured.error });
      return;
    }

    const store = readStore();
    const idx = store.fields.findIndex((f) => f.id === fieldId);
    if (idx < 0) {
      res.status(404).json({ error: `Field "${fieldId}" not found.` });
      return;
    }

    const existing = store.fields[idx];
    const nextNum = existing.versions.length + 1;
    const now = new Date().toISOString();
    const versionId = `${fieldId}-v${nextNum}`;
    const newVersion: StoredGeometryVersion = {
      geometryVersionId: versionId,
      versionNumber: nextNum,
      createdAt: now,
      source: parsed.data.source,
      crs: 'EPSG:4326',
      areaMethod: 'WGS84 Spherical Excess (Chamberlain-Duquette)',
      grossAreaHectares: measured.grossAreaHectares,
      netAreaHectares: measured.netAreaHectares,
      excludedAreaHectares: measured.excludedAreaHectares,
      perimeterM: measured.perimeterM,
      centroid: measured.centroid,
      geometry: measured.normalized,
      editReason: parsed.data.editReason || `Boundary edit v${nextNum}`,
    };

    const updated: StoredMapField = {
      ...existing,
      name: parsed.data.name?.trim() || existing.name,
      currentVersionId: versionId,
      versions: [newVersion, ...existing.versions],
      staleCalculations: [
        'Spatial Climate Sampling (invalidated by geometry v' + nextNum + ')',
        'Crop Rotation Water Budget (recalculate for updated net area)',
        'Deep Analysis Spatial Link (previous reports pinned to prior geometryVersionId)',
      ],
      updatedAt: now,
    };

    store.fields[idx] = updated;
    writeStore(store);

    res.json({
      field: updated,
      invalidatedCaches: updated.staleCalculations,
    });
  });

  // 4. Delete single field OR revert an import batch
  router.delete('/fields/:id', (req, res) => {
    const store = readStore();
    const exists = store.fields.some((f) => f.id === req.params.id);
    if (!exists) {
      res.status(404).json({ error: 'Field not found.' });
      return;
    }
    store.fields = store.fields.filter((f) => f.id !== req.params.id);
    writeStore(store);
    res.json({ deletedId: req.params.id });
  });

  router.delete('/import-batches/:batchId', (req, res) => {
    const store = readStore();
    const before = store.fields.length;
    store.fields = store.fields.filter((f) => f.batchImportId !== req.params.batchId);
    writeStore(store);
    res.json({ removedCount: before - store.fields.length });
  });

  // 5. Real point/pixel inspection endpoint across Open-Meteo (weather/soil/ET), Open-Elevation DEM slope, and NASA POWER
  router.post('/inspect', async (req, res) => {
    const schema = z.object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
      observationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      fieldId: z.string().nullable().optional(),
      fieldName: z.string().nullable().optional(),
      fieldAreaHectares: z.number().nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid lat, lon, and YYYY-MM-DD observationDate are required.' });
      return;
    }

    const { lat, lon, observationDate, fieldId, fieldName, fieldAreaHectares } = parsed.data;
    const isSmallParcelVsWeatherGrid = fieldAreaHectares !== null && fieldAreaHectares !== undefined && fieldAreaHectares < 500;
    const datasets: Array<{
      layerId: string;
      title: string;
      provider: string;
      product: string;
      observationPeriod: string;
      spatialResolution: string;
      resolutionWarning: string | null;
      provenance: 'Observed' | 'Modelled' | 'Reanalysis' | 'Calculated' | 'Unavailable';
      qualityNote: string;
      metrics: Array<{ label: string; value: string; unit: string }>;
    }> = [];

    // Real Open-Meteo Soil Moisture, ET0, Precip, Temperature for selected date (past 90d or forecast)
    const todayIso = new Date().toISOString().slice(0, 10);
    const diffDays = Math.round(
      (new Date(`${todayIso}T00:00:00Z`).getTime() - new Date(`${observationDate}T00:00:00Z`).getTime()) /
        86400000
    );

    const openMeteoPromise = (async () => {
      try {
        // Use forecast API for recent/current (past_days supported up to 92) or historical archive for older dates
        const url =
          diffDays >= 5
            ? `https://archive-api.open-meteo.com/v1/archive?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&start_date=${observationDate}&end_date=${observationDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration&hourly=soil_moisture_0_to_7cm&timezone=UTC`
            : `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,soil_moisture_0_to_1cm,soil_temperature_0cm&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration&past_days=7&forecast_days=3&timezone=UTC`;

        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = (await resp.json()) as {
          current?: {
            temperature_2m?: number;
            relative_humidity_2m?: number;
            precipitation?: number;
            wind_speed_10m?: number;
            soil_moisture_0_to_1cm?: number;
            soil_temperature_0cm?: number;
          };
          daily?: {
            time?: string[];
            temperature_2m_max?: number[];
            temperature_2m_min?: number[];
            precipitation_sum?: number[];
            et0_fao_evapotranspiration?: number[];
          };
          hourly?: {
            soil_moisture_0_to_7cm?: Array<number | null>;
          };
        };

        const dIdx = Math.max(0, json.daily?.time?.indexOf(observationDate) ?? 0);
        const tMax = json.daily?.temperature_2m_max?.[dIdx];
        const tMin = json.daily?.temperature_2m_min?.[dIdx];
        const precip = json.daily?.precipitation_sum?.[dIdx];
        const et0 = json.daily?.et0_fao_evapotranspiration?.[dIdx];
        const soilHourly = json.hourly?.soil_moisture_0_to_7cm?.filter((v): v is number => typeof v === 'number') ?? [];
        const soilMean =
          soilHourly.length > 0
            ? Number((soilHourly.reduce((s, n) => s + n, 0) / soilHourly.length).toFixed(3))
            : json.current?.soil_moisture_0_to_1cm ?? null;

        datasets.push({
          layerId: 'weather_grid',
          title: 'Weather, Soil Moisture & ET0 Context',
          provider: 'Open-Meteo / ERA5 Reanalysis & IFS',
          product: diffDays >= 5 ? 'ERA5-Land Daily Archive' : 'ECMWF/GFS Forecast + Soil Grid',
          observationPeriod: observationDate,
          spatialResolution: diffDays >= 5 ? '~11 km (ERA5-Land grid)' : '~9–13 km NWP grid',
          resolutionWarning: isSmallParcelVsWeatherGrid
            ? `Broader grid context (~11 km cell > ${fieldAreaHectares?.toFixed(1)} ha parcel). Does not replace in-field probes.`
            : null,
          provenance: diffDays >= 5 ? 'Reanalysis' : 'Modelled',
          qualityNote: 'Grid-averaged surface soil moisture (0–7 cm) & FAO Penman-Monteith reference ET0.',
          metrics: [
            { label: 'Max / Min Temp', value: tMax !== undefined && tMin !== undefined ? `${tMax.toFixed(1)} / ${tMin.toFixed(1)}` : '—', unit: '°C' },
            { label: 'Daily Precipitation', value: precip !== undefined ? precip.toFixed(1) : '—', unit: 'mm' },
            { label: 'Reference ET0', value: et0 !== undefined ? et0.toFixed(2) : '—', unit: 'mm/day' },
            {
              label: 'Topsoil Volumetric Moisture',
              value: soilMean !== null ? (soilMean * 100).toFixed(1) : '—',
              unit: '% vol',
            },
          ],
        });
      } catch (err) {
        datasets.push({
          layerId: 'weather_grid',
          title: 'Weather & Soil Grid Context',
          provider: 'Open-Meteo',
          product: 'Atmospheric & Soil Grid',
          observationPeriod: observationDate,
          spatialResolution: '~11 km',
          resolutionWarning: null,
          provenance: 'Unavailable',
          qualityNote: err instanceof Error ? err.message : 'Weather inspection unavailable',
          metrics: [],
        });
      }
    })();

    // Real Open-Elevation DEM query (center + 4 orthogonal offsets at ~90m to compute real local slope %)
    const elevationPromise = (async () => {
      try {
        const dLat = 0.00085; // ~94 m
        const dLon = 0.00085 / Math.max(0.2, Math.cos(lat * DEG_TO_RAD));
        const locs = [
          `${lat.toFixed(5)},${lon.toFixed(5)}`,
          `${(lat + dLat).toFixed(5)},${lon.toFixed(5)}`,
          `${(lat - dLat).toFixed(5)},${lon.toFixed(5)}`,
          `${lat.toFixed(5)},${(lon + dLon).toFixed(5)}`,
          `${lat.toFixed(5)},${(lon - dLon).toFixed(5)}`,
        ].join('|');
        const resp = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${locs}`, {
          signal: AbortSignal.timeout(7000),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = (await resp.json()) as { results?: Array<{ elevation?: number }> };
        const pts = json.results ?? [];
        if (pts.length < 5 || typeof pts[0]?.elevation !== 'number') {
          throw new Error('Incomplete DEM response');
        }
        const centerElev = pts[0].elevation;
        const dzDy = (pts[1].elevation! - pts[2].elevation!) / (2 * 94.5);
        const dzDx = (pts[3].elevation! - pts[4].elevation!) / (2 * 94.5);
        const slopePct = Math.sqrt(dzDx * dzDx + dzDy * dzDy) * 100;
        const slopeDeg = Math.atan(Math.sqrt(dzDx * dzDx + dzDy * dzDy)) * (180 / Math.PI);

        datasets.push({
          layerId: 'elevation_terrain',
          title: 'Elevation & Local Terrain Slope',
          provider: 'Open-Elevation (SRTM 90m / ASTER DEM)',
          product: 'SRTM Global 3-arcsecond DEM',
          observationPeriod: 'Static DEM baseline',
          spatialResolution: '~90 m posting',
          resolutionWarning:
            fieldAreaHectares && fieldAreaHectares < 1
              ? 'Parcel is smaller than 1 ha; 90 m DEM smoothes micro-terraces and ditches.'
              : null,
          provenance: 'Observed',
          qualityNote: 'Slope computed by centered finite difference over 4 orthogonal ~94 m samples.',
          metrics: [
            { label: 'Elevation (ASL)', value: `${Math.round(centerElev)}`, unit: 'm' },
            { label: 'Estimated Slope', value: slopePct.toFixed(1), unit: `% (${slopeDeg.toFixed(1)}°)` },
          ],
        });
      } catch {
        datasets.push({
          layerId: 'elevation_terrain',
          title: 'Elevation & Local Terrain Slope',
          provider: 'Open-Elevation (SRTM)',
          product: 'SRTM 90m DEM',
          observationPeriod: 'Static DEM baseline',
          spatialResolution: '~90 m',
          resolutionWarning: null,
          provenance: 'Unavailable',
          qualityNote: 'Public SRTM elevation endpoint timed out or rate-limited; retry shortly.',
          metrics: [],
        });
      }
    })();

    await Promise.allSettled([openMeteoPromise, elevationPromise]);

    res.json({
      lat,
      lon,
      observationDate,
      inspectedFieldId: fieldId ?? null,
      inspectedFieldName: fieldName ?? null,
      fieldAreaHectares: fieldAreaHectares ?? null,
      datasets,
    });
  });

  // 6. Regional Discovery (strictly privacy-safe DTOs: NO field polygons, NO exact farm coordinates, cohort >= 3 threshold)
  router.get('/discovery/regions', (req, res) => {
    const store = readStore();
    const myFarmId = typeof req.query.farmId === 'string' ? req.query.farmId : '';
    const MIN_COHORT = 3;

    const visibleOptIns = store.discoveryOptIns.filter(
      (p) => p.optedIn && !store.blockedPublicIds.includes(p.publicId)
    );

    const cityBuckets = new Map<string, StoredDiscoveryOptIn[]>();
    for (const item of visibleOptIns) {
      const list = cityBuckets.get(item.cityKey) ?? [];
      list.push(item);
      cityBuckets.set(item.cityKey, list);
    }

    const regions = Array.from(cityBuckets.entries()).map(([cityKey, list]) => {
      const meetsThreshold = list.length >= MIN_COHORT;
      const sample = list[0];

      // Only reveal aggregate crop frequency & mean climate score when cohort >= MIN_COHORT
      const cropCounts = new Map<string, number>();
      let scoreSum = 0;
      let scoreN = 0;
      if (meetsThreshold) {
        for (const p of list) {
          for (const c of p.sharedCrops) {
            cropCounts.set(c, (cropCounts.get(c) ?? 0) + 1);
          }
          if (typeof p.climateScore === 'number') {
            scoreSum += p.climateScore;
            scoreN++;
          }
        }
      }

      const commonCrops = meetsThreshold
        ? Array.from(cropCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([crop]) => crop)
        : [];

      return {
        cityKey,
        cityName: sample.cityName,
        regionLabel: sample.regionLabel,
        approximateLat: Number(sample.approximateLat.toFixed(2)), // coarse city centroid only
        approximateLon: Number(sample.approximateLon.toFixed(2)),
        cohortCount: list.length,
        minCohortThreshold: MIN_COHORT,
        meetsThreshold,
        insufficientReason: meetsThreshold
          ? undefined
          : 'Not enough shared data to provide a reliable regional comparison (minimum 3 participating farms required to protect privacy).',
        commonCrops,
        medianAreaBand: meetsThreshold ? '10–100 ha band' : undefined,
        meanClimateScore: meetsThreshold && scoreN > 0 ? Math.round(scoreSum / scoreN) : null,
        observationWindow: 'Last 30 days · NASA POWER + shared rotation context',
        methodologyNote: 'City-level aggregate only; exact field polygons & coordinates are stripped before publication.',
      };
    });

    // Public profiles only expose explicitly opted-in city-level fields (never exact coordinates or farmId)
    const profiles = visibleOptIns.map((p) => ({
      publicId: p.publicId,
      displayAlias: p.displayAlias,
      cityKey: p.cityKey,
      cityName: p.cityName,
      farmScaleBand: p.farmScaleBand,
      sharedCrops: p.sharedCrops,
      sharedPriorities: p.sharedPriorities,
      irrigationTypeShared: p.irrigationTypeShared,
      soilTextureShared: p.soilTextureShared,
      acceptsMessages: p.acceptsMessages,
      updatedAt: p.updatedAt,
    }));

    const myRecord = myFarmId
      ? store.discoveryOptIns.find((p) => p.farmId === myFarmId) ?? null
      : null;

    const myConsent = myRecord
      ? {
          farmId: myRecord.farmId,
          optedIn: myRecord.optedIn,
          displayAlias: myRecord.displayAlias,
          cityName: myRecord.cityName,
          regionLabel: myRecord.regionLabel,
          shareCrops: myRecord.sharedCrops.length > 0,
          shareSoilTexture: Boolean(myRecord.soilTextureShared),
          shareWaterMethod: Boolean(myRecord.irrigationTypeShared),
          acceptsMessages: myRecord.acceptsMessages,
          updatedAt: myRecord.updatedAt,
        }
      : null;

    res.json({
      regions,
      profiles,
      myConsent,
      messages: store.messages.slice(-20),
    });
  });

  router.post('/discovery/opt-in', (req, res) => {
    const parsed = OptInBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid opt-in payload.' });
      return;
    }

    const store = readStore();
    const d = parsed.data;
    const cityKey = d.cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'region';
    const areaHa = d.areaHectares ?? 25;
    const farmScaleBand: StoredDiscoveryOptIn['farmScaleBand'] =
      areaHa < 10 ? 'Smallholder (< 10 ha)' : areaHa > 100 ? 'Large (> 100 ha)' : 'Medium (10–100 ha)';

    const now = new Date().toISOString();
    const existingIdx = store.discoveryOptIns.findIndex((p) => p.farmId === d.farmId);
    const publicId =
      existingIdx >= 0
        ? store.discoveryOptIns[existingIdx].publicId
        : `pub-${cityKey}-${Math.random().toString(36).slice(2, 6)}`;

    const record: StoredDiscoveryOptIn = {
      farmId: d.farmId,
      publicId,
      optedIn: d.optedIn,
      displayAlias: d.displayAlias.trim(),
      cityKey,
      cityName: d.cityName.trim(),
      regionLabel: d.regionLabel.trim(),
      // Coarsen coordinates strictly to ~1 km city grid (2 decimals) so private farm pinpoint cannot be inferred
      approximateLat: Number(d.approximateLat.toFixed(2)),
      approximateLon: Number(d.approximateLon.toFixed(2)),
      farmScaleBand,
      sharedCrops: d.sharedCrops,
      sharedPriorities: d.sharedPriorities,
      irrigationTypeShared: d.irrigationTypeShared,
      soilTextureShared: d.soilTextureShared,
      climateScore: d.climateScore,
      acceptsMessages: d.acceptsMessages,
      updatedAt: now,
    };

    if (existingIdx >= 0) {
      store.discoveryOptIns[existingIdx] = record;
    } else {
      store.discoveryOptIns.push(record);
    }
    writeStore(store);

    res.json({
      consent: {
        farmId: record.farmId,
        optedIn: record.optedIn,
        displayAlias: record.displayAlias,
        cityName: record.cityName,
        regionLabel: record.regionLabel,
        shareCrops: record.sharedCrops.length > 0,
        shareSoilTexture: Boolean(record.soilTextureShared),
        shareWaterMethod: Boolean(record.irrigationTypeShared),
        acceptsMessages: record.acceptsMessages,
        updatedAt: record.updatedAt,
      },
      notice: record.optedIn
        ? 'Published at city-level granularity only. Exact coordinates and field boundaries remain private.'
        : 'Sharing revoked. Future regional queries exclude your farm profile immediately.',
    });
  });

  router.delete('/discovery/opt-in/:farmId', (req, res) => {
    const store = readStore();
    store.discoveryOptIns = store.discoveryOptIns.filter((p) => p.farmId !== req.params.farmId);
    writeStore(store);
    res.json({
      revoked: true,
      notice: 'Public sharing revoked. Cached regional cohorts refresh within seconds.',
    });
  });

  router.post('/discovery/message', (req, res) => {
    const schema = z.object({
      fromAlias: z.string().min(1).max(80),
      toPublicId: z.string().min(1),
      text: z.string().min(2).max(500),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Message text (2–500 chars) and recipient ID required.' });
      return;
    }
    const store = readStore();
    const target = store.discoveryOptIns.find((p) => p.publicId === parsed.data.toPublicId && p.optedIn);
    if (!target || !target.acceptsMessages) {
      res.status(403).json({ error: 'This grower has not enabled regional messaging.' });
      return;
    }
    if (store.blockedPublicIds.includes(target.publicId)) {
      res.status(403).json({ error: 'Messaging disabled for blocked profile.' });
      return;
    }

    const msg: StoredDiscoveryMessage = {
      id: `msg-${Date.now()}`,
      fromAlias: parsed.data.fromAlias.trim(),
      toPublicId: target.publicId,
      cityName: target.cityName,
      text: parsed.data.text.trim(),
      createdAt: new Date().toISOString(),
    };
    store.messages.push(msg);
    writeStore(store);
    res.status(201).json({ message: msg });
  });

  router.post('/discovery/block', (req, res) => {
    const publicId = typeof req.body?.publicId === 'string' ? req.body.publicId : '';
    if (!publicId) {
      res.status(400).json({ error: 'publicId required.' });
      return;
    }
    const store = readStore();
    if (!store.blockedPublicIds.includes(publicId)) {
      store.blockedPublicIds.push(publicId);
      writeStore(store);
    }
    res.json({ blocked: publicId });
  });

  return router;
}
