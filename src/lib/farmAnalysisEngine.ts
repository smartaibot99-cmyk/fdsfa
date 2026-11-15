import { findCropCatalogItem, getCropDisplayName } from '../data/farmCropCatalog';
import {
  AgriculturalChallenge,
  AgriculturalPriority,
  EonetFetchResult,
  FarmAnalysisReport,
  FarmAnalysisSection,
  FarmProfile,
  FarmRecommendationItem,
  PowerClimateResult,
} from '../types';
import {
  computeProfileCompleteness,
  formatSoilMoistureUnit,
  getMeasurementCaveats,
  getSoilMoistureProvenance,
  getSoilPhProvenance,
  getWaterQualityState,
} from './farmStorage';

const INSUFFICIENT_MSG = 'Insufficient information for a reliable farm-specific recommendation.';

function hasPriority(priorities: AgriculturalPriority[], target: AgriculturalPriority): boolean {
  return priorities.includes(target);
}

function hasChallenge(profile: FarmProfile, target: AgriculturalChallenge): boolean {
  return profile.planning.primaryChallenge === target || profile.planning.challenges.includes(target);
}

export interface PowerReferenceWindowInfo {
  yearsLabel: string;
  windowLabel: string;
  sampleCount: number;
}

export function formatPowerReferenceWindow(power: PowerClimateResult): PowerReferenceWindowInfo {
  const years = [...power.yearsAnalyzed].sort((a, b) => a - b);
  const yearsLabel =
    years.length > 1
      ? `${years[0]}–${years[years.length - 1]} (${years.length} years)`
      : years.length === 1
        ? `${years[0]} (1 year)`
        : 'unspecified years';

  const startBase = new Date(`${power.targetDate}T00:00:00Z`);
  const endBase = power.endDate ? new Date(`${power.endDate}T00:00:00Z`) : startBase;
  let windowLabel = `${power.targetDate} (±3-day calendar window)`;
  if (!Number.isNaN(startBase.getTime()) && !Number.isNaN(endBase.getTime())) {
    const winStart = new Date(startBase);
    winStart.setUTCDate(winStart.getUTCDate() - 3);
    const winEnd = new Date(endBase);
    winEnd.setUTCDate(winEnd.getUTCDate() + 3);
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    windowLabel = `${fmt(winStart)}–${fmt(winEnd)} (centered on ${power.targetDate}, ±3 days)`;
  }

  return {
    yearsLabel,
    windowLabel,
    sampleCount: power.windowDays.length,
  };
}

function resolvePowerMeanTemp(power: PowerClimateResult): {
  valueC: number;
  isActualT2m: boolean;
  label: string;
} | null {
  if (power.meanTempC !== null && power.meanTempC !== undefined) {
    return {
      valueC: power.meanTempC,
      isActualT2m: true,
      label: `NASA POWER daily mean temperature (T2M: ${power.meanTempC.toFixed(1)} °C)`,
    };
  }
  if (power.meanMaxC !== null && power.meanMinC !== null) {
    const est = (power.meanMaxC + power.meanMinC) / 2;
    return {
      valueC: est,
      isActualT2m: false,
      label: `estimated midpoint of NASA POWER mean daily high/low (${est.toFixed(1)} °C; direct T2M unavailable)`,
    };
  }
  return null;
}

function buildClimateSummary(power: PowerClimateResult | null): string | null {
  if (!power) return null;
  const win = formatPowerReferenceWindow(power);
  const parts: string[] = [];
  const resolvedMean = resolvePowerMeanTemp(power);
  if (resolvedMean) {
    parts.push(
      resolvedMean.isActualT2m
        ? `daily mean ${resolvedMean.valueC.toFixed(1)} °C (T2M)`
        : `estimated high/low midpoint ${resolvedMean.valueC.toFixed(1)} °C (T2M unavailable)`
    );
  }
  if (power.meanMaxC !== null && power.meanMinC !== null) {
    parts.push(`mean daily high ${power.meanMaxC.toFixed(1)} °C / low ${power.meanMinC.toFixed(1)} °C`);
  }
  if (power.meanPrecipMm !== null) {
    parts.push(`mean daily precipitation ${power.meanPrecipMm.toFixed(2)} mm/day`);
  }
  if (power.meanHumidityPct !== null) {
    parts.push(`mean humidity ${Math.round(power.meanHumidityPct)}%`);
  }
  if (power.meanSolarKwhM2 !== null) {
    parts.push(`solar irradiance ${power.meanSolarKwhM2.toFixed(1)} kWh/m²/day`);
  }
  return parts.length > 0
    ? `NASA POWER (${win.yearsLabel}; 7-day calendar window ${win.windowLabel}, ${win.sampleCount} daily samples): ${parts.join(', ')}.`
    : null;
}

function buildEonetSummary(eonet: EonetFetchResult | null): string | null {
  if (!eonet) return null;
  if (eonet.nearbyEvents.length === 0) {
    return 'NASA EONET v3: 0 active natural hazard events reported within 300 km in the past 30 days.';
  }
  const sample = eonet.nearbyEvents
    .slice(0, 3)
    .map((e) => `${e.title} (${e.distanceKm ?? '?'} km)`)
    .join('; ');
  return `NASA EONET v3: ${eonet.nearbyEvents.length} active event(s) within 300 km — ${sample}.`;
}

export function generateDeterministicFarmAnalysis(
  profile: FarmProfile,
  power: PowerClimateResult | null,
  eonet: EonetFetchResult | null
): FarmAnalysisReport {
  const completeness = computeProfileCompleteness(profile);
  const hasCoords = profile.location.lat !== null && profile.location.lon !== null;
  const powerSummary = buildClimateSummary(power);
  const eonetSummary = buildEonetSummary(eonet);

  const restrictedSet = new Set(profile.crops.noRestrictions ? [] : profile.crops.restrictedCrops);
  const excludedRestrictedCrops = profile.crops.noRestrictions
    ? []
    : [
        ...profile.crops.restrictedCrops.map(getCropDisplayName),
        ...(profile.crops.restrictedOther.trim() ? [profile.crops.restrictedOther.trim()] : []),
      ];

  // ---------------------------------------------------------------------------
  // SECTION A: Soil Condition Overview
  // ---------------------------------------------------------------------------
  const soilItems: FarmRecommendationItem[] = [];
  const soilTextureKnown = Boolean(profile.soil.texture && profile.soil.texture !== 'Unknown');
  const moistureProv = getSoilMoistureProvenance(profile);
  const phProv = getSoilPhProvenance(profile);
  const drainageKnown = Boolean(profile.soil.drainage && profile.soil.drainage !== 'Unknown');

  if (!soilTextureKnown && moistureProv === 'Unknown' && phProv === 'Unknown' && !drainageKnown) {
    soilItems.push({
      title: 'Soil baseline incomplete',
      detail: `${INSUFFICIENT_MSG} Texture, moisture, pH, and drainage are all unmeasured or unknown.`,
      basis: 'Assumption requiring verification',
      whyGenerated: 'Core soil properties were left unknown or untested in Stage 2.',
      supportingFarmInfo: ['Soil texture, moisture, pH, and drainage marked unknown or untested'],
      supportingExternalData: [],
      missingInfo: ['Primary soil texture', 'Root-zone soil moisture reading', 'Laboratory/kit soil pH test', 'Field drainage observation'],
      furtherTestingNeeded: 'Collect a representative composite topsoil sample (0–15 cm) for lab pH, texture, organic matter, and N-P-K testing.',
    });
  } else {
    if (soilTextureKnown) {
      const tx = profile.soil.texture;
      const isCoarse = tx === 'Sandy' || tx === 'Loamy sand' || tx === 'Sandy loam';
      const isFine = tx === 'Clay' || tx === 'Clay loam';
      soilItems.push({
        title: `General behaviour for ${tx} soil`,
        detail: isCoarse
          ? `${tx} typically drains faster with lower water and nutrient holding capacity; lighter, more frequent water pulses and organic matter additions are generally helpful, though exact rates depend on measured field retention.`
          : isFine
            ? `${tx} generally retains water and nutrients well but infiltrates slowly; monitor compaction and surface crusting before scheduling heavy irrigation.`
            : `${tx} typically provides balanced pore space for moisture retention and aeration, supporting diverse root depths when organic matter is maintained.`,
        basis: 'General agricultural knowledge',
        whyGenerated: `Farmer reported primary soil texture as ${tx}.`,
        supportingFarmInfo: [`Reported soil texture: ${tx}`],
        supportingExternalData: [],
        missingInfo: ['Laboratory particle-size (% sand/silt/clay) and organic carbon %'],
        furtherTestingNeeded: 'Confirm topsoil and subsoil texture changes across blocks with a hand-texture or lab particle test.',
      });
    }

    if (moistureProv !== 'Unknown' && profile.soil.moisturePct !== null) {
      const pct = profile.soil.moisturePct;
      const unitLabel = formatSoilMoistureUnit(profile.soil.moistureUnit);
      const methodText = profile.soil.moistureMethod.trim();
      const depthText = profile.soil.moistureDepth?.trim() || '';

      const missingMoistureContext: string[] = [];
      if (!unitLabel) missingMoistureContext.push('moisture unit/basis (e.g., % VWC, gravimetric %, or % available water)');
      if (!methodText) missingMoistureContext.push('measurement method');
      if (!depthText) missingMoistureContext.push('sampling depth');
      if (!soilTextureKnown) missingMoistureContext.push('soil texture');
      if (profile.soil.moistureStatus === 'estimated') {
        missingMoistureContext.push('instrument-verified sensor or gravimetric reading');
      }

      const contextParts = [
        unitLabel || null,
        methodText ? `method: ${methodText}` : null,
        depthText ? `depth: ${depthText}` : null,
        profile.soil.moistureDate ? `date: ${profile.soil.moistureDate}` : null,
      ].filter(Boolean);

      const isUncertain =
        missingMoistureContext.length > 0 || profile.soil.moistureStatus === 'estimated';

      soilItems.push({
        title: isUncertain
          ? `${moistureProv} soil moisture: ${pct}% (interpretation uncertain)`
          : `${moistureProv} soil moisture: ${pct}% (${unitLabel})`,
        detail: isUncertain
          ? `Reported ${moistureProv.toLowerCase()} soil moisture is ${pct}%${contextParts.length ? ` (${contextParts.join('; ')})` : ''}. Interpretation is uncertain: Anchor cannot classify ${pct}% as dry, moderate, or wet without knowing ${missingMoistureContext.join(', ')} and soil water-retention limits (field capacity / wilting point).`
          : `Reported ${moistureProv.toLowerCase()} soil moisture is ${pct}% (${contextParts.join('; ')}) on ${profile.soil.texture} soil. Anchor does not apply a universal moisture threshold; evaluate ${pct}% against soil-specific field capacity, permanent wilting point, and active crop rooting depth.`,
        basis: isUncertain ? 'Assumption requiring verification' : 'Farmer-provided information',
        whyGenerated: `Farmer recorded ${moistureProv.toLowerCase()} soil moisture of ${pct}%${methodText ? ` via ${methodText}` : ''}${depthText ? ` at ${depthText}` : ''}.`,
        supportingFarmInfo: [
          `Soil moisture: ${pct}% (${moistureProv})`,
          ...(unitLabel ? [`Unit/basis: ${unitLabel}`] : ['Unit/basis: Not specified']),
          ...(methodText ? [`Method: ${methodText}`] : ['Method: Not specified']),
          ...(depthText ? [`Depth: ${depthText}`] : ['Depth: Not specified']),
          ...(profile.soil.moistureDate ? [`Date: ${profile.soil.moistureDate}`] : []),
        ],
        supportingExternalData:
          power?.meanPrecipMm !== null && power?.meanPrecipMm !== undefined
            ? [`NASA POWER mean precip (${formatPowerReferenceWindow(power).windowLabel}): ${power.meanPrecipMm.toFixed(2)} mm/day`]
            : [],
        missingInfo: [
          ...missingMoistureContext,
          'Soil water-retention reference (field capacity & permanent wilting point for this field)',
        ],
        furtherTestingNeeded:
          profile.soil.moistureStatus === 'estimated' || !methodText || !unitLabel || !depthText
            ? 'Record measurement unit (% VWC vs. gravimetric), sampling depth (e.g., 0–15 cm), and instrument/gravimetric method before using moisture % to schedule irrigation.'
            : 'Compare sensor/gravimetric % against soil-texture field capacity and wilting point at active root depth.',
      });
    } else {
      soilItems.push({
        title: 'Soil moisture not measured',
        detail: 'Without a soil moisture reading, Anchor cannot verify current root-zone water status.',
        basis: 'Assumption requiring verification',
        whyGenerated: 'Soil moisture was marked Unknown / Not measured.',
        supportingFarmInfo: ['Soil moisture: Unknown'],
        supportingExternalData: [],
        missingInfo: ['Root-zone soil moisture (%), unit/basis, sampling depth, and measurement method'],
        furtherTestingNeeded: 'Inspect moisture at active root depth (e.g., 0–15 cm) and record unit, depth, and method before planting or irrigating.',
      });
    }

    if (phProv === 'Measured' && profile.soil.phValue !== null) {
      const ph = profile.soil.phValue;
      soilItems.push({
        title: `Tested soil pH: ${ph.toFixed(1)}`,
        detail:
          ph < 5.8
            ? `Tested pH ${ph.toFixed(1)} sits in the acidic range (< 5.8) under general soil-chemistry guidance, where availability of phosphorus, calcium, and legume nodulation can decline; consult local extension and a lab buffer-pH test before sizing lime.`
            : ph > 7.5
              ? `Tested pH ${ph.toFixed(1)} sits in the alkaline range (> 7.5) under general soil-chemistry guidance, where iron, zinc, and phosphorus availability can decrease; organic matter and adapted crop choices are useful considerations.`
              : `Tested pH ${ph.toFixed(1)} sits in the general 5.8–7.5 soil-chemistry window where nutrient availability is broadly favorable across many field crops, though specific crop tolerances vary.`,
        basis: 'Farmer-provided information',
        whyGenerated: `Farmer provided soil pH test result of ${ph.toFixed(1)}; interpreted with general soil-chemistry guidance.`,
        supportingFarmInfo: [
          `Soil pH: ${ph.toFixed(1)} (Tested)`,
          ...(profile.soil.phTestDate ? [`Test date: ${profile.soil.phTestDate}`] : []),
        ],
        supportingExternalData: [],
        missingInfo: ['Soil buffer pH and exchangeable cations (Ca, Mg, K) for amendment sizing'],
        furtherTestingNeeded: ph < 5.8 || ph > 7.5 ? 'Lab buffer-pH / calcium-carbonate test before applying soil amendments.' : null,
      });
    } else {
      soilItems.push({
        title: 'Soil pH untested',
        detail: 'Soil pH has not been tested, so nutrient availability constraints (acidic lockup or alkaline micronutrient deficiency) remain unverified.',
        basis: 'Assumption requiring verification',
        whyGenerated: 'Soil pH was marked Not tested.',
        supportingFarmInfo: ['Soil pH: Not tested'],
        supportingExternalData: [],
        missingInfo: ['Laboratory or calibrated probe soil pH'],
        furtherTestingNeeded: 'Run a soil pH and basic nutrient lab panel before applying lime, sulfur, or heavy fertiliser.',
      });
    }

    if (drainageKnown) {
      const dr = profile.soil.drainage;
      soilItems.push({
        title: `Drainage observation: ${dr}`,
        detail:
          dr === 'Very slowly' || dr === 'Slowly'
            ? 'Slow drainage elevates waterlogging and root-oxygen stress risks during heavy rains or flood/furrow irrigation. Consider raised beds or surface runoff channels.'
            : dr === 'Quickly' || dr === 'Very quickly'
              ? 'Fast drainage reduces standing water risk but increases moisture and nitrate leaching; mulching and split organic applications help retain moisture.'
              : 'Moderate drainage generally supports healthy aeration while holding usable moisture between rainfall or irrigation events.',
        basis: 'Farmer-provided information',
        whyGenerated: `Farmer observed field drainage as ${dr}.`,
        supportingFarmInfo: [`Field drainage: ${dr}`],
        supportingExternalData: [],
        missingInfo: ['Subsoil hardpan or water-table depth check'],
        furtherTestingNeeded: dr === 'Very slowly' || dr === 'Slowly' ? 'Check 30–50 cm depth for a compacted plow pan or perched water table.' : null,
      });
    }

    if (profile.soil.preparationMethods.length > 0) {
      soilItems.push({
        title: 'Reported soil preparation practices',
        detail: `Practices selected (${profile.soil.preparationMethods.join(', ')}) shape surface tilth, infiltration, and residue cover. Combining organic inputs with reduced disturbance where feasible helps preserve soil aggregates.`,
        basis: 'Farmer-provided information',
        whyGenerated: 'Farmer listed current soil preparation practices.',
        supportingFarmInfo: [`Preparation: ${profile.soil.preparationMethods.join(', ')}`],
        supportingExternalData: [],
        missingInfo: ['Tillage depth and soil organic matter %'],
        furtherTestingNeeded: null,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // SECTION B: Water Availability and Irrigation Assessment
  // ---------------------------------------------------------------------------
  const waterItems: FarmRecommendationItem[] = [];
  const waterMethod = profile.water.wateringMethod;
  const reliabilityKnown = Boolean(profile.water.reliability && profile.water.reliability !== 'Unknown');

  if (!waterMethod && profile.water.sources.length === 0) {
    waterItems.push({
      title: 'Water profile incomplete',
      detail: `${INSUFFICIENT_MSG} Primary water source and watering method were not specified.`,
      basis: 'Assumption requiring verification',
      whyGenerated: 'Water source and primary watering method are missing from Stage 3.',
      supportingFarmInfo: [],
      supportingExternalData: powerSummary ? [powerSummary] : [],
      missingInfo: ['Primary water source', 'Water supply reliability', 'Watering method'],
      furtherTestingNeeded: 'Record primary water source(s), supply reliability, and whether irrigation is used.',
    });
  } else {
    if (profile.water.sources.length > 0 || reliabilityKnown) {
      waterItems.push({
        title: `Source & supply reliability${reliabilityKnown ? `: ${profile.water.reliability}` : ''}`,
        detail: `Water source(s): ${profile.water.sources.length ? profile.water.sources.join(', ') : 'Not specified'}. ${
          profile.water.availableQuantityKnown === 'Yes' && profile.water.availableQuantityValue !== null
            ? `Reported available quantity: ${profile.water.availableQuantityValue} ${profile.water.availableQuantityUnit}.`
            : 'Exact available water volume is unknown; Anchor does not estimate water volume from source names alone.'
        } ${
          profile.water.reliability === 'Frequently limited' || profile.water.reliability === 'Highly unreliable' || profile.water.reliability === 'Sometimes limited'
            ? 'Limited reliability increases sensitivity to dry spells and favours drought-tolerant crops or water-saving delivery.'
            : ''
        }`.trim(),
        basis: 'Farmer-provided information',
        whyGenerated: 'Derived from Stage 3 water source and supply reliability answers.',
        supportingFarmInfo: [
          `Sources: ${profile.water.sources.join(', ') || 'None'}`,
          `Reliability: ${profile.water.reliability || 'Not specified'}`,
          ...(profile.water.availableQuantityKnown === 'Yes' && profile.water.availableQuantityValue !== null
            ? [`Reported quantity: ${profile.water.availableQuantityValue} ${profile.water.availableQuantityUnit}`]
            : []),
        ],
        supportingExternalData: [],
        missingInfo: profile.water.availableQuantityKnown !== 'Yes' ? ['Measured seasonal or daily water allocation volume'] : [],
        furtherTestingNeeded: profile.water.availableQuantityKnown !== 'Yes' ? 'Measure pump flow rate (L/min) or seasonal storage volume to size crop acreage accurately.' : null,
      });
    }

    const waterQualityState = getWaterQualityState(profile);
    if (waterQualityState === 'tested_with_results') {
      waterItems.push({
        title: 'Irrigation water quality (tested with results)',
        detail: `Reported water test results — ${[
          profile.water.ecValue !== null ? `EC: ${profile.water.ecValue} ${profile.water.ecUnit}` : null,
          profile.water.salinityValue !== null ? `Salinity: ${profile.water.salinityValue} ${profile.water.salinityUnit}` : null,
        ]
          .filter(Boolean)
          .join(', ')}. Compare salinity against specific crop thresholds before planting salt-sensitive vegetables or fruits.`,
        basis: 'Farmer-provided information',
        whyGenerated: 'Water quality test status was set to Yes with numeric EC/salinity readings.',
        supportingFarmInfo: [
          'Water quality: Tested with numeric results',
          ...(profile.water.ecValue !== null ? [`EC: ${profile.water.ecValue} ${profile.water.ecUnit}`] : []),
          ...(profile.water.salinityValue !== null ? [`Salinity: ${profile.water.salinityValue} ${profile.water.salinityUnit}`] : []),
          ...(profile.water.qualityTestDate ? [`Test date: ${profile.water.qualityTestDate}`] : []),
        ],
        supportingExternalData: [],
        missingInfo: [],
        furtherTestingNeeded: null,
      });
    } else if (waterQualityState === 'tested_results_missing') {
      waterItems.push({
        title: 'Irrigation water tested — results missing',
        detail: 'Farmer reported that irrigation water has been tested ("Yes"), but numeric EC and salinity values were not entered. Potential salinity, sodium hazard, or pH effects remain unverified until test values are recorded.',
        basis: 'Assumption requiring verification',
        whyGenerated: 'Water quality test status was set to Yes, but EC and salinity fields were left blank.',
        supportingFarmInfo: [
          'Water quality: Tested (numeric results missing)',
          ...(profile.water.qualityTestDate ? [`Test date: ${profile.water.qualityTestDate}`] : []),
        ],
        supportingExternalData: [],
        missingInfo: ['Numeric EC (dS/m) and salinity/TDS values from the water lab report'],
        furtherTestingNeeded: 'Enter EC / salinity readings from your water test report.',
      });
    } else if (waterQualityState === 'not_tested') {
      waterItems.push({
        title: 'Irrigation water not tested',
        detail: 'Farmer reported that irrigation water has not been tested ("No"). Potential salinity, sodium hazard, or pH effects on soil and crops cannot be ruled out.',
        basis: 'Assumption requiring verification',
        whyGenerated: 'Water quality testing was explicitly reported as No.',
        supportingFarmInfo: ['Water quality: Not tested (No)'],
        supportingExternalData: [],
        missingInfo: ['Electrical conductivity (EC), total dissolved solids / salinity, and water pH'],
        furtherTestingNeeded: 'Test irrigation water EC and pH once per season, especially if using groundwater or recycled water.',
      });
    } else if (waterQualityState === 'unknown') {
      waterItems.push({
        title: 'Irrigation water test status unknown',
        detail: 'Water quality test status was reported as Unknown. Without knowing whether testing occurred or what EC/salinity values exist, salinity and alkalinity risks remain unverified.',
        basis: 'Assumption requiring verification',
        whyGenerated: 'Water quality testing was reported as Unknown.',
        supportingFarmInfo: ['Water quality: Status unknown'],
        supportingExternalData: [],
        missingInfo: ['Confirmation of prior water testing and EC / salinity / pH values'],
        furtherTestingNeeded: 'Confirm whether a water lab test exists or test EC and pH before planting salt-sensitive crops.',
      });
    } else {
      waterItems.push({
        title: 'Irrigation water test status unanswered',
        detail: 'The irrigation water quality test question was not answered, so potential salinity, sodium hazard, or pH effects remain unverified.',
        basis: 'Assumption requiring verification',
        whyGenerated: 'Water quality testing question was left unanswered.',
        supportingFarmInfo: ['Water quality: Not answered'],
        supportingExternalData: [],
        missingInfo: ['Water quality test status (Yes/No/Unknown) and EC / salinity values if tested'],
        furtherTestingNeeded: 'Answer the water quality question in Stage 3 and test irrigation water EC and pH if untested.',
      });
    }

    if (waterMethod) {
      const usesIrr = waterMethod === 'Artificial irrigation' || waterMethod === 'Hybrid (rainfall and irrigation)';
      const usesRain = waterMethod === 'Rain-fed agriculture' || waterMethod === 'Hybrid (rainfall and irrigation)';
      waterItems.push({
        title: `Watering system: ${waterMethod}`,
        detail: `${
          usesIrr
            ? `Irrigation method: ${profile.water.irrigationMethod || 'Not specified'}; reported schedule: ${profile.water.irrigationFrequency || 'Not specified'}. `
            : ''
        }${
          usesRain
            ? `Farmer-reported rainfall frequency: ${profile.water.rainfallFrequency || 'Not specified'} (reflects personal experience rather than measured rain-gauge totals).`
            : ''
        }`.trim(),
        basis: 'Farmer-provided information',
        whyGenerated: 'Summarizes active Stage 3 conditional watering inputs.',
        supportingFarmInfo: [
          `Watering method: ${waterMethod}`,
          ...(usesIrr && profile.water.irrigationMethod ? [`Irrigation method: ${profile.water.irrigationMethod}`] : []),
          ...(usesIrr && profile.water.irrigationFrequency ? [`Irrigation frequency: ${profile.water.irrigationFrequency}`] : []),
          ...(usesRain && profile.water.rainfallFrequency ? [`Reported rainfall frequency: ${profile.water.rainfallFrequency}`] : []),
        ],
        supportingExternalData: powerSummary ? [powerSummary] : [],
        missingInfo: !hasCoords ? ['Coordinates for historical NASA POWER precipitation comparison'] : [],
        furtherTestingNeeded: null,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // SECTION C: Irrigation Management Considerations
  // ---------------------------------------------------------------------------
  const irrItems: FarmRecommendationItem[] = [];
  if (waterMethod === 'Rain-fed agriculture') {
    irrItems.push({
      title: 'Rain-fed moisture buffering',
      detail: 'Because the farm relies on rainfall without artificial irrigation, management centres on capturing rainfall infiltration (mulch, contour ridges, residue cover) and matching sowing dates to reliable onset windows rather than scheduling irrigation applications.',
      basis: 'Farmer-provided information',
      whyGenerated: 'Watering method is Rain-fed agriculture.',
      supportingFarmInfo: [
        'Watering method: Rain-fed agriculture',
        ...(profile.water.rainfallFrequency ? [`Reported rainfall frequency: ${profile.water.rainfallFrequency}`] : []),
        ...(soilTextureKnown ? [`Soil texture: ${profile.soil.texture}`] : []),
      ],
      supportingExternalData: powerSummary ? [powerSummary] : [],
      missingInfo: !hasCoords ? ['Coordinates for regional rainfall history'] : [],
      furtherTestingNeeded: null,
    });
  } else if (!waterMethod || (!profile.water.irrigationMethod && !soilTextureKnown)) {
    irrItems.push({
      title: 'Irrigation planning data limited',
      detail: `${INSUFFICIENT_MSG} Irrigation method, watering frequency, or soil texture data are missing, so Anchor does not prescribe specific irrigation quantities or schedules.`,
      basis: 'Assumption requiring verification',
      whyGenerated: 'Insufficient watering and soil data to tailor irrigation management.',
      supportingFarmInfo: [],
      supportingExternalData: [],
      missingInfo: ['Watering method', 'Irrigation method & frequency', 'Soil texture', 'Target crop water demand'],
      furtherTestingNeeded: 'Record irrigation method, flow rate, and soil texture before setting crop irrigation schedules.',
    });
  } else {
    const im = profile.water.irrigationMethod || 'Unspecified irrigation';
    irrItems.push({
      title: `Tailoring ${im} to soil & crop context`,
      detail: `Exact irrigation litres or minute-durations are intentionally not prescribed without measured flow rate, root-zone moisture, and evapotranspiration data. Contextually: ${
        profile.soil.texture === 'Sandy' || profile.soil.texture === 'Loamy sand'
          ? 'lighter, shorter pulses match fast-draining sandy soils to minimize deep percolation loss.'
          : profile.soil.texture === 'Clay' || profile.soil.texture === 'Clay loam'
            ? 'check root-zone moisture before repeating applications on moisture-retentive clay soils to avoid root oxygen stress.'
            : 'verify moisture at root depth between applications rather than relying on a fixed calendar alone.'
      }`,
      basis: 'General agricultural knowledge',
      whyGenerated: `Combined irrigation method (${im}) with reported soil/water profile without inventing irrigation quantities.`,
      supportingFarmInfo: [
        `Method: ${im}`,
        `Reported frequency: ${profile.water.irrigationFrequency || 'Not specified'}`,
        `Soil texture: ${profile.soil.texture || 'Unknown'}`,
      ],
      supportingExternalData: powerSummary ? [powerSummary] : [],
      missingInfo: ['Emitter/pump flow rate', 'Field evapotranspiration / root-zone tension'],
      furtherTestingNeeded: 'Perform a simple catch-can or emitter uniformity check and inspect root-zone moisture 12–24 hours post-irrigation.',
    });
  }

  // ---------------------------------------------------------------------------
  // SECTION D: Crop Suitability Considerations (strictly excludes Q15)
  // ---------------------------------------------------------------------------
  const suitItems: FarmRecommendationItem[] = [];
  const candidateIds = Array.from(new Set([...profile.crops.currentCrops, ...profile.crops.plannedCrops])).filter(
    (id) => !restrictedSet.has(id)
  );

  const missingSuitabilityDrivers: string[] = [];
  if (!hasCoords) missingSuitabilityDrivers.push('farm coordinates (for NASA regional climate)');
  if (!soilTextureKnown) missingSuitabilityDrivers.push('soil texture');
  if (phProv !== 'Measured') missingSuitabilityDrivers.push('tested soil pH');
  if (!waterMethod) missingSuitabilityDrivers.push('watering method');
  if (profile.planning.growingSeasons.length === 0) missingSuitabilityDrivers.push('typical growing seasons');

  if (candidateIds.length === 0 && missingSuitabilityDrivers.length >= 3) {
    suitItems.push({
      title: 'Crop suitability assessment',
      detail: `${INSUFFICIENT_MSG} No planned crops were selected and key climate/soil/water details are missing.`,
      basis: 'Assumption requiring verification',
      whyGenerated: 'Insufficient farm parameters and no planned crops entered.',
      supportingFarmInfo: excludedRestrictedCrops.length ? [`Excluded restricted crops: ${excludedRestrictedCrops.join(', ')}`] : [],
      supportingExternalData: [],
      missingInfo: ['Current or planned crop selections', ...missingSuitabilityDrivers],
      furtherTestingNeeded: 'Select target crops in Stage 4 and add location coordinates, soil pH, and water availability.',
    });
  } else {
    if (excludedRestrictedCrops.length > 0) {
      suitItems.push({
        title: 'Restricted crops excluded',
        detail: `The following crops are strictly excluded from all suitability and rotation considerations per Stage 4: ${excludedRestrictedCrops.join(', ')}.`,
        basis: 'Farmer-provided information',
        whyGenerated: 'Enforces Q15 farmer-declared crop restrictions.',
        supportingFarmInfo: [`Restricted crops: ${excludedRestrictedCrops.join(', ')}`],
        supportingExternalData: [],
        missingInfo: [],
        furtherTestingNeeded: null,
      });
    }

    for (const cropId of candidateIds.slice(0, 6)) {
      const crop = findCropCatalogItem(cropId);
      if (!crop) {
        suitItems.push({
          title: `${cropId} — custom crop note`,
          detail: `No structured reference tolerances exist in Anchor's catalog for "${cropId}". Verify local temperature, water, and soil pH requirements with local agronomy guides.`,
          basis: 'Assumption requiring verification',
          whyGenerated: 'Farmer entered a custom crop name not present in the curated catalog.',
          supportingFarmInfo: [`Selected crop: ${cropId}`],
          supportingExternalData: powerSummary ? [powerSummary] : [],
          missingInfo: ['Verified crop-specific climate and soil tolerances'],
          furtherTestingNeeded: null,
        });
        continue;
      }

      const observations: string[] = [];
      const gaps: string[] = [...missingSuitabilityDrivers];
      const windowInfo = power ? formatPowerReferenceWindow(power) : null;
      const resolvedMean = power ? resolvePowerMeanTemp(power) : null;

      if (resolvedMean && windowInfo) {
        const meanT = resolvedMean.valueC;
        const tempDesc = resolvedMean.isActualT2m
          ? `NASA POWER daily mean temperature (T2M: ${meanT.toFixed(1)} °C)`
          : `estimated midpoint of NASA POWER mean daily high/low (${meanT.toFixed(1)} °C; direct T2M unavailable)`;
        if (meanT < crop.tempMinC) {
          observations.push(`For the 7-day reference window ${windowInfo.windowLabel} (${windowInfo.yearsLabel}), ${tempDesc} is cooler than ${crop.name}'s internal catalog temperature range (${crop.tempMinC}–${crop.tempMaxC} °C).`);
        } else if (meanT > crop.tempMaxC) {
          observations.push(`For the 7-day reference window ${windowInfo.windowLabel} (${windowInfo.yearsLabel}), ${tempDesc} is warmer than ${crop.name}'s internal catalog temperature range (${crop.tempMinC}–${crop.tempMaxC} °C).`);
        } else {
          observations.push(`For the 7-day reference window ${windowInfo.windowLabel} (${windowInfo.yearsLabel}), ${tempDesc} falls within ${crop.name}'s internal catalog range (${crop.tempMinC}–${crop.tempMaxC} °C); this 7-day snapshot does not establish full-season suitability.`);
        }
      }

      if (profile.planning.growingSeasons.length > 0) {
        const selectedSeasons = profile.planning.growingSeasons;
        const matchingSeasons = selectedSeasons.filter(
          (s) => crop.preferredSeasons.includes(s) || s === 'Depends on the crop'
        );
        observations.push(
          matchingSeasons.length > 0
            ? `Anchor internal catalog season note lists ${crop.preferredSeasons.join(', ')} as typical growing seasons (general reference only, not NASA-verified seasonal suitability for ${selectedSeasons.join(', ')}).`
            : `Anchor internal catalog lists typical seasons as ${crop.preferredSeasons.join(', ')}, which differs from your selected ${selectedSeasons.join(', ')} (general catalog reference only; full-season NASA climate data was not evaluated).`
        );
        if (power && windowInfo) {
          gaps.push(`full-season NASA POWER climatology covering ${selectedSeasons.join(', ')} (current lookup covers only ${windowInfo.windowLabel})`);
        }
      }

      if (phProv === 'Measured' && profile.soil.phValue !== null) {
        const refLabel = crop.referenceSource ?? 'Anchor internal catalog — unreferenced general range';
        if (profile.soil.phValue < crop.soilPhMin || profile.soil.phValue > crop.soilPhMax) {
          observations.push(`Tested soil pH (${profile.soil.phValue.toFixed(1)}) sits outside Anchor's unverified internal catalog reference range for ${crop.name} (pH ${crop.soilPhMin}–${crop.soilPhMax}; source: ${refLabel}). Verify cultivar-specific pH tolerance with local agronomy/extension guides.`);
        } else {
          observations.push(`Tested soil pH (${profile.soil.phValue.toFixed(1)}) falls within Anchor's internal catalog reference range for ${crop.name} (pH ${crop.soilPhMin}–${crop.soilPhMax}; source: ${refLabel}), distinct from general soil-chemistry pH guidance.`);
        }
      }

      if (crop.waterNeed === 'High' && (profile.water.reliability === 'Frequently limited' || profile.water.reliability === 'Highly unreliable' || waterMethod === 'Rain-fed agriculture')) {
        observations.push(`${crop.name} is listed with high general water demand in Anchor's catalog, which poses risk given ${waterMethod || 'your farm'}'s limited or rain-dependent water supply.`);
      } else {
        observations.push(`Internal catalog traits: ${crop.waterNeed} water demand; preferred drainage: ${crop.preferredDrainage}.`);
      }

      suitItems.push({
        title: `${crop.name} (${crop.category})`,
        detail: `${observations.join(' ')}${
          gaps.length > 0 ? ` Note: missing ${gaps.join(', ')} prevents a conclusive farm-specific suitability verdict.` : ''
        }`,
        basis: power ? 'Existing Anchor environmental data' : 'General agricultural knowledge',
        whyGenerated: `Checked ${crop.name} internal catalog tolerances (${crop.referenceSource ?? 'internal catalog'}) against available farm inputs${power && windowInfo ? ` and NASA POWER ${windowInfo.windowLabel} (${windowInfo.yearsLabel})` : ''}.`,
        supportingFarmInfo: [
          `Crop: ${crop.name} (${crop.botanicalFamily})`,
          `Catalog provenance: ${crop.referenceSource ?? 'Anchor internal catalog (unreferenced)'}`,
          ...(phProv === 'Measured' && profile.soil.phValue !== null ? [`Tested pH: ${profile.soil.phValue.toFixed(1)}`] : []),
          ...(waterMethod ? [`Watering: ${waterMethod}`] : []),
        ],
        supportingExternalData: powerSummary ? [powerSummary] : [],
        missingInfo: gaps,
        furtherTestingNeeded: phProv !== 'Measured' ? 'Verify topsoil pH and cultivar-specific local extension tolerances before planting.' : null,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // SECTION E: Crop Rotation Strategies
  // ---------------------------------------------------------------------------
  const rotItems: FarmRecommendationItem[] = [];
  const c1 = profile.crops.previousCycle1;
  const c2 = profile.crops.previousCycle2;
  const c3 = profile.crops.previousCycle3;
  const allHistory = [...c1, ...c2, ...c3];

  if (allHistory.length === 0) {
    rotItems.push({
      title: 'Three-cycle crop history missing',
      detail: `${INSUFFICIENT_MSG} No previous growing cycles were entered in Stage 4.`,
      basis: 'Assumption requiring verification',
      whyGenerated: 'Previous 3 growing cycles were left empty.',
      supportingFarmInfo: [],
      supportingExternalData: [],
      missingInfo: ['Crops grown in the previous 1–3 growing cycles'],
      furtherTestingNeeded: 'Record past crops (even approximate crop groups) to evaluate rotation patterns.',
    });
  } else {
    const cropCounts = new Map<string, number>();
    const familyCounts = new Map<string, number>();
    let fixerCount = 0;
    let heavyCount = 0;

    for (const id of allHistory) {
      cropCounts.set(id, (cropCounts.get(id) ?? 0) + 1);
      const item = findCropCatalogItem(id);
      if (item) {
        familyCounts.set(item.botanicalFamily, (familyCounts.get(item.botanicalFamily) ?? 0) + 1);
        if (item.nitrogenRole === 'fixer') fixerCount++;
        if (item.nitrogenRole === 'heavy_feeder') heavyCount++;
      }
    }

    const repeats = Array.from(cropCounts.entries()).filter(([, n]) => n >= 2).map(([id]) => getCropDisplayName(id));
    const famRepeats = Array.from(familyCounts.entries()).filter(([, n]) => n >= 2).map(([f]) => f);

    rotItems.push({
      title: repeats.length > 0 || famRepeats.length > 0 ? 'Repeated crop or family pattern detected' : 'Multi-family crop sequence observed',
      detail: `${
        repeats.length > 0
          ? `Repeated planting of ${repeats.join(', ')} across recent cycles can increase pest/disease pressure and draw repeatedly on similar root zones and nutrients. `
          : ''
      }${
        famRepeats.length > 0
          ? `Botanical family repetition (${famRepeats.join(', ')}) reduces pest-break benefits even when crop names change. `
          : ''
      }${
        fixerCount === 0 && heavyCount > 0
          ? 'No legumes/pulses appeared in the recorded cycles following heavy feeders—introducing an unrestricted legume (such as chickpea, lentil, soybean, or cowpea where climate fits) is a valuable rotation option. '
          : 'Legumes were present in recent history, supporting biological nitrogen cycling. '
      }Note: Crop history alone cannot diagnose actual soil nutrient depletion without soil testing.`,
      basis: 'Farmer-provided information',
      whyGenerated: 'Analyzed botanical family, nitrogen role, and crop repetition across the 3 reported cycles.',
      supportingFarmInfo: [
        `Cycle -1: ${c1.map(getCropDisplayName).join(', ') || 'None'}`,
        `Cycle -2: ${c2.map(getCropDisplayName).join(', ') || 'None'}`,
        `Cycle -3: ${c3.map(getCropDisplayName).join(', ') || 'None'}`,
      ],
      supportingExternalData: [],
      missingInfo: ['Laboratory N-P-K soil nutrient levels'],
      furtherTestingNeeded: 'Test topsoil N, P, K, and organic matter to confirm whether heavy-feeder history depleted reserves.',
    });

    const suggestedFamilies = ['Legumes and pulses', 'Root crops', 'Cereals and grains', 'Vegetables'].filter(
      (cat) => !c1.some((id) => findCropCatalogItem(id)?.category === cat)
    );
    if (suggestedFamilies.length > 0) {
      rotItems.push({
        title: 'Next-cycle diversification options (excluding restricted crops)',
        detail: `To contrast with your most recent cycle (${c1.map(getCropDisplayName).join(', ') || 'unspecified'}), consider rotating toward under-represented crop groups such as ${suggestedFamilies.join(', ')}, strictly selecting species not on your restricted list${excludedRestrictedCrops.length ? ` (excluding ${excludedRestrictedCrops.join(', ')})` : ''}.`,
        basis: 'General agricultural knowledge',
        whyGenerated: 'Identified crop categories absent from the most recent growing cycle while respecting Q15 exclusions.',
        supportingFarmInfo: [`Most recent cycle: ${c1.map(getCropDisplayName).join(', ') || 'None'}`],
        supportingExternalData: [],
        missingInfo: ['Local market access and seed availability for rotation crops'],
        furtherTestingNeeded: null,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // SECTION F: Seasonal Planting Considerations
  // ---------------------------------------------------------------------------
  const seasonItems: FarmRecommendationItem[] = [];
  if (profile.planning.growingSeasons.length === 0 && !hasCoords) {
    seasonItems.push({
      title: 'Seasonal window context incomplete',
      detail: `${INSUFFICIENT_MSG} Neither typical growing seasons nor coordinates for seasonal climate data were provided.`,
      basis: 'Assumption requiring verification',
      whyGenerated: 'No growing seasons or coordinates entered.',
      supportingFarmInfo: [],
      supportingExternalData: [],
      missingInfo: ['Typical growing seasons (Stage 5)', 'Farm location coordinates'],
      furtherTestingNeeded: null,
    });
  } else {
    const windowInfo = power ? formatPowerReferenceWindow(power) : null;
    const resolvedMean = power ? resolvePowerMeanTemp(power) : null;
    const selectedSeasons = profile.planning.growingSeasons;
    const seasonMissing: string[] = [];
    if (!hasCoords) {
      seasonMissing.push('Coordinates for NASA POWER seasonal baseline');
    } else if (power && windowInfo) {
      seasonMissing.push(
        `Full-season NASA POWER monthly/seasonal climatology (frost frequency, temperature extremes, and seasonal rainfall totals) for ${selectedSeasons.length > 0 ? selectedSeasons.join(', ') : 'selected growing season(s)'}; current lookup covers only ${windowInfo.windowLabel}`
      );
    }

    seasonItems.push({
      title: `Seasonal cadence (${selectedSeasons.join(', ') || 'Seasons unspecified'})`,
      detail: `Planning horizon: ${profile.planning.horizon || 'Not specified'}; Annual cycles: ${profile.planning.annualCycles || 'Not specified'}. ${
        power && windowInfo
          ? `Available NASA POWER snapshot covers ${windowInfo.yearsLabel} strictly for the 7-day calendar window ${windowInfo.windowLabel} (${windowInfo.sampleCount} daily samples): ${resolvedMean ? `${resolvedMean.label}, ` : ''}mean high ${power.meanMaxC?.toFixed(1) ?? '?'} °C, mean low ${power.meanMinC?.toFixed(1) ?? '?'} °C, average rainfall ${power.meanPrecipMm?.toFixed(2) ?? '?'} mm/day. Limitation: a single 7-day reference window does not represent full-season or winter-long conditions and cannot verify ${selectedSeasons.length > 0 ? selectedSeasons.join('/') : 'seasonal'} suitability on its own.`
          : 'Add map coordinates to retrieve NASA POWER historical climate data; note that the default lookup uses a 7-day target calendar window and full-season climate checks are still needed.'
      } ${
        eonet && eonet.nearbyEvents.length > 0
          ? `Note ${eonet.nearbyEvents.length} active NASA EONET hazard(s) within 300 km when planning field operations.`
          : ''
      }`.trim(),
      basis: power ? 'Existing Anchor environmental data' : 'Farmer-provided information',
      whyGenerated: 'Synthesizes Stage 5 seasons/cycles/horizon with the exact NASA POWER 7-day reference window and states seasonal evidence limits.',
      supportingFarmInfo: [
        `Seasons: ${selectedSeasons.join(', ') || 'Not specified'}`,
        `Annual cycles: ${profile.planning.annualCycles || 'Not specified'}`,
        `Horizon: ${profile.planning.horizon || 'Not specified'}`,
      ],
      supportingExternalData: [
        ...(powerSummary ? [powerSummary] : []),
        ...(eonetSummary ? [eonetSummary] : []),
      ],
      missingInfo: seasonMissing,
      furtherTestingNeeded:
        selectedSeasons.length > 0
          ? `Review month-by-month frost dates, chill/heat accumulation, and seasonal rainfall totals for ${selectedSeasons.join(', ')} before finalizing planting dates.`
          : null,
    });
  }

  // ---------------------------------------------------------------------------
  // SECTION G: Water Conservation Opportunities
  // ---------------------------------------------------------------------------
  const conserveItems: FarmRecommendationItem[] = [];
  const waterFocused =
    hasPriority(profile.planning.priorities, 'Water conservation') ||
    hasChallenge(profile, 'Water scarcity') ||
    hasChallenge(profile, 'High irrigation costs') ||
    profile.water.reliability === 'Sometimes limited' ||
    profile.water.reliability === 'Frequently limited' ||
    profile.water.reliability === 'Highly unreliable';

  if (!waterMethod && profile.water.sources.length === 0) {
    conserveItems.push({
      title: 'Water conservation baseline missing',
      detail: `${INSUFFICIENT_MSG} Provide watering method and water reliability in Stage 3 to tailor conservation opportunities.`,
      basis: 'Assumption requiring verification',
      whyGenerated: 'Stage 3 watering system was not selected.',
      supportingFarmInfo: [],
      supportingExternalData: [],
      missingInfo: ['Watering method', 'Irrigation method (if irrigated)', 'Water reliability'],
      furtherTestingNeeded: null,
    });
  } else {
    const tips: string[] = [];
    if (profile.water.irrigationMethod === 'Flood irrigation' || profile.water.irrigationMethod === 'Furrow irrigation') {
      tips.push(`Transitioning suitable high-value beds from ${profile.water.irrigationMethod.toLowerCase()} toward precision drip or laser-leveled surge/furrow scheduling can substantially reduce runoff and evaporation loss.`);
    } else if (profile.water.irrigationMethod === 'Sprinkler irrigation') {
      tips.push('Running sprinklers during low-wind early morning or evening hours reduces wind drift and evaporative losses.');
    } else if (profile.water.irrigationMethod === 'Drip irrigation') {
      tips.push('Inspect drip emitters, flush lines, and verify pressure regulation regularly so root-zone efficiency stays high.');
    }
    if (waterMethod === 'Rain-fed agriculture' || waterMethod === 'Hybrid (rainfall and irrigation)') {
      tips.push('Organic surface mulching, minimum-disturbance soil cover, and contour water harvesting help retain natural rainfall in the root zone.');
    }
    if (!profile.water.sources.includes('Rainwater collection')) {
      tips.push('Where roof or runoff catchment is feasible, rainwater storage can provide low-salinity buffer water for dry spells.');
    }

    conserveItems.push({
      title: waterFocused ? 'High-priority water conservation options' : 'Practical water efficiency opportunities',
      detail: tips.join(' '),
      basis: 'General agricultural knowledge',
      whyGenerated: waterFocused
        ? 'Prioritized because Water Conservation, Water Scarcity, or High Irrigation Costs was flagged.'
        : 'Tailored to reported watering system and soil drainage.',
      supportingFarmInfo: [
        `Watering: ${waterMethod}`,
        ...(profile.water.irrigationMethod ? [`Irrigation method: ${profile.water.irrigationMethod}`] : []),
        ...(profile.planning.primaryChallenge ? [`Primary challenge: ${profile.planning.primaryChallenge}`] : []),
      ],
      supportingExternalData: [],
      missingInfo: ['Current irrigation water volume applied per cycle'],
      furtherTestingNeeded: null,
    });
  }

  // ---------------------------------------------------------------------------
  // SECTION H: Long-Term Soil Health Recommendations
  // ---------------------------------------------------------------------------
  const longTermItems: FarmRecommendationItem[] = [
    {
      title: 'Organic matter, structure & biological resilience',
      detail: `${
        profile.soil.preparationMethods.includes('Compost / Organic fertiliser')
          ? 'Continue building on your existing compost/organic input practice by pairing it with diverse crop residues or cover crops. '
          : 'Incorporating compost, green manures, or cover crop residues gradually increases soil organic matter, helping sandy soils hold moisture and clay soils drain more smoothly. '
      }${
        profile.soil.preparationMethods.includes('Ploughing / Tilling')
          ? 'Where practical, reducing tillage depth or frequency protects soil aggregates and moisture-holding pore channels.'
          : ''
      }`.trim(),
      basis: 'General agricultural knowledge',
      whyGenerated: 'Synthesizes reported soil preparation and fertiliser inputs into general soil-health guidance.',
      supportingFarmInfo: [
        `Preparation: ${profile.soil.preparationMethods.join(', ') || 'Not specified'}`,
        `Fertiliser: ${profile.crops.fertiliserType || 'Not specified'}`,
      ],
      supportingExternalData: [],
      missingInfo: ['Measured soil organic matter (%) and bulk density'],
      furtherTestingNeeded: 'Include organic matter (%) in your next laboratory soil test to track long-term trends.',
    },
    {
      title: 'Evidence-based testing cadence',
      detail: (() => {
        const wState = getWaterQualityState(profile);
        const waterGapMsg =
          wState === 'tested_results_missing'
            ? 'irrigation water was marked tested without numeric EC/salinity results'
            : wState === 'not_tested'
              ? 'irrigation water has not been tested'
              : wState === 'unknown'
                ? 'irrigation water test status is unknown'
                : wState === 'unanswered'
                  ? 'irrigation water test status was not answered'
                  : '';
        const gaps = [
          ...(phProv !== 'Measured' ? ['soil pH has not been tested'] : []),
          ...(waterGapMsg ? [waterGapMsg] : []),
        ];
        return `Before applying major corrective amendments (lime, gypsum, sulfur, or high-rate N-P-K fertilisers), rely on periodic soil and water lab tests rather than guesswork. ${
          gaps.length > 0
            ? `Currently, ${gaps.join(' and ')}.`
            : 'Continue re-testing soil pH and water salinity every 1–3 seasons depending on cropping intensity.'
        }`;
      })(),
      basis: 'Assumption requiring verification',
      whyGenerated: 'Highlights the boundary between general guidance and verified farm-specific lab evidence.',
      supportingFarmInfo: [
        `Soil pH status: ${phProv}`,
        `Water quality status: ${(() => {
          const s = getWaterQualityState(profile);
          if (s === 'tested_with_results') return 'Tested (with numeric results)';
          if (s === 'tested_results_missing') return 'Tested (results missing)';
          if (s === 'not_tested') return 'Not tested (No)';
          if (s === 'unknown') return 'Unknown';
          return 'Not answered';
        })()}`,
      ],
      supportingExternalData: [],
      missingInfo: [
        ...(phProv !== 'Measured' ? ['Soil pH & N-P-K lab report'] : []),
        ...(getWaterQualityState(profile) !== 'tested_with_results'
          ? [
              getWaterQualityState(profile) === 'tested_results_missing'
                ? 'Numeric water EC & salinity values from test report'
                : 'Water EC & salinity test',
            ]
          : []),
      ],
      furtherTestingNeeded: 'Schedule a baseline soil fertility + pH test and seasonal water EC check.',
    },
  ];

  const waterQualitySummaryText = (() => {
    const s = getWaterQualityState(profile);
    if (s === 'tested_with_results') return 'tested (with results)';
    if (s === 'tested_results_missing') return 'tested (results missing)';
    if (s === 'not_tested') return 'not tested';
    if (s === 'unknown') return 'unknown';
    return 'not answered';
  })();

  // Prioritize order inside priorities-sensitive view
  const sections: FarmAnalysisSection[] = [
    {
      key: 'A',
      title: 'A. Soil Condition Overview',
      status: soilTextureKnown || phProv === 'Measured' || moistureProv !== 'Unknown' ? 'partial' : 'insufficient',
      summary: soilTextureKnown
        ? `Summary based on reported ${profile.soil.texture} soil${phProv === 'Measured' ? `, tested pH ${profile.soil.phValue?.toFixed(1)}` : ', untested pH'}, and ${profile.soil.drainage || 'unspecified'} drainage.`
        : 'Limited soil evidence provided; laboratory testing is needed for farm-specific conclusions.',
      insufficientNotice: !soilTextureKnown && phProv !== 'Measured' ? INSUFFICIENT_MSG : undefined,
      items: soilItems,
    },
    {
      key: 'B',
      title: 'B. Water Availability and Irrigation Assessment',
      status: waterMethod && reliabilityKnown ? 'grounded' : waterMethod ? 'partial' : 'insufficient',
      summary: waterMethod
        ? `Watering system: ${waterMethod}; reliability: ${profile.water.reliability || 'unknown'}; water quality: ${waterQualitySummaryText}.`
        : 'Water source and watering system details are incomplete.',
      insufficientNotice: !waterMethod && profile.water.sources.length === 0 ? INSUFFICIENT_MSG : undefined,
      items: waterItems,
    },
    {
      key: 'C',
      title: 'C. Irrigation Management Considerations',
      status: waterMethod ? 'partial' : 'insufficient',
      summary:
        waterMethod === 'Rain-fed agriculture'
          ? 'Focuses on rainfall capture and root-zone moisture conservation without artificial irrigation.'
          : waterMethod
            ? 'Practical efficiency considerations matched to irrigation delivery and soil texture (without prescribing unverified water volumes).'
            : 'Insufficient watering and soil parameters for irrigation considerations.',
      insufficientNotice: !waterMethod ? INSUFFICIENT_MSG : undefined,
      items: irrItems,
    },
    {
      key: 'D',
      title: 'D. Crop Suitability Considerations',
      status: candidateIds.length > 0 && (hasCoords || soilTextureKnown) ? 'partial' : 'insufficient',
      summary:
        candidateIds.length > 0
          ? `Evaluated ${candidateIds.length} selected crop(s) while strictly excluding ${excludedRestrictedCrops.length} restricted crop(s).`
          : 'No active/planned crops or insufficient environmental inputs for suitability screening.',
      insufficientNotice: candidateIds.length === 0 && missingSuitabilityDrivers.length >= 3 ? INSUFFICIENT_MSG : undefined,
      items: suitItems,
    },
    {
      key: 'E',
      title: 'E. Crop Rotation Strategies',
      status: allHistory.length > 0 ? 'grounded' : 'insufficient',
      summary:
        allHistory.length > 0
          ? `Reviewed ${allHistory.length} crop entry(ies) across up to three prior growing cycles for family repetition and nitrogen balance.`
          : 'No prior crop cycles provided for rotation analysis.',
      insufficientNotice: allHistory.length === 0 ? INSUFFICIENT_MSG : undefined,
      items: rotItems,
    },
    {
      key: 'F',
      title: 'F. Seasonal Planting Considerations',
      status: profile.planning.growingSeasons.length > 0 || hasCoords ? 'partial' : 'insufficient',
      summary: `Aligned to ${profile.planning.growingSeasons.join(', ') || 'unspecified seasons'} over a ${profile.planning.horizon || 'unspecified'} planning horizon.`,
      insufficientNotice: profile.planning.growingSeasons.length === 0 && !hasCoords ? INSUFFICIENT_MSG : undefined,
      items: seasonItems,
    },
    {
      key: 'G',
      title: 'G. Water Conservation Opportunities',
      status: waterMethod ? 'grounded' : 'insufficient',
      summary: waterFocused
        ? 'Prioritized water conservation measures aligned with your farm water constraints and objectives.'
        : 'General water efficiency opportunities aligned with your watering method.',
      insufficientNotice: !waterMethod ? INSUFFICIENT_MSG : undefined,
      items: conserveItems,
    },
    {
      key: 'H',
      title: 'H. Long-Term Soil Health Recommendations',
      status: 'partial',
      summary: 'Distinguishes general soil-building practices from farm-specific evidence requiring laboratory verification.',
      items: longTermItems,
    },
  ];

  const measurementCaveats = getMeasurementCaveats(profile);
  const combinedMissingSummary = Array.from(
    new Set([...completeness.missingOrUnknown, ...measurementCaveats])
  );

  return {
    farmId: profile.id,
    farmName: profile.location.farmName.trim() || 'Unnamed Farm',
    generatedAt: new Date().toISOString(),
    completenessPct: completeness.overallPct,
    completenessAnswered: completeness.answeredCount,
    completenessTotal: completeness.totalChecks,
    completenessByCategory: completeness.byCategory,
    missingDataSummary: combinedMissingSummary,
    measurementCaveats,
    externalDataStatus: {
      hasCoordinates: hasCoords,
      powerSummary,
      eonetSummary,
      powerData: power,
      eonetData: eonet,
    },
    excludedRestrictedCrops,
    sections,
  };
}
