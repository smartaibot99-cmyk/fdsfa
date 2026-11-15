import { AreaUnit, FarmProfile } from './farm';

export type MapWorkspaceMode = 'explore' | 'edit_boundaries' | 'inspect_data' | 'compare' | 'discovery';

export type GeometryEditorState =
  | 'viewing'
  | 'drawing'
  | 'draft_valid'
  | 'draft_invalid'
  | 'editing_vertices'
  | 'validating'
  | 'save_pending'
  | 'saved'
  | 'save_failed';

export type LonLat = [number, number]; // [lon, lat] WGS84 EPSG:4326

export interface GeoJsonPolygonGeometry {
  type: 'Polygon';
  /** Ring 0 is exterior ring; rings 1..N are interior exclusion holes. Each ring is closed [lon, lat][]. */
  coordinates: LonLat[][];
}

export interface GeometryValidationIssue {
  code:
    | 'TOO_FEW_VERTICES'
    | 'INVALID_COORDINATE'
    | 'NOT_FINITE'
    | 'DUPLICATE_ADJACENT'
    | 'RING_UNCLOSED'
    | 'SELF_INTERSECTION'
    | 'ZERO_AREA'
    | 'IMPLAUSIBLE_SCALE'
    | 'HOLE_OUTSIDE_EXTERIOR'
    | 'OVERLAP_WARNING';
  severity: 'error' | 'warning';
  message: string;
  edgeIndices?: [number, number];
}

export interface GeometryValidationResult {
  valid: boolean;
  issues: GeometryValidationIssue[];
  grossAreaM2: number;
  excludedAreaM2: number;
  netAreaM2: number;
  perimeterM: number;
  centroid: { lat: number; lon: number } | null;
  vertexCount: number;
  holeCount: number;
}

export interface GeometryVersion {
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
  geometry: GeoJsonPolygonGeometry;
  originalImportedGeometry?: GeoJsonPolygonGeometry;
  editReason?: string;
}

export interface MapFieldRecord {
  id: string;
  farmId: string;
  name: string;
  cropId?: string;
  cropName?: string;
  soilSummary?: string;
  waterSummary?: string;
  status: 'Active' | 'Planned' | 'Fallow' | 'Needs Review';
  currentVersionId: string;
  versions: GeometryVersion[];
  staleCalculations: string[];
  batchImportId?: string;
  updatedAt: string;
}

export type BaseMapId = 'satellite' | 'satellite-labels' | 'street' | 'terrain' | 'neutral';

export type OverlayLayerId =
  | 'field_boundaries'
  | 'gibs_modis_true_color'
  | 'gibs_viirs_true_color'
  | 'gibs_imerg_precip'
  | 'weather_grid'
  | 'nasa_power_climate'
  | 'eonet_hazards'
  | 'elevation_terrain'
  | 'regional_discovery_clusters';

export type LayerGroupId =
  | 'Base map'
  | 'Boundaries & operations'
  | 'Satellite imagery'
  | 'Water & weather context'
  | 'Soil & terrain'
  | 'Regional discovery';

export interface LayerLegendStop {
  color: string;
  label: string;
}

export interface MapLayerDefinition {
  id: OverlayLayerId | BaseMapId;
  kind: 'basemap' | 'overlay';
  group: LayerGroupId;
  label: string;
  sourceProvider: string;
  productName: string;
  units: string;
  rangeLabel: string;
  resolutionLabel: string;
  nominalGridMeters: number;
  processingMethod: string;
  qualityCaveat: string;
  supportsTemporalDate: boolean;
  supportsOpacity: boolean;
  incompatibleWith?: string[];
  legend?: {
    title: string;
    missingDataColor: string;
    stops: LayerLegendStop[];
  };
}

export interface MapLayerRuntimeState {
  id: OverlayLayerId;
  enabled: boolean;
  opacity: number;
  pinned: boolean;
  status: 'Available' | 'Loading' | 'Stale' | 'Unavailable';
  statusReason?: string;
  observationDate: string;
}

export interface MapPointInspectResult {
  lat: number;
  lon: number;
  observationDate: string;
  inspectedFieldId: string | null;
  inspectedFieldName: string | null;
  fieldAreaHectares: number | null;
  datasets: Array<{
    layerId: string;
    title: string;
    provider: string;
    product: string;
    observationPeriod: string;
    spatialResolution: string;
    resolutionWarning: string | null;
    provenance: 'Observed' | 'Modelled' | 'Reanalysis' | 'Calculated' | 'Unavailable';
    qualityNote: string;
    metrics: Array<{
      label: string;
      value: string;
      unit: string;
    }>;
  }>;
}

export interface ImportedFeatureCandidate {
  index: number;
  suggestedName: string;
  geometry: GeoJsonPolygonGeometry | null;
  rawGeometryType: string;
  validation: GeometryValidationResult | null;
  error: string | null;
  selected: boolean;
}

export interface RegionalCityAggregate {
  cityKey: string;
  cityName: string;
  regionLabel: string;
  approximateLat: number;
  approximateLon: number;
  cohortCount: number;
  minCohortThreshold: number;
  meetsThreshold: boolean;
  insufficientReason?: string;
  commonCrops: string[];
  medianAreaBand?: string;
  meanClimateScore?: number | null;
  observationWindow: string;
  methodologyNote: string;
}

export interface PublicDiscoveryProfile {
  publicId: string;
  displayAlias: string;
  cityKey: string;
  cityName: string;
  farmScaleBand: 'Smallholder (< 10 ha)' | 'Medium (10–100 ha)' | 'Large (> 100 ha)';
  sharedCrops: string[];
  sharedPriorities: string[];
  irrigationTypeShared?: string;
  soilTextureShared?: string;
  acceptsMessages: boolean;
  updatedAt: string;
}

export interface DiscoveryConsentSettings {
  farmId: string;
  optedIn: boolean;
  displayAlias: string;
  cityName: string;
  regionLabel: string;
  shareCrops: boolean;
  shareSoilTexture: boolean;
  shareWaterMethod: boolean;
  acceptsMessages: boolean;
  updatedAt: string;
}

export interface DiscoveryMessageItem {
  id: string;
  fromAlias: string;
  toPublicId: string;
  cityName: string;
  text: string;
  createdAt: string;
}

export interface FarmWithFieldsSummary {
  farm: FarmProfile;
  fields: MapFieldRecord[];
  totalMappedHectares: number;
}

export interface AreaUnitPreference {
  unit: AreaUnit;
}

export type FarmHealthStatus = 'healthy' | 'moderate' | 'at_risk' | 'no_data';

export type FarmGeoJsonGeometry =
  | GeoJsonPolygonGeometry
  | {
      type: 'MultiPolygon';
      coordinates: LonLat[][][];
    };

export interface FarmAssessment {
  farmId: string;
  status: FarmHealthStatus;
  score: number | null;
  assessedAt: string;
  assessmentVersion: string;
  confidence?: number;
  explanation?: string;
}

export interface FarmMapRecord {
  id: string;
  name: string;
  crop: string | null;
  locationLabel: string;
  notes?: string;
  geometry: FarmGeoJsonGeometry;
  areaM2: number;
  areaHa: number;
  perimeterM: number;
  centroid: { lat: number; lon: number };
  labelPoint: { lat: number; lon: number };
  healthStatus: FarmHealthStatus;
  assessment: FarmAssessment;
  versionNumber: number;
  createdAt: string;
  updatedAt: string;
}

