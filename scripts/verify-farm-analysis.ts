import { AGRICULTURAL_CROP_CATALOG } from '../src/data/farmCropCatalog';
import { formatPowerReferenceWindow, generateDeterministicFarmAnalysis } from '../src/lib/farmAnalysisEngine';
import {
  getSoilMoistureOverview,
  getSoilPhOverview,
  getWaterQualityOverview,
} from '../src/lib/farmContextOverviews';
import {
  computeProfileCompleteness,
  createEmptyFarmProfile,
  getWaterQualityState,
  parseImportedFarmProfilesJson,
} from '../src/lib/farmStorage';
import { FarmProfile, PowerClimateResult } from '../src/types';

let passed = 0;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}\n  Expected: ${String(expected)}\n  Actual:   ${String(actual)}`);
  }
}

function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`PASS: ${name}`);
}

function makePowerSample(overrides: Partial<PowerClimateResult> = {}): PowerClimateResult {
  const days = Array.from({ length: 7 }, (_, i) => ({
    date: `2024-04-${String(12 + i).padStart(2, '0')}`,
    year: 2024,
    doy: 103 + i,
    tMaxC: 28.0,
    tMinC: 14.0,
    tMeanC: 20.6,
    precipMm: 0.4,
    windMs: 3.1,
    humidityPct: 52,
    solarKwhM2: 5.8,
  }));

  return {
    lat: 31.95,
    lon: 35.91,
    targetDate: '2026-04-15',
    endDate: '2026-04-15',
    yearsAnalyzed: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    windowDays: days,
    yearlySummaries: [],
    datasetName: 'NASA POWER Daily Point Climatology (MERRA-2 / CERES)',
    endpointUrl: 'https://power.larc.nasa.gov/api/temporal/daily/point',
    fetchedAt: '2026-04-15T12:00:00Z',
    meanMaxC: 28.0,
    meanMinC: 14.0,
    meanTempC: 20.6,
    meanPrecipMm: 0.4,
    meanWindMs: 3.1,
    meanHumidityPct: 52,
    meanSolarKwhM2: 5.8,
    ...overrides,
  };
}

function makeApexFarmsProfile(): FarmProfile {
  const p = createEmptyFarmProfile('Apex Farms');
  p.location = {
    farmName: 'Apex Farms',
    locationLabel: 'Amman Valley',
    regionOrAddress: 'Amman',
    lat: 31.95,
    lon: 35.91,
    entryMode: 'manual',
  };
  p.areaValue = 12;
  p.areaUnit = 'hectares';

  // Soil: 4/5 answered (pH not_tested -> 1 missing)
  p.soil = {
    texture: 'Loam',
    moistureStatus: 'measured',
    moisturePct: 29,
    moistureUnit: 'unspecified',
    moistureDepth: '',
    moistureMethod: '',
    moistureDate: '',
    phStatus: 'not_tested',
    phValue: null,
    phTestDate: '',
    drainage: 'Moderately',
    preparationMethods: ['Compost / Organic fertiliser'],
    preparationOther: '',
  };

  // Water: Artificial irrigation => 6 checks total; qualityTested='No' & irrigationFrequency='' => 2 missing (4/6)
  p.water = {
    sources: ['Groundwater / Well'],
    sourcesOther: '',
    reliability: 'Usually available',
    availableQuantityKnown: 'Unknown',
    availableQuantityValue: null,
    availableQuantityUnit: 'm³/day',
    qualityTested: 'No',
    ecValue: null,
    ecUnit: 'dS/m',
    salinityValue: null,
    salinityUnit: 'ppm',
    qualityTestDate: '',
    wateringMethod: 'Artificial irrigation',
    irrigationMethod: 'Drip irrigation',
    irrigationMethodOther: '',
    irrigationFrequency: '',
    rainfallFrequency: '',
  };

  // Crops: 4/4
  p.crops = {
    previousCycle1: ['tomatoes'],
    previousCycle2: ['wheat'],
    previousCycle3: ['chickpea'],
    currentCrops: ['wheat'],
    plannedCrops: ['tomatoes'],
    noRestrictions: true,
    restrictedCrops: [],
    restrictedOther: '',
    fertiliserType: 'Both',
    fertiliserDetails: '',
  };

  // Priorities (2/2) + Horizon (3/3)
  p.planning = {
    horizon: 'Next 2–3 years',
    priorities: ['Improving soil health', 'Water conservation'],
    annualCycles: '2',
    growingSeasons: ['Winter'],
    challenges: ['Water scarcity'],
    primaryChallenge: 'Water scarcity',
    challengeOther: '',
  };

  return p;
}

// ---------------------------------------------------------------------------
// 1. Completeness (87% = 20/23 preserved) & measurement caveat separation
// ---------------------------------------------------------------------------
test('Apex Farms preserves 87% (20/23) completeness and surfaces caveats separately', () => {
  const apex = makeApexFarmsProfile();
  const comp = computeProfileCompleteness(apex);
  assertEqual(comp.answeredCount, 20, 'answeredCount should be 20');
  assertEqual(comp.totalChecks, 23, 'totalChecks should be 23');
  assertEqual(comp.overallPct, 87, 'overallPct should be 87');

  const report = generateDeterministicFarmAnalysis(apex, makePowerSample(), null);
  assertEqual(report.completenessPct, 87, 'report completenessPct');
  assertEqual(report.completenessAnswered, 20, 'report completenessAnswered');
  assertEqual(report.completenessTotal, 23, 'report completenessTotal');
  assert(
    report.measurementCaveats?.some((c) => c.includes('29%') && c.includes('unit/basis')),
    'measurementCaveats flags missing moisture unit/method/depth'
  );
  assert(
    report.missingDataSummary.some((m) => m.includes('29%')),
    'missingDataSummary includes moisture caveat'
  );

  // Marking water quality as Yes WITHOUT EC/salinity keeps quality check counted without hiding missing readings
  const apexTestedNoValues = makeApexFarmsProfile();
  apexTestedNoValues.water.qualityTested = 'Yes';
  const comp2 = computeProfileCompleteness(apexTestedNoValues);
  assertEqual(comp2.answeredCount, 21, 'qualityTested=Yes counts toward completeness without EC/salinity');
  const report2 = generateDeterministicFarmAnalysis(apexTestedNoValues, makePowerSample(), null);
  assert(
    report2.missingDataSummary.some((m) => m.includes('EC and salinity results were not entered')),
    'missingDataSummary flags missing EC/salinity when water quality is marked Yes without numbers'
  );
});

// ---------------------------------------------------------------------------
// 2. Soil moisture: no universal moderate cutoff, flags unit/method/depth
// ---------------------------------------------------------------------------
test('Soil moisture 29% removes unsupported moderate classification and flags missing context', () => {
  const apex = makeApexFarmsProfile();
  const report = generateDeterministicFarmAnalysis(apex, makePowerSample(), null);
  const secA = report.sections.find((s) => s.key === 'A')!;
  const moistureItem = secA.items.find((i) => i.title.includes('29%'))!;
  assert(moistureItem, 'Moisture item exists in Section A');
  assert(
    !/25[–-]60%|moderate moisture|classified as moderate|within a moderate/i.test(
      moistureItem.title + ' ' + moistureItem.detail
    ),
    'Must not classify 29% using unsupported 25–60% = moderate rule'
  );
  assert(
    moistureItem.detail.includes('cannot classify 29% as dry, moderate, or wet'),
    'States explicitly that 29% cannot be classified as dry, moderate, or wet'
  );
  assert(/uncertain/i.test(moistureItem.title) && /uncertain/i.test(moistureItem.detail), 'Must label interpretation uncertain');
  assert(moistureItem.missingInfo.some((m) => /unit/i.test(m)), 'Flags missing moisture unit/basis');
  assert(moistureItem.missingInfo.some((m) => /method/i.test(m)), 'Flags missing measurement method');
  assert(moistureItem.missingInfo.some((m) => /depth/i.test(m)), 'Flags missing sampling depth');

  const overviewIncomplete = getSoilMoistureOverview(apex);
  assert(/uncertain/i.test(overviewIncomplete.title), 'Overview marks incomplete measured moisture as uncertain');
  assert(
    overviewIncomplete.body.includes('cannot be reliably classified as dry, moderate, or wet'),
    'Overview refuses dry/moderate/wet classification without context'
  );

  // Estimated moisture WITH unit/method/depth still flagged as uncertain
  const estimated = makeApexFarmsProfile();
  estimated.soil.moistureStatus = 'estimated';
  estimated.soil.moistureUnit = 'volumetric_vwc';
  estimated.soil.moistureMethod = 'Hand feel';
  estimated.soil.moistureDepth = '0–15 cm';
  const estReport = generateDeterministicFarmAnalysis(estimated, makePowerSample(), null);
  const estItem = estReport.sections.find((s) => s.key === 'A')!.items.find((i) => i.title.includes('29%'))!;
  assert(/uncertain/i.test(estItem.title), 'Estimated moisture remains uncertain even with unit/method/depth');
  assert(
    estItem.detail.includes('cannot classify 29% as dry, moderate, or wet'),
    'Estimated moisture never classified as dry, moderate, or wet'
  );

  // Measured moisture WITH full unit/method/depth/texture still never applies universal moderate cutoff
  const completeMeasured = makeApexFarmsProfile();
  completeMeasured.soil.moistureStatus = 'measured';
  completeMeasured.soil.moistureUnit = 'volumetric_vwc';
  completeMeasured.soil.moistureMethod = 'TDR probe';
  completeMeasured.soil.moistureDepth = '0–15 cm';
  const measReport = generateDeterministicFarmAnalysis(completeMeasured, makePowerSample(), null);
  const measItem = measReport.sections.find((s) => s.key === 'A')!.items.find((i) => i.title.includes('29%'))!;
  assert(
    measItem.detail.includes('does not apply a universal moisture threshold'),
    'Complete measured moisture states Anchor does not apply a universal moisture threshold'
  );
  assert(measItem.detail.includes('volumetric (% VWC)') && measItem.detail.includes('0–15 cm'), 'Displays unit and depth');
});

// ---------------------------------------------------------------------------
// 3. NASA temperature: actual T2M vs estimated high/low midpoint fallback
// ---------------------------------------------------------------------------
test('NASA temperature prefers actual T2M (20.6 C) and labels fallback midpoint as estimate', () => {
  const apex = makeApexFarmsProfile();
  const reportT2m = generateDeterministicFarmAnalysis(
    apex,
    makePowerSample({ meanTempC: 20.6, meanMaxC: 28.0, meanMinC: 14.0 }),
    null
  );
  assert(reportT2m.externalDataStatus.powerSummary?.includes('20.6 °C (T2M)'), 'Summary uses actual T2M 20.6 C');
  assert(!reportT2m.externalDataStatus.powerSummary?.includes('21.0 °C'), 'Summary does not substitute 21.0 C midpoint when T2M exists');

  const secF = reportT2m.sections.find((s) => s.key === 'F')!;
  assert(secF.items[0].detail.includes('T2M: 20.6 °C'), 'Section F reports actual T2M');

  const reportFallback = generateDeterministicFarmAnalysis(
    apex,
    makePowerSample({ meanTempC: null, meanMaxC: 28.0, meanMinC: 14.0 }),
    null
  );
  assert(
    reportFallback.externalDataStatus.powerSummary?.includes('estimated high/low midpoint 21.0 °C (T2M unavailable)'),
    'Fallback summary explicitly labels 21.0 C as estimated midpoint with T2M unavailable'
  );
});

// ---------------------------------------------------------------------------
// 4. Crop pH provenance & separation from general soil-chemistry guidance
// ---------------------------------------------------------------------------
test('Crop catalog includes honest internal provenance and distinguishes general soil-chemistry pH guidance', () => {
  const crops = AGRICULTURAL_CROP_CATALOG;
  assert(crops.length >= 25, 'Catalog loaded');
  for (const crop of crops) {
    assert(Boolean(crop.referenceSource && crop.referenceSource.trim()), `${crop.id} has referenceSource`);
    assertEqual(crop.referenceVerified, false, `${crop.id} referenceVerified is false`);
  }

  const apex = makeApexFarmsProfile();
  apex.soil.phStatus = 'tested';
  apex.soil.phValue = 6.4;

  const phOverview = getSoilPhOverview(apex);
  assert(phOverview.provenanceNote.includes('not crop-specific'), 'pH overview clarifies general soil-chemistry guidance');

  const report = generateDeterministicFarmAnalysis(apex, makePowerSample(), null);
  const secA = report.sections.find((s) => s.key === 'A')!;
  const phItem = secA.items.find((i) => i.title.includes('Tested soil pH'))!;
  assert(phItem.detail.includes('general 5.8–7.5 soil-chemistry window'), 'Section A labels general soil-chemistry pH window');

  const secD = report.sections.find((s) => s.key === 'D')!;
  const wheatItem = secD.items.find((i) => i.title.includes('Wheat'))!;
  assert(wheatItem.detail.includes('internal catalog reference range'), 'Section D states internal catalog provenance');
  assert(wheatItem.detail.includes('distinct from general soil-chemistry pH guidance'), 'Section D distinguishes crop range from general soil guidance');
});

// ---------------------------------------------------------------------------
// 5. Seasonal suitability: explicit 7-day window + refusal to claim winter suitability
// ---------------------------------------------------------------------------
test('Seasonal suitability surfaces exact 7-day NASA POWER window and avoids winter suitability claims', () => {
  const power = makePowerSample();
  const win = formatPowerReferenceWindow(power);
  assertEqual(win.yearsLabel, '2015–2024 (10 years)', 'yearsLabel');
  assert(win.windowLabel.includes('Apr 12–Apr 18'), 'windowLabel shows exact 7-day calendar span');

  const apex = makeApexFarmsProfile();
  const report = generateDeterministicFarmAnalysis(apex, power, null);
  const secF = report.sections.find((s) => s.key === 'F')!;
  const seasonItem = secF.items[0];
  assert(seasonItem.detail.includes('2015–2024 (10 years)'), 'Section F shows exact years analyzed');
  assert(seasonItem.detail.includes('Apr 12–Apr 18'), 'Section F shows exact 7-day reference window');
  assert(
    seasonItem.detail.includes('cannot verify Winter seasonal suitability') ||
      seasonItem.detail.includes('cannot verify Winter/seasonal suitability') ||
      seasonItem.detail.includes('does not represent full-season or winter-long conditions'),
    'Section F explicitly rejects claiming winter suitability from 7-day snapshot'
  );
  assert(
    seasonItem.missingInfo.some((m) => m.includes('Full-season NASA POWER') && m.includes('Winter')),
    'Section F lists missing full-season climatology'
  );

  const secD = report.sections.find((s) => s.key === 'D')!;
  const wheatItem = secD.items.find((i) => i.title.includes('Wheat'))!;
  assert(
    wheatItem.detail.includes('not NASA-verified seasonal suitability'),
    'Section D distinguishes internal catalog season affinity from NASA seasonal evidence'
  );
});

// ---------------------------------------------------------------------------
// 6. Five distinct water quality states across state helper, overviews, and report
// ---------------------------------------------------------------------------
test('Water quality handles all 5 states consistently across helpers, overviews, and report', () => {
  const variants: Array<{
    label: string;
    setup: (p: FarmProfile) => void;
    expectedState: ReturnType<typeof getWaterQualityState>;
    overviewTitleNeedle: string;
    secBTitleNeedle: string;
    secBSummaryNeedle: string;
  }> = [
    {
      label: 'tested_with_results',
      setup: (p) => {
        p.water.qualityTested = 'Yes';
        p.water.ecValue = 1.2;
      },
      expectedState: 'tested_with_results',
      overviewTitleNeedle: 'recorded water quality (ec 1.2 ds/m)',
      secBTitleNeedle: 'tested with results',
      secBSummaryNeedle: 'water quality: tested (with results)',
    },
    {
      label: 'tested_results_missing',
      setup: (p) => {
        p.water.qualityTested = 'Yes';
        p.water.ecValue = null;
        p.water.salinityValue = null;
      },
      expectedState: 'tested_results_missing',
      overviewTitleNeedle: 'numeric results missing',
      secBTitleNeedle: 'tested — results missing',
      secBSummaryNeedle: 'water quality: tested (results missing)',
    },
    {
      label: 'not_tested',
      setup: (p) => {
        p.water.qualityTested = 'No';
      },
      expectedState: 'not_tested',
      overviewTitleNeedle: 'irrigation water not tested',
      secBTitleNeedle: 'not tested',
      secBSummaryNeedle: 'water quality: not tested',
    },
    {
      label: 'unknown',
      setup: (p) => {
        p.water.qualityTested = 'Unknown';
      },
      expectedState: 'unknown',
      overviewTitleNeedle: 'water test status unknown',
      secBTitleNeedle: 'status unknown',
      secBSummaryNeedle: 'water quality: unknown',
    },
    {
      label: 'unanswered',
      setup: (p) => {
        p.water.qualityTested = '';
      },
      expectedState: 'unanswered',
      overviewTitleNeedle: 'irrigation water quality status',
      secBTitleNeedle: 'status unanswered',
      secBSummaryNeedle: 'water quality: not answered',
    },
  ];

  const seenOverviewTitles = new Set<string>();
  const seenSecBTitles = new Set<string>();

  for (const v of variants) {
    const p = makeApexFarmsProfile();
    v.setup(p);
    assertEqual(getWaterQualityState(p), v.expectedState, `state for ${v.label}`);
    const ov = getWaterQualityOverview(p);
    assert(ov.title.toLowerCase().includes(v.overviewTitleNeedle), `overview title for ${v.label}: ${ov.title}`);
    seenOverviewTitles.add(ov.title);

    const rep = generateDeterministicFarmAnalysis(p, makePowerSample(), null);
    const secB = rep.sections.find((s) => s.key === 'B')!;
    assert(secB.summary.includes(v.secBSummaryNeedle), `Section B summary for ${v.label}: ${secB.summary}`);
    const wqItem = secB.items.find((i) => i.title.toLowerCase().includes(v.secBTitleNeedle));
    assert(wqItem, `Section B item title matches ${v.label}`);
    seenSecBTitles.add(wqItem!.title);
  }

  assertEqual(seenOverviewTitles.size, 5, 'All 5 overview titles must be distinct');
  assertEqual(seenSecBTitles.size, 5, 'All 5 Section B item titles must be distinct');
});

// ---------------------------------------------------------------------------
// 7. Backward compatibility for legacy saved/imported profiles
// ---------------------------------------------------------------------------
test('Legacy profiles missing moistureUnit/moistureDepth deserialize and analyze cleanly', () => {
  const legacyProfile = makeApexFarmsProfile();
  const legacyRaw = JSON.parse(JSON.stringify(legacyProfile));
  delete legacyRaw.soil.moistureUnit;
  delete legacyRaw.soil.moistureDepth;

  const parsed = parseImportedFarmProfilesJson(JSON.stringify([legacyRaw]));
  assertEqual(parsed.length, 1, 'Parsed 1 legacy profile');
  assertEqual(parsed[0].soil.moistureUnit, 'unspecified', 'moistureUnit defaults to unspecified');
  assertEqual(parsed[0].soil.moistureDepth, '', 'moistureDepth defaults to empty string');

  const rep = generateDeterministicFarmAnalysis(parsed[0], null, null);
  assertEqual(rep.completenessPct, 87, 'Legacy Apex Farms completeness preserved at 87%');
});

console.log(`\nAll ${passed} deterministic verification tests passed.`);
