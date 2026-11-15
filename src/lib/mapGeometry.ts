import {
  FarmGeoJsonGeometry,
  GeoJsonPolygonGeometry,
  GeometryValidationIssue,
  GeometryValidationResult,
  ImportedFeatureCandidate,
  LonLat,
  MapFieldRecord,
} from '../types/maps';

const EARTH_RADIUS_M = 6371008.8; // IUGG mean Earth radius (meters)
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export function isValidLonLat(pt: unknown): pt is LonLat {
  if (!Array.isArray(pt) || pt.length < 2) return false;
  const lon = Number(pt[0]);
  const lat = Number(pt[1]);
  return (
    Number.isFinite(lon) &&
    Number.isFinite(lat) &&
    lon >= -180 &&
    lon <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

/** Haversine distance in meters between two WGS84 [lon, lat] points */
export function haversineDistanceM(a: LonLat, b: LonLat): number {
  const lat1 = a[1] * DEG_TO_RAD;
  const lat2 = b[1] * DEG_TO_RAD;
  const dLat = (b[1] - a[1]) * DEG_TO_RAD;
  const dLon = (b[0] - a[0]) * DEG_TO_RAD;

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}

/**
 * Exact spherical-excess ring area (Chamberlain & Duquette, JPL, 2007) in square meters.
 * Never uses planar lat/lon degree arithmetic.
 */
export function computeRingGeodesicAreaM2(ring: LonLat[]): number {
  if (ring.length < 3) return 0;
  const closed = closeRing(ring);
  const n = closed.length - 1;
  if (n < 3) return 0;

  let total = 0;
  for (let i = 0; i < n; i++) {
    const p1 = closed[i];
    const p2 = closed[(i + 1) % n];
    const p3 = closed[(i + 2) % n];

    const lon1 = p1[0] * DEG_TO_RAD;
    const lon3 = p3[0] * DEG_TO_RAD;
    const lat2 = p2[1] * DEG_TO_RAD;
    total += (lon3 - lon1) * Math.sin(lat2);
  }
  return Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

export function computeRingPerimeterM(ring: LonLat[]): number {
  if (ring.length < 2) return 0;
  const closed = closeRing(ring);
  let total = 0;
  for (let i = 0; i < closed.length - 1; i++) {
    total += haversineDistanceM(closed[i], closed[i + 1]);
  }
  return total;
}

export function closeRing(ring: LonLat[]): LonLat[] {
  if (ring.length === 0) return [];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (Math.abs(first[0] - last[0]) < 1e-11 && Math.abs(first[1] - last[1]) < 1e-11) {
    return ring.map((p) => [Number(p[0]), Number(p[1])] as LonLat);
  }
  return [...ring.map((p) => [Number(p[0]), Number(p[1])] as LonLat), [Number(first[0]), Number(first[1])]];
}

export function stripClosingVertex(ring: LonLat[]): LonLat[] {
  if (ring.length < 2) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (Math.abs(first[0] - last[0]) < 1e-10 && Math.abs(first[1] - last[1]) < 1e-10) {
    return ring.slice(0, -1);
  }
  return ring;
}

export function computeRingCentroid(ring: LonLat[]): { lat: number; lon: number } | null {
  const open = stripClosingVertex(ring);
  if (open.length === 0) return null;
  if (open.length < 3) {
    const lon = open.reduce((s, p) => s + p[0], 0) / open.length;
    const lat = open.reduce((s, p) => s + p[1], 0) / open.length;
    return { lat, lon };
  }

  let signedArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < open.length; i++) {
    const [x0, y0] = open[i];
    const [x1, y1] = open[(i + 1) % open.length];
    const a = x0 * y1 - x1 * y0;
    signedArea += a;
    cx += (x0 + x1) * a;
    cy += (y0 + y1) * a;
  }

  if (Math.abs(signedArea) < 1e-14) {
    const lon = open.reduce((s, p) => s + p[0], 0) / open.length;
    const lat = open.reduce((s, p) => s + p[1], 0) / open.length;
    return { lat, lon };
  }

  signedArea *= 0.5;
  return {
    lon: cx / (6 * signedArea),
    lat: cy / (6 * signedArea),
  };
}

/** Orientation helper for segment intersection check */
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

export function segmentsIntersect(a1: LonLat, a2: LonLat, b1: LonLat, b2: LonLat): boolean {
  const o1 = orient(a1, a2, b1);
  const o2 = orient(a1, a2, b2);
  const o3 = orient(b1, b2, a1);
  const o4 = orient(b1, b2, a2);

  if (((o1 > 1e-12 && o2 < -1e-12) || (o1 < -1e-12 && o2 > 1e-12)) &&
      ((o3 > 1e-12 && o4 < -1e-12) || (o3 < -1e-12 && o4 > 1e-12))) {
    return true;
  }

  if (Math.abs(o1) <= 1e-12 && onSegment(a1, b1, a2)) return true;
  if (Math.abs(o2) <= 1e-12 && onSegment(a1, b2, a2)) return true;
  if (Math.abs(o3) <= 1e-12 && onSegment(b1, a1, b2)) return true;
  if (Math.abs(o4) <= 1e-12 && onSegment(b1, a2, b2)) return true;
  return false;
}

export function findSelfIntersections(ring: LonLat[]): Array<[number, number]> {
  const open = stripClosingVertex(ring);
  const n = open.length;
  if (n < 4) return [];
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const a1 = open[i];
    const a2 = open[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // adjacent closing edge
      const b1 = open[j];
      const b2 = open[(j + 1) % n];
      if (segmentsIntersect(a1, a2, b1, b2)) {
        pairs.push([i, j]);
      }
    }
  }
  return pairs;
}

export function isPointInRing(point: LonLat, ring: LonLat[]): boolean {
  const open = stripClosingVertex(ring);
  if (open.length < 3) return false;
  const [px, py] = point;
  let inside = false;
  for (let i = 0, j = open.length - 1; i < open.length; j = i++) {
    const [xi, yi] = open[i];
    const [xj, yj] = open[j];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-15) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointInPolygon(point: LonLat, geometry: GeoJsonPolygonGeometry): boolean {
  const exterior = geometry.coordinates[0];
  if (!exterior || !isPointInRing(point, exterior)) return false;
  for (let h = 1; h < geometry.coordinates.length; h++) {
    if (isPointInRing(point, geometry.coordinates[h])) {
      return false; // Point sits inside an excluded hole
    }
  }
  return true;
}

/** Bounding box check + vertex/edge intersection test between two outer rings */
export function polygonsOverlap(
  a: GeoJsonPolygonGeometry,
  b: GeoJsonPolygonGeometry
): { overlaps: boolean; estimatedOverlapRatio: number } {
  const ringA = stripClosingVertex(a.coordinates[0] ?? []);
  const ringB = stripClosingVertex(b.coordinates[0] ?? []);
  if (ringA.length < 3 || ringB.length < 3) return { overlaps: false, estimatedOverlapRatio: 0 };

  let minAx = Infinity, maxAx = -Infinity, minAy = Infinity, maxAy = -Infinity;
  for (const [x, y] of ringA) {
    if (x < minAx) minAx = x;
    if (x > maxAx) maxAx = x;
    if (y < minAy) minAy = y;
    if (y > maxAy) maxAy = y;
  }
  let minBx = Infinity, maxBx = -Infinity, minBy = Infinity, maxBy = -Infinity;
  for (const [x, y] of ringB) {
    if (x < minBx) minBx = x;
    if (x > maxBx) maxBx = x;
    if (y < minBy) minBy = y;
    if (y > maxBy) maxBy = y;
  }

  // Slight tolerance (~1 meter) so adjacent shared field edges don't trigger overlap
  const eps = 1e-5;
  if (maxAx <= minBx + eps || maxBx <= minAx + eps || maxAy <= minBy + eps || maxBy <= minBy + eps) {
    if (maxAx <= minBx + eps || maxBx <= minAx + eps || maxAy <= minBy + eps || maxBy <= minAy + eps) {
      return { overlaps: false, estimatedOverlapRatio: 0 };
    }
  }

  // Grid-sample inside A to estimate true interior overlap ratio (ignores touching shared edges)
  const samples = 8;
  let insideA = 0;
  let insideBoth = 0;
  for (let ix = 0; ix < samples; ix++) {
    for (let iy = 0; iy < samples; iy++) {
      const px = minAx + ((ix + 0.5) / samples) * (maxAx - minAx);
      const py = minAy + ((iy + 0.5) / samples) * (maxAy - minAy);
      if (isPointInRing([px, py], ringA)) {
        insideA++;
        if (isPointInRing([px, py], ringB)) {
          insideBoth++;
        }
      }
    }
  }

  if (insideBoth > 0 && insideA > 0) {
    const ratio = insideBoth / insideA;
    if (ratio >= 0.03) {
      return { overlaps: true, estimatedOverlapRatio: ratio };
    }
  }

  // Also check if B's centroid sits strictly inside A or vice versa
  const cB = computeRingCentroid(ringB);
  const cA = computeRingCentroid(ringA);
  if ((cB && isPointInRing([cB.lon, cB.lat], ringA)) || (cA && isPointInRing([cA.lon, cA.lat], ringB))) {
    return { overlaps: true, estimatedOverlapRatio: Math.max(insideA > 0 ? insideBoth / insideA : 0.25, 0.15) };
  }

  return { overlaps: false, estimatedOverlapRatio: 0 };
}

/** Complete polygon geometry validation matching Section 29.4, 29.5 & 34 */
export function validatePolygonGeometry(
  geometry: GeoJsonPolygonGeometry,
  existingSameFarmFields: MapFieldRecord[] = [],
  editingFieldId?: string | null
): GeometryValidationResult {
  const issues: GeometryValidationIssue[] = [];
  const exteriorRaw = geometry.coordinates?.[0] ?? [];
  const openExterior = stripClosingVertex(exteriorRaw);

  // 1. Finite and geographic bounds check
  for (let r = 0; r < (geometry.coordinates?.length ?? 0); r++) {
    for (const pt of geometry.coordinates[r]) {
      const lon = Number(pt?.[0]);
      const lat = Number(pt?.[1]);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        issues.push({
          code: 'NOT_FINITE',
          severity: 'error',
          message: 'Geometry contains non-finite coordinates.',
        });
        break;
      }
      if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        issues.push({
          code: 'INVALID_COORDINATE',
          severity: 'error',
          message: `Coordinate [${lon.toFixed(4)}, ${lat.toFixed(4)}] is outside valid WGS84 range (lon -180..180, lat -90..90).`,
        });
        break;
      }
    }
  }

  // 2. Minimum 3 distinct vertices
  const uniqueKeys = new Set(openExterior.map(([x, y]) => `${x.toFixed(7)},${y.toFixed(7)}`));
  if (openExterior.length < 3 || uniqueKeys.size < 3) {
    issues.push({
      code: 'TOO_FEW_VERTICES',
      severity: 'error',
      message: 'A valid field boundary requires at least 3 distinct points.',
    });
  }

  // 3. Duplicate adjacent vertices (< 0.2 m apart)
  for (let i = 0; i < openExterior.length; i++) {
    const a = openExterior[i];
    const b = openExterior[(i + 1) % openExterior.length];
    if (openExterior.length >= 2 && haversineDistanceM(a, b) < 0.2) {
      issues.push({
        code: 'DUPLICATE_ADJACENT',
        severity: 'warning',
        message: `Vertices ${i + 1} and ${((i + 1) % openExterior.length) + 1} are virtually identical (< 0.2 m apart).`,
      });
      break;
    }
  }

  // 4. Self-intersection
  const crossings = findSelfIntersections(openExterior);
  if (crossings.length > 0) {
    const [e1, e2] = crossings[0];
    issues.push({
      code: 'SELF_INTERSECTION',
      severity: 'error',
      edgeIndices: [e1, e2],
      message: `Boundary edges ${e1 + 1} and ${e2 + 1} cross each other (self-intersection invalidates geodesic area). Drag vertices to uncross before saving.`,
    });
  }

  // 5. Geodesic area & perimeter
  const grossAreaM2 = openExterior.length >= 3 ? computeRingGeodesicAreaM2(openExterior) : 0;
  let excludedAreaM2 = 0;
  for (let h = 1; h < (geometry.coordinates?.length ?? 0); h++) {
    const hole = stripClosingVertex(geometry.coordinates[h]);
    if (hole.length >= 3) {
      const holeCrossings = findSelfIntersections(hole);
      if (holeCrossings.length > 0) {
        issues.push({
          code: 'SELF_INTERSECTION',
          severity: 'error',
          message: `Exclusion zone #${h} has self-intersecting edges.`,
        });
      }
      const holeInside = hole.every((pt) => isPointInRing(pt, openExterior));
      if (!holeInside) {
        issues.push({
          code: 'HOLE_OUTSIDE_EXTERIOR',
          severity: 'error',
          message: `Exclusion zone #${h} extends outside the main field boundary.`,
        });
      }
      excludedAreaM2 += computeRingGeodesicAreaM2(hole);
    }
  }

  const netAreaM2 = Math.max(0, grossAreaM2 - excludedAreaM2);
  const perimeterM = openExterior.length >= 2 ? computeRingPerimeterM(openExterior) : 0;
  const centroid = computeRingCentroid(openExterior);

  if (openExterior.length >= 3 && netAreaM2 < 25) {
    issues.push({
      code: 'ZERO_AREA',
      severity: 'error',
      message: 'Net field area is effectively zero (< 25 m²). Widen the polygon boundary.',
    });
  } else if (netAreaM2 > 500_000_000) {
    // > 50,000 ha
    issues.push({
      code: 'IMPLAUSIBLE_SCALE',
      severity: 'warning',
      message: `Very large boundary (${(netAreaM2 / 10000).toFixed(0)} ha). Confirm scale is intended for one management unit.`,
    });
  }

  // 6. Overlap check against sibling fields on the same farm
  for (const sibling of existingSameFarmFields) {
    if (editingFieldId && sibling.id === editingFieldId) continue;
    const siblingVer = sibling.versions.find((v) => v.geometryVersionId === sibling.currentVersionId) ?? sibling.versions[0];
    if (!siblingVer) continue;
    const check = polygonsOverlap(geometry, siblingVer.geometry);
    if (check.overlaps) {
      issues.push({
        code: 'OVERLAP_WARNING',
        severity: 'warning',
        message: `Overlaps ~${Math.round(check.estimatedOverlapRatio * 100)}% with existing field "${sibling.name}". Adjacent borders are allowed, but overlapping production fields require review.`,
      });
    }
  }

  const hasError = issues.some((i) => i.severity === 'error');
  return {
    valid: !hasError,
    issues,
    grossAreaM2,
    excludedAreaM2,
    netAreaM2,
    perimeterM,
    centroid,
    vertexCount: openExterior.length,
    holeCount: Math.max(0, (geometry.coordinates?.length ?? 1) - 1),
  };
}

export function formatArea(areaM2: number, unit: 'hectares' | 'acres'): string {
  if (unit === 'acres') {
    const acres = areaM2 / 4046.8564224;
    return acres >= 100 ? `${acres.toFixed(0)} ac` : `${acres.toFixed(2)} ac`;
  }
  const ha = areaM2 / 10000;
  return ha >= 100 ? `${ha.toFixed(1)} ha` : `${ha.toFixed(2)} ha`;
}

export function formatPerimeter(perimeterM: number): string {
  if (perimeterM >= 1000) return `${(perimeterM / 1000).toFixed(2)} km`;
  return `${Math.round(perimeterM)} m`;
}

/** Parse GeoJSON or KML text into previewable Import Candidates (never drops failures silently) */
export function parseImportedBoundariesFile(
  filename: string,
  rawText: string,
  existingFields: MapFieldRecord[] = []
): {
  format: 'GeoJSON' | 'KML';
  crsAssumption: string;
  candidates: ImportedFeatureCandidate[];
} {
  const lower = filename.toLowerCase();
  const candidates: ImportedFeatureCandidate[] = [];

  if (lower.endsWith('.kml') || rawText.trim().startsWith('<')) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(rawText, 'application/xml');
    const parseErr = xml.querySelector('parsererror');
    if (parseErr) {
      throw new Error('Malformed XML/KML file. Check file syntax and retry.');
    }
    const placemarks = Array.from(xml.querySelectorAll('Placemark'));
    if (placemarks.length === 0) {
      const polygons = Array.from(xml.querySelectorAll('Polygon'));
      polygons.forEach((poly, idx) => {
        const coordsText = poly.querySelector('outerBoundaryIs LinearRing coordinates, coordinates')?.textContent ?? '';
        const ring = parseKmlCoordinates(coordsText);
        if (ring.length > 0) {
          const geom: GeoJsonPolygonGeometry = { type: 'Polygon', coordinates: [closeRing(ring)] };
          const val = validatePolygonGeometry(geom, existingFields);
          candidates.push({
            index: idx + 1,
            suggestedName: `Imported Parcel ${idx + 1}`,
            geometry: geom,
            rawGeometryType: 'KML Polygon',
            validation: val,
            error: val.valid ? null : val.issues.find((i) => i.severity === 'error')?.message ?? 'Invalid polygon',
            selected: val.valid,
          });
        }
      });
    } else {
      placemarks.forEach((pm, idx) => {
        const name = pm.querySelector('name')?.textContent?.trim() || `KML Field ${idx + 1}`;
        const outerText =
          pm.querySelector('outerBoundaryIs LinearRing coordinates')?.textContent ??
          pm.querySelector('Polygon coordinates')?.textContent ??
          '';
        const innerTexts = Array.from(pm.querySelectorAll('innerBoundaryIs LinearRing coordinates')).map(
          (n) => n.textContent ?? ''
        );
        const outerRing = parseKmlCoordinates(outerText);
        if (outerRing.length === 0) {
          candidates.push({
            index: idx + 1,
            suggestedName: name,
            geometry: null,
            rawGeometryType: 'Non-polygon Placemark',
            validation: null,
            error: 'No <Polygon> coordinates found in Placemark.',
            selected: false,
          });
          return;
        }
        const rings: LonLat[][] = [closeRing(outerRing)];
        innerTexts.forEach((t) => {
          const hole = parseKmlCoordinates(t);
          if (hole.length >= 3) rings.push(closeRing(hole));
        });
        const geom: GeoJsonPolygonGeometry = { type: 'Polygon', coordinates: rings };
        const val = validatePolygonGeometry(geom, existingFields);
        candidates.push({
          index: idx + 1,
          suggestedName: name,
          geometry: geom,
          rawGeometryType: 'KML Polygon',
          validation: val,
          error: val.valid ? null : val.issues.find((i) => i.severity === 'error')?.message ?? 'Invalid polygon',
          selected: val.valid,
        });
      });
    }

    return {
      format: 'KML',
      crsAssumption: 'KML Standard WGS84 (EPSG:4326 lon/lat)',
      candidates,
    };
  }

  // GeoJSON path
  const parsed = JSON.parse(rawText) as {
    type?: string;
    features?: Array<{ properties?: Record<string, unknown>; geometry?: { type?: string; coordinates?: unknown } }>;
    geometry?: { type?: string; coordinates?: unknown };
    coordinates?: unknown;
    properties?: Record<string, unknown>;
  };

  const features: Array<{ name: string; geometryType: string; coordinates: unknown }> = [];
  if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
    parsed.features.forEach((f, idx) => {
      const props = f.properties ?? {};
      const label =
        String(props.name || props.fieldName || props.title || props.label || `Imported Field ${idx + 1}`);
      features.push({
        name: label,
        geometryType: f.geometry?.type || 'Unknown',
        coordinates: f.geometry?.coordinates,
      });
    });
  } else if (parsed.type === 'Feature' && parsed.geometry) {
    const props = parsed.properties ?? {};
    features.push({
      name: String(props.name || props.fieldName || 'Imported Field 1'),
      geometryType: parsed.geometry.type || 'Unknown',
      coordinates: parsed.geometry.coordinates,
    });
  } else if (parsed.type === 'Polygon' || parsed.type === 'MultiPolygon') {
    features.push({
      name: 'Imported Field 1',
      geometryType: parsed.type,
      coordinates: parsed.coordinates,
    });
  } else {
    throw new Error('Unrecognized GeoJSON structure. Expected FeatureCollection, Feature, or Polygon.');
  }

  features.forEach((feat, idx) => {
    if (feat.geometryType === 'Polygon' && Array.isArray(feat.coordinates)) {
      const rings = (feat.coordinates as LonLat[][]).map((r) => closeRing(r.map((p) => [Number(p[0]), Number(p[1])])));
      const geom: GeoJsonPolygonGeometry = { type: 'Polygon', coordinates: rings };
      const val = validatePolygonGeometry(geom, existingFields);
      candidates.push({
        index: idx + 1,
        suggestedName: feat.name,
        geometry: geom,
        rawGeometryType: 'Polygon',
        validation: val,
        error: val.valid ? null : val.issues.find((i) => i.severity === 'error')?.message ?? 'Invalid polygon',
        selected: val.valid,
      });
    } else if (feat.geometryType === 'MultiPolygon' && Array.isArray(feat.coordinates) && feat.coordinates.length > 0) {
      // Take outer polygon of MultiPolygon #1 and note multi-part if > 1
      const firstPoly = feat.coordinates[0] as LonLat[][];
      const rings = firstPoly.map((r) => closeRing(r.map((p) => [Number(p[0]), Number(p[1])])));
      const geom: GeoJsonPolygonGeometry = { type: 'Polygon', coordinates: rings };
      const val = validatePolygonGeometry(geom, existingFields);
      candidates.push({
        index: idx + 1,
        suggestedName: feat.name,
        geometry: geom,
        rawGeometryType: 'MultiPolygon (part 1)',
        validation: val,
        error: val.valid ? null : val.issues.find((i) => i.severity === 'error')?.message ?? 'Invalid MultiPolygon',
        selected: val.valid,
      });
    } else {
      candidates.push({
        index: idx + 1,
        suggestedName: feat.name,
        geometry: null,
        rawGeometryType: feat.geometryType,
        validation: null,
        error: `Unsupported geometry type "${feat.geometryType}". Only Polygon and MultiPolygon are supported.`,
        selected: false,
      });
    }
  });

  return {
    format: 'GeoJSON',
    crsAssumption: 'RFC 7946 WGS84 (EPSG:4326 lon/lat)',
    candidates,
  };
}

function parseKmlCoordinates(coordText: string): LonLat[] {
  return coordText
    .trim()
    .split(/\s+/)
    .map((tuple) => {
      const [lonStr, latStr] = tuple.split(',');
      const lon = Number(lonStr);
      const lat = Number(latStr);
      if (Number.isFinite(lon) && Number.isFinite(lat)) {
        return [lon, lat] as LonLat;
      }
      return null;
    })
    .filter((pt): pt is LonLat => pt !== null);
}

export function exportFieldsAsGeoJson(fields: MapFieldRecord[]): string {
  const features = fields.map((field) => {
    const activeVer =
      field.versions.find((v) => v.geometryVersionId === field.currentVersionId) ?? field.versions[0];
    return {
      type: 'Feature',
      id: field.id,
      properties: {
        fieldId: field.id,
        farmId: field.farmId,
        name: field.name,
        cropName: field.cropName || null,
        status: field.status,
        geometryVersionId: activeVer?.geometryVersionId,
        versionNumber: activeVer?.versionNumber,
        netAreaHectares: activeVer?.netAreaHectares,
        grossAreaHectares: activeVer?.grossAreaHectares,
        crs: 'EPSG:4326',
        areaMethod: activeVer?.areaMethod,
      },
      geometry: activeVer?.geometry ?? null,
    };
  });

  return JSON.stringify(
    {
      type: 'FeatureCollection',
      crs: { type: 'name', properties: { name: 'EPSG:4326' } },
      exportedAt: new Date().toISOString(),
      features,
    },
    null,
    2
  );
}

/** Point-to-segment distance in lon/lat degrees (for interior pole-of-inaccessibility search) */
function pointToSegmentDist(px: number, py: number, a: LonLat, b: LonLat): number {
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

function pointToPolygonDist(px: number, py: number, rings: LonLat[][]): number {
  let inside = false;
  let minDistSq = Infinity;
  for (let r = 0; r < rings.length; r++) {
    const ring = stripClosingVertex(rings[r]);
    for (let i = 0, len = ring.length, j = len - 1; i < len; j = i++) {
      const a = ring[i];
      const b = ring[j];
      if ((a[1] > py) !== (b[1] > py) && px < ((b[0] - a[0]) * (py - a[1])) / (b[1] - a[1] || 1e-15) + a[0]) {
        inside = !inside;
      }
      const d = pointToSegmentDist(px, py, a, b);
      if (d < minDistSq) minDistSq = d;
    }
  }
  return (inside ? 1 : -1) * minDistSq;
}

/** Finds an interior label point (pole of inaccessibility) guaranteed to sit inside a polygon */
export function computeInteriorLabelPoint(geometry: FarmGeoJsonGeometry): { lat: number; lon: number } {
  const rings: LonLat[][] =
    geometry.type === 'MultiPolygon'
      ? (geometry.coordinates[0] ?? [])
      : geometry.coordinates;

  const outer = stripClosingVertex(rings[0] ?? []);
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
  const cellSize = Math.min(width, height);
  if (cellSize <= 0) return { lat: outer[0][1], lon: outer[0][0] };

  // Start from centroid if inside, else bounding box center
  const centroid = computeRingCentroid(outer);
  let bestX = centroid ? centroid.lon : (minX + maxX) / 2;
  let bestY = centroid ? centroid.lat : (minY + maxY) / 2;
  let bestDist = pointToPolygonDist(bestX, bestY, rings);

  // Coarse + fine grid search for guaranteed interior pole
  const steps = 12;
  for (let ix = 0; ix <= steps; ix++) {
    for (let iy = 0; iy <= steps; iy++) {
      const cx = minX + (ix / steps) * width;
      const cy = minY + (iy / steps) * height;
      const d = pointToPolygonDist(cx, cy, rings);
      if (d > bestDist) {
        bestDist = d;
        bestX = cx;
        bestY = cy;
      }
    }
  }

  // Refine around best point
  let stepX = width / steps / 2;
  let stepY = height / steps / 2;
  for (let iter = 0; iter < 4; iter++) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cx = bestX + dx * stepX;
        const cy = bestY + dy * stepY;
        const d = pointToPolygonDist(cx, cy, rings);
        if (d > bestDist) {
          bestDist = d;
          bestX = cx;
          bestY = cy;
        }
      }
    }
    stepX *= 0.5;
    stepY *= 0.5;
  }

  return { lat: Number(bestY.toFixed(6)), lon: Number(bestX.toFixed(6)) };
}

export function computeFarmGeometryMetrics(geometry: FarmGeoJsonGeometry): {
  areaM2: number;
  areaHa: number;
  perimeterM: number;
  centroid: { lat: number; lon: number };
  labelPoint: { lat: number; lon: number };
} {
  const polygons: LonLat[][][] =
    geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];

  let totalAreaM2 = 0;
  let totalPerimeterM = 0;
  let largestPolyArea = -1;
  let largestPoly: LonLat[][] = polygons[0] ?? [];

  for (const poly of polygons) {
    const outer = poly[0] ?? [];
    const gross = computeRingGeodesicAreaM2(outer);
    let holes = 0;
    for (let h = 1; h < poly.length; h++) {
      holes += computeRingGeodesicAreaM2(poly[h]);
    }
    const net = Math.max(0, gross - holes);
    totalAreaM2 += net;
    totalPerimeterM += computeRingPerimeterM(outer);
    if (net > largestPolyArea) {
      largestPolyArea = net;
      largestPoly = poly;
    }
  }

  const centroid = computeRingCentroid(largestPoly[0] ?? []) ?? { lat: 0, lon: 0 };
  const labelPoint = computeInteriorLabelPoint({ type: 'Polygon', coordinates: largestPoly });

  return {
    areaM2: Math.round(totalAreaM2),
    areaHa: Number((totalAreaM2 / 10000).toFixed(1)),
    perimeterM: Math.round(totalPerimeterM),
    centroid: { lat: Number(centroid.lat.toFixed(6)), lon: Number(centroid.lon.toFixed(6)) },
    labelPoint,
  };
}

export function getGeometryBounds(geometry: FarmGeoJsonGeometry): {
  west: number;
  south: number;
  east: number;
  north: number;
} {
  const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  for (const poly of polygons) {
    for (const ring of poly) {
      for (const [lon, lat] of ring) {
        if (lon < west) west = lon;
        if (lon > east) east = lon;
        if (lat < south) south = lat;
        if (lat > north) north = lat;
      }
    }
  }
  return { west, south, east, north };
}

