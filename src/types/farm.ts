import { EonetFetchResult, PowerClimateResult } from './index';

export type DataProvenanceTag = 'Measured' | 'Reported' | 'Estimated' | 'Unknown';

export type AreaUnit = 'acres' | 'hectares';

export type SoilTexture =
  | 'Sandy'
  | 'Loamy sand'
  | 'Sandy loam'
  | 'Loam'
  | 'Silt loam'
  | 'Clay loam'
  | 'Clay'
  | 'Unknown';

export type SoilMoistureStatus = 'measured' | 'estimated' | 'unknown';

export type SoilMoistureUnit =
  | 'volumetric_vwc'
  | 'gravimetric'
  | 'available_water_pct'
  | 'unspecified';

export type SoilPhStatus = 'tested' | 'not_tested';

export type DrainageRate =
  | 'Very slowly'
  | 'Slowly'
  | 'Moderately'
  | 'Quickly'
  | 'Very quickly'
  | 'Unknown';

export type SoilPreparationMethod =
  | 'Ploughing / Tilling'
  | 'Harrowing'
  | 'Compost / Organic fertiliser'
  | 'Chemical fertilisers'
  | 'Raised beds'
  | 'No regular preparation'
  | 'Other';

export type WaterSource =
  | 'Groundwater / Well'
  | 'River / Stream'
  | 'Reservoir'
  | 'Canal'
  | 'Rainwater collection'
  | 'Recycled water'
  | 'Other'
  | 'Unknown';

export type WaterReliability =
  | 'Always available'
  | 'Usually available'
  | 'Sometimes limited'
  | 'Frequently limited'
  | 'Highly unreliable'
  | 'Unknown';

export type WaterQualityTestStatus = 'Yes' | 'No' | 'Unknown';

export type WateringMethod =
  | 'Rain-fed agriculture'
  | 'Artificial irrigation'
  | 'Hybrid (rainfall and irrigation)';

export type IrrigationMethod =
  | 'Drip irrigation'
  | 'Sprinkler irrigation'
  | 'Flood irrigation'
  | 'Furrow irrigation'
  | 'Manual watering'
  | 'Other'
  | 'Unknown';

export type IrrigationFrequency =
  | 'Multiple times daily'
  | 'Once daily'
  | 'Every 2–3 days'
  | 'Weekly'
  | 'Every two weeks'
  | 'Seasonally / Irregularly'
  | 'Only when required'
  | 'Unknown';

export type RainfallFrequency =
  | 'Almost daily'
  | 'Several times weekly'
  | 'Weekly'
  | 'Several times monthly'
  | 'Monthly'
  | 'Rarely'
  | 'Almost never'
  | 'Unknown';

export type CropCategoryGroup =
  | 'Cereals and grains'
  | 'Legumes and pulses'
  | 'Vegetables'
  | 'Fruits'
  | 'Root crops'
  | 'Cash crops'
  | 'Other';

export type FertiliserType =
  | 'Organic fertilisers'
  | 'Chemical fertilisers'
  | 'Both'
  | 'Neither'
  | 'Unknown';

export type PlanningHorizon =
  | 'Next growing cycle'
  | 'Next season'
  | 'Next 6 months'
  | 'Next year'
  | 'Next 2–3 years'
  | 'Next 5 years';

export type AgriculturalPriority =
  | 'Water conservation'
  | 'Improving soil health'
  | 'Climate resistance'
  | 'Crop suitability'
  | 'Maximising crop yield'
  | 'Reducing farming costs'
  | 'Long-term sustainability';

export type AnnualGrowingCycles = '1' | '2' | '3' | '4+' | 'Not fixed';

export type GrowingSeasonOption =
  | 'Winter'
  | 'Spring'
  | 'Summer'
  | 'Autumn'
  | 'Year-round'
  | 'Depends on the crop';

export type AgriculturalChallenge =
  | 'Water scarcity'
  | 'Poor soil fertility'
  | 'Unpredictable rainfall'
  | 'Extreme temperatures'
  | 'Soil drainage problems'
  | 'Low crop yields'
  | 'Pest and disease management'
  | 'High irrigation costs'
  | 'Other';

export type LocationEntryMode = 'search' | 'gps' | 'map' | 'manual';

export interface FarmLocationInfo {
  farmName: string;
  locationLabel: string;
  regionOrAddress: string;
  lat: number | null;
  lon: number | null;
  country?: string;
  entryMode: LocationEntryMode;
}

export interface FarmSoilInfo {
  texture: SoilTexture | '';
  moistureStatus: SoilMoistureStatus;
  moisturePct: number | null;
  moistureUnit?: SoilMoistureUnit;
  moistureDepth?: string;
  moistureMethod: string;
  moistureDate: string;
  phStatus: SoilPhStatus;
  phValue: number | null;
  phTestDate: string;
  drainage: DrainageRate | '';
  preparationMethods: SoilPreparationMethod[];
  preparationOther: string;
}

export interface FarmWaterInfo {
  sources: WaterSource[];
  sourcesOther: string;
  reliability: WaterReliability | '';
  availableQuantityKnown: 'Yes' | 'No' | 'Unknown' | '';
  availableQuantityValue: number | null;
  availableQuantityUnit: 'litres/day' | 'm³/day' | 'm³/season' | 'acre-feet/year' | 'gallons/day';
  qualityTested: WaterQualityTestStatus | '';
  ecValue: number | null;
  ecUnit: 'dS/m' | 'µS/cm' | 'mS/cm';
  salinityValue: number | null;
  salinityUnit: 'ppm' | 'mg/L' | 'ppt';
  qualityTestDate: string;
  wateringMethod: WateringMethod | '';
  irrigationMethod: IrrigationMethod | '';
  irrigationMethodOther: string;
  irrigationFrequency: IrrigationFrequency | '';
  rainfallFrequency: RainfallFrequency | '';
}

export interface FarmCropHistoryInfo {
  previousCycle1: string[];
  previousCycle2: string[];
  previousCycle3: string[];
  currentCrops: string[];
  plannedCrops: string[];
  noRestrictions: boolean;
  restrictedCrops: string[];
  restrictedOther: string;
  fertiliserType: FertiliserType | '';
  fertiliserDetails: string;
}

export interface FarmPlanningInfo {
  horizon: PlanningHorizon | '';
  priorities: AgriculturalPriority[];
  annualCycles: AnnualGrowingCycles | '';
  growingSeasons: GrowingSeasonOption[];
  challenges: AgriculturalChallenge[];
  primaryChallenge: AgriculturalChallenge | '';
  challengeOther: string;
}

export interface FarmProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  currentStage: 1 | 2 | 3 | 4 | 5;
  completedStages: number[];
  location: FarmLocationInfo;
  areaValue: number | null;
  areaUnit: AreaUnit;
  soil: FarmSoilInfo;
  water: FarmWaterInfo;
  crops: FarmCropHistoryInfo;
  planning: FarmPlanningInfo;
  lastReportGeneratedAt?: string;
}

export interface AgriculturalCropItem {
  id: string;
  name: string;
  scientificName: string;
  category: CropCategoryGroup;
  botanicalFamily: string;
  nitrogenRole: 'fixer' | 'heavy_feeder' | 'light_feeder' | 'cover';
  waterNeed: 'Low' | 'Medium' | 'High';
  tempMinC: number;
  tempMaxC: number;
  soilPhMin: number;
  soilPhMax: number;
  preferredDrainage: string;
  preferredSeasons: GrowingSeasonOption[];
  fromCropsJson?: boolean;
  referenceSource?: string;
  referenceVerified?: boolean;
}

export type EvidenceBasis =
  | 'Farmer-provided information'
  | 'Existing Anchor environmental data'
  | 'General agricultural knowledge'
  | 'Assumption requiring verification';

export interface FarmRecommendationItem {
  title: string;
  detail: string;
  basis: EvidenceBasis;
  whyGenerated: string;
  supportingFarmInfo: string[];
  supportingExternalData: string[];
  missingInfo: string[];
  furtherTestingNeeded: string | null;
}

export type SectionStatus = 'grounded' | 'partial' | 'insufficient';

export interface FarmAnalysisSection {
  key: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  title: string;
  status: SectionStatus;
  summary: string;
  insufficientNotice?: string;
  items: FarmRecommendationItem[];
}

export interface FarmAnalysisReport {
  farmId: string;
  farmName: string;
  generatedAt: string;
  completenessPct: number;
  completenessAnswered?: number;
  completenessTotal?: number;
  completenessByCategory?: {
    farm: { pct: number; missing: string[] };
    soil: { pct: number; missing: string[] };
    water: { pct: number; missing: string[] };
    crops: { pct: number; missing: string[] };
    priorities: { pct: number; missing: string[] };
    horizon: { pct: number; missing: string[] };
  };
  missingDataSummary: string[];
  measurementCaveats?: string[];
  externalDataStatus: {
    hasCoordinates: boolean;
    powerSummary: string | null;
    eonetSummary: string | null;
    powerData: PowerClimateResult | null;
    eonetData: EonetFetchResult | null;
  };
  excludedRestrictedCrops: string[];
  sections: FarmAnalysisSection[];
}

export interface FarmGeminiExplanation {
  plainLanguageSummary: string;
  questionnaireRecap: string;
  sectionHighlights: Array<{
    sectionKey: string;
    plainLanguageExplanation: string;
  }>;
  questionsForLocalAdvisor: string[];
}
