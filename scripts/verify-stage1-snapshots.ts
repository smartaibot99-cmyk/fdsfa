import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { createMyFarmsRouter } from '../server/myFarmsRouter';
import {
  buildAssessedFarmRecord,
  buildFreshSnapshotPayload,
  computeScientificConfidence,
  evaluateSoilPhForSnapshot,
  ServerRawFarmDto,
  validateSnapshotPayload,
} from '../src/lib/snapshotAssessment';
import { SavedFarmSnapshot } from '../src/types/myFarms';

let passed = 0;

async function runTest(name: string, fn: () => void | Promise<void>): Promise<void> {
  await fn();
  passed++;
  console.log(`PASS: ${name}`);
}

function makeRawFarm(overrides: Partial<ServerRawFarmDto> = {}): ServerRawFarmDto {
  const now = '2026-11-15T10:00:00.000Z';
  return {
    id: 'farm-test-1',
    name: 'Test Parcel',
    primaryCrop: 'Wheat',
    locationLabel: 'Polk County, OR',
    regionLabel: 'Willamette Valley, OR',
    country: 'United States',
    timezone: 'America/Los_Angeles',
    centroid: { lat: 44.86, lon: -123.14 },
    geometry: null,
    areaUnit: 'hectares',
    declaredAreaHa: 40,
    mappedAreaHa: 40,
    perimeterM: 2500,
    hasBoundary: true,
    areaGapNote: null,
    hasFieldOverlapWarning: false,
    overlapWarningDetail: null,
    isPrivate: true,
    isDraft: false,
    archivedAt: null,
    notes: '',
    versionNumber: 1,
    activePlan: null,
    recommendedPlanId: null,
    recommendedPlanTitle: null,
    soil: {
      texture: 'Loam',
      moistureStatus: 'measured',
      moisturePct: 30,
      moistureMethod: 'Capacitance probe',
      moistureDate: '2026-11-14',
      phStatus: 'tested',
      phValue: 6.6,
      bufferPh: null,
      phTestDate: '2026-11-10',
      organicMatterPct: 3.2,
      drainage: 'Moderately',
      slopePct: 2.0,
      elevationM: 70,
      preparationMethods: [],
      notes: '',
    },
    water: {
      sources: ['Groundwater / Well'],
      reliability: 'Always available',
      dailyCapacityKnown: true,
      dailyCapacityM3: 150,
      qualityTested: 'Yes',
      ecDsM: 0.4,
      salinityPpm: 256,
      qualityTestDate: '2026-11-01',
      wateringMethod: 'Artificial irrigation',
      irrigationMethod: 'Drip irrigation',
      irrigationFrequency: 'Weekly',
      rainfallFrequency: 'Weekly',
      estimatedDailyDemandM3: 90,
      demandAssumptionNote: '',
    },
    planningHorizon: 'Next season',
    priorities: [],
    challenges: [],
    lastAssessedAt: null,
    suitabilityScore: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

async function main() {
  // 1. Farm with acidic soil pH (5.2)
  await runTest('1. Acidic soil pH (5.2) is penalized, interpreted, and never called balanced', () => {
    const raw = makeRawFarm({
      soil: {
        ...makeRawFarm().soil,
        phStatus: 'tested',
        phValue: 5.2,
        bufferPh: null,
      },
    });
    const farm = buildAssessedFarmRecord(raw, [], [], []);
    const snap = buildFreshSnapshotPayload({
      farm,
      meanTempC: 11.2,
      precipMmDay: 2.5,
      et0MmDay: null,
      weatherWindowSummary: 'NASA POWER 21y window: 15.0/7.4 C, 2.50 mm/d.',
      dataAvailability: { nasaPower: 'available', openMeteo: 'available', nasaEonet: 'available' },
      nearbyHazardCount: 0,
    });

    // Score penalty applied (-12 for <5.5): 74 + 10 (moisture 30%) - 12 (pH 5.2) + 5 (Always available) = 77
    assert.equal(snap.suitabilityScore, 77);
    assert.ok(snap.observations && snap.observations.some((o) => o.includes('5.2') && o.includes('strongly acidic')));
    assert.ok(snap.recommendations.some((r) => /buffer-pH|lime-requirement/i.test(r)));
    assert.ok(
      !snap.recommendations.some((r) => /within balanced/i.test(r)),
      'Acidic pH 5.2 must never produce a "within balanced" recommendation'
    );
    assert.ok(
      farm.assessment.summary.includes('acidic') || farm.assessment.worstFieldReason?.includes('acidic'),
      'Overview assessment must flag acidic soil reaction'
    );
  });

  // 2. Farm with neutral soil pH (6.6)
  await runTest('2. Neutral soil pH (6.6) with measured moisture & climate feeds agrees across score, observations, and recommendations', () => {
    const raw = makeRawFarm();
    const farm = buildAssessedFarmRecord(raw, [], [], []);
    const snap = buildFreshSnapshotPayload({
      farm,
      meanTempC: 12.5,
      precipMmDay: 2.8,
      et0MmDay: null,
      weatherWindowSummary: 'NASA POWER 21y window: 16.5/8.5 C, 2.80 mm/d.',
      dataAvailability: { nasaPower: 'available', openMeteo: 'available', nasaEonet: 'available' },
      nearbyHazardCount: 0,
    });

    // 74 + 10 (moisture 30) + 6 (pH 6.6) + 5 (water) = 95
    assert.equal(snap.suitabilityScore, 95);
    assert.ok(snap.observations?.some((o) => o.includes('6.6') && o.includes('5.8–7.5')));
    assert.ok(snap.recommendations.some((r) => /within balanced operating bounds/i.test(r)));

    // Also verify neutral pH 6.6 with estimated moisture does NOT issue an unqualified balanced claim
    const estRaw = makeRawFarm({
      soil: { ...makeRawFarm().soil, moistureStatus: 'estimated', moisturePct: 30 },
    });
    const estFarm = buildAssessedFarmRecord(estRaw, [], [], []);
    const estSnap = buildFreshSnapshotPayload({
      farm: estFarm,
      meanTempC: 12.5,
      precipMmDay: 2.8,
      et0MmDay: null,
      weatherWindowSummary: 'NASA POWER 21y window.',
      dataAvailability: { nasaPower: 'available', openMeteo: 'available', nasaEonet: 'available' },
      nearbyHazardCount: 0,
    });
    assert.ok(!estSnap.recommendations.some((r) => /remain within balanced operating bounds/i.test(r)));
  });

  // 3. Farm with missing pH
  await runTest('3. Missing soil pH (not_tested / null) notes unverified reaction and asks for composite soil cores', () => {
    const raw = makeRawFarm({
      soil: {
        ...makeRawFarm().soil,
        phStatus: 'not_tested',
        phValue: null,
        bufferPh: null,
      },
    });
    const farm = buildAssessedFarmRecord(raw, [], [], []);
    const snap = buildFreshSnapshotPayload({
      farm,
      meanTempC: 14.0,
      precipMmDay: 1.9,
      et0MmDay: null,
      weatherWindowSummary: 'NASA POWER window.',
      dataAvailability: { nasaPower: 'available', openMeteo: 'available', nasaEonet: 'available' },
    });

    assert.equal(snap.keyMetrics.phValue, null);
    assert.ok(snap.observations?.some((o) => /not been laboratory-tested/i.test(o)));
    assert.ok(snap.recommendations.some((r) => /composite 0–20 cm/i.test(r)));
    assert.ok(!snap.recommendations.some((r) => /within balanced/i.test(r)));
  });

  // 4. Farm with missing buffer pH
  await runTest('4. Missing buffer pH with acidic soil refuses exact lime rate and requests buffer-pH test', () => {
    const noBufferEval = evaluateSoilPhForSnapshot('tested', 5.2, null);
    assert.equal(noBufferEval.classification, 'acidic');
    assert.equal(noBufferEval.isBalanced, false);
    assert.match(noBufferEval.observation, /Buffer pH \/ lime requirement is not recorded/i);
    assert.match(noBufferEval.recommendation, /buffer-pH \/ lime-requirement test/i);
    assert.match(noBufferEval.recommendation, /exact lime tonnage cannot be calculated from water pH alone/i);
    assert.ok(!/\d+\s*(t\/ha|tons?\/acre|kg\/ha)/i.test(noBufferEval.recommendation));

    const withBufferEval = evaluateSoilPhForSnapshot('tested', 5.2, 6.15);
    assert.match(withBufferEval.observation, /Recorded buffer pH: 6\.15/);
    assert.match(withBufferEval.recommendation, /buffer pH \(6\.15\)/i);
    assert.ok(!/\d+\s*(t\/ha|tons?\/acre|kg\/ha)/i.test(withBufferEval.recommendation));
  });

  // 5. Consistent confidence before and after snapshot creation (no 0.4 vs 0.85 arbitrary jump)
  await runTest('5. Unified evidence-based confidence stays consistent before and after snapshot creation and separates completeness', () => {
    const rawUnassessed = makeRawFarm({
      lastAssessedAt: null,
      suitabilityScore: null,
      soil: {
        ...makeRawFarm().soil,
        moistureStatus: 'estimated',
        moisturePct: 54,
        moistureMethod: '',
        moistureDate: '',
        phStatus: 'tested',
        phValue: 5.2,
        bufferPh: null,
        phTestDate: '',
        organicMatterPct: null,
      },
      water: {
        ...makeRawFarm().water,
        dailyCapacityKnown: false,
        dailyCapacityM3: null,
        qualityTested: 'No',
        ecDsM: null,
        salinityPpm: null,
      },
    });

    const beforeNoFeeds = buildAssessedFarmRecord(rawUnassessed, [], [], [], []);
    // All 8 UI checklist fields are populated -> 100% profile completeness, yet scientific confidence is materially lower
    assert.equal(beforeNoFeeds.assessment.completenessPct, 100);
    assert.ok(beforeNoFeeds.assessment.confidencePct < 60, `Expected <60 scientific confidence before telemetry/lab depth, got ${beforeNoFeeds.assessment.confidencePct}`);

    // Snapshot created with unavailable feeds -> identical confidence before, in snapshot, and after
    const offlineSnapPayload = buildFreshSnapshotPayload({
      farm: beforeNoFeeds,
      meanTempC: null,
      precipMmDay: null,
      et0MmDay: null,
      weatherWindowSummary: 'Offline baseline check.',
      dataAvailability: { nasaPower: 'unavailable', openMeteo: 'unavailable', nasaEonet: 'unavailable' },
    });
    const offlineSnap: SavedFarmSnapshot = {
      id: 'snap-offline-1',
      farmId: rawUnassessed.id,
      generatedAt: '2026-11-15T10:05:00.000Z',
      ...offlineSnapPayload,
    };
    const afterOffline = buildAssessedFarmRecord(
      { ...rawUnassessed, lastAssessedAt: offlineSnap.generatedAt, suitabilityScore: offlineSnap.suitabilityScore },
      [],
      [],
      [],
      [offlineSnap]
    );

    assert.equal(beforeNoFeeds.assessment.confidencePct, offlineSnap.confidencePct);
    assert.equal(afterOffline.assessment.confidencePct, offlineSnap.confidencePct);

    // Online snapshot with retrieved feeds -> snapshot confidence equals Overview confidence immediately after
    const onlineSnapPayload = buildFreshSnapshotPayload({
      farm: beforeNoFeeds,
      meanTempC: 11.4,
      precipMmDay: 2.2,
      et0MmDay: null,
      weatherWindowSummary: 'NASA POWER + Open-Meteo + EONET.',
      dataAvailability: { nasaPower: 'available', openMeteo: 'available', nasaEonet: 'available' },
    });
    const onlineSnap: SavedFarmSnapshot = {
      id: 'snap-online-1',
      farmId: rawUnassessed.id,
      generatedAt: '2026-11-15T10:06:00.000Z',
      ...onlineSnapPayload,
    };
    const afterOnline = buildAssessedFarmRecord(
      { ...rawUnassessed, lastAssessedAt: onlineSnap.generatedAt, suitabilityScore: onlineSnap.suitabilityScore },
      [],
      [],
      [],
      [onlineSnap]
    );

    assert.equal(onlineSnap.confidencePct, afterOnline.assessment.confidencePct);
    // Flipping only lastAssessedAt / suitabilityScore under same evidence NEVER causes a 40 -> 85 jump
    const sameEvidenceBefore = computeScientificConfidence({
      soil: rawUnassessed.soil,
      water: rawUnassessed.water,
      hasCentroid: true,
      hasBoundary: true,
      hasPrimaryCrop: true,
      observations: [],
      dataAvailability: { nasaPower: 'available', openMeteo: 'available', nasaEonet: 'available' },
    });
    assert.equal(sameEvidenceBefore, onlineSnap.confidencePct);
  });

  // 6 & 7 & 8 via isolated Express router HTTP verification
  const tmpDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anchor-stage1-'));
  const prevEnvDir = process.env.ANCHOR_DATA_DIR;
  process.env.ANCHOR_DATA_DIR = tmpDataDir;

  const app = express();
  app.use(express.json());
  app.use('/api/my-farms', createMyFarmsRouter());

  const server = await new Promise<http.Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });

  try {
    const addr = server.address();
    assert.ok(addr && typeof addr === 'object');
    const baseUrl = `http://127.0.0.1:${addr.port}/api/my-farms`;

    // 6. Snapshot persistence & historical snapshot integrity
    await runTest('6. HTTP snapshot persistence preserves historical snapshots unchanged on disk', async () => {
      const initialResp = await fetch(`${baseUrl}/portfolio`);
      assert.equal(initialResp.status, 200);
      const initialBody = (await initialResp.json()) as {
        farms: ServerRawFarmDto[];
        snapshots: SavedFarmSnapshot[];
      };
      const originalGv01 = initialBody.snapshots.find((s) => s.id === 'snap-gv-01');
      const originalGv02 = initialBody.snapshots.find((s) => s.id === 'snap-gv-02');
      assert.ok(originalGv01 && originalGv02, 'Baseline historical snapshots must exist');

      const gvRaw = initialBody.farms.find((f) => f.id === 'farm-green-valley');
      assert.ok(gvRaw);
      const gvAssessed = buildAssessedFarmRecord(gvRaw, [], [], [], initialBody.snapshots);
      const newDraft = buildFreshSnapshotPayload({
        farm: gvAssessed,
        meanTempC: 10.5,
        precipMmDay: 3.1,
        et0MmDay: null,
        weatherWindowSummary: 'NASA POWER window check.',
        dataAvailability: { nasaPower: 'available', openMeteo: 'available', nasaEonet: 'available' },
        nearbyHazardCount: 0,
      });

      const postResp = await fetch(`${baseUrl}/farms/farm-green-valley/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDraft),
      });
      assert.equal(postResp.status, 201);
      const postJson = (await postResp.json()) as {
        snapshot: SavedFarmSnapshot;
        portfolio: { snapshots: SavedFarmSnapshot[] };
      };

      const afterResp = await fetch(`${baseUrl}/portfolio`);
      const afterBody = (await afterResp.json()) as { snapshots: SavedFarmSnapshot[] };
      assert.equal(afterBody.snapshots.length, initialBody.snapshots.length + 1);
      assert.deepEqual(afterBody.snapshots.find((s) => s.id === 'snap-gv-01'), originalGv01);
      assert.deepEqual(afterBody.snapshots.find((s) => s.id === 'snap-gv-02'), originalGv02);
      assert.equal(afterBody.snapshots[0].id, postJson.snapshot.id);
    });

    // 7. Invalid snapshot inputs rejected with clear errors
    await runTest('7. Invalid snapshot inputs (NaN, Infinity, out-of-range, empty recs, unknown farm) are rejected cleanly', () => {
      const validBase = buildFreshSnapshotPayload({
        farm: buildAssessedFarmRecord(makeRawFarm(), [], [], []),
        meanTempC: 15,
        precipMmDay: 2,
        et0MmDay: 1.5,
        weatherWindowSummary: 'Valid window',
        dataAvailability: { nasaPower: 'available', openMeteo: 'available', nasaEonet: 'available' },
      });

      const nanRes = validateSnapshotPayload({
        ...validBase,
        keyMetrics: { ...validBase.keyMetrics, phValue: Number.NaN },
      });
      assert.equal(nanRes.ok, false);

      const infRes = validateSnapshotPayload({
        ...validBase,
        keyMetrics: { ...validBase.keyMetrics, precipMmDay: Number.POSITIVE_INFINITY },
      });
      assert.equal(infRes.ok, false);

      const outOfRangePh = validateSnapshotPayload({
        ...validBase,
        keyMetrics: { ...validBase.keyMetrics, phValue: 14.5 },
      });
      assert.equal(outOfRangePh.ok, false);
      if (!outOfRangePh.ok) assert.match(outOfRangePh.error, /0 and 14/);

      const negMoisture = validateSnapshotPayload({
        ...validBase,
        keyMetrics: { ...validBase.keyMetrics, soilMoisturePct: -3 },
      });
      assert.equal(negMoisture.ok, false);

      const badScore = validateSnapshotPayload({
        ...validBase,
        suitabilityScore: 105,
      });
      assert.equal(badScore.ok, false);

      const emptyRecs = validateSnapshotPayload({
        ...validBase,
        recommendations: [],
      });
      assert.equal(emptyRecs.ok, false);
    });

    await runTest('7b. HTTP endpoint rejects invalid snapshot payload (400) and unknown farmId (404)', async () => {
      const badResp = await fetch(`${baseUrl}/farms/farm-green-valley/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName: 'Whole Farm',
          modelVersion: 'power-eonet-v2.1',
          triggerReason: 'Test',
          suitabilityScore: 120,
          confidencePct: 50,
          completenessPct: 50,
          weatherWindowSummary: 'Summary',
          dataAvailability: {
            nasaPower: 'available',
            openMeteo: 'available',
            nasaEonet: 'available',
            soilLab: 'measured',
          },
          keyMetrics: {
            meanTempC: 10,
            precipMmDay: -2,
            et0MmDay: null,
            soilMoisturePct: 30,
            phValue: 6.5,
            mappedAreaHa: 10,
          },
          recommendations: ['Check'],
        }),
      });
      assert.equal(badResp.status, 400);
      const badJson = (await badResp.json()) as { error?: string };
      assert.ok(badJson.error && badJson.error.length > 5);

      const validPayload = buildFreshSnapshotPayload({
        farm: buildAssessedFarmRecord(makeRawFarm(), [], [], []),
        meanTempC: 10,
        precipMmDay: 1,
        et0MmDay: null,
        weatherWindowSummary: 'Summary',
        dataAvailability: { nasaPower: 'available', openMeteo: 'available', nasaEonet: 'available' },
      });
      const notFoundResp = await fetch(`${baseUrl}/farms/farm-does-not-exist/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });
      assert.equal(notFoundResp.status, 404);
    });

    // 8. Valid zero-valued inputs preserved across calculations and HTTP persistence
    await runTest('8. Valid zero values (0 temp, 0 precip, 0 ET0, 0 moisture, 0 pH, 0 area, 0 score) are preserved untouched', async () => {
      const zeroFarmRaw = makeRawFarm({
        id: 'farm-green-valley',
        mappedAreaHa: 0,
        hasBoundary: false,
        soil: {
          ...makeRawFarm().soil,
          moistureStatus: 'measured',
          moisturePct: 0,
          phStatus: 'tested',
          phValue: 0,
        },
      });
      const assessed = buildAssessedFarmRecord(zeroFarmRaw, [], [], []);
      const zeroDraft = buildFreshSnapshotPayload({
        farm: assessed,
        meanTempC: 0,
        precipMmDay: 0,
        et0MmDay: 0,
        weatherWindowSummary: '0 C, 0.00 mm/d dry cold window.',
        dataAvailability: { nasaPower: 'available', openMeteo: 'available', nasaEonet: 'available' },
        nearbyHazardCount: 0,
      });

      assert.equal(zeroDraft.keyMetrics.meanTempC, 0);
      assert.equal(zeroDraft.keyMetrics.precipMmDay, 0);
      assert.equal(zeroDraft.keyMetrics.et0MmDay, 0);
      assert.equal(zeroDraft.keyMetrics.soilMoisturePct, 0);
      assert.equal(zeroDraft.keyMetrics.phValue, 0);
      assert.equal(zeroDraft.keyMetrics.mappedAreaHa, 0);

      // Also test zero score/confidence/completeness explicitly through HTTP POST persistence
      const zeroMetricsPayload = {
        ...zeroDraft,
        suitabilityScore: 0,
        confidencePct: 0,
        completenessPct: 0,
      };
      const val = validateSnapshotPayload(zeroMetricsPayload);
      assert.equal(val.ok, true);

      const postResp = await fetch(`${baseUrl}/farms/farm-green-valley/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zeroMetricsPayload),
      });
      assert.equal(postResp.status, 201);
      const postJson = (await postResp.json()) as {
        snapshot: SavedFarmSnapshot;
        portfolio: { farms: ServerRawFarmDto[] };
      };
      assert.equal(postJson.snapshot.suitabilityScore, 0);
      assert.equal(postJson.snapshot.confidencePct, 0);
      assert.equal(postJson.snapshot.completenessPct, 0);
      assert.equal(postJson.snapshot.keyMetrics.meanTempC, 0);
      assert.equal(postJson.snapshot.keyMetrics.precipMmDay, 0);
      assert.equal(postJson.snapshot.keyMetrics.et0MmDay, 0);
      assert.equal(postJson.snapshot.keyMetrics.soilMoisturePct, 0);
      assert.equal(postJson.snapshot.keyMetrics.phValue, 0);
      assert.equal(postJson.snapshot.keyMetrics.mappedAreaHa, 0);

      const updatedGv = postJson.portfolio.farms.find((f) => f.id === 'farm-green-valley');
      assert.equal(updatedGv?.suitabilityScore, 0);
    });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (prevEnvDir === undefined) delete process.env.ANCHOR_DATA_DIR;
    else process.env.ANCHOR_DATA_DIR = prevEnvDir;
    fs.rmSync(tmpDataDir, { recursive: true, force: true });
  }

  console.log(`\nAll ${passed} Stage 1 regression verification tests passed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
