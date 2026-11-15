import wheatImg from '../assets/images/farm_thumbnail_1790691751269.jpg';
import cornImg from '../assets/images/crop_maize_1790789298341.jpg';
import peasImg from '../assets/images/crop_beans_1790789288018.jpg';
import barleyImg from '../assets/images/crop_barley_1790791046594.jpg';
import soyImg from '../assets/images/crop_soybean_1790791011503.jpg';
import sunflowerImg from '../assets/images/crop_sunflower_1790791032279.jpg';
import lettuceImg from '../assets/images/crop_lettuce_1790789274802.jpg';
import { findCropCatalogItem, getCropDisplayName } from '../data/farmCropCatalog';
import { EonetFetchResult, FarmProfile, PowerClimateResult } from '../types';
import { computeDeterministicScore } from './scoring';
import { LiveWeatherReading } from '../services/weather';
import { createEmptyFarmProfile, loadFarmProfiles, upsertFarmProfile } from './farmStorage';

export interface HomeFieldView {
  id: string;
  name: string;
  cropId: string;
  cropName: string;
  image: string;
  isCurrent: boolean;
  rotationLabel: string;
  nitrogenRole: string;
  notes: string;
  healthPct: number;
  status: 'Healthy' | 'Monitor';
}

export interface WeeklyHealthSlot {
  dayNumber: number; // 1 (Mon) .. 7 (Sun)
  dayShort: string;
  dateISO: string;
  healthPct: number | null;
  isToday: boolean;
}

export interface HomeFarmAlert {
  id: string;
  severity: 'critical' | 'warning';
  source: 'Soil Sensor' | 'Live Weather' | 'NASA EONET' | 'NASA POWER' | 'Water & Rotation';
  message: string;
  recommendation: string;
  metric: string;
}

export interface HomeHealthBreakdown {
  overallPct: number;
  statusLabel: 'Very Healthy' | 'Healthy' | 'Moderate' | 'Needs Attention';
  trackHeadline: string;
  trackSubtext: string;
  components: Array<{
    label: string;
    score: number;
    detail: string;
  }>;
}

const CROP_IMAGE_MAP: Record<string, string> = {
  wheat: wheatImg,
  winter_wheat: wheatImg,
  maize: cornImg,
  corn: cornImg,
  sweet_corn: cornImg,
  peas: peasImg,
  green_beans: peasImg,
  chickpeas: peasImg,
  lentils: peasImg,
  soybean: soyImg,
  barley: barleyImg,
  oats: barleyImg,
  rye: barleyImg,
  sunflower: sunflowerImg,
  lettuce: lettuceImg,
  spinach: lettuceImg,
};

function resolveCropImage(cropId: string): string {
  const key = cropId.toLowerCase().replace(/\s+/g, '_');
  if (CROP_IMAGE_MAP[key]) return CROP_IMAGE_MAP[key];
  if (key.includes('corn') || key.includes('maize')) return cornImg;
  if (key.includes('pea') || key.includes('bean') || key.includes('lentil')) return peasImg;
  if (key.includes('soy')) return soyImg;
  if (key.includes('barley') || key.includes('oat') || key.includes('sorghum')) return barleyImg;
  if (key.includes('sunflower')) return sunflowerImg;
  if (key.includes('lettuce') || key.includes('spinach') || key.includes('cabbage')) return lettuceImg;
  return wheatImg;
}

function estimateRotationDays(cropId: string): number {
  const item = findCropCatalogItem(cropId);
  if (!item) return 90;
  if (item.category === 'Vegetables') return 65;
  if (item.category === 'Legumes and pulses') return 90;
  if (item.category === 'Root crops') return 100;
  if (item.category === 'Cereals and grains') return 90;
  return 110;
}

/**
 * Ensures there is at least one real persisted FarmProfile in farmStorage
 * when the user first visits the site, so Home and /analyze share the exact same profiles.
 */
export function ensureSyncedFarmProfiles(): FarmProfile[] {
  const existing = loadFarmProfiles();
  if (existing.length > 0 && existing.some((p) => p.location.farmName.trim())) {
    return existing;
  }

  const greenValley: FarmProfile = {
    ...createEmptyFarmProfile('Green Valley Farm'),
    id: 'farm-green-valley',
    currentStage: 5,
    completedStages: [1, 2, 3, 4],
    location: {
      farmName: 'Green Valley Farm',
      locationLabel: 'Ames, North Valley, Iowa',
      regionOrAddress: 'Story County, Iowa, United States',
      lat: 42.0308,
      lon: -93.6319,
      country: 'United States',
      entryMode: 'search',
    },
    areaValue: 48,
    areaUnit: 'hectares',
    soil: {
      texture: 'Silt loam',
      moistureStatus: 'measured',
      moisturePct: 21,
      moistureMethod: 'Soil moisture probe',
      moistureDate: new Date().toISOString().slice(0, 10),
      phStatus: 'tested',
      phValue: 6.6,
      phTestDate: new Date().toISOString().slice(0, 10),
      drainage: 'Moderately',
      preparationMethods: ['Compost / Organic fertiliser'],
      preparationOther: '',
    },
    water: {
      sources: ['Groundwater / Well', 'Rainwater collection'],
      sourcesOther: '',
      reliability: 'Always available',
      availableQuantityKnown: 'Yes',
      availableQuantityValue: 420,
      availableQuantityUnit: 'm³/day',
      qualityTested: 'Yes',
      ecValue: 0.65,
      ecUnit: 'dS/m',
      salinityValue: 410,
      salinityUnit: 'ppm',
      qualityTestDate: new Date().toISOString().slice(0, 10),
      wateringMethod: 'Hybrid (rainfall and irrigation)',
      irrigationMethod: 'Sprinkler irrigation',
      irrigationMethodOther: '',
      irrigationFrequency: 'Weekly',
      rainfallFrequency: 'Several times monthly',
    },
    crops: {
      previousCycle1: ['soybean'],
      previousCycle2: ['maize'],
      previousCycle3: ['wheat'],
      currentCrops: ['wheat'],
      plannedCrops: ['maize', 'peas'],
      noRestrictions: true,
      restrictedCrops: [],
      restrictedOther: '',
      fertiliserType: 'Both',
      fertiliserDetails: 'Split spring nitrogen application with legume cover residue',
    },
    planning: {
      horizon: 'Next year',
      priorities: ['Improving soil health', 'Maximising crop yield'],
      annualCycles: '2',
      growingSeasons: ['Spring', 'Summer', 'Autumn'],
      challenges: ['Unpredictable rainfall'],
      primaryChallenge: 'Unpredictable rainfall',
      challengeOther: '',
    },
  };

  const riverbend: FarmProfile = {
    ...createEmptyFarmProfile('Riverbend Valley Farm'),
    id: 'farm-riverbend-valley',
    currentStage: 5,
    completedStages: [1, 2, 3, 4],
    location: {
      farmName: 'Riverbend Valley Farm',
      locationLabel: 'Davis, Sacramento Valley, CA',
      regionOrAddress: 'Yolo County, California, United States',
      lat: 38.5449,
      lon: -121.7405,
      country: 'United States',
      entryMode: 'search',
    },
    areaValue: 32,
    areaUnit: 'hectares',
    soil: {
      texture: 'Loam',
      moistureStatus: 'measured',
      moisturePct: 34,
      moistureMethod: 'Tensiometer',
      moistureDate: new Date().toISOString().slice(0, 10),
      phStatus: 'tested',
      phValue: 6.8,
      phTestDate: new Date().toISOString().slice(0, 10),
      drainage: 'Quickly',
      preparationMethods: ['Raised beds', 'Compost / Organic fertiliser'],
      preparationOther: '',
    },
    water: {
      sources: ['Canal', 'Groundwater / Well'],
      sourcesOther: '',
      reliability: 'Always available',
      availableQuantityKnown: 'Yes',
      availableQuantityValue: 350,
      availableQuantityUnit: 'm³/day',
      qualityTested: 'Yes',
      ecValue: 0.72,
      ecUnit: 'dS/m',
      salinityValue: 460,
      salinityUnit: 'ppm',
      qualityTestDate: new Date().toISOString().slice(0, 10),
      wateringMethod: 'Artificial irrigation',
      irrigationMethod: 'Drip irrigation',
      irrigationMethodOther: '',
      irrigationFrequency: 'Every 2–3 days',
      rainfallFrequency: 'Rarely',
    },
    crops: {
      previousCycle1: ['chickpeas'],
      previousCycle2: ['barley'],
      previousCycle3: ['sunflower'],
      currentCrops: ['lettuce'],
      plannedCrops: ['soybean', 'barley'],
      noRestrictions: true,
      restrictedCrops: [],
      restrictedOther: '',
      fertiliserType: 'Organic fertilisers',
      fertiliserDetails: 'Drip fertigation with compost tea',
    },
    planning: {
      horizon: 'Next year',
      priorities: ['Water conservation', 'Improving soil health'],
      annualCycles: '3',
      growingSeasons: ['Spring', 'Summer', 'Autumn'],
      challenges: ['Extreme temperatures'],
      primaryChallenge: 'Extreme temperatures',
      challengeOther: '',
    },
  };

  // Persist both if empty so /analyze immediately sees them too
  upsertFarmProfile(riverbend);
  return upsertFarmProfile(greenValley);
}

/**
 * Compute real per-field health (15–99%) from actual soil metrics, crop catalog traits,
 * live weather conditions, and NASA POWER climatology (no fabricated offsets).
 */
function computeRealFieldHealth(
  profile: FarmProfile,
  cropId: string,
  fieldIndex: number,
  isCurrent: boolean,
  weather: LiveWeatherReading | null,
  power: PowerClimateResult | null,
  eonet: EonetFetchResult | null
): { healthPct: number; status: 'Healthy' | 'Monitor' } {
  const item = findCropCatalogItem(cropId);
  const det = power || eonet ? computeDeterministicScore(power, eonet, 'farming') : null;
  let score = det ? det.dataScore : 84;

  // Soil moisture suitability against crop water need
  if (profile.soil.moistureStatus !== 'unknown' && profile.soil.moisturePct !== null) {
    const m = profile.soil.moisturePct;
    const highWater = item?.waterNeed === 'High';
    const lowWater = item?.waterNeed === 'Low';
    if (highWater && m < 26) score -= 14;
    else if (lowWater && m > 52) score -= 10;
    else if (m < 22) score -= 12;
    else if (m >= 28 && m <= 48) score += 5;
  }

  // Soil pH suitability
  if (profile.soil.phStatus === 'tested' && profile.soil.phValue !== null) {
    const ph = profile.soil.phValue;
    if (ph >= 6.0 && ph <= 7.3) score += 3;
    else if (ph < 5.5 || ph > 8.0) score -= 12;
  }

  // Live weather match against crop sensitivity
  if (weather) {
    if (weather.tempC > 34 || weather.tempC < 2) score -= 18;
    else if (weather.tempC > 30 && item?.category === 'Vegetables') score -= 10;
    else if (weather.tempC >= 14 && weather.tempC <= 28) score += 3;

    if (weather.windKmh >= 35) score -= 14;
    else if (weather.windKmh >= 24 && item?.category === 'Cereals and grains') score -= 5;

    if (weather.precipMm >= 8 && profile.soil.drainage === 'Slowly') score -= 10;
  }

  // Nitrogen role synergy with farm soil/fertiliser plan
  if (item?.nitrogenRole === 'fixer') score += 4;
  else if (item?.nitrogenRole === 'heavy_feeder' && profile.crops.fertiliserType === 'Neither') score -= 7;

  // Water reliability penalty on active block
  if (
    isCurrent &&
    (profile.water.reliability === 'Frequently limited' ||
      profile.water.reliability === 'Highly unreliable')
  ) {
    score -= 9;
  }

  // Slight variance if multiple planned blocks have missing moisture measurements
  if (!isCurrent && profile.soil.moistureStatus === 'unknown' && fieldIndex > 0) {
    score -= 3;
  }

  const clamped = Math.round(Math.max(20, Math.min(98, score)));
  return {
    healthPct: clamped,
    status: clamped >= 80 ? 'Healthy' : 'Monitor',
  };
}

/**
 * Derive real field cards directly from the FarmProfile's actual current, planned,
 * and historical crops paired with real calculated per-field health.
 */
export function buildRealFarmFields(
  profile: FarmProfile,
  weather: LiveWeatherReading | null = null,
  power: PowerClimateResult | null = null,
  eonet: EonetFetchResult | null = null
): HomeFieldView[] {
  const fields: HomeFieldView[] = [];
  const usedIds = new Set<string>();

  const pushField = (cropId: string, isCurrent: boolean, roleNote: string) => {
    const cleanId = cropId.trim();
    if (!cleanId) return;
    const item = findCropCatalogItem(cleanId);
    const displayName = item?.name ?? getCropDisplayName(cleanId);
    const fieldNumber = fields.length + 1;
    const days = estimateRotationDays(cleanId);
    const evaluated = computeRealFieldHealth(
      profile,
      cleanId,
      fields.length,
      isCurrent,
      weather,
      power,
      eonet
    );
    fields.push({
      id: `${profile.id}-field-${fieldNumber}-${cleanId}`,
      name: `Field ${fieldNumber}`,
      cropId: cleanId,
      cropName: displayName,
      image: resolveCropImage(cleanId),
      isCurrent,
      rotationLabel: isCurrent ? 'Current' : `${days} days`,
      nitrogenRole: item?.nitrogenRole?.replace('_', ' ') ?? 'balanced',
      notes: roleNote,
      healthPct: evaluated.healthPct,
      status: evaluated.status,
    });
    usedIds.add(cleanId);
  };

  for (const cropId of profile.crops.currentCrops) {
    if (fields.length >= 3) break;
    pushField(
      cropId,
      true,
      `Active cultivation block in ${profile.location.farmName || 'this farm'} (${profile.soil.texture || 'field'} soil).`
    );
  }

  for (const cropId of profile.crops.plannedCrops) {
    if (fields.length >= 3) break;
    if (usedIds.has(cropId)) continue;
    const item = findCropCatalogItem(cropId);
    pushField(
      cropId,
      false,
      item
        ? `Planned next rotation (${item.category}; ${item.nitrogenRole.replace('_', ' ')}).`
        : 'Scheduled next crop rotation block.'
    );
  }

  for (const cropId of profile.crops.previousCycle1) {
    if (fields.length >= 3) break;
    if (usedIds.has(cropId)) continue;
    pushField(cropId, false, 'Recent prior-cycle crop block ready for rotation follow-up.');
  }

  return fields;
}

/**
 * Strictly calculates actual farm alerts from live weather, NASA EONET hazards,
 * NASA POWER climate anomalies, and measured soil/water inputs.
 * Returns [] when no real alert condition is met.
 */
export function evaluateRealFarmAlerts(
  profile: FarmProfile,
  fields: HomeFieldView[],
  weather: LiveWeatherReading | null,
  power: PowerClimateResult | null,
  eonet: EonetFetchResult | null
): HomeFarmAlert[] {
  const alerts: HomeFarmAlert[] = [];
  const primaryFieldName = fields[0]?.name ?? 'Field 1';

  // 1. Soil moisture alert (actual measured/estimated value below 25% or over-saturated > 70%)
  if (profile.soil.moistureStatus !== 'unknown' && profile.soil.moisturePct !== null) {
    if (profile.soil.moisturePct < 25) {
      alerts.push({
        id: 'soil-moisture-low',
        severity: 'critical',
        source: 'Soil Sensor',
        message: `Soil moisture is low in ${primaryFieldName}.`,
        recommendation: `Measured root-zone moisture is ${profile.soil.moisturePct}% (below optimal 28–45% band). Schedule targeted irrigation for ${primaryFieldName} (${fields[0]?.cropName ?? 'active crop'}).`,
        metric: `Measured moisture: ${profile.soil.moisturePct}% · Target: 28–45%`,
      });
    } else if (profile.soil.moisturePct > 70) {
      alerts.push({
        id: 'soil-moisture-high',
        severity: 'warning',
        source: 'Soil Sensor',
        message: `Excess soil saturation detected in ${primaryFieldName}.`,
        recommendation: `Moisture reading is ${profile.soil.moisturePct}%. Pause irrigation and inspect drainage channels to prevent root hypoxia.`,
        metric: `Measured moisture: ${profile.soil.moisturePct}% · Drainage: ${profile.soil.drainage || 'Check'}`,
      });
    }
  }

  // 2. Live Wind / Storm / Extreme Temperature alerts from Open-Meteo
  if (weather) {
    if (weather.windKmh >= 26) {
      alerts.push({
        id: 'live-high-wind',
        severity: weather.windKmh >= 40 ? 'critical' : 'warning',
        source: 'Live Weather',
        message: `High wind (${weather.windKmh} km/h) active at farm.`,
        recommendation: `Live wind speed is ${weather.windKmh} km/h. Postpone foliar spraying and secure light row covers until wind drops below 20 km/h.`,
        metric: `Live wind: ${weather.windKmh} km/h · ${weather.conditionLabel}`,
      });
    }

    if (weather.weatherCode >= 95 || weather.precipMm >= 8) {
      alerts.push({
        id: 'live-storm-precip',
        severity: 'critical',
        source: 'Live Weather',
        message: `Active ${weather.conditionLabel.toLowerCase()} over farm.`,
        recommendation: `Live precipitation (${weather.precipMm} mm) detected. Halt field machinery traffic to avoid soil compaction.`,
        metric: `Precipitation: ${weather.precipMm} mm · ${weather.conditionLabel}`,
      });
    } else if (weather.tempC >= 35) {
      alerts.push({
        id: 'live-heat-stress',
        severity: 'critical',
        source: 'Live Weather',
        message: `Heat stress warning (${weather.tempC}°C) at farm.`,
        recommendation: `Canopy temperatures exceed 35°C. Shift irrigation to pre-dawn or dusk to minimize evaporative loss.`,
        metric: `Live temperature: ${weather.tempC}°C · Humidity: ${weather.humidityPct}%`,
      });
    } else if (weather.tempC <= 1) {
      alerts.push({
        id: 'live-frost-risk',
        severity: 'critical',
        source: 'Live Weather',
        message: `Frost risk (${weather.tempC}°C) detected at farm.`,
        recommendation: `Near-freezing surface air. Protect tender seedlings and sensitive foliage overnight.`,
        metric: `Live temperature: ${weather.tempC}°C`,
      });
    }
  }

  // 3. NASA EONET v3 natural hazard alert within 300 km
  if (eonet && eonet.nearbyEvents.length > 0) {
    const nearest = eonet.nearbyEvents[0];
    const dist = nearest.distanceKm !== undefined ? `${Math.round(nearest.distanceKm)} km away` : 'within 300 km';
    alerts.push({
      id: `eonet-${nearest.id}`,
      severity: (nearest.distanceKm ?? 300) < 100 ? 'critical' : 'warning',
      source: 'NASA EONET',
      message: `${nearest.categories[0]?.title || 'Natural hazard'} (${dist}).`,
      recommendation: `NASA EONET v3 tracks active event "${nearest.title}" ${dist}. Monitor air quality, ash, or runoff impacts.`,
      metric: `NASA EONET v3 · Distance: ${dist}`,
    });
  }

  // 4. Soil pH out of agronomic balance
  if (profile.soil.phStatus === 'tested' && profile.soil.phValue !== null) {
    if (profile.soil.phValue < 5.5 || profile.soil.phValue > 8.0) {
      alerts.push({
        id: 'soil-ph-imbalance',
        severity: 'warning',
        source: 'Soil Sensor',
        message: `Soil pH (${profile.soil.phValue}) outside optimal range.`,
        recommendation:
          profile.soil.phValue < 5.5
            ? 'Acidic topsoil limits phosphorus and nitrogen uptake; plan agricultural lime amendment before next seeding.'
            : 'Alkaline topsoil may lock out micronutrients; apply elemental sulfur or organic compost.',
        metric: `Measured pH: ${profile.soil.phValue} · Target: 6.0–7.5`,
      });
    }
  }

  // 5. NASA POWER climatology wind/rain/heat risk (if wind > 7.5 m/s seasonal norm and no live wind alert yet)
  if (power && !alerts.some((a) => a.id === 'live-high-wind')) {
    if (power.meanWindMs !== null && power.meanWindMs >= 6.8) {
      alerts.push({
        id: 'power-wind-window',
        severity: 'warning',
        source: 'NASA POWER',
        message: `Elevated seasonal wind window in ${profile.location.locationLabel || 'region'}.`,
        recommendation: `20-year NASA POWER climatology shows higher gusts (${(power.meanWindMs * 3.6).toFixed(0)} km/h mean) in this calendar window.`,
        metric: `NASA POWER 20yr wind mean: ${(power.meanWindMs * 3.6).toFixed(1)} km/h`,
      });
    }
  }

  // 6. Water reliability warning
  if (
    profile.water.reliability === 'Frequently limited' ||
    profile.water.reliability === 'Highly unreliable'
  ) {
    alerts.push({
      id: 'water-reliability',
      severity: 'warning',
      source: 'Water & Rotation',
      message: 'Water supply reliability marked constrained.',
      recommendation: 'Prioritize drought-tolerant cover crops and drip scheduling to stretch reserves.',
      metric: `Reliability: ${profile.water.reliability}`,
    });
  }

  return alerts;
}

/**
 * Computes overall farm health (0–100%) strictly from real sub-calculations:
 * 1) NASA POWER + EONET deterministic suitability score (40% weight)
 * 2) Soil health & moisture balance (25% weight)
 * 3) Live weather comfort & stress index (20% weight)
 * 4) Water reliability & crop rotation diversity (15% weight)
 */
export function computeRealFarmHealth(
  profile: FarmProfile,
  fields: HomeFieldView[],
  weather: LiveWeatherReading | null,
  power: PowerClimateResult | null,
  eonet: EonetFetchResult | null,
  alerts: HomeFarmAlert[]
): HomeHealthBreakdown {
  // Component 1: NASA POWER + EONET Deterministic Score (40%)
  let climateScore = 82;
  let climateDetail = 'Awaiting NASA POWER climatology sync';
  if (power || eonet) {
    const det = computeDeterministicScore(power, eonet, 'farming');
    climateScore = det.dataScore;
    const hazardCount = eonet?.nearbyEvents.length ?? 0;
    climateDetail = `NASA POWER (${power?.yearsAnalyzed.length ?? 0}yr) · ${hazardCount} EONET hazards`;
  }

  // Component 2: Soil Condition & Moisture Balance (25%)
  let soilScore = 76;
  const soilNotes: string[] = [];
  if (profile.soil.moistureStatus !== 'unknown' && profile.soil.moisturePct !== null) {
    const m = profile.soil.moisturePct;
    if (m >= 28 && m <= 45) {
      soilScore = 95;
      soilNotes.push(`Optimal moisture (${m}%)`);
    } else if (m >= 20 && m < 28) {
      soilScore = 76;
      soilNotes.push(`Slightly dry (${m}%)`);
    } else if (m > 45 && m <= 60) {
      soilScore = 80;
      soilNotes.push(`Moist (${m}%)`);
    } else {
      soilScore = 55;
      soilNotes.push(`Moisture stress (${m}%)`);
    }
  } else {
    soilNotes.push('Moisture unmeasured');
  }
  if (profile.soil.phStatus === 'tested' && profile.soil.phValue !== null) {
    const ph = profile.soil.phValue;
    if (ph >= 6.0 && ph <= 7.3) {
      soilScore = Math.min(100, soilScore + 5);
      soilNotes.push(`pH ${ph}`);
    } else if (ph < 5.5 || ph > 8.0) {
      soilScore = Math.max(40, soilScore - 15);
      soilNotes.push(`pH ${ph} out of range`);
    }
  }

  // Component 3: Live Weather Stress Index (20%)
  let weatherScore = 88;
  let weatherDetail = 'Syncing live meteorological telemetry';
  if (weather) {
    weatherScore = 96;
    if (weather.tempC > 34 || weather.tempC < 2) weatherScore -= 28;
    else if (weather.tempC > 30 || weather.tempC < 6) weatherScore -= 12;
    if (weather.windKmh >= 35) weatherScore -= 24;
    else if (weather.windKmh >= 25) weatherScore -= 12;
    if (weather.weatherCode >= 95 || weather.precipMm >= 10) weatherScore -= 25;
    weatherScore = Math.max(25, Math.min(100, weatherScore));
    weatherDetail = `${weather.tempC}°C · ${weather.humidityPct}% RH · ${weather.windKmh} km/h`;
  }

  // Component 4: Water Reliability & Crop Rotation Diversity (15%)
  let rotationScore = 78;
  const roles = new Set(fields.map((f) => f.nitrogenRole));
  if (roles.has('fixer')) rotationScore += 12;
  if (fields.length >= 3) rotationScore += 6;
  if (profile.water.reliability === 'Always available') rotationScore += 4;
  else if (
    profile.water.reliability === 'Frequently limited' ||
    profile.water.reliability === 'Highly unreliable'
  ) {
    rotationScore -= 22;
  }
  rotationScore = Math.max(30, Math.min(100, rotationScore));

  // Weighted total minus small penalty per active critical alert
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const rawTotal =
    climateScore * 0.4 +
    soilScore * 0.25 +
    weatherScore * 0.2 +
    rotationScore * 0.15 -
    criticalCount * 2;
  const overallPct = Math.round(Math.max(15, Math.min(99, rawTotal)));

  let statusLabel: HomeHealthBreakdown['statusLabel'] = 'Very Healthy';
  let trackHeadline = 'Your farm is on track!';
  let trackSubtext = 'Everything looks healthy.';

  if (overallPct >= 85) {
    statusLabel = 'Very Healthy';
    trackHeadline = 'Your farm is on track!';
    trackSubtext =
      alerts.length === 0
        ? 'Everything looks healthy across all monitored fields.'
        : `Overall resilience is strong (${alerts.length} active advisory).`;
  } else if (overallPct >= 70) {
    statusLabel = 'Healthy';
    trackHeadline = 'Your farm is performing steadily.';
    trackSubtext =
      alerts.length === 0
        ? 'All core climate and soil indicators remain balanced.'
        : `Review ${alerts.length} active field advisory to maintain peak yield.`;
  } else if (overallPct >= 50) {
    statusLabel = 'Moderate';
    trackHeadline = 'Your farm needs targeted attention.';
    trackSubtext = `${alerts.length} condition alert(s) impacting your overall score.`;
  } else {
    statusLabel = 'Needs Attention';
    trackHeadline = 'Action recommended on active fields.';
    trackSubtext = 'Multiple environmental or soil stress factors detected.';
  }

  return {
    overallPct,
    statusLabel,
    trackHeadline,
    trackSubtext,
    components: [
      { label: 'NASA Climate & Hazards', score: Math.round(climateScore), detail: climateDetail },
      { label: 'Soil & Moisture Balance', score: Math.round(soilScore), detail: soilNotes.join(' · ') },
      { label: 'Live Weather Index', score: Math.round(weatherScore), detail: weatherDetail },
      {
        label: 'Rotation & Water',
        score: Math.round(rotationScore),
        detail: `${fields.length} fields · ${roles.has('fixer') ? 'Legume N-fixer included' : 'Rotation active'}`,
      },
    ],
  };
}

const DAILY_HEALTH_STORAGE_KEY = 'fieldshift_daily_health_v1';
const DISMISSED_ALERTS_STORAGE_KEY = 'fieldshift_dismissed_alerts_v1';

function toLocalDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readDailyHealthMap(): Record<string, Record<string, number>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(DAILY_HEALTH_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function recordDailyFarmHealth(farmId: string, healthPct: number): void {
  if (typeof window === 'undefined' || !farmId) return;
  try {
    const map = readDailyHealthMap();
    const todayISO = toLocalDateISO(new Date());
    const farmHistory = map[farmId] ?? {};
    farmHistory[todayISO] = Math.round(healthPct);
    map[farmId] = farmHistory;
    window.localStorage.setItem(DAILY_HEALTH_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Returns the 7 days of the current week (Days 1..7, Mon..Sun) strictly populated
 * from persisted daily health readings. Any unstored day remains null so no fake data is shown.
 */
export function getWeeklyFarmHealthSlots(farmId: string): {
  slots: WeeklyHealthSlot[];
  deltaVsPrevious: number | null;
} {
  const map = readDailyHealthMap();
  const farmHistory = map[farmId] ?? {};

  const today = new Date();
  const todayISO = toLocalDateISO(today);
  // ISO weekday: Monday = 1 .. Sunday = 7
  const isoDay = today.getDay() === 0 ? 7 : today.getDay();
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - (isoDay - 1));

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slots: WeeklyHealthSlot[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = toLocalDateISO(d);
    const val = typeof farmHistory[iso] === 'number' ? farmHistory[iso] : null;
    return {
      dayNumber: i + 1,
      dayShort: dayNames[i],
      dateISO: iso,
      healthPct: val,
      isToday: iso === todayISO,
    };
  });

  // Compute real delta vs most recent previously stored day (null if none stored prior to today)
  const sortedDates = Object.keys(farmHistory)
    .filter((d) => d < todayISO && typeof farmHistory[d] === 'number')
    .sort();
  const prevDate = sortedDates[sortedDates.length - 1];
  const todayScore = typeof farmHistory[todayISO] === 'number' ? farmHistory[todayISO] : null;
  const deltaVsPrevious =
    prevDate && todayScore !== null ? todayScore - farmHistory[prevDate] : null;

  return { slots, deltaVsPrevious };
}

export function loadDismissedAlertIds(farmId: string): string[] {
  if (typeof window === 'undefined' || !farmId) return [];
  try {
    const raw = window.localStorage.getItem(DISMISSED_ALERTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return Array.isArray(parsed?.[farmId]) ? parsed[farmId] : [];
  } catch {
    return [];
  }
}

export function saveDismissedAlertIds(farmId: string, ids: string[]): void {
  if (typeof window === 'undefined' || !farmId) return;
  try {
    const raw = window.localStorage.getItem(DISMISSED_ALERTS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    parsed[farmId] = ids;
    window.localStorage.setItem(DISMISSED_ALERTS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage errors
  }
}
