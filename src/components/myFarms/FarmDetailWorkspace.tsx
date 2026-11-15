import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  CloudSun,
  Copy,
  Download,
  Droplets,
  Edit3,
  FileBarChart2,
  GitCompare,
  Layers,
  Lock,
  Map as MapIcon,
  Play,
  Plus,
  RefreshCw,
  Satellite,
  Settings as SettingsIcon,
  Sprout,
  Trash2,
} from 'lucide-react';
import {
  FarmObservationItem,
  FarmTaskItem,
  IrrigationLogItem,
  MyFarmRecord,
  MyFarmsSubTab,
  PlanDecisionAction,
  PlanDecisionEvent,
  PlanDecisionReasonCode,
  PortfolioFieldRecord,
  RotationCandidateOption,
  SavedFarmSnapshot,
} from '../../types/myFarms';
import {
  AreaUnit,
  DrainageRate,
  IrrigationFrequency,
  IrrigationMethod,
  SoilMoistureStatus,
  SoilPhStatus,
  SoilTexture,
  WateringMethod,
  WaterQualityTestStatus,
  WaterReliability,
  WaterSource,
} from '../../types/farm';
import { GeoJsonPolygonGeometry } from '../../types/maps';
import {
  computeWaterBalance,
  formatArea,
  formatRelativeDate,
  resolveCropThumbnail,
} from '../../lib/myFarmsEngine';
import { useDisplayPrefs } from '../../context/DisplayPrefsContext';
import { fetchLiveFarmWeather, LiveWeatherReading } from '../../services/weather';
import { fetchNasaPowerClimatology } from '../../services/nasaPower';
import { fetchEonetEvents } from '../../services/eonet';
import { PowerClimateResult } from '../../types';
import { FieldBoundaryEditorMap } from './FieldBoundaryEditorMap';
import { PlanDecisionJournal } from './PlanDecisionJournal';
import { ProvenanceText, StatusLabel } from './StatusIndicators';

const SUB_TABS: Array<{ id: MyFarmsSubTab; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview', Icon: Activity },
  { id: 'fields', label: 'Fields & Map', Icon: Layers },
  { id: 'rotation', label: 'Rotation Plan', Icon: Sprout },
  { id: 'soil', label: 'Soil & Land', Icon: ClipboardList },
  { id: 'water', label: 'Water Intelligence', Icon: Droplets },
  { id: 'weather', label: 'Weather & Climate', Icon: CloudSun },
  { id: 'vegetation', label: 'Vegetation & Change', Icon: Satellite },
  { id: 'actions', label: 'Actions & Logs', Icon: CalendarCheck },
  { id: 'reports', label: 'Past Analyses', Icon: FileBarChart2 },
  { id: 'settings', label: 'Farm Settings', Icon: SettingsIcon },
];

interface FarmDetailWorkspaceProps {
  farm: MyFarmRecord;
  allFields: PortfolioFieldRecord[];
  decisions: PlanDecisionEvent[];
  observations: FarmObservationItem[];
  tasks: FarmTaskItem[];
  irrigationLogs: IrrigationLogItem[];
  snapshots: SavedFarmSnapshot[];
  activeTab: MyFarmsSubTab;
  isOnline: boolean;
  onChangeTab: (tab: MyFarmsSubTab) => void;
  onBackToPortfolio: () => void;
  onPatchFarm: (farm: MyFarmRecord, patch: Record<string, unknown>, label: string) => Promise<void>;
  onCreateField: (payload: Record<string, unknown>) => Promise<void>;
  onPatchField: (fieldId: string, patch: Record<string, unknown>) => Promise<void>;
  onSaveFieldBoundary: (fieldId: string, geometry: GeoJsonPolygonGeometry, editReason?: string) => Promise<void>;
  onDeleteField: (fieldId: string) => Promise<void>;
  onRecordDecision: (payload: {
    fieldId: string | null;
    fieldName: string;
    action: PlanDecisionAction;
    candidate: RotationCandidateOption;
    isRecommendedPlan: boolean;
    reasonCode: PlanDecisionReasonCode;
    reasonNote: string;
  }) => Promise<void>;
  onAddObservation: (payload: Record<string, unknown>) => Promise<void>;
  onAddTask: (payload: Record<string, unknown>) => Promise<void>;
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
  onAddIrrigation: (payload: Record<string, unknown>) => Promise<void>;
  onCreateSnapshot: (payload: Record<string, unknown>) => Promise<void>;
  onOpenRename: (farm: MyFarmRecord) => void;
  onOpenDuplicate: (farm: MyFarmRecord) => void;
  onOpenExport: (farm: MyFarmRecord) => void;
  onArchiveToggle: (farm: MyFarmRecord) => void;
  onOpenDelete: (farm: MyFarmRecord) => void;
  onOpenInMaps: (farm: MyFarmRecord) => void;
  onRunDeepAnalysis: (farm: MyFarmRecord) => void;
}

export const FarmDetailWorkspace: React.FC<FarmDetailWorkspaceProps> = ({
  farm,
  allFields,
  decisions,
  observations,
  tasks,
  irrigationLogs,
  snapshots,
  activeTab,
  isOnline,
  onChangeTab,
  onBackToPortfolio,
  onPatchFarm,
  onCreateField,
  onPatchField,
  onSaveFieldBoundary,
  onDeleteField,
  onRecordDecision,
  onAddObservation,
  onAddTask,
  onToggleTask,
  onAddIrrigation,
  onCreateSnapshot,
  onOpenRename,
  onOpenDuplicate,
  onOpenExport,
  onArchiveToggle,
  onOpenDelete,
  onOpenInMaps,
  onRunDeepAnalysis,
}) => {
  const { tempUnit, windUnit } = useDisplayPrefs();

  const farmFields = useMemo(
    () => allFields.filter((f) => f.farmId === farm.id),
    [allFields, farm.id]
  );
  const farmObservations = useMemo(
    () => observations.filter((o) => o.farmId === farm.id),
    [observations, farm.id]
  );
  const farmTasks = useMemo(
    () => tasks.filter((t) => t.farmId === farm.id),
    [tasks, farm.id]
  );
  const farmIrrigation = useMemo(
    () => irrigationLogs.filter((l) => l.farmId === farm.id),
    [irrigationLogs, farm.id]
  );
  const farmSnapshots = useMemo(
    () =>
      snapshots
        .filter((s) => s.farmId === farm.id)
        .sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt)),
    [snapshots, farm.id]
  );

  // Fields & Map State
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    farmFields[0]?.id ?? null
  );
  const [fieldTableFilter, setFieldTableFilter] = useState<
    'all' | 'alerts' | 'rotation_due' | 'missing_soil'
  >('all');
  const [pendingNewFieldGeom, setPendingNewFieldGeom] = useState<{
    geometry: GeoJsonPolygonGeometry;
    areaHa: number;
  } | null>(null);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldCrop, setNewFieldCrop] = useState(farm.primaryCrop || 'Wheat');
  const [confirmDeleteFieldId, setConfirmDeleteFieldId] = useState<string | null>(null);

  useEffect(() => {
    if (farmFields.length > 0 && !farmFields.some((f) => f.id === selectedFieldId)) {
      setSelectedFieldId(farmFields[0].id);
    } else if (farmFields.length === 0) {
      setSelectedFieldId(null);
    }
  }, [farm.id, farmFields.length]);

  const selectedField = useMemo(
    () => farmFields.find((f) => f.id === selectedFieldId) ?? null,
    [farmFields, selectedFieldId]
  );

  const filteredComparisonFields = useMemo(() => {
    return farmFields.filter((f) => {
      if (fieldTableFilter === 'alerts') {
        return f.status === 'Needs Review' || f.activeAlertsCount > 0;
      }
      if (fieldTableFilter === 'rotation_due') {
        return f.rotationReviewDue;
      }
      if (fieldTableFilter === 'missing_soil') {
        return !f.soilSummary && !f.soilOverrides?.texture;
      }
      return true;
    });
  }, [farmFields, fieldTableFilter]);

  // Soil form state synced on farm change
  const [soilForm, setSoilForm] = useState(farm.soil);
  const [savingSoil, setSavingSoil] = useState(false);
  const [demProbeLoading, setDemProbeLoading] = useState(false);

  useEffect(() => {
    setSoilForm(farm.soil);
  }, [farm.id, farm.updatedAt]);

  // Water form state
  const [waterForm, setWaterForm] = useState(farm.water);
  const [savingWater, setSavingWater] = useState(false);
  const [irrDate, setIrrDate] = useState(new Date().toISOString().slice(0, 10));
  const [irrVolume, setIrrVolume] = useState('');
  const [irrNotes, setIrrNotes] = useState('');

  useEffect(() => {
    setWaterForm(farm.water);
  }, [farm.id, farm.updatedAt]);

  const waterBalance = useMemo(() => computeWaterBalance(farm), [farm]);

  // Live Weather & Climate State
  const [liveWeather, setLiveWeather] = useState<LiveWeatherReading | null>(null);
  const [climateResult, setClimateResult] = useState<PowerClimateResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const loadWeatherAndClimate = async () => {
    if (!farm.centroid) {
      setWeatherError('Add farm coordinates to fetch gridded weather and NASA POWER climate data.');
      return;
    }
    if (!isOnline) {
      setWeatherError('Offline — live weather and NASA POWER fetch disabled until connection returns.');
      return;
    }
    setWeatherLoading(true);
    setWeatherError(null);
    const todayIso = new Date().toISOString().slice(0, 10);
    try {
      const [wRes, pRes] = await Promise.allSettled([
        fetchLiveFarmWeather(farm.centroid.lat, farm.centroid.lon),
        fetchNasaPowerClimatology(farm.centroid.lat, farm.centroid.lon, todayIso, undefined, 'farming'),
      ]);
      if (wRes.status === 'fulfilled') setLiveWeather(wRes.value);
      if (pRes.status === 'fulfilled') setClimateResult(pRes.value);
      if (wRes.status === 'rejected' && pRes.status === 'rejected') {
        setWeatherError('Unable to reach Open-Meteo or NASA POWER right now.');
      }
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'weather' || activeTab === 'overview') && farm.centroid && isOnline && !liveWeather) {
      loadWeatherAndClimate();
    }
  }, [activeTab, farm.id, isOnline]);

  // Actions & Observations Form
  const [obsTitle, setObsTitle] = useState('');
  const [obsCategory, setObsCategory] = useState<FarmObservationItem['category']>('scouting');
  const [obsDetail, setObsDetail] = useState('');
  const [obsProvenance, setObsProvenance] = useState<'Measured' | 'Reported'>('Reported');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'normal' | 'low'>('normal');

  // Past Analyses Compare State
  const [compareLeftId, setCompareLeftId] = useState<string>(farmSnapshots[1]?.id ?? farmSnapshots[0]?.id ?? '');
  const [compareRightId, setCompareRightId] = useState<string>(farmSnapshots[0]?.id ?? '');
  const [runningSnapshot, setRunningSnapshot] = useState(false);

  useEffect(() => {
    setCompareRightId(farmSnapshots[0]?.id ?? '');
    setCompareLeftId(farmSnapshots[1]?.id ?? farmSnapshots[0]?.id ?? '');
  }, [farm.id, farmSnapshots.length]);

  const compareLeft = farmSnapshots.find((s) => s.id === compareLeftId) ?? null;
  const compareRight = farmSnapshots.find((s) => s.id === compareRightId) ?? null;

  // Settings Region / Area Unit local edits
  const [settingsRegion, setSettingsRegion] = useState(farm.regionLabel);
  const [settingsTz, setSettingsTz] = useState(farm.timezone);
  const [settingsDeclaredArea, setSettingsDeclaredArea] = useState(
    farm.declaredAreaHa !== null ? String(farm.declaredAreaHa) : ''
  );
  const [settingsAreaUnit, setSettingsAreaUnit] = useState<AreaUnit>(farm.areaUnit);
  const [settingsNotes, setSettingsNotes] = useState(farm.notes);

  useEffect(() => {
    setSettingsRegion(farm.regionLabel);
    setSettingsTz(farm.timezone);
    setSettingsDeclaredArea(farm.declaredAreaHa !== null ? String(farm.declaredAreaHa) : '');
    setSettingsAreaUnit(farm.areaUnit);
    setSettingsNotes(farm.notes);
  }, [farm.id, farm.updatedAt]);

  const fmtTemp = (c: number | null | undefined) => {
    if (c === null || c === undefined || !Number.isFinite(c)) return '—';
    return tempUnit === 'F' ? `${Math.round((c * 9) / 5 + 32)} °F` : `${c.toFixed(1)} °C`;
  };
  const fmtWind = (kmh: number | null | undefined) => {
    if (kmh === null || kmh === undefined || !Number.isFinite(kmh)) return '—';
    return windUnit === 'mph' ? `${Math.round(kmh * 0.621371)} mph` : `${Math.round(kmh)} km/h`;
  };

  const handleSaveSoil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSoil(true);
    try {
      await onPatchFarm(farm, { soil: soilForm }, `Updated Soil & Land for ${farm.name}`);
    } finally {
      setSavingSoil(false);
    }
  };

  const handleProbeTerrainSlope = async () => {
    if (!farm.centroid || !isOnline) return;
    setDemProbeLoading(true);
    try {
      const resp = await fetch('/api/maps/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: farm.centroid.lat,
          lon: farm.centroid.lon,
          observationDate: new Date().toISOString().slice(0, 10),
          fieldAreaHectares: farm.mappedAreaHa || null,
        }),
      });
      if (!resp.ok) return;
      const json = (await resp.json()) as {
        datasets?: Array<{ layerId: string; metrics?: Array<{ label: string; value: string }> }>;
      };
      const elevDs = json.datasets?.find((d) => d.layerId === 'elevation_terrain');
      const elevM = Number(elevDs?.metrics?.find((m) => m.label.includes('Elevation'))?.value);
      const slopeVal = Number(elevDs?.metrics?.find((m) => m.label.includes('Slope'))?.value);
      setSoilForm((prev) => ({
        ...prev,
        elevationM: Number.isFinite(elevM) ? elevM : prev.elevationM,
        slopePct: Number.isFinite(slopeVal) ? slopeVal : prev.slopePct,
      }));
    } finally {
      setDemProbeLoading(false);
    }
  };

  const handleSaveWater = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWater(true);
    try {
      await onPatchFarm(farm, { water: waterForm }, `Updated Water Intelligence for ${farm.name}`);
    } finally {
      setSavingWater(false);
    }
  };

  const handleCreateFreshSnapshot = async () => {
    if (!isOnline) return;
    setRunningSnapshot(true);
    try {
      const todayIso = new Date().toISOString().slice(0, 10);
      let weatherSummary = 'No coordinates set; baseline profile check only.';
      let meanTemp: number | null = null;
      let precip: number | null = null;
      let et0: number | null = null;
      let nasaAvail: 'available' | 'unavailable' = 'unavailable';
      let meteoAvail: 'available' | 'unavailable' = 'unavailable';
      let eonetAvail: 'available' | 'unavailable' = 'unavailable';
      let hazardPenalty = 0;

      if (farm.centroid) {
        const [pRes, wRes, eRes] = await Promise.allSettled([
          fetchNasaPowerClimatology(farm.centroid.lat, farm.centroid.lon, todayIso, undefined, 'farming'),
          fetchLiveFarmWeather(farm.centroid.lat, farm.centroid.lon),
          fetchEonetEvents(farm.centroid.lat, farm.centroid.lon, 30),
        ]);
        if (pRes.status === 'fulfilled') {
          nasaAvail = 'available';
          const p = pRes.value;
          meanTemp = p.meanMaxC !== null && p.meanMinC !== null ? Number(((p.meanMaxC + p.meanMinC) / 2).toFixed(1)) : null;
          precip = p.meanPrecipMm;
          weatherSummary = `NASA POWER (${p.yearsAnalyzed.length}y window): ${p.meanMaxC?.toFixed(1) ?? '—'}/${p.meanMinC?.toFixed(1) ?? '—'} °C, ${p.meanPrecipMm?.toFixed(2) ?? '—'} mm/d.`;
        }
        if (wRes.status === 'fulfilled') {
          meteoAvail = 'available';
          setLiveWeather(wRes.value);
          if (meanTemp === null) meanTemp = wRes.value.tempC;
          if (precip === null) precip = wRes.value.precipMm;
        }
        if (eRes.status === 'fulfilled') {
          eonetAvail = 'available';
          if (eRes.value.nearbyEvents.length > 0) hazardPenalty = 10;
        }
      }

      // Compute deterministic suitability honestly (or null if too incomplete)
      const moisture = farm.soil.moistureStatus !== 'unknown' ? farm.soil.moisturePct : null;
      const ph = farm.soil.phStatus === 'tested' ? farm.soil.phValue : null;
      const hasEnough = farm.centroid !== null && (moisture !== null || ph !== null || farm.soil.texture !== 'Unknown');

      let score: number | null = null;
      if (hasEnough) {
        let s = 74;
        if (moisture !== null) {
          if (moisture >= 24 && moisture <= 42) s += 10;
          else if (moisture < 19) s -= 24;
          else s -= 8;
        }
        if (ph !== null) {
          if (ph >= 6.0 && ph <= 7.2) s += 6;
          else if (ph < 5.3 || ph > 8.2) s -= 12;
        }
        if (farm.water.reliability === 'Frequently limited' || farm.water.reliability === 'Highly unreliable') s -= 16;
        else if (farm.water.reliability === 'Always available') s += 5;
        s -= hazardPenalty;
        score = Math.max(12, Math.min(96, Math.round(s)));
      }

      const recs: string[] = [];
      if (moisture !== null && moisture < 21) {
        recs.push(`Moisture deficit (${moisture}% VWC): prioritize drought-tolerant varieties or pre-dawn drip pulses.`);
      }
      if (ph === null) recs.push('Soil pH untested: submit composite 0–20 cm cores before next fertiliser cycle.');
      if (farm.water.reliability === 'Frequently limited') {
        recs.push('Align peak-ET crop stage outside constrained supply months.');
      }
      if (recs.length === 0) {
        recs.push('Current moisture, soil, and climate indicators remain within balanced thresholds.');
      }

      await onCreateSnapshot({
        fieldId: null,
        fieldName: 'Whole Farm',
        modelVersion: 'power-eonet-v2.1',
        triggerReason: 'Manual My Farms assessment refresh',
        suitabilityScore: score,
        confidencePct: farm.assessment.confidencePct,
        completenessPct: farm.assessment.completenessPct,
        weatherWindowSummary: weatherSummary,
        dataAvailability: {
          nasaPower: nasaAvail,
          openMeteo: meteoAvail,
          nasaEonet: eonetAvail,
          soilLab:
            farm.soil.moistureStatus === 'measured' || farm.soil.phStatus === 'tested'
              ? 'measured'
              : farm.soil.moistureStatus === 'estimated'
                ? 'estimated'
                : 'missing',
        },
        keyMetrics: {
          meanTempC: meanTemp,
          precipMmDay: precip,
          et0MmDay: et0,
          soilMoisturePct: moisture,
          phValue: ph,
          mappedAreaHa: farm.mappedAreaHa,
        },
        recommendations: recs,
      });
    } finally {
      setRunningSnapshot(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb & Farm Action Strip */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToPortfolio}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/50 hover:bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            My Farms
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-[var(--text-primary)] truncate">
                {farm.name}
              </h1>
              <StatusLabel status={farm.assessment.status} />
            </div>
            <div className="text-xs text-[var(--text-secondary)] truncate tabular-nums">
              {farm.locationLabel}
              {farm.mappedAreaHa > 0 ? ` · ${formatArea(farm.mappedAreaHa, farm.areaUnit)}` : ' · Unmapped'}
              {` · ${farmFields.length} field${farmFields.length === 1 ? '' : 's'}`}
              {` · Private`}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => onOpenInMaps(farm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] font-medium text-[var(--text-primary)] cursor-pointer"
          >
            <MapIcon className="w-3.5 h-3.5" />
            Open in Maps
          </button>
          <button
            type="button"
            onClick={() => onRunDeepAnalysis(farm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white font-semibold hover:brightness-110 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            Deep Analysis
          </button>
        </div>
      </div>

      {/* Main Split Workspace: Vertical Sub-nav + Content */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Stable Sub-navigation */}
        <nav
          aria-label="Farm sections"
          className="w-full lg:w-56 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1.5 flex lg:flex-col gap-1 overflow-x-auto fs-thin-scroll"
        >
          {SUB_TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChangeTab(id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-[var(--accent)] text-white font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Detail Section */}
        <section className="flex-1 min-w-0 w-full space-y-4">
          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {(farm.hasFieldOverlapWarning || farm.areaGapNote || farm.assessment.worstFieldReason || farm.assessment.freshnessState === 'stale') && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Operational &amp; Spatial Advisories
                  </div>
                  {farm.assessment.worstFieldReason && (
                    <div>
                      · <strong>Priority Risk ({farm.assessment.worstFieldName || 'Field Monitor'}):</strong> {farm.assessment.worstFieldReason}
                    </div>
                  )}
                  {farm.hasFieldOverlapWarning && farm.overlapWarningDetail && (
                    <div>· <strong>Polygon Overlap:</strong> {farm.overlapWarningDetail}</div>
                  )}
                  {farm.areaGapNote && <div>· <strong>Area Reconciliation:</strong> {farm.areaGapNote}</div>}
                  {farm.assessment.staleReasons.map((sr, i) => (
                    <div key={i}>· {sr}</div>
                  ))}
                </div>
              )}

              {/* Compact 4-Metric Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3.5">
                  <div className="text-[11px] text-[var(--text-secondary)]">Suitability Score</div>
                  <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums mt-1">
                    {farm.assessment.score !== null ? `${farm.assessment.score}/100` : 'Unassessed'}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 tabular-nums">
                    Data confidence {farm.assessment.confidencePct}%
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3.5">
                  <div className="text-[11px] text-[var(--text-secondary)]">Mapped Area</div>
                  <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums mt-1">
                    {farm.mappedAreaHa > 0 ? formatArea(farm.mappedAreaHa, farm.areaUnit) : 'Unmapped'}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 tabular-nums">
                    {farm.declaredAreaHa ? `Declared ${formatArea(farm.declaredAreaHa, farm.areaUnit)}` : 'No declared area'}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3.5">
                  <div className="text-[11px] text-[var(--text-secondary)]">Profile Completeness</div>
                  <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums mt-1">
                    {farm.assessment.completenessPct}%
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    {formatRelativeDate(farm.assessment.assessedAt)}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3.5">
                  <div className="text-[11px] text-[var(--text-secondary)]">Active Plan</div>
                  <div className="text-sm font-bold text-[var(--text-primary)] truncate mt-1.5">
                    {farm.activePlan ? farm.activePlan.title : 'None selected'}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                    {farm.activePlan ? `v${farm.activePlan.version} · Farmer selected` : 'Open Rotation Plan →'}
                  </div>
                </div>
              </div>

              {/* Tracker Summary & Open Tasks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Assessment Summary</h3>
                    <button
                      type="button"
                      disabled={!isOnline || runningSnapshot}
                      onClick={handleCreateFreshSnapshot}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-45 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${runningSnapshot ? 'animate-spin' : ''}`} />
                      {runningSnapshot ? 'Refreshing…' : 'Refresh Assessment'}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {farm.assessment.summary}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)] text-xs">
                    <div>
                      <span className="text-[var(--text-secondary)]">Soil texture: </span>
                      <strong className="text-[var(--text-primary)]">{farm.soil.texture}</strong>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">Moisture: </span>
                      <strong className="text-[var(--text-primary)] tabular-nums">
                        {farm.soil.moistureStatus !== 'unknown' && farm.soil.moisturePct !== null
                          ? `${farm.soil.moisturePct}% (${farm.soil.moistureStatus})`
                          : 'Unknown'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">Soil pH: </span>
                      <strong className="text-[var(--text-primary)] tabular-nums">
                        {farm.soil.phStatus === 'tested' && farm.soil.phValue !== null
                          ? farm.soil.phValue.toFixed(1)
                          : 'Not tested'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">Water supply: </span>
                      <strong className="text-[var(--text-primary)]">{farm.water.reliability}</strong>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Open Farm Tasks ({farmTasks.filter((t) => !t.completed).length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => onChangeTab('actions')}
                      className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      Manage all →
                    </button>
                  </div>
                  {farmTasks.length === 0 ? (
                    <p className="text-xs text-[var(--text-secondary)]">
                      No open tasks recorded for {farm.name}.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {farmTasks.slice(0, 4).map((t) => (
                        <label
                          key={t.id}
                          className="flex items-start gap-2.5 p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/35 text-xs cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={t.completed}
                            onChange={(e) => onToggleTask(t.id, e.target.checked)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium ${t.completed ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                              {t.title}
                            </div>
                            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                              {t.fieldName || 'Whole Farm'} · {t.priority} priority
                              {t.dueDate ? ` · Due ${t.dueDate}` : ''}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. FIELDS & MAP */}
          {activeTab === 'fields' && (
            <div className="space-y-4">
              <FieldBoundaryEditorMap
                center={farm.centroid}
                farmGeometry={farm.geometry}
                fields={farmFields}
                selectedFieldId={selectedFieldId}
                areaUnit={farm.areaUnit}
                onSelectField={(id) => setSelectedFieldId(id)}
                onSavePolygon={async ({ geometry, areaHa, mode, editingFieldId, editReason }) => {
                  if (mode === 'edit' && editingFieldId) {
                    await onSaveFieldBoundary(editingFieldId, geometry, editReason);
                  } else {
                    setPendingNewFieldGeom({ geometry, areaHa });
                    setNewFieldName(`Field Block ${farmFields.length + 1}`);
                  }
                }}
              />

              {/* New Drawn Field Naming Prompt */}
              {pendingNewFieldGeom && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newFieldName.trim()) return;
                    await onCreateField({
                      farmId: farm.id,
                      name: newFieldName.trim(),
                      cropId: newFieldCrop.toLowerCase(),
                      cropName: newFieldCrop.trim() || undefined,
                      status: 'Active',
                      geometry: pendingNewFieldGeom.geometry,
                    });
                    setPendingNewFieldGeom(null);
                  }}
                  className="rounded-xl border border-emerald-500/45 bg-emerald-500/10 p-4 flex flex-wrap items-end gap-3 text-xs"
                >
                  <div className="flex-1 min-w-[180px]">
                    <label className="block font-semibold text-[var(--text-primary)] mb-1">
                      Name newly drawn field ({formatArea(pendingNewFieldGeom.areaHa, farm.areaUnit)})
                    </label>
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    />
                  </div>
                  <div className="w-40">
                    <label className="block font-semibold text-[var(--text-primary)] mb-1">Crop</label>
                    <input
                      type="text"
                      value={newFieldCrop}
                      onChange={(e) => setNewFieldCrop(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white font-semibold cursor-pointer"
                  >
                    Save Field
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingNewFieldGeom(null)}
                    className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] cursor-pointer"
                  >
                    Discard
                  </button>
                </form>
              )}

              {/* Selected Field Inspector */}
              {selectedField && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={resolveCropThumbnail(selectedField.cropId || selectedField.cropName)}
                        alt={selectedField.cropName || selectedField.name}
                        className="w-10 h-10 rounded-lg object-cover border border-[var(--border)]"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">{selectedField.name}</h3>
                        <div className="text-[var(--text-secondary)] tabular-nums">
                          {formatArea(selectedField.versions[0]?.netAreaHectares ?? 0, farm.areaUnit)} ·{' '}
                          {selectedField.versions[0]?.perimeterM ?? 0} m perimeter · v{selectedField.versions.length}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedField.status}
                        onChange={(e) => onPatchField(selectedField.id, { status: e.target.value })}
                        className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                      >
                        {['Active', 'Planned', 'Fallow', 'Needs Review'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>

                      {confirmDeleteFieldId === selectedField.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteField(selectedField.id);
                              setConfirmDeleteFieldId(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white font-semibold cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteFieldId(null)}
                            className="px-2 py-1.5 rounded-lg border border-[var(--border)] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteFieldId(selectedField.id)}
                          className="p-1.5 rounded-lg border border-[var(--border)] text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          title="Delete field"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedField.staleCalculations.length > 0 && (
                    <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-amber-900 dark:text-amber-200">
                      <strong>Stale flags:</strong> {selectedField.staleCalculations.join(' · ')}
                    </div>
                  )}
                </div>
              )}

              {/* Same-Farm Field Comparison Table */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Fields in {farm.name} ({farmFields.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {[
                      { id: 'all', label: 'All fields' },
                      { id: 'alerts', label: 'Active alerts' },
                      { id: 'rotation_due', label: 'Rotation review due' },
                      { id: 'missing_soil', label: 'Missing soil info' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFieldTableFilter(f.id as typeof fieldTableFilter)}
                        className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                          fieldTableFilter === f.id
                            ? 'bg-[var(--accent)] text-white'
                            : 'border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredComparisonFields.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                    {farmFields.length === 0
                      ? 'No individual fields mapped yet. Use "Draw Field Boundary" above to partition blocks.'
                      : 'No fields match this filter.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/40 text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
                          <th className="py-2.5 pl-4 pr-3">Field</th>
                          <th className="py-2.5 px-3">Crop / History</th>
                          <th className="py-2.5 px-3">Mapped Area</th>
                          <th className="py-2.5 px-3">Soil Summary</th>
                          <th className="py-2.5 px-3">Water Summary</th>
                          <th className="py-2.5 pl-3 pr-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {filteredComparisonFields.map((fl) => (
                          <tr
                            key={fl.id}
                            onClick={() => setSelectedFieldId(fl.id)}
                            style={
                              selectedFieldId === fl.id
                                ? { backgroundColor: 'rgba(39, 199, 178, 0.08)' }
                                : undefined
                            }
                            className="h-[58px] hover:bg-[var(--bg-elevated)]/40 cursor-pointer"
                          >
                            <td className="py-2 pl-4 pr-3 font-semibold text-[var(--text-primary)]">
                              {fl.name}
                            </td>
                            <td className="py-2 px-3 text-[var(--text-secondary)]">
                              <span className="font-medium text-[var(--text-primary)]">
                                {fl.cropName || 'Unassigned'}
                              </span>
                              {fl.previousCrops.length > 0 && ` · Prev: ${fl.previousCrops.join(', ')}`}
                            </td>
                            <td className="py-2 px-3 tabular-nums text-[var(--text-primary)]">
                              {fl.versions[0]
                                ? formatArea(fl.versions[0].netAreaHectares, farm.areaUnit)
                                : 'Unavailable'}
                            </td>
                            <td className="py-2 px-3 text-[var(--text-secondary)]">
                              {fl.soilSummary || 'Unavailable'}
                            </td>
                            <td className="py-2 px-3 text-[var(--text-secondary)]">
                              {fl.waterSummary || 'Unavailable'}
                            </td>
                            <td className="py-2 pl-3 pr-4 font-medium text-[var(--text-primary)]">
                              {fl.status}
                              {fl.rotationReviewDue ? ' · Review due' : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. ROTATION PLAN & PLAN HISTORY */}
          {activeTab === 'rotation' && (
            <PlanDecisionJournal
              farm={farm}
              fields={farmFields}
              decisions={decisions}
              onRecordDecision={onRecordDecision}
            />
          )}

          {/* 4. SOIL & LAND */}
          {activeTab === 'soil' && (
            <form
              onSubmit={handleSaveSoil}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Soil &amp; Land Profile</h3>
                  <ProvenanceText
                    kind={soilForm.moistureStatus === 'measured' || soilForm.phStatus === 'tested' ? 'observed' : 'farmer_reported'}
                    detail={soilForm.moistureDate || 'Updated on save'}
                  />
                </div>
                {farm.centroid && (
                  <button
                    type="button"
                    disabled={!isOnline || demProbeLoading}
                    onClick={handleProbeTerrainSlope}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/50 font-semibold text-[var(--text-primary)] disabled:opacity-45 cursor-pointer"
                  >
                    {demProbeLoading ? 'Sampling DEM…' : 'Sample SRTM Elevation & Slope'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">Soil texture</label>
                  <select
                    value={soilForm.texture}
                    onChange={(e) => setSoilForm((s) => ({ ...s, texture: e.target.value as SoilTexture }))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                  >
                    {['Unknown', 'Sandy', 'Loamy sand', 'Sandy loam', 'Loam', 'Silt loam', 'Clay loam', 'Clay'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">Drainage</label>
                  <select
                    value={soilForm.drainage}
                    onChange={(e) => setSoilForm((s) => ({ ...s, drainage: e.target.value as DrainageRate }))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                  >
                    {['Unknown', 'Very slowly', 'Slowly', 'Moderately', 'Quickly', 'Very quickly'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">Organic matter (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={soilForm.organicMatterPct ?? ''}
                    onChange={(e) =>
                      setSoilForm((s) => ({
                        ...s,
                        organicMatterPct: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">Moisture basis</label>
                  <select
                    value={soilForm.moistureStatus}
                    onChange={(e) =>
                      setSoilForm((s) => ({ ...s, moistureStatus: e.target.value as SoilMoistureStatus }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                  >
                    <option value="unknown">Unknown</option>
                    <option value="estimated">Estimated</option>
                    <option value="measured">Measured (Probe / Lab)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">Moisture (% VWC)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={soilForm.moistureStatus === 'unknown'}
                    value={soilForm.moisturePct ?? ''}
                    onChange={(e) =>
                      setSoilForm((s) => ({ ...s, moisturePct: e.target.value ? Number(e.target.value) : null }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)] disabled:opacity-45 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">Moisture observation date</label>
                  <input
                    type="date"
                    disabled={soilForm.moistureStatus === 'unknown'}
                    value={soilForm.moistureDate}
                    onChange={(e) => setSoilForm((s) => ({ ...s, moistureDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)] disabled:opacity-45"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">pH test status</label>
                  <select
                    value={soilForm.phStatus}
                    onChange={(e) => setSoilForm((s) => ({ ...s, phStatus: e.target.value as SoilPhStatus }))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                  >
                    <option value="not_tested">Not tested</option>
                    <option value="tested">Lab tested</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">Soil pH (0–14)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="10"
                    disabled={soilForm.phStatus === 'not_tested'}
                    value={soilForm.phValue ?? ''}
                    onChange={(e) =>
                      setSoilForm((s) => ({ ...s, phValue: e.target.value ? Number(e.target.value) : null }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)] disabled:opacity-45 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">Elevation / Slope (SRTM)</label>
                  <div className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/40 tabular-nums text-[var(--text-primary)]">
                    {soilForm.elevationM !== null ? `${Math.round(soilForm.elevationM)} m ASL` : 'Elevation —'} ·{' '}
                    {soilForm.slopePct !== null ? `${soilForm.slopePct.toFixed(1)}% slope` : 'Slope —'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">Field &amp; Soil notes</label>
                <textarea
                  rows={2}
                  value={soilForm.notes}
                  onChange={(e) => setSoilForm((s) => ({ ...s, notes: e.target.value }))}
                  className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingSoil}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white font-semibold hover:brightness-110 disabled:opacity-50 cursor-pointer"
                >
                  {savingSoil ? 'Saving…' : 'Save Soil & Land'}
                </button>
              </div>
            </form>
          )}

          {/* 5. WATER INTELLIGENCE */}
          {activeTab === 'water' && (
            <div className="space-y-4 text-xs">
              {/* Demand vs Supply Estimate Card */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Water Supply vs Estimated Demand</h3>
                  <ProvenanceText kind={waterBalance.status === 'insufficient' ? 'unavailable' : 'calculated'} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-3">
                    <div className="text-[var(--text-secondary)]">Measured Daily Capacity</div>
                    <div className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                      {waterBalance.supplyM3Day !== null ? `${waterBalance.supplyM3Day} m³/day` : 'Not metered'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-3">
                    <div className="text-[var(--text-secondary)]">Estimated Crop Demand</div>
                    <div className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                      {waterBalance.demandM3Day !== null ? `${waterBalance.demandM3Day} m³/day` : 'Insufficient data'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-3">
                    <div className="text-[var(--text-secondary)]">Net Balance</div>
                    <div
                      className={`text-base font-bold mt-0.5 ${
                        waterBalance.status === 'deficit'
                          ? 'text-rose-700 dark:text-rose-300'
                          : waterBalance.status === 'surplus'
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {waterBalance.deltaM3Day !== null
                        ? `${waterBalance.deltaM3Day > 0 ? '+' : ''}${waterBalance.deltaM3Day} m³/day (${waterBalance.coveragePct}%)`
                        : 'Unavailable'}
                    </div>
                  </div>
                </div>
                {waterBalance.assumptions.map((a, i) => (
                  <p key={i} className="text-[11.5px] text-[var(--text-secondary)]">· {a}</p>
                ))}
              </div>

              <form
                onSubmit={handleSaveWater}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-4"
              >
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Supply &amp; Irrigation Configuration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-medium text-[var(--text-secondary)] mb-1">Primary source</label>
                    <select
                      value={waterForm.sources[0] || 'Unknown'}
                      onChange={(e) => setWaterForm((w) => ({ ...w, sources: [e.target.value as WaterSource] }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                    >
                      {['Unknown', 'Groundwater / Well', 'River / Stream', 'Reservoir', 'Canal', 'Rainwater collection', 'Recycled water', 'Other'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-[var(--text-secondary)] mb-1">Reliability</label>
                    <select
                      value={waterForm.reliability}
                      onChange={(e) => setWaterForm((w) => ({ ...w, reliability: e.target.value as WaterReliability }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                    >
                      {['Unknown', 'Always available', 'Usually available', 'Sometimes limited', 'Frequently limited', 'Highly unreliable'].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-[var(--text-secondary)] mb-1">Daily capacity (m³/day)</label>
                    <input
                      type="number"
                      min="0"
                      value={waterForm.dailyCapacityM3 ?? ''}
                      onChange={(e) =>
                        setWaterForm((w) => ({
                          ...w,
                          dailyCapacityKnown: Boolean(e.target.value),
                          dailyCapacityM3: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      placeholder="Enter metered capacity"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)] tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[var(--text-secondary)] mb-1">Watering system</label>
                    <select
                      value={waterForm.wateringMethod}
                      onChange={(e) => setWaterForm((w) => ({ ...w, wateringMethod: e.target.value as WateringMethod }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                    >
                      <option value="">Unspecified</option>
                      <option value="Rain-fed agriculture">Rain-fed agriculture</option>
                      <option value="Artificial irrigation">Artificial irrigation</option>
                      <option value="Hybrid (rainfall and irrigation)">Hybrid (rainfall and irrigation)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-[var(--text-secondary)] mb-1">Irrigation method</label>
                    <select
                      value={waterForm.irrigationMethod}
                      onChange={(e) => setWaterForm((w) => ({ ...w, irrigationMethod: e.target.value as IrrigationMethod }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                    >
                      {['Unknown', 'Drip irrigation', 'Sprinkler irrigation', 'Flood irrigation', 'Furrow irrigation', 'Manual watering', 'Other'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-[var(--text-secondary)] mb-1">Water EC (dS/m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={waterForm.ecDsM ?? ''}
                      onChange={(e) =>
                        setWaterForm((w) => ({
                          ...w,
                          qualityTested: e.target.value ? 'Yes' : w.qualityTested,
                          ecDsM: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      placeholder="Not tested"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)] tabular-nums"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingWater}
                    className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white font-semibold hover:brightness-110 cursor-pointer"
                  >
                    {savingWater ? 'Saving…' : 'Save Water Settings'}
                  </button>
                </div>
              </form>

              {/* Irrigation Event Logger */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Logged Irrigation Runs ({farmIrrigation.length})</h4>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const vol = Number(irrVolume);
                    if (!Number.isFinite(vol) || vol <= 0) return;
                    await onAddIrrigation({
                      date: irrDate,
                      volumeM3: vol,
                      method: waterForm.irrigationMethod || 'Drip irrigation',
                      notes: irrNotes.trim(),
                    });
                    setIrrVolume('');
                    setIrrNotes('');
                  }}
                  className="flex flex-wrap gap-2 items-end"
                >
                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Date</label>
                    <input type="date" value={irrDate} onChange={(e) => setIrrDate(e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Volume (m³)</label>
                    <input type="number" min="1" step="0.5" value={irrVolume} onChange={(e) => setIrrVolume(e.target.value)} placeholder="e.g., 95" required className="w-28 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)] tabular-nums" />
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Notes</label>
                    <input type="text" value={irrNotes} onChange={(e) => setIrrNotes(e.target.value)} placeholder="Block & pump duration…" className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]" />
                  </div>
                  <button type="submit" className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white font-semibold cursor-pointer">
                    Log Run
                  </button>
                </form>

                {farmIrrigation.length > 0 && (
                  <div className="divide-y divide-[var(--border)] pt-2">
                    {farmIrrigation.map((l) => (
                      <div key={l.id} className="py-2 flex items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-[var(--text-primary)] tabular-nums">{l.date}</span>
                          <span className="text-[var(--text-secondary)]"> · {l.method} {l.notes ? `· ${l.notes}` : ''}</span>
                        </div>
                        <span className="font-semibold text-[var(--text-primary)] tabular-nums">{l.volumeM3} m³</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. WEATHER & CLIMATE */}
          {activeTab === 'weather' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Local Weather &amp; NASA POWER 21-Year Baseline
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Resolution disclosure: Open-Meteo NWP (~11 km cell) &amp; NASA POWER (~50 km / 0.5° cell). Regional climate signals do not replace in-field stations.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!isOnline || weatherLoading}
                    onClick={loadWeatherAndClimate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/50 font-semibold text-[var(--text-primary)] disabled:opacity-45 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${weatherLoading ? 'animate-spin' : ''}`} />
                    {weatherLoading ? 'Fetching…' : 'Reload Feeds'}
                  </button>
                </div>

                {weatherError && (
                  <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-amber-900 dark:text-amber-200">
                    {weatherError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 tabular-nums">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-3">
                    <div className="text-[var(--text-secondary)]">Current Temp (Open-Meteo)</div>
                    <div className="text-lg font-bold text-[var(--text-primary)] mt-1">
                      {liveWeather ? fmtTemp(liveWeather.tempC) : '—'}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      {liveWeather ? `${liveWeather.conditionLabel} · RH ${liveWeather.humidityPct}%` : 'Unavailable'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-3">
                    <div className="text-[var(--text-secondary)]">10m Wind Speed</div>
                    <div className="text-lg font-bold text-[var(--text-primary)] mt-1">
                      {liveWeather ? fmtWind(liveWeather.windKmh) : '—'}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      {liveWeather ? `Direction ${liveWeather.windDirCompass}` : 'Unavailable'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-3">
                    <div className="text-[var(--text-secondary)]">21-Yr High / Low (NASA POWER)</div>
                    <div className="text-lg font-bold text-[var(--text-primary)] mt-1">
                      {climateResult ? `${fmtTemp(climateResult.meanMaxC)} / ${fmtTemp(climateResult.meanMinC)}` : '—'}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      Same calendar window ±3 days
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-3">
                    <div className="text-[var(--text-secondary)]">Historical Rain / Solar</div>
                    <div className="text-lg font-bold text-[var(--text-primary)] mt-1">
                      {climateResult?.meanPrecipMm !== null && climateResult?.meanPrecipMm !== undefined
                        ? `${climateResult.meanPrecipMm.toFixed(2)} mm/d`
                        : '—'}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      {climateResult?.meanSolarKwhM2 !== null && climateResult?.meanSolarKwhM2 !== undefined
                        ? `Solar ${climateResult.meanSolarKwhM2.toFixed(1)} kWh/m²/d`
                        : 'NASA POWER AG community'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. VEGETATION & FIELD CHANGE */}
          {activeTab === 'vegetation' && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Vegetation &amp; Satellite Coverage Honesty Disclosure
                  </h3>
                  <ProvenanceText kind="remote_sensing" detail="NASA GIBS MODIS 250 m / VIIRS 375 m" />
                </div>
              </div>

              <div className="rounded-lg border border-sky-500/35 bg-sky-500/10 p-3.5 space-y-1.5 text-sky-900 dark:text-sky-200 leading-relaxed">
                <div className="font-bold">Why plant-level field NDVI is not fabricated here</div>
                <p>
                  This workspace integrates public <strong>NASA GIBS</strong> orbital true-color streams (MODIS Terra 250 m, Suomi NPP VIIRS 375 m). A single 250 m pixel covers <strong>6.25 hectares</strong>, which averages edges, roads, and neighboring plots on small/medium fields. Rather than faking parcel-level NDVI scores from rainfall or coarse pixels, vegetation status stays transparently scoped until field-resolution Sentinel-2/commercial imagery or field scouting logs are supplied.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-3.5 space-y-1">
                  <div className="font-semibold text-[var(--text-primary)]">Parcel vs Pixel Scale Comparison</div>
                  <div className="text-[var(--text-secondary)] tabular-nums">
                    Farm mapped area: <strong>{farm.mappedAreaHa > 0 ? `${farm.mappedAreaHa.toFixed(1)} ha` : 'Unmapped'}</strong> vs 1 MODIS 250 m pixel (6.25 ha)
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-3.5 space-y-1">
                  <div className="font-semibold text-[var(--text-primary)]">Recent Field Scouting Notes</div>
                  <div className="text-[var(--text-secondary)]">
                    {farmObservations.length > 0
                      ? farmObservations[0].title
                      : 'No scouting notes logged yet. Record crop vigor in Actions & Logs.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. ACTIONS & OBSERVATIONS */}
          {activeTab === 'actions' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              {/* Observations Form & Feed */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Scouting &amp; Lab Observations</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!obsTitle.trim() || !obsDetail.trim()) return;
                    await onAddObservation({
                      category: obsCategory,
                      title: obsTitle.trim(),
                      detail: obsDetail.trim(),
                      observedAt: new Date().toISOString().slice(0, 10),
                      provenance: obsProvenance,
                    });
                    setObsTitle('');
                    setObsDetail('');
                  }}
                  className="space-y-2.5 pb-3 border-b border-[var(--border)]"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={obsCategory}
                      onChange={(e) => setObsCategory(e.target.value as FarmObservationItem['category'])}
                      className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                    >
                      <option value="scouting">Field scouting</option>
                      <option value="soil_lab">Soil lab</option>
                      <option value="pest_disease">Pest / disease</option>
                      <option value="weather_impact">Weather impact</option>
                      <option value="management">Management action</option>
                    </select>
                    <select
                      value={obsProvenance}
                      onChange={(e) => setObsProvenance(e.target.value as 'Measured' | 'Reported')}
                      className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                    >
                      <option value="Reported">Farmer-reported</option>
                      <option value="Measured">Measured / Probe</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={obsTitle}
                    onChange={(e) => setObsTitle(e.target.value)}
                    placeholder="Observation headline…"
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                  />
                  <textarea
                    rows={2}
                    value={obsDetail}
                    onChange={(e) => setObsDetail(e.target.value)}
                    placeholder="Details, affected rows, or sample values…"
                    required
                    className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                  />
                  <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white font-semibold cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                    Log Observation
                  </button>
                </form>

                <div className="space-y-2.5 max-h-80 overflow-y-auto fs-thin-scroll">
                  {farmObservations.length === 0 ? (
                    <div className="text-[var(--text-secondary)]">No observations logged yet.</div>
                  ) : (
                    farmObservations.map((ob) => (
                      <div key={ob.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/35 p-2.5 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[var(--text-primary)]">{ob.title}</span>
                          <span className="text-[11px] text-[var(--text-secondary)] tabular-nums">{ob.observedAt}</span>
                        </div>
                        <p className="text-[var(--text-secondary)]">{ob.detail}</p>
                        <div className="text-[10.5px] text-[var(--text-secondary)]">
                          {ob.category.replace('_', ' ')} · {ob.provenance}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Tasks */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Action Checklist</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!taskTitle.trim()) return;
                    await onAddTask({
                      title: taskTitle.trim(),
                      category: 'scouting',
                      dueDate: taskDue || null,
                      priority: taskPriority,
                    });
                    setTaskTitle('');
                    setTaskDue('');
                  }}
                  className="space-y-2 pb-3 border-b border-[var(--border)]"
                >
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Add operational task…"
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                  />
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="date"
                      value={taskDue}
                      onChange={(e) => setTaskDue(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                    />
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as 'high' | 'normal' | 'low')}
                      className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                    >
                      <option value="high">High priority</option>
                      <option value="normal">Normal priority</option>
                      <option value="low">Low priority</option>
                    </select>
                    <button type="submit" className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white font-semibold cursor-pointer">
                      Add Task
                    </button>
                  </div>
                </form>

                <div className="space-y-2 max-h-80 overflow-y-auto fs-thin-scroll">
                  {farmTasks.length === 0 ? (
                    <div className="text-[var(--text-secondary)]">No tasks created yet.</div>
                  ) : (
                    farmTasks.map((t) => (
                      <label
                        key={t.id}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/35 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={t.completed}
                          onChange={(e) => onToggleTask(t.id, e.target.checked)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold ${t.completed ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                            {t.title}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 tabular-nums">
                            {t.priority} priority {t.dueDate ? `· Due ${t.dueDate}` : ''}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 9. PAST ANALYSES & SIDE-BY-SIDE COMPARISON */}
          {activeTab === 'reports' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Immutable Assessment Snapshots ({farmSnapshots.length})
                  </h3>
                  <p className="text-[var(--text-secondary)] mt-0.5">
                    Saved snapshots remain immutable so you can audit how weather, soil updates, and model versions shifted suitability over time.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!isOnline || runningSnapshot}
                  onClick={handleCreateFreshSnapshot}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent)] text-white font-semibold disabled:opacity-45 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${runningSnapshot ? 'animate-spin' : ''}`} />
                  {runningSnapshot ? 'Generating…' : 'Generate Fresh Snapshot'}
                </button>
              </div>

              {farmSnapshots.length >= 2 && compareLeft && compareRight && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                      <GitCompare className="w-4 h-4 text-[var(--accent)]" />
                      Compare Two Reports
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={compareLeftId}
                        onChange={(e) => setCompareLeftId(e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                      >
                        {farmSnapshots.map((s) => (
                          <option key={s.id} value={s.id}>
                            {new Date(s.generatedAt).toLocaleDateString()} ({s.modelVersion})
                          </option>
                        ))}
                      </select>
                      <span className="text-[var(--text-secondary)]">vs</span>
                      <select
                        value={compareRightId}
                        onChange={(e) => setCompareRightId(e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                      >
                        {farmSnapshots.map((s) => (
                          <option key={s.id} value={s.id}>
                            {new Date(s.generatedAt).toLocaleDateString()} ({s.modelVersion})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[11px] uppercase text-[var(--text-secondary)]">
                          <th className="py-2 pr-3">Metric / Condition</th>
                          <th className="py-2 px-3">Baseline ({new Date(compareLeft.generatedAt).toLocaleDateString()})</th>
                          <th className="py-2 px-3">Comparison ({new Date(compareRight.generatedAt).toLocaleDateString()})</th>
                          <th className="py-2 pl-3">Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] tabular-nums">
                        <tr>
                          <td className="py-2 pr-3 font-medium">Suitability Score</td>
                          <td className="py-2 px-3">{compareLeft.suitabilityScore ?? 'Unassessed'}</td>
                          <td className="py-2 px-3 font-semibold">{compareRight.suitabilityScore ?? 'Unassessed'}</td>
                          <td className="py-2 pl-3">
                            {compareLeft.suitabilityScore !== null && compareRight.suitabilityScore !== null
                              ? `${compareRight.suitabilityScore - compareLeft.suitabilityScore >= 0 ? '+' : ''}${compareRight.suitabilityScore - compareLeft.suitabilityScore} pts`
                              : 'N/A'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-3 font-medium">Data Completeness</td>
                          <td className="py-2 px-3">{compareLeft.completenessPct}%</td>
                          <td className="py-2 px-3">{compareRight.completenessPct}%</td>
                          <td className="py-2 pl-3">
                            {compareRight.completenessPct - compareLeft.completenessPct >= 0 ? '+' : ''}
                            {compareRight.completenessPct - compareLeft.completenessPct}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-3 font-medium">Measured Soil Moisture</td>
                          <td className="py-2 px-3">{compareLeft.keyMetrics.soilMoisturePct ?? '—'}%</td>
                          <td className="py-2 px-3">{compareRight.keyMetrics.soilMoisturePct ?? '—'}%</td>
                          <td className="py-2 pl-3">
                            {compareLeft.keyMetrics.soilMoisturePct !== null && compareRight.keyMetrics.soilMoisturePct !== null
                              ? `${compareRight.keyMetrics.soilMoisturePct - compareLeft.keyMetrics.soilMoisturePct >= 0 ? '+' : ''}${compareRight.keyMetrics.soilMoisturePct - compareLeft.keyMetrics.soilMoisturePct}%`
                              : '—'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-3 font-medium">Mean Precipitation</td>
                          <td className="py-2 px-3">{compareLeft.keyMetrics.precipMmDay ?? '—'} mm/d</td>
                          <td className="py-2 px-3">{compareRight.keyMetrics.precipMmDay ?? '—'} mm/d</td>
                          <td className="py-2 pl-3">
                            {compareLeft.modelVersion} → {compareRight.modelVersion}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                {farmSnapshots.length === 0 ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-center text-[var(--text-secondary)]">
                    No saved report snapshots yet. Click “Generate Fresh Snapshot” above or run Deep Analysis.
                  </div>
                ) : (
                  farmSnapshots.map((s) => (
                    <div key={s.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-[var(--text-primary)] tabular-nums">
                            {new Date(s.generatedAt).toLocaleString()}
                          </span>
                          <span className="text-[var(--text-secondary)]"> · {s.triggerReason} · {s.modelVersion}</span>
                        </div>
                        <div className="font-bold text-[var(--text-primary)] tabular-nums">
                          {s.suitabilityScore !== null ? `Score ${s.suitabilityScore}/100` : 'Unassessed'} · {s.confidencePct}% confidence
                        </div>
                      </div>
                      <p className="text-[var(--text-secondary)]">{s.weatherWindowSummary}</p>
                      <div className="space-y-1 pt-1">
                        {s.recommendations.map((r, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[var(--text-primary)]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 10. FARM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Farm Configuration &amp; Units</h3>
                    <p className="text-[var(--text-secondary)]">Changes synchronize across Portfolio, Maps, and Analysis.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenRename(farm)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Rename Farm
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-[var(--text-secondary)] mb-1">Region label</label>
                    <input
                      type="text"
                      value={settingsRegion}
                      onChange={(e) => setSettingsRegion(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[var(--text-secondary)] mb-1">Timezone</label>
                    <input
                      type="text"
                      value={settingsTz}
                      onChange={(e) => setSettingsTz(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[var(--text-secondary)] mb-1">Declared whole-farm area (ha)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settingsDeclaredArea}
                      onChange={(e) => setSettingsDeclaredArea(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)] tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[var(--text-secondary)] mb-1">Preferred area display unit</label>
                    <select
                      value={settingsAreaUnit}
                      onChange={(e) => setSettingsAreaUnit(e.target.value as AreaUnit)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                    >
                      <option value="hectares">Hectares (ha)</option>
                      <option value="acres">Acres (ac)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={settingsNotes}
                    onChange={(e) => setSettingsNotes(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onPatchFarm(
                        farm,
                        {
                          regionLabel: settingsRegion.trim(),
                          timezone: settingsTz.trim(),
                          declaredAreaHa: settingsDeclaredArea ? Number(settingsDeclaredArea) : null,
                          areaUnit: settingsAreaUnit,
                          notes: settingsNotes.trim(),
                        },
                        `Updated Settings for ${farm.name}`
                      )
                    }
                    className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white font-semibold hover:brightness-110 cursor-pointer"
                  >
                    Save Settings
                  </button>
                </div>
              </div>

              {/* Privacy & Lifecycle Controls */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-300">
                  <Lock className="w-4 h-4" />
                  Privacy &amp; Data Isolation
                </div>
                <p className="text-[var(--text-secondary)]">
                  This farm record, coordinates, boundaries, soil/water logs, and rotation decisions are strictly private to your workspace. Nothing is published to regional discovery unless you explicitly opt in on the Maps workspace.
                </p>

                <div className="pt-2 border-t border-[var(--border)] flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenDuplicate(farm)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicate Farm…
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenExport(farm)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export JSON / GeoJSON
                  </button>
                  <button
                    type="button"
                    onClick={() => onArchiveToggle(farm)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                  >
                    {farm.archivedAt ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                    {farm.archivedAt ? 'Unarchive Farm' : 'Archive Farm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenDelete(farm)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-500/40 bg-rose-500/10 font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Farm Permanently…
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
