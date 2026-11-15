import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { validateSnapshotPayload } from '../src/lib/snapshotAssessment';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDataDir(): string {
  return process.env.ANCHOR_DATA_DIR
    ? path.resolve(process.env.ANCHOR_DATA_DIR)
    : path.resolve(__dirname, '..', '.data');
}
function getMapsStorePath(): string {
  return path.join(getDataDir(), 'maps-workspace.json');
}
function getPortfolioStorePath(): string {
  return path.join(getDataDir(), 'my-farms-portfolio.json');
}

const EARTH_RADIUS_M = 6371008.8;
const DEG_TO_RAD = Math.PI / 180;

type LonLat = [number, number];

interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: LonLat[][];
}

type FarmGeoJson =
  | GeoJsonPolygon
  | {
      type: 'MultiPolygon';
      coordinates: LonLat[][][];
    };

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

function validateAndMeasurePolygon(geometry: GeoJsonPolygon): {
  ok: true;
  normalized: GeoJsonPolygon;
  grossAreaHectares: number;
  netAreaHectares: number;
  excludedAreaHectares: number;
  perimeterM: number;
  centroid: { lat: number; lon: number };
} | { ok: false; error: string } {
  const ext = geometry.coordinates[0];
  if (!Array.isArray(ext) || stripClosing(ext).length < 3) {
    return { ok: false, error: 'Polygon exterior must contain at least 3 vertices.' };
  }
  const normalizedRings: LonLat[][] = [];
  for (const r of geometry.coordinates) {
    const clean = stripClosing(r).map(([lon, lat]) => [Number(lon), Number(lat)] as LonLat);
    if (clean.some(([lon, lat]) => !Number.isFinite(lon) || !Number.isFinite(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90)) {
      return { ok: false, error: 'Geometry contains out-of-range coordinates.' };
    }
    if (hasSelfIntersection(clean)) {
      return { ok: false, error: 'Polygon boundary intersects itself. Adjust overlapping edges before saving.' };
    }
    normalizedRings.push(closeRing(clean));
  }
  const grossM2 = computeRingAreaM2(normalizedRings[0]);
  if (grossM2 < 25) {
    return { ok: false, error: 'Boundary enclosed area is below 25 m².' };
  }
  let holeM2 = 0;
  for (let i = 1; i < normalizedRings.length; i++) {
    holeM2 += computeRingAreaM2(normalizedRings[i]);
  }
  const netM2 = Math.max(0, grossM2 - holeM2);
  return {
    ok: true,
    normalized: { type: 'Polygon', coordinates: normalizedRings },
    grossAreaHectares: Number((grossM2 / 10000).toFixed(2)),
    netAreaHectares: Number((netM2 / 10000).toFixed(2)),
    excludedAreaHectares: Number((holeM2 / 10000).toFixed(2)),
    perimeterM: Math.round(computeRingPerimeterM(normalizedRings[0])),
    centroid: computeCentroid(normalizedRings[0]),
  };
}

function pointInRing(pt: LonLat, ring: LonLat[]): boolean {
  const open = stripClosing(ring);
  let inside = false;
  for (let i = 0, j = open.length - 1; i < open.length; j = i++) {
    const xi = open[i][0], yi = open[i][1];
    const xj = open[j][0], yj = open[j][1];
    const intersect = yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi + 1e-18) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function ringsOverlap(a: LonLat[], b: LonLat[]): boolean {
  const oa = stripClosing(a);
  const ob = stripClosing(b);
  if (oa.length < 3 || ob.length < 3) return false;
  // Strictly interior sample points avoid false positives for adjacent shared borders
  const ca = computeCentroid(oa);
  const cb = computeCentroid(ob);
  if (pointInRing([ca.lon, ca.lat], ob) || pointInRing([cb.lon, cb.lat], oa)) return true;
  for (let i = 0; i < oa.length; i++) {
    const a1 = oa[i];
    const a2 = oa[(i + 1) % oa.length];
    for (let j = 0; j < ob.length; j++) {
      const b1 = ob[j];
      const b2 = ob[(j + 1) % ob.length];
      // Strictly crossing edges (not just touching endpoints)
      const o1 = orient(a1, a2, b1);
      const o2 = orient(a1, a2, b2);
      const o3 = orient(b1, b2, a1);
      const o4 = orient(b1, b2, a2);
      if (
        ((o1 > 1e-10 && o2 < -1e-10) || (o1 < -1e-10 && o2 > 1e-10)) &&
        ((o3 > 1e-10 && o4 < -1e-10) || (o3 < -1e-10 && o4 > 1e-10))
      ) {
        return true;
      }
    }
  }
  return false;
}

interface StoredMapFarm {
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
  healthStatus: 'healthy' | 'moderate' | 'at_risk' | 'no_data';
  assessment: {
    farmId: string;
    status: 'healthy' | 'moderate' | 'at_risk' | 'no_data';
    score: number | null;
    assessedAt: string;
    assessmentVersion: string;
    confidence?: number;
    explanation?: string;
  };
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

interface MapsWorkspaceStoreRaw {
  farms: StoredMapFarm[];
  fields: StoredMapField[];
  discoveryOptIns: unknown[];
  messages: unknown[];
  blockedPublicIds: string[];
}

interface FarmMetaExtension {
  farmId: string;
  name?: string;
  primaryCrop?: string | null;
  locationLabel?: string;
  regionLabel: string;
  country: string;
  timezone: string;
  centroid: { lat: number; lon: number } | null;
  areaUnit: 'acres' | 'hectares';
  declaredAreaHa: number | null;
  isPrivate: boolean;
  isDraft: boolean;
  archivedAt: string | null;
  deletedAt?: string | null;
  versionNumber: number;
  notes: string;
  activePlan: {
    planId: string;
    title: string;
    version: number;
    selectedAt: string;
    selectedBy: string;
    cropSequence: Array<{ cropId: string; cropName: string; cycleLabel: string }>;
    isRecommendedPlan: boolean;
  } | null;
  recommendedPlanId: string | null;
  recommendedPlanTitle: string | null;
  soil: {
    texture: string;
    moistureStatus: 'measured' | 'estimated' | 'unknown';
    moisturePct: number | null;
    moistureMethod: string;
    moistureDate: string;
    phStatus: 'tested' | 'not_tested';
    phValue: number | null;
    bufferPh?: number | null;
    phTestDate: string;
    organicMatterPct: number | null;
    drainage: string;
    slopePct: number | null;
    elevationM: number | null;
    preparationMethods: string[];
    notes: string;
  };
  water: {
    sources: string[];
    reliability: string;
    dailyCapacityKnown: boolean;
    dailyCapacityM3: number | null;
    qualityTested: string;
    ecDsM: number | null;
    salinityPpm: number | null;
    qualityTestDate: string;
    wateringMethod: string;
    irrigationMethod: string;
    irrigationFrequency: string;
    rainfallFrequency: string;
    estimatedDailyDemandM3: number | null;
    demandAssumptionNote: string;
  };
  planningHorizon: string;
  priorities: string[];
  challenges: string[];
  lastAssessedAt: string | null;
  suitabilityScore: number | null;
  createdAt: string;
  updatedAt: string;
}

interface FieldMetaExtension {
  fieldId: string;
  previousCrops: string[];
  soilOverrides?: Record<string, unknown>;
  waterOverrides?: Record<string, unknown>;
  activePlanId?: string | null;
  activePlanTitle?: string | null;
  rotationReviewDue: boolean;
  activeAlertsCount: number;
  criticalAlert?: string | null;
  lastAssessedAt: string | null;
  notes?: string;
}

interface PortfolioStore {
  farmMeta: Record<string, FarmMetaExtension>;
  fieldMeta: Record<string, FieldMetaExtension>;
  decisions: Array<Record<string, unknown>>;
  observations: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
  irrigationLogs: Array<Record<string, unknown>>;
  snapshots: Array<Record<string, unknown>>;
  appliedOpIds: string[];
}

function writeJsonAtomic(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);
}

function readMapsStore(): MapsWorkspaceStoreRaw {
  try {
    const mapsPath = getMapsStorePath();
    if (!fs.existsSync(mapsPath)) {
      return { farms: [], fields: [], discoveryOptIns: [], messages: [], blockedPublicIds: [] };
    }
    const raw = fs.readFileSync(mapsPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<MapsWorkspaceStoreRaw>;
    return {
      farms: Array.isArray(parsed.farms) ? parsed.farms : [],
      fields: Array.isArray(parsed.fields) ? parsed.fields : [],
      discoveryOptIns: Array.isArray(parsed.discoveryOptIns) ? parsed.discoveryOptIns : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      blockedPublicIds: Array.isArray(parsed.blockedPublicIds) ? parsed.blockedPublicIds : [],
    };
  } catch {
    return { farms: [], fields: [], discoveryOptIns: [], messages: [], blockedPublicIds: [] };
  }
}

function getDefaultPortfolioStore(): PortfolioStore {
  const now = '2026-11-10T09:00:00.000Z';
  const staleDate = '2026-10-12T08:00:00.000Z'; // > 14 days before 2026-11-14 -> demonstrates honest stale warning
  return {
    farmMeta: {
      'farm-green-valley': {
        farmId: 'farm-green-valley',
        regionLabel: 'Willamette Valley, OR',
        country: 'United States',
        timezone: 'America/Los_Angeles',
        centroid: { lat: 44.8602, lon: -123.1462 },
        areaUnit: 'hectares',
        declaredAreaHa: 78.5,
        isPrivate: true,
        isDraft: false,
        archivedAt: null,
        versionNumber: 1,
        notes: 'Primary cereal-legume rotational unit with gravity drip backup on East Creek block.',
        activePlan: {
          planId: 'rot-wheat-peas-cover',
          title: 'Wheat → Peas → Cover Oats',
          version: 2,
          selectedAt: '2026-11-02T14:15:00.000Z',
          selectedBy: 'Farm Manager',
          cropSequence: [
            { cropId: 'wheat', cropName: 'Wheat', cycleLabel: 'Cycle 1 (Current)' },
            { cropId: 'peas', cropName: 'Peas', cycleLabel: 'Cycle 2 (Next)' },
            { cropId: 'barley', cropName: 'Oats / Barley Cover', cycleLabel: 'Cycle 3 (Restore)' },
          ],
          isRecommendedPlan: true,
        },
        recommendedPlanId: 'rot-wheat-peas-cover',
        recommendedPlanTitle: 'Wheat → Peas → Cover Oats',
        soil: {
          texture: 'Silt loam',
          moistureStatus: 'measured',
          moisturePct: 34,
          moistureMethod: 'TDR Probe',
          moistureDate: '2026-11-09',
          phStatus: 'tested',
          phValue: 6.6,
          phTestDate: '2026-10-28',
          organicMatterPct: 3.8,
          drainage: 'Moderately',
          slopePct: 2.4,
          elevationM: 68,
          preparationMethods: ['Compost / Organic fertiliser', 'No regular preparation'],
          notes: 'Uniform silt loam along old river bench.',
        },
        water: {
          sources: ['Groundwater / Well', 'Rainwater collection'],
          reliability: 'Usually available',
          dailyCapacityKnown: true,
          dailyCapacityM3: 185,
          qualityTested: 'Yes',
          ecDsM: 0.48,
          salinityPpm: 310,
          qualityTestDate: '2026-10-15',
          wateringMethod: 'Hybrid (rainfall and irrigation)',
          irrigationMethod: 'Drip irrigation',
          irrigationFrequency: 'Weekly',
          rainfallFrequency: 'Several times weekly',
          estimatedDailyDemandM3: 142,
          demandAssumptionNote: 'Based on ~3.2 mm/day autumn ET0 adjusted by cereal Kc 0.85 across irrigated acreage.',
        },
        planningHorizon: 'Next 2–3 years',
        priorities: ['Improving soil health', 'Water conservation', 'Crop suitability'],
        challenges: [],
        lastAssessedAt: now,
        suitabilityScore: 86,
        createdAt: now,
        updatedAt: now,
      },
      'farm-riverside': {
        farmId: 'farm-riverside',
        regionLabel: 'Willamette Valley, OR',
        country: 'United States',
        timezone: 'America/Los_Angeles',
        centroid: { lat: 44.8488, lon: -123.1496 },
        areaUnit: 'hectares',
        declaredAreaHa: 90.0,
        isPrivate: true,
        isDraft: false,
        archivedAt: null,
        versionNumber: 1,
        notes: 'Monitoring lower bench moisture deficit following warm dry spell.',
        activePlan: {
          planId: 'rot-maize-soy-sunflower',
          title: 'Maize → Soybean → Sunflower',
          version: 1,
          selectedAt: '2026-10-15T10:00:00.000Z',
          selectedBy: 'Farm Manager',
          cropSequence: [
            { cropId: 'maize', cropName: 'Maize', cycleLabel: 'Cycle 1 (Current)' },
            { cropId: 'soybean', cropName: 'Soybean', cycleLabel: 'Cycle 2 (Next)' },
            { cropId: 'sunflowers', cropName: 'Sunflower', cycleLabel: 'Cycle 3 (Low Water)' },
          ],
          isRecommendedPlan: false,
        },
        recommendedPlanId: 'rot-sunflower-lentils-wheat',
        recommendedPlanTitle: 'Sunflower → Lentils → Winter Wheat (Low Water)',
        soil: {
          texture: 'Clay loam',
          moistureStatus: 'estimated',
          moisturePct: 24,
          moistureMethod: 'Estimated from ERA5 soil grid + hand feel',
          moistureDate: '2026-11-08',
          phStatus: 'tested',
          phValue: 6.9,
          phTestDate: '2026-09-12',
          organicMatterPct: 2.9,
          drainage: 'Slowly',
          slopePct: 1.8,
          elevationM: 61,
          preparationMethods: ['Harrowing'],
          notes: 'Southern edge drains slower after heavy winter rain.',
        },
        water: {
          sources: ['River / Stream', 'Canal'],
          reliability: 'Sometimes limited',
          dailyCapacityKnown: true,
          dailyCapacityM3: 140,
          qualityTested: 'No',
          ecDsM: null,
          salinityPpm: null,
          qualityTestDate: '',
          wateringMethod: 'Artificial irrigation',
          irrigationMethod: 'Sprinkler irrigation',
          irrigationFrequency: 'Every 2–3 days',
          rainfallFrequency: 'Several times monthly',
          estimatedDailyDemandM3: 168,
          demandAssumptionNote: 'Late-cycle maize canopy demand exceeds reliable late-summer pump capacity during dry periods.',
        },
        planningHorizon: 'Next year',
        priorities: ['Water conservation', 'Climate resistance'],
        challenges: ['Unpredictable rainfall / drought'],
        lastAssessedAt: '2026-11-08T11:20:00.000Z',
        suitabilityScore: 63,
        createdAt: now,
        updatedAt: now,
      },
      'farm-highland': {
        farmId: 'farm-highland',
        regionLabel: 'Independence Bench, OR',
        country: 'United States',
        timezone: 'America/Los_Angeles',
        centroid: { lat: 44.8527, lon: -123.1656 },
        areaUnit: 'hectares',
        declaredAreaHa: 120.0,
        isPrivate: true,
        isDraft: false,
        archivedAt: null,
        versionNumber: 1,
        notes: 'High-priority moisture stress & seasonal irrigation bottleneck on upper bench.',
        activePlan: {
          planId: 'rot-soy-wheat-fallow',
          title: 'Soybean → Winter Wheat → Legume Mulch',
          version: 1,
          selectedAt: '2026-10-01T09:00:00.000Z',
          selectedBy: 'Farm Manager',
          cropSequence: [
            { cropId: 'soybean', cropName: 'Soybean', cycleLabel: 'Cycle 1 (Current)' },
            { cropId: 'wheat', cropName: 'Wheat', cycleLabel: 'Cycle 2 (Next)' },
            { cropId: 'peas', cropName: 'Peas', cycleLabel: 'Cycle 3 (Mulch)' },
          ],
          isRecommendedPlan: false,
        },
        recommendedPlanId: 'rot-chickpeas-barley-cover',
        recommendedPlanTitle: 'Chickpeas → Drought-Tolerant Barley → Cover',
        soil: {
          texture: 'Sandy loam',
          moistureStatus: 'measured',
          moisturePct: 17,
          moistureMethod: 'Handheld capacitance probe',
          moistureDate: '2026-11-09',
          phStatus: 'tested',
          phValue: 6.1,
          phTestDate: '2026-10-05',
          organicMatterPct: 2.1,
          drainage: 'Quickly',
          slopePct: 5.2,
          elevationM: 94,
          preparationMethods: ['Raised beds'],
          notes: 'Coarser sandy loam dries rapidly between irrigation runs.',
        },
        water: {
          sources: ['Groundwater / Well'],
          reliability: 'Frequently limited',
          dailyCapacityKnown: true,
          dailyCapacityM3: 110,
          qualityTested: 'Yes',
          ecDsM: 0.92,
          salinityPpm: 589,
          qualityTestDate: '2026-10-02',
          wateringMethod: 'Hybrid (rainfall and irrigation)',
          irrigationMethod: 'Drip irrigation',
          irrigationFrequency: 'Only when required',
          rainfallFrequency: 'Monthly',
          estimatedDailyDemandM3: 195,
          demandAssumptionNote: 'Well drawdown caps peak daily abstraction below evapotranspiration demand for 120 ha soybeans.',
        },
        planningHorizon: 'Next season',
        priorities: ['Water conservation', 'Improving soil health'],
        challenges: ['Limited water supply', 'Soil quality decline'],
        lastAssessedAt: now,
        suitabilityScore: 38,
        createdAt: now,
        updatedAt: now,
      },
      'farm-sunrise': {
        farmId: 'farm-sunrise',
        regionLabel: 'North Polk Valley, OR',
        country: 'United States',
        timezone: 'America/Los_Angeles',
        centroid: { lat: 44.8703, lon: -123.1334 },
        areaUnit: 'hectares',
        declaredAreaHa: 64.5,
        isPrivate: true,
        isDraft: false,
        archivedAt: null,
        versionNumber: 1,
        notes: 'Winter-hardy barley block; last full lab & NASA POWER assessment ran > 30 days ago (needs refresh).',
        activePlan: null,
        recommendedPlanId: 'rot-barley-peas-wheat',
        recommendedPlanTitle: 'Barley → Field Peas → Winter Wheat',
        soil: {
          texture: 'Loam',
          moistureStatus: 'measured',
          moisturePct: 31,
          moistureMethod: 'Soil moisture probe',
          moistureDate: '2026-10-12',
          phStatus: 'tested',
          phValue: 6.5,
          phTestDate: '2026-10-12',
          organicMatterPct: 3.4,
          drainage: 'Moderately',
          slopePct: 2.1,
          elevationM: 72,
          preparationMethods: ['Compost / Organic fertiliser'],
          notes: '',
        },
        water: {
          sources: ['Rainwater collection', 'Groundwater / Well'],
          reliability: 'Always available',
          dailyCapacityKnown: false,
          dailyCapacityM3: null,
          qualityTested: 'Unknown',
          ecDsM: null,
          salinityPpm: null,
          qualityTestDate: '',
          wateringMethod: 'Rain-fed agriculture',
          irrigationMethod: 'Unknown',
          irrigationFrequency: 'Only when required',
          rainfallFrequency: 'Several times weekly',
          estimatedDailyDemandM3: 95,
          demandAssumptionNote: 'Estimated rain-fed winter cereal requirement; well backup capacity not yet metered.',
        },
        planningHorizon: 'Next year',
        priorities: ['Increasing yield stability', 'Improving soil health'],
        challenges: [],
        lastAssessedAt: staleDate,
        suitabilityScore: 82,
        createdAt: staleDate,
        updatedAt: staleDate,
      },
      'farm-oakridge': {
        farmId: 'farm-oakridge',
        regionLabel: 'South Polk Ridge, OR',
        country: 'United States',
        timezone: 'America/Los_Angeles',
        centroid: { lat: 44.8384, lon: -123.173 },
        areaUnit: 'hectares',
        declaredAreaHa: 72.8,
        isPrivate: true,
        isDraft: false,
        archivedAt: null,
        versionNumber: 1,
        notes: 'Newly registered parcel. Soil and water lab parameters remain unentered.',
        activePlan: null,
        recommendedPlanId: null,
        recommendedPlanTitle: null,
        soil: {
          texture: 'Unknown',
          moistureStatus: 'unknown',
          moisturePct: null,
          moistureMethod: '',
          moistureDate: '',
          phStatus: 'not_tested',
          phValue: null,
          phTestDate: '',
          organicMatterPct: null,
          drainage: 'Unknown',
          slopePct: null,
          elevationM: null,
          preparationMethods: [],
          notes: '',
        },
        water: {
          sources: ['Unknown'],
          reliability: 'Unknown',
          dailyCapacityKnown: false,
          dailyCapacityM3: null,
          qualityTested: 'Unknown',
          ecDsM: null,
          salinityPpm: null,
          qualityTestDate: '',
          wateringMethod: '',
          irrigationMethod: 'Unknown',
          irrigationFrequency: 'Unknown',
          rainfallFrequency: 'Unknown',
          estimatedDailyDemandM3: null,
          demandAssumptionNote: 'Awaiting soil, crop, and water source details.',
        },
        planningHorizon: '',
        priorities: [],
        challenges: [],
        lastAssessedAt: null,
        suitabilityScore: null,
        createdAt: now,
        updatedAt: now,
      },
    },
    fieldMeta: {
      'field-gv-1': {
        fieldId: 'field-gv-1',
        previousCrops: ['Peas', 'Barley'],
        activePlanId: 'rot-wheat-peas-cover',
        activePlanTitle: 'Wheat → Peas → Cover Oats',
        rotationReviewDue: false,
        activeAlertsCount: 0,
        lastAssessedAt: now,
        notes: 'Healthy vigorous tillering stand.',
      },
      'field-gv-2': {
        fieldId: 'field-gv-2',
        previousCrops: ['Wheat', 'Soybean'],
        activePlanId: 'rot-wheat-peas-cover',
        activePlanTitle: 'Wheat → Peas → Cover Oats',
        rotationReviewDue: true,
        activeAlertsCount: 1,
        lastAssessedAt: now,
        notes: 'Check drip header pressure before spring seeding.',
      },
      'field-gv-3': {
        fieldId: 'field-gv-3',
        previousCrops: ['Maize', 'Wheat'],
        activePlanId: 'rot-wheat-peas-cover',
        activePlanTitle: 'Wheat → Peas → Cover Oats',
        rotationReviewDue: false,
        activeAlertsCount: 0,
        lastAssessedAt: now,
      },
    },
    decisions: [
      {
        id: 'dec-gv-01',
        farmId: 'farm-green-valley',
        fieldId: null,
        fieldName: 'Whole Farm',
        timestamp: '2026-10-18T15:00:00.000Z',
        actor: 'Farm Manager',
        action: 'selected',
        candidateId: 'rot-wheat-peas-cover-v1',
        candidateTitle: 'Wheat → Soybeans → Rye Cover',
        candidateScoreSnapshot: 81,
        priorPlan: null,
        newPlan: {
          planId: 'rot-wheat-peas-cover-v1',
          title: 'Wheat → Soybeans → Rye Cover',
          version: 1,
          crops: [
            { cropId: 'wheat', cropName: 'Wheat', cycleLabel: 'Cycle 1' },
            { cropId: 'soybean', cropName: 'Soybean', cycleLabel: 'Cycle 2' },
            { cropId: 'barley', cropName: 'Rye Cover', cycleLabel: 'Cycle 3' },
          ],
        },
        reasonCode: 'agronomic_fit',
        reasonNote: 'Initial autumn cereal establishment aligned with wet winter forecast.',
        sourceReportId: 'snap-gv-01',
        sourceReportDate: '2026-10-18',
      },
      {
        id: 'dec-gv-02',
        farmId: 'farm-green-valley',
        fieldId: null,
        fieldName: 'Whole Farm',
        timestamp: '2026-11-02T14:15:00.000Z',
        actor: 'Farm Manager',
        action: 'replaced',
        candidateId: 'rot-wheat-peas-cover',
        candidateTitle: 'Wheat → Peas → Cover Oats',
        candidateScoreSnapshot: 86,
        priorPlan: {
          planId: 'rot-wheat-peas-cover-v1',
          title: 'Wheat → Soybeans → Rye Cover',
          version: 1,
          crops: [
            { cropId: 'wheat', cropName: 'Wheat', cycleLabel: 'Cycle 1' },
            { cropId: 'soybean', cropName: 'Soybean', cycleLabel: 'Cycle 2' },
            { cropId: 'barley', cropName: 'Rye Cover', cycleLabel: 'Cycle 3' },
          ],
        },
        newPlan: {
          planId: 'rot-wheat-peas-cover',
          title: 'Wheat → Peas → Cover Oats',
          version: 2,
          crops: [
            { cropId: 'wheat', cropName: 'Wheat', cycleLabel: 'Cycle 1 (Current)' },
            { cropId: 'peas', cropName: 'Peas', cycleLabel: 'Cycle 2 (Next)' },
            { cropId: 'barley', cropName: 'Oats / Barley Cover', cycleLabel: 'Cycle 3 (Restore)' },
          ],
        },
        reasonCode: 'water',
        reasonNote: 'Switched summer soybean cycle to cool-season field peas to cut peak drip irrigation demand by ~24%.',
        sourceReportId: 'snap-gv-02',
        sourceReportDate: '2026-11-02',
      },
      {
        id: 'dec-rb-01',
        farmId: 'farm-riverside',
        fieldId: null,
        fieldName: 'Whole Farm',
        timestamp: '2026-10-15T10:00:00.000Z',
        actor: 'Farm Manager',
        action: 'deferred',
        candidateId: 'rot-sunflower-lentils-wheat',
        candidateTitle: 'Sunflower → Lentils → Winter Wheat (Low Water)',
        candidateScoreSnapshot: 79,
        priorPlan: {
          planId: 'rot-maize-soy-sunflower',
          title: 'Maize → Soybean → Sunflower',
          version: 1,
          crops: [
            { cropId: 'maize', cropName: 'Maize', cycleLabel: 'Cycle 1 (Current)' },
            { cropId: 'soybean', cropName: 'Soybean', cycleLabel: 'Cycle 2 (Next)' },
            { cropId: 'sunflowers', cropName: 'Sunflower', cycleLabel: 'Cycle 3 (Low Water)' },
          ],
        },
        newPlan: null,
        reasonCode: 'equipment',
        reasonNote: 'Keeping Maize → Soybean for current contract cycle; header kit for lentils awaits grower co-op delivery.',
        sourceReportId: null,
        sourceReportDate: null,
      },
    ],
    observations: [
      {
        id: 'obs-gv-01',
        farmId: 'farm-green-valley',
        fieldId: 'field-gv-1',
        fieldName: 'North Ridge Block 1',
        category: 'soil_lab',
        title: 'Autumn topsoil TDR & composite pH check',
        detail: 'Moisture stabilized at 34% VWC after 14 mm rainfall; pH measured 6.6 across 6 cores.',
        observedAt: '2026-11-09',
        provenance: 'Measured',
        createdAt: '2026-11-09T16:20:00.000Z',
      },
      {
        id: 'obs-hl-01',
        farmId: 'farm-highland',
        fieldId: null,
        fieldName: 'Whole Farm',
        category: 'scouting',
        title: 'Sandy loam bench moisture drawdown alert',
        detail: 'Probe averaged 17% VWC at 15 cm depth; upper bench rows showing early wilting before afternoon heat.',
        observedAt: '2026-11-09',
        provenance: 'Measured',
        createdAt: '2026-11-09T13:10:00.000Z',
      },
    ],
    tasks: [
      {
        id: 'task-gv-01',
        farmId: 'farm-green-valley',
        fieldId: 'field-gv-2',
        fieldName: 'East Creek Block 2',
        title: 'Inspect drip manifold pressure & flush lateral filters',
        category: 'irrigation',
        dueDate: '2026-11-18',
        priority: 'normal',
        completed: false,
        completedAt: null,
        createdAt: now,
      },
      {
        id: 'task-hl-01',
        farmId: 'farm-highland',
        fieldId: null,
        fieldName: 'Whole Farm',
        title: 'Shift irrigation set to pre-dawn low-wind window & verify well drawdown',
        category: 'irrigation',
        dueDate: '2026-11-15',
        priority: 'high',
        completed: false,
        completedAt: null,
        createdAt: now,
      },
      {
        id: 'task-or-01',
        farmId: 'farm-oakridge',
        fieldId: null,
        fieldName: 'Whole Farm',
        title: 'Collect composite soil cores (0–20 cm) for pH & texture lab entry',
        category: 'soil',
        dueDate: '2026-11-20',
        priority: 'high',
        completed: false,
        completedAt: null,
        createdAt: now,
      },
    ],
    irrigationLogs: [
      {
        id: 'irr-gv-01',
        farmId: 'farm-green-valley',
        fieldId: 'field-gv-1',
        fieldName: 'North Ridge Block 1',
        date: '2026-11-06',
        volumeM3: 112,
        method: 'Drip irrigation',
        notes: 'Pre-emergence soak across 28.4 ha block.',
        createdAt: '2026-11-06T07:30:00.000Z',
      },
      {
        id: 'irr-hl-01',
        farmId: 'farm-highland',
        fieldId: null,
        fieldName: 'Whole Farm',
        date: '2026-11-08',
        volumeM3: 105,
        method: 'Drip irrigation',
        notes: 'Limited by well recovery rate after 6 hours.',
        createdAt: '2026-11-08T06:00:00.000Z',
      },
    ],
    snapshots: [
      {
        id: 'snap-gv-01',
        farmId: 'farm-green-valley',
        fieldId: null,
        fieldName: 'Whole Farm',
        generatedAt: '2026-10-18T14:20:00.000Z',
        modelVersion: 'power-eonet-v2',
        triggerReason: 'Baseline onboarding soil + climate run',
        suitabilityScore: 81,
        confidencePct: 84,
        completenessPct: 86,
        weatherWindowSummary: 'NASA POWER 21-year Oct window: 16.4 °C high / 6.2 °C low, 2.8 mm/day rainfall.',
        dataAvailability: {
          nasaPower: 'available',
          openMeteo: 'available',
          nasaEonet: 'available',
          soilLab: 'measured',
        },
        keyMetrics: {
          meanTempC: 11.3,
          precipMmDay: 2.8,
          et0MmDay: 2.3,
          soilMoisturePct: 29,
          phValue: 6.6,
          mappedAreaHa: 78.3,
        },
        recommendations: [
          'Maintain autumn cereal establishment with residue cover to preserve silt loam structure.',
          'Schedule legume rotation next cycle to supply 40–60 kg N/ha biologically.',
        ],
      },
      {
        id: 'snap-gv-02',
        farmId: 'farm-green-valley',
        fieldId: null,
        fieldName: 'Whole Farm',
        generatedAt: now,
        modelVersion: 'power-eonet-v2.1',
        triggerReason: 'Post-probe Nov re-assessment & water sensitivity check',
        suitabilityScore: 86,
        confidencePct: 91,
        completenessPct: 94,
        weatherWindowSummary: 'NASA POWER + Open-Meteo: 14.2 °C high / 5.1 °C low, 3.4 mm/day rainfall, 0 EONET hazards.',
        dataAvailability: {
          nasaPower: 'available',
          openMeteo: 'available',
          nasaEonet: 'available',
          soilLab: 'measured',
        },
        keyMetrics: {
          meanTempC: 9.7,
          precipMmDay: 3.4,
          et0MmDay: 1.9,
          soilMoisturePct: 34,
          phValue: 6.6,
          mappedAreaHa: 78.3,
        },
        recommendations: [
          'Soil moisture recharge improved +5% VWC; Wheat → Peas → Cover Oats scores highest water-efficiency fit.',
          'Flush East Creek drip filters prior to spring transition.',
        ],
      },
    ],
    appliedOpIds: [],
  };
}

function readPortfolioStore(): PortfolioStore {
  try {
    const portfolioPath = getPortfolioStorePath();
    if (!fs.existsSync(portfolioPath)) {
      const def = getDefaultPortfolioStore();
      writeJsonAtomic(portfolioPath, def);
      return def;
    }
    const raw = fs.readFileSync(portfolioPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PortfolioStore>;
    const def = getDefaultPortfolioStore();
    return {
      farmMeta: parsed.farmMeta && typeof parsed.farmMeta === 'object' ? parsed.farmMeta : def.farmMeta,
      fieldMeta: parsed.fieldMeta && typeof parsed.fieldMeta === 'object' ? parsed.fieldMeta : def.fieldMeta,
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : def.decisions,
      observations: Array.isArray(parsed.observations) ? parsed.observations : def.observations,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : def.tasks,
      irrigationLogs: Array.isArray(parsed.irrigationLogs) ? parsed.irrigationLogs : def.irrigationLogs,
      snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : def.snapshots,
      appliedOpIds: Array.isArray(parsed.appliedOpIds) ? parsed.appliedOpIds : [],
    };
  } catch {
    return getDefaultPortfolioStore();
  }
}

function writePortfolioStore(store: PortfolioStore): void {
  writeJsonAtomic(getPortfolioStorePath(), store);
}

function writeMapsStore(store: MapsWorkspaceStoreRaw): void {
  writeJsonAtomic(getMapsStorePath(), store);
}

function defaultMetaForMapFarm(farm: StoredMapFarm): FarmMetaExtension {
  const score = farm.assessment?.score ?? null;
  const now = farm.updatedAt || new Date().toISOString();
  return {
    farmId: farm.id,
    name: farm.name,
    primaryCrop: farm.crop,
    locationLabel: farm.locationLabel,
    regionLabel: farm.locationLabel || 'Unassigned region',
    country: 'Unspecified',
    timezone: 'UTC',
    centroid: farm.centroid ?? null,
    areaUnit: 'hectares',
    declaredAreaHa: farm.areaHa || null,
    isPrivate: true,
    isDraft: false,
    archivedAt: null,
    deletedAt: farm.deletedAt,
    versionNumber: farm.versionNumber || 1,
    notes: farm.notes || '',
    activePlan: farm.crop
      ? {
          planId: `active-${farm.crop.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          title: `${farm.crop} Rotation`,
          version: 1,
          selectedAt: now,
          selectedBy: 'Farm Manager',
          cropSequence: [{ cropId: farm.crop.toLowerCase(), cropName: farm.crop, cycleLabel: 'Cycle 1' }],
          isRecommendedPlan: false,
        }
      : null,
    recommendedPlanId: null,
    recommendedPlanTitle: null,
    soil: {
      texture: 'Unknown',
      moistureStatus: 'unknown',
      moisturePct: null,
      moistureMethod: '',
      moistureDate: '',
      phStatus: 'not_tested',
      phValue: null,
      phTestDate: '',
      organicMatterPct: null,
      drainage: 'Unknown',
      slopePct: null,
      elevationM: null,
      preparationMethods: [],
      notes: '',
    },
    water: {
      sources: ['Unknown'],
      reliability: 'Unknown',
      dailyCapacityKnown: false,
      dailyCapacityM3: null,
      qualityTested: 'Unknown',
      ecDsM: null,
      salinityPpm: null,
      qualityTestDate: '',
      wateringMethod: '',
      irrigationMethod: 'Unknown',
      irrigationFrequency: 'Unknown',
      rainfallFrequency: 'Unknown',
      estimatedDailyDemandM3: null,
      demandAssumptionNote: '',
    },
    planningHorizon: '',
    priorities: [],
    challenges: [],
    lastAssessedAt: score !== null ? farm.assessment?.assessedAt || now : null,
    suitabilityScore: score,
    createdAt: farm.createdAt || now,
    updatedAt: now,
  };
}

function buildUnifiedPortfolioPayload() {
  const maps = readMapsStore();
  const port = readPortfolioStore();

  // Combine farms stored in maps-workspace AND unmapped/draft farms stored solely in farmMeta
  const mapFarmsById = new Map<string, StoredMapFarm>();
  for (const mf of maps.farms) {
    if (!mf.deletedAt) mapFarmsById.set(mf.id, mf);
  }

  const allIds = new Set<string>([
    ...Array.from(mapFarmsById.keys()),
    ...Object.keys(port.farmMeta).filter((id) => !port.farmMeta[id]?.deletedAt && !mapFarmsById.has(id)),
  ]);

  const rawFarms = Array.from(allIds).map((id) => {
    const mf = mapFarmsById.get(id);
    const meta = port.farmMeta[id] ?? (mf ? defaultMetaForMapFarm(mf) : null);
    if (!meta || meta.deletedAt) return null;

    const farmFields = maps.fields.filter((f) => f.farmId === id);

    // Check pairwise sibling field overlap (warn, never auto-mutate)
    const overlapPairs: string[] = [];
    for (let i = 0; i < farmFields.length; i++) {
      const va = farmFields[i].versions[0]?.geometry?.coordinates?.[0];
      if (!va) continue;
      for (let j = i + 1; j < farmFields.length; j++) {
        const vb = farmFields[j].versions[0]?.geometry?.coordinates?.[0];
        if (!vb) continue;
        if (ringsOverlap(va, vb)) {
          overlapPairs.push(`"${farmFields[i].name}" & "${farmFields[j].name}"`);
        }
      }
    }

    const mappedFieldAreaHa = Number(
      farmFields.reduce((s, f) => s + (f.versions[0]?.netAreaHectares ?? 0), 0).toFixed(2)
    );
    const farmGeomAreaHa = mf ? Number(mf.areaHa.toFixed(2)) : 0;
    const mappedAreaHa = farmFields.length > 0 ? mappedFieldAreaHa : farmGeomAreaHa;
    const declaredAreaHa = meta.declaredAreaHa ?? null;
    const hasBoundary = Boolean(mf?.geometry || farmFields.length > 0);

    let areaGapNote: string | null = null;
    if (!hasBoundary && declaredAreaHa) {
      areaGapNote = `No mapped boundary yet (declared ${declaredAreaHa.toFixed(1)} ha).`;
    } else if (hasBoundary && declaredAreaHa && Math.abs(mappedAreaHa - declaredAreaHa) > Math.max(2, declaredAreaHa * 0.08)) {
      areaGapNote = `Mapped area (${mappedAreaHa.toFixed(1)} ha) differs from declared area (${declaredAreaHa.toFixed(1)} ha).`;
    }

    return {
      id,
      name: mf?.name || meta.name || 'Unnamed Farm',
      primaryCrop: mf?.crop ?? meta.primaryCrop ?? null,
      locationLabel: mf?.locationLabel || meta.locationLabel || 'Location not set',
      regionLabel: meta.regionLabel || mf?.locationLabel || 'Unspecified',
      country: meta.country || 'Unspecified',
      timezone: meta.timezone || 'UTC',
      centroid: mf?.centroid || meta.centroid || null,
      geometry: mf?.geometry || null,
      areaUnit: meta.areaUnit || 'hectares',
      declaredAreaHa,
      mappedAreaHa,
      perimeterM: mf?.perimeterM ?? 0,
      hasBoundary,
      areaGapNote,
      hasFieldOverlapWarning: overlapPairs.length > 0,
      overlapWarningDetail:
        overlapPairs.length > 0
          ? `Overlapping field polygons detected between ${overlapPairs.join(', ')}. Review vertices; areas are flagged until adjusted.`
          : null,
      isPrivate: meta.isPrivate !== false,
      isDraft: Boolean(meta.isDraft),
      archivedAt: meta.archivedAt ?? null,
      notes: mf?.notes || meta.notes || '',
      versionNumber: Math.max(mf?.versionNumber ?? 1, meta.versionNumber ?? 1),
      activePlan: meta.activePlan ?? null,
      recommendedPlanId: meta.recommendedPlanId ?? null,
      recommendedPlanTitle: meta.recommendedPlanTitle ?? null,
      soil: meta.soil,
      water: meta.water,
      planningHorizon: meta.planningHorizon || '',
      priorities: meta.priorities || [],
      challenges: meta.challenges || [],
      lastAssessedAt: meta.lastAssessedAt ?? (mf?.assessment?.score !== null ? mf?.assessment?.assessedAt : null) ?? null,
      suitabilityScore: meta.suitabilityScore ?? mf?.assessment?.score ?? null,
      mapHealthStatus: mf?.healthStatus ?? 'no_data',
      mapExplanation: mf?.assessment?.explanation ?? '',
      createdAt: mf?.createdAt || meta.createdAt,
      updatedAt: mf?.updatedAt || meta.updatedAt,
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  const fields = maps.fields.map((f) => {
    const fm = port.fieldMeta[f.id];
    return {
      ...f,
      previousCrops: fm?.previousCrops ?? [],
      soilOverrides: fm?.soilOverrides ?? undefined,
      waterOverrides: fm?.waterOverrides ?? undefined,
      activePlanId: fm?.activePlanId ?? null,
      activePlanTitle: fm?.activePlanTitle ?? null,
      rotationReviewDue: fm?.rotationReviewDue ?? false,
      activeAlertsCount: fm?.activeAlertsCount ?? (f.status === 'Needs Review' ? 1 : 0),
      criticalAlert: fm?.criticalAlert ?? null,
      lastAssessedAt: fm?.lastAssessedAt ?? f.updatedAt,
      notes: fm?.notes ?? '',
    };
  });

  return {
    farms: rawFarms,
    fields,
    decisions: port.decisions,
    observations: port.observations,
    tasks: port.tasks,
    irrigationLogs: port.irrigationLogs,
    snapshots: port.snapshots,
    serverTimestamp: new Date().toISOString(),
  };
}

export function createMyFarmsRouter(): express.Router {
  const router = express.Router();

  // 1. Unified portfolio read
  router.get('/portfolio', (_req, res) => {
    res.json(buildUnifiedPortfolioPayload());
  });

  // 2. Create farm (supports both unmapped draft/shell and mapped polygon farm, with optional idempotency key)
  router.post('/farms', (req, res) => {
    const schema = z.object({
      operationId: z.string().optional(),
      name: z.string().trim().min(1, 'Farm name is required').max(150),
      primaryCrop: z.string().trim().max(100).nullable().optional(),
      locationLabel: z.string().trim().max(255).optional().default(''),
      regionLabel: z.string().trim().max(150).optional().default(''),
      country: z.string().trim().max(100).optional().default('Unspecified'),
      timezone: z.string().trim().max(80).optional().default('UTC'),
      centroid: z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }).nullable().optional(),
      geometry: z
        .object({
          type: z.literal('Polygon'),
          coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(1),
        })
        .nullable()
        .optional(),
      declaredAreaHa: z.number().nonnegative().nullable().optional(),
      areaUnit: z.enum(['acres', 'hectares']).optional().default('hectares'),
      isDraft: z.boolean().optional().default(false),
      notes: z.string().max(1000).optional().default(''),
      soil: z.record(z.string(), z.unknown()).optional(),
      water: z.record(z.string(), z.unknown()).optional(),
      initialFieldName: z.string().trim().max(100).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid farm creation payload.' });
      return;
    }

    const port = readPortfolioStore();
    const maps = readMapsStore();

    if (parsed.data.operationId && port.appliedOpIds.includes(parsed.data.operationId)) {
      res.json(buildUnifiedPortfolioPayload());
      return;
    }

    const d = parsed.data;
    const now = new Date().toISOString();
    const farmId = `farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    let measuredPoly: ReturnType<typeof validateAndMeasurePolygon> | null = null;
    if (d.geometry) {
      measuredPoly = validateAndMeasurePolygon(d.geometry as GeoJsonPolygon);
      if (!measuredPoly.ok) {
        res.status(422).json({ error: measuredPoly.error });
        return;
      }
    }

    const effectiveCentroid = measuredPoly?.ok ? measuredPoly.centroid : d.centroid ?? null;
    const effectiveLocation =
      d.locationLabel.trim() ||
      (effectiveCentroid ? `${effectiveCentroid.lat.toFixed(3)}°, ${effectiveCentroid.lon.toFixed(3)}°` : 'Location not set');

    // Sync to maps store ONLY if boundary exists (preserves Maps spatial index assumptions)
    if (measuredPoly?.ok) {
      const mapFarm: StoredMapFarm = {
        id: farmId,
        name: d.name,
        crop: d.primaryCrop ?? null,
        locationLabel: effectiveLocation,
        notes: d.notes || undefined,
        geometry: measuredPoly.normalized,
        areaM2: Math.round(measuredPoly.netAreaHectares * 10000),
        areaHa: measuredPoly.netAreaHectares,
        perimeterM: measuredPoly.perimeterM,
        centroid: measuredPoly.centroid,
        labelPoint: measuredPoly.centroid,
        healthStatus: 'no_data',
        assessment: {
          farmId,
          status: 'no_data',
          score: null,
          assessedAt: now,
          assessmentVersion: 'power-eonet-v2',
          confidence: 0,
          explanation: 'Newly added farm; awaiting climate and soil assessment.',
        },
        versionNumber: 1,
        boundaryHistory: [
          {
            versionNumber: 1,
            geometry: measuredPoly.normalized,
            areaM2: Math.round(measuredPoly.netAreaHectares * 10000),
            changedAt: now,
            changeReason: 'Created from My Farms',
          },
        ],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      maps.farms = [mapFarm, ...maps.farms];

      if (d.initialFieldName) {
        const fieldId = `field-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
        const verId = `${fieldId}-v1`;
        maps.fields = [
          {
            id: fieldId,
            farmId,
            name: d.initialFieldName,
            cropId: d.primaryCrop ? d.primaryCrop.toLowerCase() : undefined,
            cropName: d.primaryCrop || undefined,
            status: 'Active',
            currentVersionId: verId,
            versions: [
              {
                geometryVersionId: verId,
                versionNumber: 1,
                createdAt: now,
                source: 'drawn',
                crs: 'EPSG:4326',
                areaMethod: 'WGS84 Spherical Excess (Chamberlain-Duquette)',
                grossAreaHectares: measuredPoly.grossAreaHectares,
                netAreaHectares: measuredPoly.netAreaHectares,
                excludedAreaHectares: measuredPoly.excludedAreaHectares,
                perimeterM: measuredPoly.perimeterM,
                centroid: measuredPoly.centroid,
                geometry: measuredPoly.normalized,
                editReason: 'Initial field created during onboarding',
              },
            ],
            staleCalculations: [],
            updatedAt: now,
          },
          ...maps.fields,
        ];
      }
      writeMapsStore(maps);
    }

    const sIn = (d.soil ?? {}) as Partial<FarmMetaExtension['soil']>;
    const wIn = (d.water ?? {}) as Partial<FarmMetaExtension['water']>;

    port.farmMeta[farmId] = {
      farmId,
      name: d.name,
      primaryCrop: d.primaryCrop ?? null,
      locationLabel: effectiveLocation,
      regionLabel: d.regionLabel || effectiveLocation,
      country: d.country || 'Unspecified',
      timezone: d.timezone || 'UTC',
      centroid: effectiveCentroid,
      areaUnit: d.areaUnit,
      declaredAreaHa: d.declaredAreaHa ?? (measuredPoly?.ok ? measuredPoly.netAreaHectares : null),
      isPrivate: true, // Privacy guard: private by default
      isDraft: d.isDraft,
      archivedAt: null,
      versionNumber: 1,
      notes: d.notes || '',
      activePlan: null,
      recommendedPlanId: null,
      recommendedPlanTitle: null,
      soil: {
        texture: typeof sIn.texture === 'string' && sIn.texture ? sIn.texture : 'Unknown',
        moistureStatus: sIn.moistureStatus ?? 'unknown',
        moisturePct: typeof sIn.moisturePct === 'number' ? sIn.moisturePct : null,
        moistureMethod: sIn.moistureMethod ?? '',
        moistureDate: sIn.moistureDate ?? '',
        phStatus: sIn.phStatus ?? 'not_tested',
        phValue: typeof sIn.phValue === 'number' && Number.isFinite(sIn.phValue) ? sIn.phValue : null,
        bufferPh: typeof sIn.bufferPh === 'number' && Number.isFinite(sIn.bufferPh) ? sIn.bufferPh : null,
        phTestDate: sIn.phTestDate ?? '',
        organicMatterPct: typeof sIn.organicMatterPct === 'number' ? sIn.organicMatterPct : null,
        drainage: typeof sIn.drainage === 'string' && sIn.drainage ? sIn.drainage : 'Unknown',
        slopePct: typeof sIn.slopePct === 'number' ? sIn.slopePct : null,
        elevationM: typeof sIn.elevationM === 'number' ? sIn.elevationM : null,
        preparationMethods: Array.isArray(sIn.preparationMethods) ? (sIn.preparationMethods as string[]) : [],
        notes: typeof sIn.notes === 'string' ? sIn.notes : '',
      },
      water: {
        sources: Array.isArray(wIn.sources) && wIn.sources.length > 0 ? (wIn.sources as string[]) : ['Unknown'],
        reliability: typeof wIn.reliability === 'string' && wIn.reliability ? wIn.reliability : 'Unknown',
        dailyCapacityKnown: Boolean(wIn.dailyCapacityKnown),
        dailyCapacityM3: typeof wIn.dailyCapacityM3 === 'number' ? wIn.dailyCapacityM3 : null,
        qualityTested: typeof wIn.qualityTested === 'string' ? wIn.qualityTested : 'Unknown',
        ecDsM: typeof wIn.ecDsM === 'number' ? wIn.ecDsM : null,
        salinityPpm: typeof wIn.salinityPpm === 'number' ? wIn.salinityPpm : null,
        qualityTestDate: typeof wIn.qualityTestDate === 'string' ? wIn.qualityTestDate : '',
        wateringMethod: typeof wIn.wateringMethod === 'string' ? wIn.wateringMethod : '',
        irrigationMethod: typeof wIn.irrigationMethod === 'string' ? wIn.irrigationMethod : 'Unknown',
        irrigationFrequency: typeof wIn.irrigationFrequency === 'string' ? wIn.irrigationFrequency : 'Unknown',
        rainfallFrequency: typeof wIn.rainfallFrequency === 'string' ? wIn.rainfallFrequency : 'Unknown',
        estimatedDailyDemandM3: typeof wIn.estimatedDailyDemandM3 === 'number' ? wIn.estimatedDailyDemandM3 : null,
        demandAssumptionNote: typeof wIn.demandAssumptionNote === 'string' ? wIn.demandAssumptionNote : '',
      },
      planningHorizon: '',
      priorities: [],
      challenges: [],
      lastAssessedAt: null,
      suitabilityScore: null,
      createdAt: now,
      updatedAt: now,
    };

    if (d.operationId) {
      port.appliedOpIds.push(d.operationId);
    }
    writePortfolioStore(port);

    const payload = buildUnifiedPortfolioPayload();
    const created = payload.farms.find((f) => f.id === farmId);
    res.status(201).json({ farm: created, portfolio: payload });
  });

  // 3. Patch farm metadata, archive state, soil, water, boundary, or optimistic version check
  router.patch('/farms/:farmId', (req, res) => {
    const farmId = req.params.farmId;
    const schema = z.object({
      operationId: z.string().optional(),
      expectedVersion: z.number().int().positive().optional(),
      forceOverwrite: z.boolean().optional(),
      name: z.string().trim().min(1).max(150).optional(),
      primaryCrop: z.string().trim().max(100).nullable().optional(),
      locationLabel: z.string().trim().max(255).optional(),
      regionLabel: z.string().trim().max(150).optional(),
      country: z.string().trim().max(100).optional(),
      timezone: z.string().trim().max(80).optional(),
      centroid: z.object({ lat: z.number(), lon: z.number() }).nullable().optional(),
      declaredAreaHa: z.number().nonnegative().nullable().optional(),
      areaUnit: z.enum(['acres', 'hectares']).optional(),
      archived: z.boolean().optional(),
      isDraft: z.boolean().optional(),
      notes: z.string().max(1000).optional(),
      soil: z.record(z.string(), z.unknown()).optional(),
      water: z.record(z.string(), z.unknown()).optional(),
      planningHorizon: z.string().optional(),
      priorities: z.array(z.string()).optional(),
      challenges: z.array(z.string()).optional(),
      recommendedPlanId: z.string().nullable().optional(),
      recommendedPlanTitle: z.string().nullable().optional(),
      lastAssessedAt: z.string().nullable().optional(),
      suitabilityScore: z.number().min(0).max(100).nullable().optional(),
      geometry: z
        .object({
          type: z.literal('Polygon'),
          coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(1),
        })
        .optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid farm update payload.' });
      return;
    }

    const maps = readMapsStore();
    const port = readPortfolioStore();
    if (parsed.data.operationId && port.appliedOpIds.includes(parsed.data.operationId)) {
      res.json(buildUnifiedPortfolioPayload());
      return;
    }

    const mapIdx = maps.farms.findIndex((f) => f.id === farmId && !f.deletedAt);
    const existingMap = mapIdx >= 0 ? maps.farms[mapIdx] : null;
    const existingMeta = port.farmMeta[farmId] ?? (existingMap ? defaultMetaForMapFarm(existingMap) : null);
    if (!existingMeta || existingMeta.deletedAt) {
      res.status(404).json({ error: 'Farm not found.' });
      return;
    }

    const currentVersion = Math.max(existingMap?.versionNumber ?? 1, existingMeta.versionNumber ?? 1);
    if (
      parsed.data.expectedVersion !== undefined &&
      !parsed.data.forceOverwrite &&
      parsed.data.expectedVersion !== currentVersion
    ) {
      const snapshot = buildUnifiedPortfolioPayload().farms.find((f) => f.id === farmId) ?? null;
      res.status(409).json({
        error: `Conflict: "${existingMap?.name || existingMeta.name}" was updated (server v${currentVersion} vs local base v${parsed.data.expectedVersion}).`,
        conflict: {
          serverVersion: currentVersion,
          serverFarm: snapshot,
        },
      });
      return;
    }

    const d = parsed.data;
    const now = new Date().toISOString();
    const nextVersion = currentVersion + 1;

    let measuredPoly: ReturnType<typeof validateAndMeasurePolygon> | null = null;
    if (d.geometry) {
      measuredPoly = validateAndMeasurePolygon(d.geometry as GeoJsonPolygon);
      if (!measuredPoly.ok) {
        res.status(422).json({ error: measuredPoly.error });
        return;
      }
    }

    // Rename uniqueness check (non-deleted sibling check)
    if (d.name) {
      const normalizedTarget = d.name.trim().toLowerCase();
      const duplicate = buildUnifiedPortfolioPayload().farms.find(
        (f) => f.id !== farmId && f.name.trim().toLowerCase() === normalizedTarget
      );
      if (duplicate) {
        res.status(409).json({ error: `A farm named "${duplicate.name}" already exists in your portfolio.` });
        return;
      }
    }

    const nextMeta: FarmMetaExtension = {
      ...existingMeta,
      name: d.name ?? existingMeta.name ?? existingMap?.name,
      primaryCrop: d.primaryCrop !== undefined ? d.primaryCrop : existingMeta.primaryCrop,
      locationLabel: d.locationLabel ?? existingMeta.locationLabel ?? existingMap?.locationLabel,
      regionLabel: d.regionLabel ?? existingMeta.regionLabel,
      country: d.country ?? existingMeta.country,
      timezone: d.timezone ?? existingMeta.timezone,
      centroid: measuredPoly?.ok ? measuredPoly.centroid : d.centroid !== undefined ? d.centroid : existingMeta.centroid,
      declaredAreaHa: d.declaredAreaHa !== undefined ? d.declaredAreaHa : existingMeta.declaredAreaHa,
      areaUnit: d.areaUnit ?? existingMeta.areaUnit,
      archivedAt: d.archived === undefined ? existingMeta.archivedAt : d.archived ? now : null,
      isDraft: d.isDraft !== undefined ? d.isDraft : existingMeta.isDraft,
      notes: d.notes !== undefined ? d.notes : existingMeta.notes,
      soil: d.soil ? { ...existingMeta.soil, ...d.soil } : existingMeta.soil,
      water: d.water ? { ...existingMeta.water, ...d.water } : existingMeta.water,
      planningHorizon: d.planningHorizon ?? existingMeta.planningHorizon,
      priorities: d.priorities ?? existingMeta.priorities,
      challenges: d.challenges ?? existingMeta.challenges,
      recommendedPlanId: d.recommendedPlanId !== undefined ? d.recommendedPlanId : existingMeta.recommendedPlanId,
      recommendedPlanTitle:
        d.recommendedPlanTitle !== undefined ? d.recommendedPlanTitle : existingMeta.recommendedPlanTitle,
      lastAssessedAt: d.lastAssessedAt !== undefined ? d.lastAssessedAt : existingMeta.lastAssessedAt,
      suitabilityScore: d.suitabilityScore !== undefined ? d.suitabilityScore : existingMeta.suitabilityScore,
      versionNumber: nextVersion,
      updatedAt: now,
    };

    port.farmMeta[farmId] = nextMeta;

    if (existingMap) {
      const updatedMap: StoredMapFarm = {
        ...existingMap,
        name: d.name ?? existingMap.name,
        crop: d.primaryCrop !== undefined ? d.primaryCrop : existingMap.crop,
        locationLabel: d.locationLabel ?? existingMap.locationLabel,
        notes: d.notes !== undefined ? d.notes : existingMap.notes,
        versionNumber: nextVersion,
        updatedAt: now,
        ...(measuredPoly?.ok
          ? {
              geometry: measuredPoly.normalized,
              areaM2: Math.round(measuredPoly.netAreaHectares * 10000),
              areaHa: measuredPoly.netAreaHectares,
              perimeterM: measuredPoly.perimeterM,
              centroid: measuredPoly.centroid,
              labelPoint: measuredPoly.centroid,
              boundaryHistory: [
                {
                  versionNumber: nextVersion,
                  geometry: measuredPoly.normalized,
                  areaM2: Math.round(measuredPoly.netAreaHectares * 10000),
                  changedAt: now,
                  changeReason: 'Boundary updated from My Farms',
                },
                ...existingMap.boundaryHistory,
              ],
            }
          : {}),
        ...(d.suitabilityScore !== undefined
          ? {
              healthStatus:
                d.suitabilityScore === null
                  ? 'no_data'
                  : d.suitabilityScore >= 75
                    ? 'healthy'
                    : d.suitabilityScore >= 45
                      ? 'moderate'
                      : 'at_risk',
              assessment: {
                ...existingMap.assessment,
                score: d.suitabilityScore,
                assessedAt: d.lastAssessedAt || now,
              },
            }
          : {}),
      };
      maps.farms[mapIdx] = updatedMap;
      writeMapsStore(maps);
    } else if (measuredPoly?.ok) {
      // Farm previously had no boundary — register in maps store now that boundary was drawn
      const createdMap: StoredMapFarm = {
        id: farmId,
        name: nextMeta.name || 'Unnamed Farm',
        crop: nextMeta.primaryCrop ?? null,
        locationLabel: nextMeta.locationLabel || 'Location set',
        notes: nextMeta.notes || undefined,
        geometry: measuredPoly.normalized,
        areaM2: Math.round(measuredPoly.netAreaHectares * 10000),
        areaHa: measuredPoly.netAreaHectares,
        perimeterM: measuredPoly.perimeterM,
        centroid: measuredPoly.centroid,
        labelPoint: measuredPoly.centroid,
        healthStatus: 'no_data',
        assessment: {
          farmId,
          status: 'no_data',
          score: nextMeta.suitabilityScore ?? null,
          assessedAt: now,
          assessmentVersion: 'power-eonet-v2',
          confidence: 0,
        },
        versionNumber: nextVersion,
        boundaryHistory: [
          {
            versionNumber: nextVersion,
            geometry: measuredPoly.normalized,
            areaM2: Math.round(measuredPoly.netAreaHectares * 10000),
            changedAt: now,
            changeReason: 'Boundary added in My Farms',
          },
        ],
        createdAt: existingMeta.createdAt,
        updatedAt: now,
        deletedAt: null,
      };
      maps.farms = [createdMap, ...maps.farms];
      writeMapsStore(maps);
    }

    if (d.operationId) port.appliedOpIds.push(d.operationId);
    writePortfolioStore(port);

    const portfolio = buildUnifiedPortfolioPayload();
    const farm = portfolio.farms.find((f) => f.id === farmId);
    res.json({ farm, portfolio });
  });

  // 4. Duplicate farm configuration (explicit options for copying fields vs history)
  router.post('/farms/:farmId/duplicate', (req, res) => {
    const schema = z.object({
      newName: z.string().trim().min(1).max(150).optional(),
      includeFields: z.boolean().default(true),
      includeHistory: z.boolean().default(false),
    });
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid duplicate options.' });
      return;
    }

    const maps = readMapsStore();
    const port = readPortfolioStore();
    const sourceMap = maps.farms.find((f) => f.id === req.params.farmId && !f.deletedAt);
    const sourceMeta = port.farmMeta[req.params.farmId] ?? (sourceMap ? defaultMetaForMapFarm(sourceMap) : null);
    if (!sourceMeta || sourceMeta.deletedAt) {
      res.status(404).json({ error: 'Source farm not found.' });
      return;
    }

    const now = new Date().toISOString();
    const newId = `farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const baseName = parsed.data.newName || `${sourceMap?.name || sourceMeta.name} (Copy)`;

    if (sourceMap) {
      maps.farms = [
        {
          ...JSON.parse(JSON.stringify(sourceMap)),
          id: newId,
          name: baseName,
          versionNumber: 1,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
        ...maps.farms,
      ];
    }

    if (parsed.data.includeFields) {
      const sourceFields = maps.fields.filter((f) => f.farmId === req.params.farmId);
      for (const sf of sourceFields) {
        const nfId = `field-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        maps.fields = [
          {
            ...JSON.parse(JSON.stringify(sf)),
            id: nfId,
            farmId: newId,
            updatedAt: now,
          },
          ...maps.fields,
        ];
      }
    }
    writeMapsStore(maps);

    port.farmMeta[newId] = {
      ...JSON.parse(JSON.stringify(sourceMeta)),
      farmId: newId,
      name: baseName,
      versionNumber: 1,
      archivedAt: null,
      isDraft: false,
      activePlan: parsed.data.includeHistory ? sourceMeta.activePlan : null,
      lastAssessedAt: parsed.data.includeHistory ? sourceMeta.lastAssessedAt : null,
      suitabilityScore: parsed.data.includeHistory ? sourceMeta.suitabilityScore : null,
      createdAt: now,
      updatedAt: now,
    };

    if (parsed.data.includeHistory) {
      const copiedDecisions = port.decisions
        .filter((d) => d.farmId === req.params.farmId)
        .map((d) => ({ ...d, id: `dec-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, farmId: newId }));
      port.decisions.push(...copiedDecisions);
    }

    writePortfolioStore(port);
    const portfolio = buildUnifiedPortfolioPayload();
    res.status(201).json({
      farm: portfolio.farms.find((f) => f.id === newId),
      portfolio,
    });
  });

  // 5. Cascade Delete Farm & return exact removed counts
  router.delete('/farms/:farmId', (req, res) => {
    const farmId = req.params.farmId;
    const maps = readMapsStore();
    const port = readPortfolioStore();

    const mapIdx = maps.farms.findIndex((f) => f.id === farmId && !f.deletedAt);
    const meta = port.farmMeta[farmId];
    if (mapIdx < 0 && (!meta || meta.deletedAt)) {
      res.status(404).json({ error: 'Farm not found.' });
      return;
    }

    if (mapIdx >= 0) {
      maps.farms[mapIdx] = { ...maps.farms[mapIdx], deletedAt: new Date().toISOString() };
    }
    const ownedFields = maps.fields.filter((f) => f.farmId === farmId);
    maps.fields = maps.fields.filter((f) => f.farmId !== farmId);
    writeMapsStore(maps);

    if (port.farmMeta[farmId]) {
      delete port.farmMeta[farmId];
    }
    const decBefore = port.decisions.length;
    port.decisions = port.decisions.filter((d) => d.farmId !== farmId);
    const obsBefore = port.observations.length;
    port.observations = port.observations.filter((o) => o.farmId !== farmId);
    const tasksBefore = port.tasks.length;
    port.tasks = port.tasks.filter((t) => t.farmId !== farmId);
    const irrBefore = port.irrigationLogs.length;
    port.irrigationLogs = port.irrigationLogs.filter((l) => l.farmId !== farmId);
    const snapsBefore = port.snapshots.length;
    port.snapshots = port.snapshots.filter((s) => s.farmId !== farmId);
    writePortfolioStore(port);

    res.json({
      deletedFarmId: farmId,
      removedCounts: {
        fields: ownedFields.length,
        decisions: decBefore - port.decisions.length,
        observations: obsBefore - port.observations.length,
        tasks: tasksBefore - port.tasks.length,
        irrigationLogs: irrBefore - port.irrigationLogs.length,
        snapshots: snapsBefore - port.snapshots.length,
      },
    });
  });

  // 6. Field management (patch agronomic overrides / crop / status / notes, boundary PUT with overlap check)
  router.post('/fields', (req, res) => {
    const schema = z.object({
      operationId: z.string().optional(),
      farmId: z.string().min(1),
      name: z.string().trim().min(1).max(100),
      cropId: z.string().optional(),
      cropName: z.string().optional(),
      soilSummary: z.string().optional(),
      waterSummary: z.string().optional(),
      status: z.enum(['Active', 'Planned', 'Fallow', 'Needs Review']).default('Active'),
      previousCrops: z.array(z.string()).optional(),
      notes: z.string().optional(),
      geometry: z.object({
        type: z.literal('Polygon'),
        coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(1),
      }),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid field payload.' });
      return;
    }

    const measured = validateAndMeasurePolygon(parsed.data.geometry as GeoJsonPolygon);
    if (!measured.ok) {
      res.status(422).json({ error: measured.error });
      return;
    }

    const maps = readMapsStore();
    const port = readPortfolioStore();
    if (parsed.data.operationId && port.appliedOpIds.includes(parsed.data.operationId)) {
      res.json(buildUnifiedPortfolioPayload());
      return;
    }

    // Warn on sibling field overlap without mutating user geometry
    const siblingOverlaps: string[] = [];
    for (const sib of maps.fields.filter((f) => f.farmId === parsed.data.farmId)) {
      const sr = sib.versions[0]?.geometry?.coordinates?.[0];
      if (sr && ringsOverlap(sr, measured.normalized.coordinates[0])) {
        siblingOverlaps.push(sib.name);
      }
    }

    const now = new Date().toISOString();
    const fieldId = `field-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const versionId = `${fieldId}-v1`;

    const fieldRecord: StoredMapField = {
      id: fieldId,
      farmId: parsed.data.farmId,
      name: parsed.data.name,
      cropId: parsed.data.cropId,
      cropName: parsed.data.cropName,
      soilSummary: parsed.data.soilSummary,
      waterSummary: parsed.data.waterSummary,
      status: parsed.data.status,
      currentVersionId: versionId,
      versions: [
        {
          geometryVersionId: versionId,
          versionNumber: 1,
          createdAt: now,
          source: 'drawn',
          crs: 'EPSG:4326',
          areaMethod: 'WGS84 Spherical Excess (Chamberlain-Duquette)',
          grossAreaHectares: measured.grossAreaHectares,
          netAreaHectares: measured.netAreaHectares,
          excludedAreaHectares: measured.excludedAreaHectares,
          perimeterM: measured.perimeterM,
          centroid: measured.centroid,
          geometry: measured.normalized,
          editReason: 'Created in My Farms Fields workspace',
        },
      ],
      staleCalculations: ['Climate & Water Budget (run fresh assessment for new field)'],
      updatedAt: now,
    };

    maps.fields = [fieldRecord, ...maps.fields];
    writeMapsStore(maps);

    port.fieldMeta[fieldId] = {
      fieldId,
      previousCrops: parsed.data.previousCrops ?? [],
      rotationReviewDue: false,
      activeAlertsCount: siblingOverlaps.length > 0 ? 1 : 0,
      lastAssessedAt: null,
      notes: parsed.data.notes ?? '',
    };
    if (parsed.data.operationId) port.appliedOpIds.push(parsed.data.operationId);
    writePortfolioStore(port);

    const payload = buildUnifiedPortfolioPayload();
    res.status(201).json({
      field: payload.fields.find((f) => f.id === fieldId),
      overlapWarning:
        siblingOverlaps.length > 0
          ? `This boundary overlaps sibling field(s): ${siblingOverlaps.join(', ')}. Review boundaries to avoid double-counted acreage.`
          : null,
      portfolio: payload,
    });
  });

  router.patch('/fields/:fieldId', (req, res) => {
    const schema = z.object({
      name: z.string().trim().min(1).max(100).optional(),
      cropId: z.string().optional(),
      cropName: z.string().optional(),
      status: z.enum(['Active', 'Planned', 'Fallow', 'Needs Review']).optional(),
      soilSummary: z.string().optional(),
      waterSummary: z.string().optional(),
      previousCrops: z.array(z.string()).optional(),
      soilOverrides: z.record(z.string(), z.unknown()).optional(),
      waterOverrides: z.record(z.string(), z.unknown()).optional(),
      rotationReviewDue: z.boolean().optional(),
      notes: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid field update.' });
      return;
    }

    const maps = readMapsStore();
    const port = readPortfolioStore();
    const idx = maps.fields.findIndex((f) => f.id === req.params.fieldId);
    if (idx < 0) {
      res.status(404).json({ error: 'Field not found.' });
      return;
    }

    const d = parsed.data;
    const now = new Date().toISOString();
    maps.fields[idx] = {
      ...maps.fields[idx],
      name: d.name ?? maps.fields[idx].name,
      cropId: d.cropId !== undefined ? d.cropId : maps.fields[idx].cropId,
      cropName: d.cropName !== undefined ? d.cropName : maps.fields[idx].cropName,
      status: d.status ?? maps.fields[idx].status,
      soilSummary: d.soilSummary !== undefined ? d.soilSummary : maps.fields[idx].soilSummary,
      waterSummary: d.waterSummary !== undefined ? d.waterSummary : maps.fields[idx].waterSummary,
      updatedAt: now,
    };
    writeMapsStore(maps);

    const existingFm = port.fieldMeta[req.params.fieldId] ?? {
      fieldId: req.params.fieldId,
      previousCrops: [],
      rotationReviewDue: false,
      activeAlertsCount: 0,
      lastAssessedAt: now,
    };
    port.fieldMeta[req.params.fieldId] = {
      ...existingFm,
      previousCrops: d.previousCrops ?? existingFm.previousCrops,
      soilOverrides: d.soilOverrides ?? existingFm.soilOverrides,
      waterOverrides: d.waterOverrides ?? existingFm.waterOverrides,
      rotationReviewDue: d.rotationReviewDue ?? existingFm.rotationReviewDue,
      notes: d.notes ?? existingFm.notes,
    };
    writePortfolioStore(port);

    res.json({ portfolio: buildUnifiedPortfolioPayload() });
  });

  // 7. Append-Only Rotation Decision Journal
  router.post('/farms/:farmId/decisions', (req, res) => {
    const schema = z.object({
      operationId: z.string().optional(),
      fieldId: z.string().nullable().optional(),
      fieldName: z.string().nullable().optional(),
      action: z.enum(['selected', 'rejected', 'deferred', 'replaced']),
      candidateId: z.string().min(1),
      candidateTitle: z.string().min(1),
      candidateScoreSnapshot: z.number().nullable().optional(),
      candidateCrops: z.array(
        z.object({
          cropId: z.string(),
          cropName: z.string(),
          cycleLabel: z.string(),
        })
      ),
      isRecommendedPlan: z.boolean().default(false),
      reasonCode: z.enum([
        'water',
        'cost',
        'equipment',
        'market',
        'management_preference',
        'unavailable_crop',
        'agronomic_fit',
        'other',
      ]),
      reasonNote: z.string().max(600).default(''),
      actor: z.string().max(80).default('Farm Manager'),
      sourceReportId: z.string().nullable().optional(),
      sourceReportDate: z.string().nullable().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid decision payload.' });
      return;
    }

    const port = readPortfolioStore();
    if (parsed.data.operationId && port.appliedOpIds.includes(parsed.data.operationId)) {
      res.json(buildUnifiedPortfolioPayload());
      return;
    }

    const d = parsed.data;
    const farmMeta = port.farmMeta[req.params.farmId];
    if (!farmMeta) {
      res.status(404).json({ error: 'Farm metadata not found.' });
      return;
    }

    const now = new Date().toISOString();
    const priorPlanSnapshot = farmMeta.activePlan
      ? {
          planId: farmMeta.activePlan.planId,
          title: farmMeta.activePlan.title,
          version: farmMeta.activePlan.version,
          crops: farmMeta.activePlan.cropSequence,
        }
      : null;

    let newPlanSnapshot: {
      planId: string;
      title: string;
      version: number;
      crops: Array<{ cropId: string; cropName: string; cycleLabel: string }>;
    } | null = null;

    if (d.action === 'selected' || d.action === 'replaced') {
      const nextVersion = (farmMeta.activePlan?.version ?? 0) + 1;
      newPlanSnapshot = {
        planId: d.candidateId,
        title: d.candidateTitle,
        version: nextVersion,
        crops: d.candidateCrops,
      };
      farmMeta.activePlan = {
        planId: d.candidateId,
        title: d.candidateTitle,
        version: nextVersion,
        selectedAt: now,
        selectedBy: d.actor,
        cropSequence: d.candidateCrops,
        isRecommendedPlan: d.isRecommendedPlan,
      };
      farmMeta.updatedAt = now;
    }

    const eventRecord = {
      id: `dec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      farmId: req.params.farmId,
      fieldId: d.fieldId ?? null,
      fieldName: d.fieldName ?? 'Whole Farm',
      timestamp: now,
      actor: d.actor,
      action: d.action,
      candidateId: d.candidateId,
      candidateTitle: d.candidateTitle,
      candidateScoreSnapshot: d.candidateScoreSnapshot ?? null,
      priorPlan: priorPlanSnapshot,
      newPlan: newPlanSnapshot,
      reasonCode: d.reasonCode,
      reasonNote: d.reasonNote.trim(),
      sourceReportId: d.sourceReportId ?? null,
      sourceReportDate: d.sourceReportDate ?? null,
    };

    port.decisions = [eventRecord, ...port.decisions];
    if (d.operationId) port.appliedOpIds.push(d.operationId);
    writePortfolioStore(port);

    res.status(201).json({ event: eventRecord, portfolio: buildUnifiedPortfolioPayload() });
  });

  // 8. Observations, Tasks, Irrigation Logs, Past Analysis Snapshots
  router.post('/farms/:farmId/observations', (req, res) => {
    const schema = z.object({
      operationId: z.string().optional(),
      fieldId: z.string().nullable().optional(),
      fieldName: z.string().nullable().optional(),
      category: z.enum(['scouting', 'soil_lab', 'pest_disease', 'weather_impact', 'management']),
      title: z.string().trim().min(1).max(150),
      detail: z.string().trim().min(1).max(1000),
      observedAt: z.string().min(4),
      provenance: z.enum(['Measured', 'Reported', 'Estimated', 'Unknown']).default('Reported'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid observation.' });
      return;
    }
    const port = readPortfolioStore();
    if (parsed.data.operationId && port.appliedOpIds.includes(parsed.data.operationId)) {
      res.json(buildUnifiedPortfolioPayload());
      return;
    }
    const rec = {
      id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      farmId: req.params.farmId,
      ...parsed.data,
      createdAt: new Date().toISOString(),
    };
    port.observations = [rec, ...port.observations];
    if (parsed.data.operationId) port.appliedOpIds.push(parsed.data.operationId);
    writePortfolioStore(port);
    res.status(201).json({ observation: rec, portfolio: buildUnifiedPortfolioPayload() });
  });

  router.delete('/observations/:id', (req, res) => {
    const port = readPortfolioStore();
    port.observations = port.observations.filter((o) => o.id !== req.params.id);
    writePortfolioStore(port);
    res.json({ deletedId: req.params.id, portfolio: buildUnifiedPortfolioPayload() });
  });

  router.post('/farms/:farmId/tasks', (req, res) => {
    const schema = z.object({
      operationId: z.string().optional(),
      fieldId: z.string().nullable().optional(),
      fieldName: z.string().nullable().optional(),
      title: z.string().trim().min(1).max(180),
      category: z.enum(['irrigation', 'soil', 'planting', 'scouting', 'rotation']),
      dueDate: z.string().nullable().optional(),
      priority: z.enum(['high', 'normal', 'low']).default('normal'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid task.' });
      return;
    }
    const port = readPortfolioStore();
    if (parsed.data.operationId && port.appliedOpIds.includes(parsed.data.operationId)) {
      res.json(buildUnifiedPortfolioPayload());
      return;
    }
    const rec = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      farmId: req.params.farmId,
      fieldId: parsed.data.fieldId ?? null,
      fieldName: parsed.data.fieldName ?? 'Whole Farm',
      title: parsed.data.title,
      category: parsed.data.category,
      dueDate: parsed.data.dueDate ?? null,
      priority: parsed.data.priority,
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
    };
    port.tasks = [rec, ...port.tasks];
    if (parsed.data.operationId) port.appliedOpIds.push(parsed.data.operationId);
    writePortfolioStore(port);
    res.status(201).json({ task: rec, portfolio: buildUnifiedPortfolioPayload() });
  });

  router.patch('/tasks/:id', (req, res) => {
    const port = readPortfolioStore();
    const idx = port.tasks.findIndex((t) => t.id === req.params.id);
    if (idx < 0) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }
    const nextCompleted = Boolean(req.body?.completed);
    port.tasks[idx] = {
      ...port.tasks[idx],
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : null,
    };
    writePortfolioStore(port);
    res.json({ task: port.tasks[idx], portfolio: buildUnifiedPortfolioPayload() });
  });

  router.delete('/tasks/:id', (req, res) => {
    const port = readPortfolioStore();
    port.tasks = port.tasks.filter((t) => t.id !== req.params.id);
    writePortfolioStore(port);
    res.json({ deletedId: req.params.id, portfolio: buildUnifiedPortfolioPayload() });
  });

  router.post('/farms/:farmId/irrigation', (req, res) => {
    const schema = z.object({
      operationId: z.string().optional(),
      fieldId: z.string().nullable().optional(),
      fieldName: z.string().nullable().optional(),
      date: z.string().min(4),
      volumeM3: z.number().positive(),
      method: z.string().min(1),
      notes: z.string().max(400).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid irrigation date, volume (m³), and method required.' });
      return;
    }
    const port = readPortfolioStore();
    if (parsed.data.operationId && port.appliedOpIds.includes(parsed.data.operationId)) {
      res.json(buildUnifiedPortfolioPayload());
      return;
    }
    const rec = {
      id: `irr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      farmId: req.params.farmId,
      fieldId: parsed.data.fieldId ?? null,
      fieldName: parsed.data.fieldName ?? 'Whole Farm',
      date: parsed.data.date,
      volumeM3: parsed.data.volumeM3,
      method: parsed.data.method,
      notes: parsed.data.notes ?? '',
      createdAt: new Date().toISOString(),
    };
    port.irrigationLogs = [rec, ...port.irrigationLogs];
    if (parsed.data.operationId) port.appliedOpIds.push(parsed.data.operationId);
    writePortfolioStore(port);
    res.status(201).json({ irrigationLog: rec, portfolio: buildUnifiedPortfolioPayload() });
  });

  router.post('/farms/:farmId/snapshots', (req, res) => {
    const validation = validateSnapshotPayload(req.body);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error, issues: validation.issues });
      return;
    }

    const farmId = req.params.farmId;
    const maps = readMapsStore();
    const port = readPortfolioStore();
    const mapFarm = maps.farms.find((f) => f.id === farmId && !f.deletedAt) ?? null;
    const existingMeta = port.farmMeta[farmId] && !port.farmMeta[farmId].deletedAt ? port.farmMeta[farmId] : null;
    if (!mapFarm && !existingMeta) {
      res.status(404).json({ error: 'Farm not found.' });
      return;
    }

    const d = validation.data;
    if (d.operationId && port.appliedOpIds.includes(d.operationId)) {
      res.json(buildUnifiedPortfolioPayload());
      return;
    }

    const generatedAt = new Date().toISOString();
    const snap: Record<string, unknown> = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      farmId,
      fieldId: d.fieldId ?? null,
      fieldName: d.fieldName,
      generatedAt,
      modelVersion: d.modelVersion,
      triggerReason: d.triggerReason,
      suitabilityScore: d.suitabilityScore,
      confidencePct: d.confidencePct,
      completenessPct: d.completenessPct,
      weatherWindowSummary: d.weatherWindowSummary,
      dataAvailability: d.dataAvailability,
      keyMetrics: d.keyMetrics,
      ...(d.observations && d.observations.length > 0 ? { observations: d.observations } : {}),
      recommendations: d.recommendations,
    };

    // Prepend new immutable snapshot without mutating any previously saved snapshots
    port.snapshots = [snap, ...port.snapshots];
    const meta = existingMeta ?? (mapFarm ? defaultMetaForMapFarm(mapFarm) : null);
    if (meta) {
      meta.lastAssessedAt = generatedAt;
      if (typeof d.suitabilityScore === 'number' && Number.isFinite(d.suitabilityScore)) {
        meta.suitabilityScore = d.suitabilityScore;
      }
      meta.updatedAt = generatedAt;
      port.farmMeta[farmId] = meta;
    }
    if (d.operationId) port.appliedOpIds.push(d.operationId);
    writePortfolioStore(port);
    res.status(201).json({ snapshot: snap, portfolio: buildUnifiedPortfolioPayload() });
  });

  return router;
}
