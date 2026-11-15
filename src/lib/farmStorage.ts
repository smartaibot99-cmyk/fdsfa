import { DataProvenanceTag, FarmProfile, SoilMoistureUnit } from '../types';

const FARM_PROFILES_KEY = 'anchor_farm_profiles_v1';
const ACTIVE_FARM_ID_KEY = 'anchor_active_farm_id_v1';

export function createEmptyFarmProfile(name = ''): FarmProfile {
  const now = new Date().toISOString();
  return {
    id: `farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: now,
    updatedAt: now,
    currentStage: 1,
    completedStages: [],
    location: {
      farmName: name,
      locationLabel: '',
      regionOrAddress: '',
      lat: null,
      lon: null,
      country: undefined,
      entryMode: 'search',
    },
    areaValue: null,
    areaUnit: 'hectares',
    soil: {
      texture: '',
      moistureStatus: 'unknown',
      moisturePct: null,
      moistureUnit: 'unspecified',
      moistureDepth: '',
      moistureMethod: '',
      moistureDate: '',
      phStatus: 'not_tested',
      phValue: null,
      phTestDate: '',
      drainage: '',
      preparationMethods: [],
      preparationOther: '',
    },
    water: {
      sources: [],
      sourcesOther: '',
      reliability: '',
      availableQuantityKnown: '',
      availableQuantityValue: null,
      availableQuantityUnit: 'm³/day',
      qualityTested: '',
      ecValue: null,
      ecUnit: 'dS/m',
      salinityValue: null,
      salinityUnit: 'ppm',
      qualityTestDate: '',
      wateringMethod: '',
      irrigationMethod: '',
      irrigationMethodOther: '',
      irrigationFrequency: '',
      rainfallFrequency: '',
    },
    crops: {
      previousCycle1: [],
      previousCycle2: [],
      previousCycle3: [],
      currentCrops: [],
      plannedCrops: [],
      noRestrictions: false,
      restrictedCrops: [],
      restrictedOther: '',
      fertiliserType: '',
      fertiliserDetails: '',
    },
    planning: {
      horizon: '',
      priorities: [],
      annualCycles: '',
      growingSeasons: [],
      challenges: [],
      primaryChallenge: '',
      challengeOther: '',
    },
  };
}

export function loadFarmProfiles(): FarmProfile[] {
  try {
    const raw = window.localStorage.getItem(FARM_PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FarmProfile[]) : [];
  } catch {
    return [];
  }
}

export function saveFarmProfilesList(profiles: FarmProfile[]): void {
  try {
    window.localStorage.setItem(FARM_PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    // Ignore storage quota / private mode issues
  }
}

export function upsertFarmProfile(profile: FarmProfile): FarmProfile[] {
  const existing = loadFarmProfiles();
  const updated: FarmProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  const idx = existing.findIndex((p) => p.id === updated.id);
  const next = idx >= 0
    ? existing.map((p, i) => (i === idx ? updated : p))
    : [updated, ...existing];
  saveFarmProfilesList(next);
  setActiveFarmId(updated.id);
  return next;
}

export function deleteFarmProfile(id: string): FarmProfile[] {
  const next = loadFarmProfiles().filter((p) => p.id !== id);
  saveFarmProfilesList(next);
  const active = getActiveFarmId();
  if (active === id) {
    setActiveFarmId(next[0]?.id ?? '');
  }
  return next;
}

export function getActiveFarmId(): string {
  try {
    return window.localStorage.getItem(ACTIVE_FARM_ID_KEY) || '';
  } catch {
    return '';
  }
}

export function setActiveFarmId(id: string): void {
  try {
    if (!id) {
      window.localStorage.removeItem(ACTIVE_FARM_ID_KEY);
    } else {
      window.localStorage.setItem(ACTIVE_FARM_ID_KEY, id);
    }
  } catch {
    // Ignore
  }
}

export interface ProfileCompletenessResult {
  overallPct: number;
  answeredCount: number;
  totalChecks: number;
  missingOrUnknown: string[];
  byCategory: {
    farm: { pct: number; missing: string[] };
    soil: { pct: number; missing: string[] };
    water: { pct: number; missing: string[] };
    crops: { pct: number; missing: string[] };
    priorities: { pct: number; missing: string[] };
    horizon: { pct: number; missing: string[] };
  };
}

export function computeProfileCompleteness(profile: FarmProfile): ProfileCompletenessResult {
  const farmMissing: string[] = [];
  let farmDone = 0;
  const farmTotal = 3;
  if (profile.location.farmName.trim()) farmDone++;
  else farmMissing.push('Farm name');
  if (
    (profile.location.lat !== null && profile.location.lon !== null) ||
    profile.location.locationLabel.trim() ||
    profile.location.regionOrAddress.trim()
  ) {
    farmDone++;
  } else {
    farmMissing.push('Farm location or coordinates');
  }
  if (profile.areaValue !== null && profile.areaValue > 0) farmDone++;
  else farmMissing.push('Total farming area');

  const soilMissing: string[] = [];
  let soilDone = 0;
  const soilTotal = 5;
  if (profile.soil.texture && profile.soil.texture !== 'Unknown') soilDone++;
  else soilMissing.push(profile.soil.texture === 'Unknown' ? 'Primary soil texture (Unknown)' : 'Primary soil texture');

  if (profile.soil.moistureStatus !== 'unknown' && profile.soil.moisturePct !== null) soilDone++;
  else soilMissing.push('Soil moisture measurement');

  if (profile.soil.phStatus === 'tested' && profile.soil.phValue !== null) soilDone++;
  else soilMissing.push('Laboratory or kit soil pH test');

  if (profile.soil.drainage && profile.soil.drainage !== 'Unknown') soilDone++;
  else soilMissing.push(profile.soil.drainage === 'Unknown' ? 'Field water drainage (Unknown)' : 'Field water drainage');

  if (profile.soil.preparationMethods.length > 0) soilDone++;
  else soilMissing.push('Soil preparation methods');

  const waterMissing: string[] = [];
  let waterDone = 0;
  const needsIrrigation =
    profile.water.wateringMethod === 'Artificial irrigation' ||
    profile.water.wateringMethod === 'Hybrid (rainfall and irrigation)';
  const needsRainfall =
    profile.water.wateringMethod === 'Rain-fed agriculture' ||
    profile.water.wateringMethod === 'Hybrid (rainfall and irrigation)';
  const waterTotal = 4 + (needsIrrigation ? 2 : 0) + (needsRainfall ? 1 : 0);

  if (profile.water.sources.length > 0 && !profile.water.sources.every((s) => s === 'Unknown')) waterDone++;
  else waterMissing.push('Primary water source');

  if (profile.water.reliability && profile.water.reliability !== 'Unknown') waterDone++;
  else waterMissing.push('Water supply reliability');

  if (profile.water.qualityTested === 'Yes') waterDone++;
  else waterMissing.push('Irrigation water quality test (EC / salinity)');

  if (profile.water.wateringMethod) waterDone++;
  else waterMissing.push('Primary watering method');

  if (needsIrrigation) {
    if (profile.water.irrigationMethod && profile.water.irrigationMethod !== 'Unknown') waterDone++;
    else waterMissing.push('Irrigation method');
    if (profile.water.irrigationFrequency && profile.water.irrigationFrequency !== 'Unknown') waterDone++;
    else waterMissing.push('Irrigation frequency');
  }
  if (needsRainfall) {
    if (profile.water.rainfallFrequency && profile.water.rainfallFrequency !== 'Unknown') waterDone++;
    else waterMissing.push('Reported rainfall frequency');
  }

  const cropsMissing: string[] = [];
  let cropsDone = 0;
  const cropsTotal = 4;
  if (
    profile.crops.previousCycle1.length > 0 ||
    profile.crops.previousCycle2.length > 0 ||
    profile.crops.previousCycle3.length > 0
  ) {
    cropsDone++;
  } else {
    cropsMissing.push('Previous growing cycle crop history');
  }
  if (profile.crops.currentCrops.length > 0 || profile.crops.plannedCrops.length > 0) cropsDone++;
  else cropsMissing.push('Current or planned crops');
  if (profile.crops.noRestrictions || profile.crops.restrictedCrops.length > 0) cropsDone++;
  else cropsMissing.push('Restricted crop declaration');
  if (profile.crops.fertiliserType && profile.crops.fertiliserType !== 'Unknown') cropsDone++;
  else cropsMissing.push('Fertiliser management practice');

  const prioritiesMissing: string[] = [];
  let prioritiesDone = 0;
  const prioritiesTotal = 2;
  if (profile.planning.priorities.length > 0) prioritiesDone++;
  else prioritiesMissing.push('Agricultural priorities');
  if (profile.planning.primaryChallenge) prioritiesDone++;
  else prioritiesMissing.push('Primary agricultural challenge');

  const horizonMissing: string[] = [];
  let horizonDone = 0;
  const horizonTotal = 3;
  if (profile.planning.horizon) horizonDone++;
  else horizonMissing.push('Planning horizon');
  if (profile.planning.annualCycles) horizonDone++;
  else horizonMissing.push('Annual growing cycles');
  if (profile.planning.growingSeasons.length > 0) horizonDone++;
  else horizonMissing.push('Typical growing season');

  const answeredCount = farmDone + soilDone + waterDone + cropsDone + prioritiesDone + horizonDone;
  const totalChecks = farmTotal + soilTotal + waterTotal + cropsTotal + prioritiesTotal + horizonTotal;
  const overallPct = totalChecks > 0 ? Math.round((answeredCount / totalChecks) * 100) : 0;

  return {
    overallPct,
    answeredCount,
    totalChecks,
    missingOrUnknown: [
      ...farmMissing,
      ...soilMissing,
      ...waterMissing,
      ...cropsMissing,
      ...prioritiesMissing,
      ...horizonMissing,
    ],
    byCategory: {
      farm: { pct: Math.round((farmDone / farmTotal) * 100), missing: farmMissing },
      soil: { pct: Math.round((soilDone / soilTotal) * 100), missing: soilMissing },
      water: { pct: Math.round((waterDone / waterTotal) * 100), missing: waterMissing },
      crops: { pct: Math.round((cropsDone / cropsTotal) * 100), missing: cropsMissing },
      priorities: { pct: Math.round((prioritiesDone / prioritiesTotal) * 100), missing: prioritiesMissing },
      horizon: { pct: Math.round((horizonDone / horizonTotal) * 100), missing: horizonMissing },
    },
  };
}

export function getSoilMoistureProvenance(profile: FarmProfile): DataProvenanceTag {
  if (profile.soil.moistureStatus === 'measured' && profile.soil.moisturePct !== null) return 'Measured';
  if (profile.soil.moistureStatus === 'estimated' && profile.soil.moisturePct !== null) return 'Estimated';
  return 'Unknown';
}

export function getSoilPhProvenance(profile: FarmProfile): DataProvenanceTag {
  if (profile.soil.phStatus === 'tested' && profile.soil.phValue !== null) return 'Measured';
  return 'Unknown';
}

export type WaterQualityState =
  | 'tested_with_results'
  | 'tested_results_missing'
  | 'not_tested'
  | 'unknown'
  | 'unanswered';

export function getWaterQualityState(profile: FarmProfile): WaterQualityState {
  const qt = profile.water.qualityTested;
  if (qt === 'Yes') {
    const hasReadings =
      profile.water.ecValue !== null || profile.water.salinityValue !== null;
    return hasReadings ? 'tested_with_results' : 'tested_results_missing';
  }
  if (qt === 'No') return 'not_tested';
  if (qt === 'Unknown') return 'unknown';
  return 'unanswered';
}

export function formatSoilMoistureUnit(unit?: SoilMoistureUnit): string {
  switch (unit) {
    case 'volumetric_vwc':
      return 'volumetric (% VWC)';
    case 'gravimetric':
      return 'gravimetric (% dry weight)';
    case 'available_water_pct':
      return '% available water capacity';
    default:
      return '';
  }
}

export function getMeasurementCaveats(profile: FarmProfile): string[] {
  const caveats: string[] = [];
  if (profile.soil.moistureStatus !== 'unknown' && profile.soil.moisturePct !== null) {
    const missingMoistureContext: string[] = [];
    if (!profile.soil.moistureUnit || profile.soil.moistureUnit === 'unspecified') {
      missingMoistureContext.push('unit/basis (e.g., % VWC vs. gravimetric)');
    }
    if (!profile.soil.moistureMethod.trim()) {
      missingMoistureContext.push('measurement method');
    }
    if (!profile.soil.moistureDepth?.trim()) {
      missingMoistureContext.push('sampling depth');
    }
    if (missingMoistureContext.length > 0) {
      caveats.push(`Soil moisture (${profile.soil.moisturePct}%) missing: ${missingMoistureContext.join(', ')}`);
    }
  }
  if (getWaterQualityState(profile) === 'tested_results_missing') {
    caveats.push('Irrigation water marked tested ("Yes"), but EC and salinity results were not entered');
  }
  if (
    profile.location.lat === null &&
    profile.location.lon === null &&
    (profile.location.locationLabel.trim() || profile.location.regionOrAddress.trim())
  ) {
    caveats.push('Location text entered without map coordinates (NASA POWER / EONET lookup skipped)');
  }
  return caveats;
}

export function exportFarmProfilesJson(profiles: FarmProfile[]): string {
  return JSON.stringify(
    {
      schema: 'anchor-smart-farm-profiles-v1',
      exportedAt: new Date().toISOString(),
      count: profiles.length,
      profiles,
    },
    null,
    2
  );
}

export function parseImportedFarmProfilesJson(rawText: string): FarmProfile[] {
  const parsed = JSON.parse(rawText) as { profiles?: unknown } | unknown[];
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray(parsed.profiles)
      ? parsed.profiles
      : null;

  if (!list) {
    throw new Error('Invalid JSON structure: expected an array of farm profiles.');
  }

  return list.map((item) => {
    const base = createEmptyFarmProfile();
    const rec = (item && typeof item === 'object' ? item : {}) as Partial<FarmProfile>;
    return {
      ...base,
      ...rec,
      id: typeof rec.id === 'string' && rec.id ? rec.id : base.id,
      location: { ...base.location, ...(rec.location ?? {}) },
      soil: { ...base.soil, ...(rec.soil ?? {}) },
      water: { ...base.water, ...(rec.water ?? {}) },
      crops: { ...base.crops, ...(rec.crops ?? {}) },
      planning: { ...base.planning, ...(rec.planning ?? {}) },
      updatedAt: new Date().toISOString(),
    };
  });
}
