import {
  AreaUnit,
  DataProvenanceTag,
  DrainageRate,
  FarmAnalysisReport,
  FarmProfile,
  IrrigationFrequency,
  IrrigationMethod,
  PlanningHorizon,
  RainfallFrequency,
  SoilMoistureStatus,
  SoilPhStatus,
  SoilTexture,
  WateringMethod,
  WaterQualityTestStatus,
  WaterReliability,
  WaterSource,
} from './farm';
import { FarmGeoJsonGeometry, GeoJsonPolygonGeometry, GeometryVersion, LonLat } from './maps';

export type PortfolioStatus =
  | 'good'
  | 'needs_attention'
  | 'alert'
  | 'not_assessed'
  | 'partial'
  | 'needs_refresh'
  | 'archived';

export type FarmFreshnessState = 'fresh' | 'stale' | 'partial' | 'unassessed';

export type MyFarmsSubTab =
  | 'overview'
  | 'fields'
  | 'rotation'
  | 'soil'
  | 'water'
  | 'weather'
  | 'vegetation'
  | 'actions'
  | 'reports'
  | 'settings';

export type ProvenanceKind =
  | 'observed'
  | 'remote_sensing'
  | 'modelled'
  | 'farmer_reported'
  | 'calculated'
  | 'unavailable'
  | 'stale';

export type PlanDecisionAction = 'selected' | 'rejected' | 'deferred' | 'replaced';

export type PlanDecisionReasonCode =
  | 'water'
  | 'cost'
  | 'equipment'
  | 'market'
  | 'management_preference'
  | 'unavailable_crop'
  | 'agronomic_fit'
  | 'other';

export interface RotationSequenceStep {
  cycleLabel: string;
  cropId: string;
  cropName: string;
  nitrogenRole: 'fixer' | 'heavy_feeder' | 'light_feeder' | 'cover_builder';
  waterNeedBand: 'Low' | 'Moderate' | 'High';
  rationale: string;
}

export interface RotationCandidateOption {
  id: string;
  title: string;
  suitabilityScore: number; // 0-100 suitability score (kept separate from data confidence)
  confidencePct: number; // 0-100 data completeness/confidence
  primaryBenefit: string;
  waterDemandImpact: 'Reduces demand' | 'Neutral' | 'Increases demand';
  waterDemandMmEstimate: number | null;
  soilImpactLabel: string;
  warningNote?: string;
  steps: RotationSequenceStep[];
}

export interface ActivePlanSummary {
  planId: string;
  title: string;
  version: number;
  selectedAt: string;
  selectedBy: string;
  cropSequence: Array<{ cropId: string; cropName: string; cycleLabel: string }>;
  isRecommendedPlan: boolean;
}

export interface PlanDecisionEvent {
  id: string;
  farmId: string;
  fieldId?: string | null;
  fieldName?: string | null;
  timestamp: string;
  actor: string;
  action: PlanDecisionAction;
  candidateId: string;
  candidateTitle: string;
  candidateScoreSnapshot: number | null;
  priorPlan: {
    planId: string;
    title: string;
    version: number;
    crops: Array<{ cropId: string; cropName: string; cycleLabel: string }>;
  } | null;
  newPlan: {
    planId: string;
    title: string;
    version: number;
    crops: Array<{ cropId: string; cropName: string; cycleLabel: string }>;
  } | null;
  reasonCode: PlanDecisionReasonCode;
  reasonNote: string;
  sourceReportId?: string | null;
  sourceReportDate?: string | null;
}

export interface SoilLandProfile {
  texture: SoilTexture;
  moistureStatus: SoilMoistureStatus;
  moisturePct: number | null;
  moistureMethod: string;
  moistureDate: string;
  phStatus: SoilPhStatus;
  phValue: number | null;
  phTestDate: string;
  organicMatterPct: number | null;
  drainage: DrainageRate;
  slopePct: number | null;
  elevationM: number | null;
  preparationMethods: string[];
  notes: string;
}

export interface WaterIntelligenceProfile {
  sources: WaterSource[];
  reliability: WaterReliability;
  dailyCapacityKnown: boolean;
  dailyCapacityM3: number | null;
  qualityTested: WaterQualityTestStatus;
  ecDsM: number | null;
  salinityPpm: number | null;
  qualityTestDate: string;
  wateringMethod: WateringMethod | '';
  irrigationMethod: IrrigationMethod | '';
  irrigationFrequency: IrrigationFrequency | '';
  rainfallFrequency: RainfallFrequency | '';
  estimatedDailyDemandM3: number | null;
  demandAssumptionNote: string;
}

export interface MyFarmAssessment {
  status: PortfolioStatus;
  freshnessState: FarmFreshnessState;
  score: number | null;
  confidencePct: number;
  completenessPct: number;
  assessedAt: string | null;
  activeAlertsCount: number;
  criticalAlertsCount: number;
  summary: string;
  worstFieldId: string | null;
  worstFieldName: string | null;
  worstFieldReason: string | null;
  staleReasons: string[];
}

export interface MyFarmRecord {
  id: string;
  name: string;
  primaryCrop: string | null;
  locationLabel: string;
  regionLabel: string;
  country: string;
  timezone: string;
  centroid: { lat: number; lon: number } | null;
  geometry: FarmGeoJsonGeometry | null;
  areaUnit: AreaUnit;
  declaredAreaHa: number | null;
  mappedAreaHa: number; // Sum of valid non-overlapping fields or farm boundary fallback
  perimeterM: number;
  hasBoundary: boolean;
  areaGapNote: string | null;
  hasFieldOverlapWarning: boolean;
  overlapWarningDetail: string | null;
  isPrivate: boolean; // Always defaults to true (private to workspace)
  isDraft: boolean;
  archivedAt: string | null;
  notes: string;
  versionNumber: number;
  activePlan: ActivePlanSummary | null;
  recommendedPlanId: string | null;
  recommendedPlanTitle: string | null;
  soil: SoilLandProfile;
  water: WaterIntelligenceProfile;
  planningHorizon: PlanningHorizon | '';
  priorities: string[];
  challenges: string[];
  assessment: MyFarmAssessment;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioFieldRecord {
  id: string;
  farmId: string;
  name: string;
  cropId?: string;
  cropName?: string;
  previousCrops: string[];
  soilSummary?: string;
  waterSummary?: string;
  soilOverrides?: {
    texture?: SoilTexture;
    moistureStatus?: SoilMoistureStatus;
    moisturePct?: number | null;
    phStatus?: SoilPhStatus;
    phValue?: number | null;
    drainage?: DrainageRate;
  };
  waterOverrides?: {
    irrigationMethod?: IrrigationMethod | '';
    reliability?: WaterReliability | '';
    dailyDemandM3?: number | null;
  };
  status: 'Active' | 'Planned' | 'Fallow' | 'Needs Review';
  activePlanId?: string | null;
  activePlanTitle?: string | null;
  currentVersionId: string;
  versions: GeometryVersion[];
  staleCalculations: string[];
  rotationReviewDue: boolean;
  activeAlertsCount: number;
  criticalAlert?: string | null;
  lastAssessedAt: string | null;
  notes?: string;
  updatedAt: string;
}

export interface FarmObservationItem {
  id: string;
  farmId: string;
  fieldId?: string | null;
  fieldName?: string | null;
  category: 'scouting' | 'soil_lab' | 'pest_disease' | 'weather_impact' | 'management';
  title: string;
  detail: string;
  observedAt: string;
  provenance: DataProvenanceTag;
  createdAt: string;
}

export interface FarmTaskItem {
  id: string;
  farmId: string;
  fieldId?: string | null;
  fieldName?: string | null;
  title: string;
  category: 'irrigation' | 'soil' | 'planting' | 'scouting' | 'rotation';
  dueDate: string | null;
  priority: 'high' | 'normal' | 'low';
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface IrrigationLogItem {
  id: string;
  farmId: string;
  fieldId?: string | null;
  fieldName?: string | null;
  date: string;
  volumeM3: number;
  method: string;
  notes?: string;
  createdAt: string;
}

export interface SavedFarmSnapshot {
  id: string;
  farmId: string;
  fieldId?: string | null;
  fieldName?: string | null;
  generatedAt: string;
  modelVersion: string;
  triggerReason: string;
  suitabilityScore: number | null;
  confidencePct: number;
  completenessPct: number;
  weatherWindowSummary: string;
  dataAvailability: {
    nasaPower: 'available' | 'cached' | 'unavailable';
    openMeteo: 'available' | 'cached' | 'unavailable';
    nasaEonet: 'available' | 'cached' | 'unavailable';
    soilLab: 'measured' | 'estimated' | 'missing';
  };
  keyMetrics: {
    meanTempC: number | null;
    precipMmDay: number | null;
    et0MmDay: number | null;
    soilMoisturePct: number | null;
    phValue: number | null;
    mappedAreaHa: number;
  };
  recommendations: string[];
  report?: FarmAnalysisReport;
}

export type OutboxOpStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';

export type OutboxEntityType =
  | 'farm_create'
  | 'farm_patch'
  | 'farm_delete'
  | 'field_create'
  | 'field_patch'
  | 'field_boundary'
  | 'field_delete'
  | 'decision_log'
  | 'observation_add'
  | 'task_add'
  | 'task_toggle'
  | 'irrigation_add'
  | 'snapshot_save';

export interface OutboxOperation {
  operationId: string;
  entityType: OutboxEntityType;
  entityId: string;
  farmId: string;
  baseVersion: number | null;
  payloadSchemaVersion: 1;
  createdAt: string;
  conflictPolicy: 'ask_user' | 'append_only' | 'server_wins';
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  endpoint: string;
  payload: Record<string, unknown>;
  summaryLabel: string;
  status: OutboxOpStatus;
  attempts: number;
  lastError?: string;
  conflictServerSnapshot?: Record<string, unknown> | null;
}

export interface PortfolioFilterState {
  search: string;
  status: 'all' | 'good' | 'needs_attention' | 'alert' | 'not_assessed' | 'archived';
  region: string;
  sortBy: 'name' | 'area' | 'status' | 'assessedAt';
  sortDir: 'asc' | 'desc';
}

export interface LinkedFarmProfileBundle {
  profile: FarmProfile;
  farm: MyFarmRecord;
}

export interface GeoJsonGeometryPayload {
  geometry: GeoJsonPolygonGeometry;
  centroid: { lat: number; lon: number };
  areaHa: number;
  perimeterM: number;
  vertices: LonLat[];
}
