export type ActivityPresetId =
  | 'outdoor_event'
  | 'farming'
  | 'hiking'
  | 'school_sports'
  | 'construction';

export type FactorKey =
  | 'rain'
  | 'heat'
  | 'cold'
  | 'wind'
  | 'hazard'
  | 'variability';

export type FactorWeights = Record<FactorKey, number>;

export interface ActivityPreset {
  id: ActivityPresetId;
  label: string;
  description: string;
  heatThresholdC: number;
  windThresholdMs: number;
  rainThresholdMm: number;
  coldThresholdC: number;
  defaultWeights: FactorWeights;
}

export interface PlaceSelection {
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  country?: string;
}

export interface PowerDailyPoint {
  date: string; // YYYY-MM-DD
  year: number;
  doy: number;
  tMaxC: number | null;
  tMinC: number | null;
  tMeanC: number | null;
  precipMm: number | null;
  windMs: number | null;
  humidityPct: number | null;
  solarKwhM2: number | null;
}

export interface PowerYearlySummary {
  year: number;
  meanMaxC: number | null;
  meanMinC: number | null;
  maxPrecipMm: number | null;
  totalPrecipMm: number | null;
  meanWindMs: number | null;
  rainyDaysOver5mm: number;
  hotDaysOverThreshold: number;
  coldDaysUnder2C: number;
  windyDaysOver10Ms: number;
  sampleCount: number;
}

export interface PowerClimateResult {
  lat: number;
  lon: number;
  targetDate: string;
  endDate?: string;
  yearsAnalyzed: number[];
  windowDays: PowerDailyPoint[];
  yearlySummaries: PowerYearlySummary[];
  datasetName: string;
  endpointUrl: string;
  fetchedAt: string;
  meanMaxC: number | null;
  meanMinC: number | null;
  meanTempC?: number | null;
  meanPrecipMm: number | null;
  meanWindMs: number | null;
  meanHumidityPct: number | null;
  meanSolarKwhM2: number | null;
}

export interface EonetEvent {
  id: string;
  title: string;
  description?: string;
  link: string;
  categories: { id: string; title: string }[];
  date: string;
  lat: number;
  lon: number;
  distanceKm?: number;
  magnitudeValue?: number;
  magnitudeUnit?: string;
}

export interface EonetFetchResult {
  events: EonetEvent[];
  nearbyEvents: EonetEvent[];
  datasetName: string;
  endpointUrl: string;
  fetchedAt: string;
}

export interface SubScore {
  key: FactorKey;
  label: string;
  rawMetricLabel: string;
  rawValue: number | null;
  unit: string;
  riskScore: number | null; // 0..100 (higher = worse risk)
  suitabilityScore: number | null; // 0..100 (higher = safer/better)
  weight: number; // 0..1 (normalized over available factors)
  contribution: number; // suitabilityScore * weight
  hasData: boolean;
  datasetCitation: string;
  formulaDescription: string;
}

export interface DeterministicScoreResult {
  dataScore: number;
  verdict: ScoreVerdict;
  confidence: number; // 0..1
  subScores: SubScore[];
  dataGaps: string[];
  activityId: ActivityPresetId;
}

export type ScoreVerdict = 'Excellent' | 'Good' | 'Caution' | 'Poor' | 'Avoid';

export interface GeminiAdjustment {
  factor: string;
  delta: number;
  reason: string;
}

export interface GeminiScoreOutput {
  anchorScore: number;
  verdict: ScoreVerdict;
  confidence: number;
  adjustments: GeminiAdjustment[];
  summary: string;
  keyDrivers: string[];
  recommendations: string[];
  dataGaps: string[];
}

export type TimelineStepStatus = 'pending' | 'running' | 'success' | 'error';

export interface StepTimelineItem {
  id: string;
  label: string;
  status: TimelineStepStatus;
  elapsedMs?: number;
  detail?: string;
  error?: string;
}

export interface AnchorAnalysis {
  id: string;
  place: PlaceSelection;
  targetDate: string;
  endDate?: string;
  activityId: ActivityPresetId;
  weights: FactorWeights;
  power: PowerClimateResult | null;
  eonet: EonetFetchResult | null;
  deterministic: DeterministicScoreResult;
  ai: GeminiScoreOutput | null;
  aiThoughtSummary: string;
  aiAvailable: boolean;
  aiFallbackNotice?: string;
  finalScore: number;
  finalVerdict: ScoreVerdict;
  finalConfidence: number;
  createdAt: string;
}

export interface SavedAnalysisSummary {
  id: string;
  place: PlaceSelection;
  targetDate: string;
  endDate?: string;
  activityId: ActivityPresetId;
  finalScore: number;
  dataScore: number;
  verdict: ScoreVerdict;
  createdAt: string;
}

export interface ApodData {
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: 'image' | 'video';
  date: string;
  copyright?: string;
  fetchedAt: string;
}

export interface CmrDataset {
  id: string;
  title: string;
  shortName: string;
  summary: string;
  timeStart?: string;
  updated?: string;
  links: { href: string; title?: string; rel?: string }[];
}

export interface DonkiEvent {
  messageType: string;
  messageID: string;
  messageURL: string;
  messageIssueTime: string;
  messageBody: string;
}

export interface NeoSummary {
  elementCount: number;
  hazardousCount: number;
  closestApproachName?: string;
  closestDistanceKm?: number;
  fetchedAt: string;
}

export interface SatelliteCatalogMeta {
  noradId: number;
  name: string;
  agency: string;
  measures: string;
  anchorContribution: string;
  color: string;
}

export interface SatelliteOmmRecord {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  CLASSIFICATION_TYPE: string;
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
}

export interface SatelliteLiveState {
  meta: SatelliteCatalogMeta;
  lat: number;
  lon: number;
  altitudeKm: number;
  velocityKmS: number;
  position3D: [number, number, number];
  orbitPoints: [number, number, number][];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isFallback?: boolean;
}

export interface CompareSlot {
  id: string;
  place: PlaceSelection;
  targetDate: string;
  activityId: ActivityPresetId;
  analysis?: AnchorAnalysis;
  loading?: boolean;
  error?: string;
}

export type GrowthStageKey = 'seed' | 'sprout' | 'vegetative' | 'flowering' | 'harvest';

export interface CropGrowthStage {
  stage: GrowthStageKey;
  label: string;
  dayRange: string;
  summary: string;
}

export interface CropIdealConditions {
  tempMinC: number;
  tempMaxC: number;
  annualRainfallMmMin: number;
  annualRainfallMmMax: number;
  sunlightHoursMin: number;
  sunlightHoursMax: number;
  soilType: string;
  soilPhMin: number;
  soilPhMax: number;
  waterNeed: 'Low' | 'Medium' | 'High';
  growingSeason: string;
  daysToHarvest: string;
}

export interface CropEntry {
  id: string;
  name: string;
  scientificName: string;
  family: string;
  origin: string;
  regionName: string;
  country: string;
  lat: number;
  lon: number;
  icon: string;
  color: string;
  description: string;
  growthStages: CropGrowthStage[];
  idealConditions: CropIdealConditions;
  funFacts: string[];
  producingCountries: string[];
  nutritionHighlights: string;
  nasaMonitoring: string;
  kind?: HotspotKind;
  globeFeatured?: boolean;
  uses?: string[];
  benefits?: PlantBenefits;
  treeDetails?: TreeDetails;
}

export interface CropSubScore {
  key: 'temperature' | 'precipitation' | 'sunlight' | 'humidity';
  label: string;
  observed: number | null;
  idealRange: string;
  unit: string;
  score: number | null;
  weight: number;
  contribution: number;
  inIdealRange: boolean | null;
  datasetCitation: string;
}

export interface CropHealthResult {
  dataScore: number;
  verdict: ScoreVerdict;
  confidence: number;
  subScores: CropSubScore[];
  dataGaps: string[];
  tips: string[];
}

export interface NasaImageItem {
  nasaId: string;
  title: string;
  description: string;
  dateCreated: string;
  thumbnailUrl: string;
  center?: string;
}

export type AppMode = 'space' | 'plant';

export type HotspotKind = 'crop' | 'tree' | 'meadow' | 'wildflower' | 'pasture' | 'solar';

export type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';

export interface TreeDetails {
  height: string;
  lifespan: string;
  leafShape: string;
  co2AbsorbedKgPerYear: string;
}

export interface PlantBenefits {
  shade: string;
  soilHealth: string;
  pollinators: string;
  co2PerYear: string;
}

export interface PlantHotspot {
  id: string;
  cropId: string;
  label: string;
  emoji: string;
  kind: HotspotKind;
  x: number; // % of original image width
  y: number; // % of original image height
  w: number; // % of original image width
  h: number; // % of original image height
  spriteType?:
    | 'corn'
    | 'wheat'
    | 'sunflowers'
    | 'tomatoes'
    | 'pumpkins'
    | 'apple-tree'
    | 'lavender'
    | 'carrots';
  scale?: number;
}

export * from './farm';

