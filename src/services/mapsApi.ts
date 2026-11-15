import {
  BaseMapId,
  DiscoveryConsentSettings,
  DiscoveryMessageItem,
  FarmGeoJsonGeometry,
  FarmMapRecord,
  GeoJsonPolygonGeometry,
  MapFieldRecord,
  MapLayerDefinition,
  MapPointInspectResult,
  PublicDiscoveryProfile,
  RegionalCityAggregate,
} from '../types/maps';

export function getRecentObservationDate(daysAgo = 2): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/** Generate authentic recent NASA GIBS / meteorological capture date windows (most recent 8 dates, no invented future frames) */
export function getAvailableObservationDates(): Array<{ date: string; label: string; note: string }> {
  const offsets = [2, 4, 7, 10, 14, 21, 30, 45];
  return offsets.map((days) => {
    const date = getRecentObservationDate(days);
    return {
      date,
      label: days === 2 ? `${date} (Latest GIBS)` : date,
      note: `Terra/Suomi NPP daily composite · T-${days}d`,
    };
  });
}

export interface TileProviderSpec {
  url: string;
  attribution: string;
  maxNativeZoom: number;
  maxZoom: number;
  note: string;
}

export function getBaseMapTileSpec(baseMapId: BaseMapId): TileProviderSpec {
  switch (baseMapId) {
    case 'satellite':
    case 'satellite-labels':
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri • © OpenStreetMap',
        maxNativeZoom: 18,
        maxZoom: 19,
        note: 'High-resolution true-color aerial & satellite imagery.',
      };
    case 'terrain':
      return {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '© OpenTopoMap • © OpenStreetMap',
        maxNativeZoom: 17,
        maxZoom: 18,
        note: 'Topographic contour & elevation shading basemap derived from SRTM.',
      };
    case 'neutral':
      return {
        url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
        attribution: '© CARTO • © OpenStreetMap',
        maxNativeZoom: 18,
        maxZoom: 19,
        note: 'Neutral cartographic reference layer highlighting boundary geometry.',
      };
    case 'street':
    default:
      return {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        maxNativeZoom: 19,
        maxZoom: 19,
        note: 'Road network & regional boundary reference layer.',
      };
  }
}

export function getBaseMapReferenceOverlaySpec(baseMapId: BaseMapId): TileProviderSpec | null {
  if (baseMapId === 'satellite-labels') {
    return {
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri',
      maxNativeZoom: 18,
      maxZoom: 19,
      note: 'Place & road reference labels overlay.',
    };
  }
  return null;
}

export function getOverlayGibsTileUrl(layerId: string, date: string): TileProviderSpec | null {
  if (layerId === 'gibs_modis_true_color') {
    return {
      url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
      attribution: 'Imagery © NASA GIBS / EOSDIS Terra MODIS',
      maxNativeZoom: 9,
      maxZoom: 16,
      note: '250 m daily true-color composite (~10:30 local overpass). Clouds may obscure field parcels.',
    };
  }
  if (layerId === 'gibs_viirs_true_color') {
    return {
      url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
      attribution: 'Imagery © NASA GIBS / Suomi NPP VIIRS',
      maxNativeZoom: 9,
      maxZoom: 16,
      note: '375 m daily true-color composite (~13:30 local overpass). Broad-grid view only.',
    };
  }
  if (layerId === 'gibs_imerg_precip') {
    return {
      url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/${date}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
      attribution: 'Precipitation © NASA GIBS / GPM IMERG',
      maxNativeZoom: 6,
      maxZoom: 14,
      note: '0.1° (~11 km) GPM IMERG precipitation rate. Regional storm-band context only.',
    };
  }
  return null;
}

export const MAP_LAYER_CATALOG: MapLayerDefinition[] = [
  {
    id: 'field_boundaries',
    kind: 'overlay',
    group: 'Boundaries & operations',
    label: 'Field Boundaries & Exclusions',
    sourceProvider: 'Field Shift Farmer-Defined GeoJSON',
    productName: 'WGS84 EPSG:4326 Geometry Versions',
    units: 'ha / ac (geodesic)',
    rangeLabel: 'User-drawn / Imported parcels',
    resolutionLabel: 'Sub-meter vector vertices',
    nominalGridMeters: 1,
    processingMethod: 'Spherical excess geodesic calculation (Chamberlain-Duquette)',
    qualityCaveat: 'User-defined boundaries are not independently verified legal/cadastral surveys.',
    supportsTemporalDate: false,
    supportsOpacity: false,
  },
  {
    id: 'gibs_modis_true_color',
    kind: 'overlay',
    group: 'Satellite imagery',
    label: 'NASA Terra MODIS True Color',
    sourceProvider: 'NASA GIBS / EOSDIS',
    productName: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    units: 'True-Color RGB',
    rangeLabel: 'Surface reflectance Bands 1,4,3',
    resolutionLabel: '250 m / pixel (Zoom ≤ 9 native)',
    nominalGridMeters: 250,
    processingMethod: 'Atmospheric Rayleigh-corrected daily mosaic',
    qualityCaveat: '250 m pixels exceed small parcels; cloud cover obscures surface crops without synthetic filling.',
    supportsTemporalDate: true,
    supportsOpacity: true,
    incompatibleWith: ['gibs_viirs_true_color'],
  },
  {
    id: 'gibs_viirs_true_color',
    kind: 'overlay',
    group: 'Satellite imagery',
    label: 'NASA Suomi NPP VIIRS True Color',
    sourceProvider: 'NASA GIBS / EOSDIS',
    productName: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
    units: 'True-Color RGB',
    rangeLabel: 'Bands I1, M4, M3',
    resolutionLabel: '375 m / pixel (Zoom ≤ 9 native)',
    nominalGridMeters: 375,
    processingMethod: 'Afternoon overpass daily reflectance composite',
    qualityCaveat: 'Regional resolution (375 m). Do not treat coarse daily mosaics as individual row diagnostics.',
    supportsTemporalDate: true,
    supportsOpacity: true,
    incompatibleWith: ['gibs_modis_true_color'],
  },
  {
    id: 'gibs_imerg_precip',
    kind: 'overlay',
    group: 'Water & weather context',
    label: 'NASA GPM IMERG Precipitation',
    sourceProvider: 'NASA GPM / GIBS',
    productName: 'IMERG_Precipitation_Rate',
    units: 'mm / hr',
    rangeLabel: '0.1 – 50+ mm/hr',
    resolutionLabel: '0.1° (~11 km grid)',
    nominalGridMeters: 11000,
    processingMethod: 'Merged microwave + infrared satellite precipitation grid',
    qualityCaveat: '0.1° cell represents watershed rainfall belts, not exact sub-parcel rain gauge totals.',
    supportsTemporalDate: true,
    supportsOpacity: true,
    legend: {
      title: 'GPM IMERG Rain Rate (mm/hr)',
      missingDataColor: 'transparent',
      stops: [
        { color: '#38BDF8', label: '0.1–2 Light' },
        { color: '#2563EB', label: '2–10 Moderate' },
        { color: '#9333EA', label: '10–25 Heavy' },
        { color: '#EF4444', label: '25+ Intense' },
      ],
    },
  },
  {
    id: 'eonet_hazards',
    kind: 'overlay',
    group: 'Water & weather context',
    label: 'NASA EONET Active Hazards',
    sourceProvider: 'NASA EONET v3 API',
    productName: 'Natural Events within 350 km',
    units: 'km distance',
    rangeLabel: 'Wildfires, Storms, Floods, Volcanoes',
    resolutionLabel: 'Event point / centroid',
    nominalGridMeters: 1000,
    processingMethod: 'Real-time open hazard catalog filtered to regional scan radius',
    qualityCaveat: 'Event pins represent reported hazard centroids; check local emergency guidance for smoke/runoff.',
    supportsTemporalDate: false,
    supportsOpacity: false,
    legend: {
      title: 'NASA EONET Hazard Categories',
      missingDataColor: '#64748B',
      stops: [
        { color: '#EF4444', label: 'Wildfire' },
        { color: '#38BDF8', label: 'Severe Storm' },
        { color: '#22C7B8', label: 'Flood' },
        { color: '#F59E0B', label: 'Other Event' },
      ],
    },
  },
  {
    id: 'weather_grid',
    kind: 'overlay',
    group: 'Water & weather context',
    label: 'Weather, Soil Moisture & ET0 Point Probe',
    sourceProvider: 'Open-Meteo / ERA5-Land & IFS',
    productName: 'Daily Weather + 0–7cm Soil Moisture + FAO ET0',
    units: '°C · mm · % vol',
    rangeLabel: 'Click map in Inspect mode to sample',
    resolutionLabel: '~11 km atmospheric grid',
    nominalGridMeters: 11000,
    processingMethod: 'Numerical Weather Prediction & ERA5-Land assimilation (point query, not pseudo-raster)',
    qualityCaveat: 'Coarse ~11 km grid model; always shown as broader grid context vs. small farm fields.',
    supportsTemporalDate: true,
    supportsOpacity: false,
  },
  {
    id: 'elevation_terrain',
    kind: 'overlay',
    group: 'Soil & terrain',
    label: 'SRTM Elevation & Local Slope Probe',
    sourceProvider: 'Open-Elevation / NASA SRTM',
    productName: 'SRTM 3-arcsecond Digital Elevation Model',
    units: 'meters ASL · % slope',
    rangeLabel: 'Click map in Inspect mode for terrain slope',
    resolutionLabel: '~90 m posting',
    nominalGridMeters: 90,
    processingMethod: 'Centered finite-difference gradient across 4 orthogonal 94 m DEM lookups',
    qualityCaveat: '90 m resolution smoothes narrow berms, drainage ditches, and terrace risers.',
    supportsTemporalDate: false,
    supportsOpacity: false,
  },
  {
    id: 'regional_discovery_clusters',
    kind: 'overlay',
    group: 'Regional discovery',
    label: 'Regional Farm Discovery Clusters (City-Only)',
    sourceProvider: 'Field Shift Opt-In Community API',
    productName: 'Privacy-Filtered City Cohort Aggregates',
    units: 'Participating farms (min ≥ 3)',
    rangeLabel: 'City centroid only — zero farm pins',
    resolutionLabel: 'City / municipality scale',
    nominalGridMeters: 15000,
    processingMethod: 'Strict k-anonymity cohort threshold (≥ 3 farms) & separate public DTO',
    qualityCaveat: 'Exact farm coordinates and boundaries are never exposed. Regions < 3 farms suppress numeric averages.',
    supportsTemporalDate: false,
    supportsOpacity: false,
    legend: {
      title: 'Regional Discovery Privacy Threshold',
      missingDataColor: '#64748B',
      stops: [
        { color: '#14B8A6', label: '≥ 3 farms (Cohort aggregate active)' },
        { color: '#F59E0B', label: '< 3 farms (Stats suppressed for privacy)' },
      ],
    },
  },
];

const LOCAL_FIELDS_FALLBACK_KEY = 'fieldshift_maps_fields_cache_v1';

export async function fetchMapFields(farmId?: string): Promise<MapFieldRecord[]> {
  try {
    const qs = farmId ? `?farmId=${encodeURIComponent(farmId)}` : '';
    const resp = await fetch(`/api/maps/fields${qs}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = (await resp.json()) as { fields: MapFieldRecord[] };
    if (!farmId && typeof window !== 'undefined') {
      window.localStorage.setItem(LOCAL_FIELDS_FALLBACK_KEY, JSON.stringify(data.fields));
    }
    return data.fields;
  } catch {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(LOCAL_FIELDS_FALLBACK_KEY);
      if (raw) {
        const list = JSON.parse(raw) as MapFieldRecord[];
        return farmId ? list.filter((f) => f.farmId === farmId) : list;
      }
    }
    return [];
  }
}

export async function createFieldBoundaryApi(payload: {
  farmId: string;
  name: string;
  cropId?: string;
  cropName?: string;
  soilSummary?: string;
  waterSummary?: string;
  status?: 'Active' | 'Planned' | 'Fallow' | 'Needs Review';
  source: 'drawn' | 'imported' | 'edited';
  editReason?: string;
  batchImportId?: string;
  geometry: GeoJsonPolygonGeometry;
  originalImportedGeometry?: GeoJsonPolygonGeometry;
}): Promise<MapFieldRecord> {
  const resp = await fetch('/api/maps/fields', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await resp.json()) as { field?: MapFieldRecord; error?: string };
  if (!resp.ok || !data.field) {
    throw new Error(data.error || `Failed to save boundary (HTTP ${resp.status})`);
  }
  return data.field;
}

export async function updateFieldBoundaryApi(
  fieldId: string,
  payload: {
    name?: string;
    source: 'drawn' | 'imported' | 'edited';
    editReason?: string;
    geometry: GeoJsonPolygonGeometry;
  }
): Promise<{ field: MapFieldRecord; invalidatedCaches: string[] }> {
  const resp = await fetch(`/api/maps/fields/${encodeURIComponent(fieldId)}/boundary`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await resp.json()) as {
    field?: MapFieldRecord;
    invalidatedCaches?: string[];
    error?: string;
  };
  if (!resp.ok || !data.field) {
    throw new Error(data.error || `Failed to update boundary (HTTP ${resp.status})`);
  }
  return { field: data.field, invalidatedCaches: data.invalidatedCaches ?? [] };
}

export async function deleteFieldBoundaryApi(fieldId: string): Promise<void> {
  const resp = await fetch(`/api/maps/fields/${encodeURIComponent(fieldId)}`, {
    method: 'DELETE',
  });
  if (!resp.ok) {
    const data = (await resp.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Failed to delete field (HTTP ${resp.status})`);
  }
}

export async function revertImportBatchApi(batchId: string): Promise<number> {
  const resp = await fetch(`/api/maps/import-batches/${encodeURIComponent(batchId)}`, {
    method: 'DELETE',
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = (await resp.json()) as { removedCount: number };
  return data.removedCount ?? 0;
}

export async function inspectMapLocationApi(payload: {
  lat: number;
  lon: number;
  observationDate: string;
  fieldId?: string | null;
  fieldName?: string | null;
  fieldAreaHectares?: number | null;
}): Promise<MapPointInspectResult> {
  const resp = await fetch('/api/maps/inspect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await resp.json()) as MapPointInspectResult & { error?: string };
  if (!resp.ok) {
    throw new Error(data.error || `Inspection failed (HTTP ${resp.status})`);
  }
  return data;
}

export async function fetchDiscoveryRegionsApi(farmId?: string): Promise<{
  regions: RegionalCityAggregate[];
  profiles: PublicDiscoveryProfile[];
  myConsent: DiscoveryConsentSettings | null;
  messages: DiscoveryMessageItem[];
}> {
  const qs = farmId ? `?farmId=${encodeURIComponent(farmId)}` : '';
  const resp = await fetch(`/api/maps/discovery/regions${qs}`);
  if (!resp.ok) throw new Error(`Failed to load regional discovery (${resp.status})`);
  return resp.json();
}

export async function saveDiscoveryOptInApi(payload: {
  farmId: string;
  optedIn: boolean;
  displayAlias: string;
  cityName: string;
  regionLabel?: string;
  approximateLat: number;
  approximateLon: number;
  areaHectares?: number | null;
  sharedCrops: string[];
  sharedPriorities: string[];
  irrigationTypeShared?: string;
  soilTextureShared?: string;
  climateScore?: number;
  acceptsMessages: boolean;
}): Promise<{ consent: DiscoveryConsentSettings; notice: string }> {
  const resp = await fetch('/api/maps/discovery/opt-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await resp.json()) as {
    consent?: DiscoveryConsentSettings;
    notice?: string;
    error?: string;
  };
  if (!resp.ok || !data.consent) {
    throw new Error(data.error || `Failed to update privacy settings (${resp.status})`);
  }
  return { consent: data.consent, notice: data.notice || 'Saved.' };
}

export async function revokeDiscoveryOptInApi(farmId: string): Promise<{ notice: string }> {
  const resp = await fetch(`/api/maps/discovery/opt-in/${encodeURIComponent(farmId)}`, {
    method: 'DELETE',
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

export async function sendDiscoveryMessageApi(payload: {
  fromAlias: string;
  toPublicId: string;
  text: string;
}): Promise<DiscoveryMessageItem> {
  const resp = await fetch('/api/maps/discovery/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await resp.json()) as { message?: DiscoveryMessageItem; error?: string };
  if (!resp.ok || !data.message) {
    throw new Error(data.error || `Message blocked (${resp.status})`);
  }
  return data.message;
}

export async function blockDiscoveryProfileApi(publicId: string): Promise<void> {
  const resp = await fetch('/api/maps/discovery/block', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
}

const LOCAL_WORKSPACE_FARMS_CACHE_KEY = 'fieldshift_workspace_farms_cache_v1';

export async function fetchWorkspaceFarms(): Promise<FarmMapRecord[]> {
  try {
    const resp = await fetch('/api/maps/farms');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = (await resp.json()) as { farms: FarmMapRecord[] };
    if (typeof window !== 'undefined' && Array.isArray(data.farms)) {
      window.localStorage.setItem(LOCAL_WORKSPACE_FARMS_CACHE_KEY, JSON.stringify(data.farms));
    }
    return data.farms;
  } catch (err) {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(LOCAL_WORKSPACE_FARMS_CACHE_KEY);
      if (raw) {
        return JSON.parse(raw) as FarmMapRecord[];
      }
    }
    throw err;
  }
}

export async function fetchFarmsInBounds(bounds: {
  west: number;
  south: number;
  east: number;
  north: number;
}): Promise<FarmMapRecord[]> {
  const qs = new URLSearchParams({
    west: String(bounds.west),
    south: String(bounds.south),
    east: String(bounds.east),
    north: String(bounds.north),
  });
  const resp = await fetch(`/api/maps/farms/map?${qs.toString()}`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = (await resp.json()) as { farms: FarmMapRecord[] };
  return data.farms;
}

export async function createWorkspaceFarm(payload: {
  name: string;
  crop?: string | null;
  locationLabel?: string;
  notes?: string;
  geometry: FarmGeoJsonGeometry;
}): Promise<FarmMapRecord> {
  const resp = await fetch('/api/maps/farms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await resp.json()) as { farm?: FarmMapRecord; error?: string };
  if (!resp.ok || !data.farm) {
    throw new Error(data.error || `Failed to create farm (HTTP ${resp.status})`);
  }
  return data.farm;
}

export async function updateWorkspaceFarmBoundary(
  farmId: string,
  payload: {
    geometry: FarmGeoJsonGeometry;
    expectedVersion?: number;
    changeReason?: string;
  }
): Promise<FarmMapRecord> {
  const resp = await fetch(`/api/maps/farms/${encodeURIComponent(farmId)}/boundary`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await resp.json()) as { farm?: FarmMapRecord; error?: string };
  if (!resp.ok || !data.farm) {
    throw new Error(data.error || `Failed to update farm boundary (HTTP ${resp.status})`);
  }
  return data.farm;
}

export async function deleteWorkspaceFarm(farmId: string): Promise<void> {
  const resp = await fetch(`/api/maps/farms/${encodeURIComponent(farmId)}`, {
    method: 'DELETE',
  });
  if (!resp.ok) {
    const data = (await resp.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Failed to delete farm (HTTP ${resp.status})`);
  }
}

