import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  Sprout,
  X,
} from 'lucide-react';
import {
  FarmObservationItem,
  FarmTaskItem,
  IrrigationLogItem,
  MyFarmRecord,
  MyFarmsSubTab,
  OutboxOperation,
  PlanDecisionAction,
  PlanDecisionEvent,
  PlanDecisionReasonCode,
  PortfolioFieldRecord,
  PortfolioFilterState,
  RotationCandidateOption,
  SavedFarmSnapshot,
} from '../types/myFarms';
import { GeoJsonPolygonGeometry } from '../types/maps';
import {
  buildAssessedFarmRecord,
  computePortfolioAggregates,
  formatArea,
  handleLocalProfileDeletionCleanup,
  ServerRawFarmDto,
  syncFarmToLocalProfiles,
} from '../lib/myFarmsEngine';
import {
  downloadJsonFile,
  enqueueOutboxOp,
  loadCachedPortfolio,
  loadOutbox,
  removeOutboxOp,
  saveCachedPortfolio,
} from '../lib/myFarmsOutbox';
import {
  ConflictApiError,
  executeDirectMutation,
  fetchMyFarmsPortfolio,
  PortfolioApiResponse,
  replaySyncOutbox,
} from '../services/myFarmsApi';
import { getActiveFarmId, setActiveFarmId } from '../lib/farmStorage';
import { useToast } from '../components/Toast';
import { OfflineSyncBar } from '../components/myFarms/OfflineSyncBar';
import { PortfolioTable } from '../components/myFarms/PortfolioTable';
import { AddFarmWizardModal } from '../components/myFarms/AddFarmWizardModal';
import {
  DeleteFarmModal,
  DuplicateFarmModal,
  ExportFarmModal,
  RenameFarmModal,
} from '../components/myFarms/FarmModals';
import { FarmDetailWorkspace } from '../components/myFarms/FarmDetailWorkspace';

const STATUS_RANK: Record<string, number> = {
  alert: 1,
  needs_attention: 2,
  needs_refresh: 3,
  partial: 4,
  not_assessed: 5,
  good: 6,
  archived: 7,
};

export const MyFarms: React.FC = () => {
  const { farmId: routeFarmId } = useParams<{ farmId?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Raw server/cached store data
  const [rawFarms, setRawFarms] = useState<ServerRawFarmDto[]>([]);
  const [fields, setFields] = useState<PortfolioFieldRecord[]>([]);
  const [decisions, setDecisions] = useState<PlanDecisionEvent[]>([]);
  const [observations, setObservations] = useState<FarmObservationItem[]>([]);
  const [tasks, setTasks] = useState<FarmTaskItem[]>([]);
  const [irrigationLogs, setIrrigationLogs] = useState<IrrigationLogItem[]>([]);
  const [snapshots, setSnapshots] = useState<SavedFarmSnapshot[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [outbox, setOutbox] = useState<OutboxOperation[]>(() => loadOutbox());
  const [isSyncing, setIsSyncing] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  // View state
  const [advancedMode, setAdvancedMode] = useState(false);
  const [detailTab, setDetailTab] = useState<MyFarmsSubTab>('overview');
  const [filter, setFilter] = useState<PortfolioFilterState>({
    search: '',
    status: 'all',
    region: 'all',
    sortBy: 'name',
    sortDir: 'asc',
  });

  // Modals
  const [wizardOpen, setWizardOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<MyFarmRecord | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<MyFarmRecord | null>(null);
  const [exportTarget, setExportTarget] = useState<MyFarmRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MyFarmRecord | null>(null);

  const applyPortfolioBundle = useCallback((bundle: PortfolioApiResponse) => {
    setRawFarms(bundle.farms);
    setFields(bundle.fields);
    setDecisions(bundle.decisions);
    setObservations(bundle.observations);
    setTasks(bundle.tasks);
    setIrrigationLogs(bundle.irrigationLogs);
    setSnapshots(bundle.snapshots);
    setLastSyncedAt(bundle.serverTimestamp);
    const cacheRes = saveCachedPortfolio({
      farms: bundle.farms,
      fields: bundle.fields,
      decisions: bundle.decisions,
      observations: bundle.observations,
      tasks: bundle.tasks,
      irrigationLogs: bundle.irrigationLogs,
      snapshots: bundle.snapshots,
    });
    if (cacheRes.quotaExceeded && cacheRes.error) {
      setQuotaError(cacheRes.error);
    }
  }, []);

  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchMyFarmsPortfolio();
      applyPortfolioBundle(data);
    } catch (err) {
      const cached = loadCachedPortfolio();
      if (cached) {
        setRawFarms(cached.farms);
        setFields(cached.fields);
        setDecisions(cached.decisions);
        setObservations(cached.observations);
        setTasks(cached.tasks);
        setIrrigationLogs(cached.irrigationLogs);
        setSnapshots(cached.snapshots);
        setLastSyncedAt(cached.cachedAt);
        setLoadError(
          `Using locally cached portfolio (${new Date(cached.cachedAt).toLocaleString()}) — server unavailable.`
        );
      } else {
        setLoadError(err instanceof Error ? err.message : 'Unable to load My Farms portfolio.');
      }
    } finally {
      setLoading(false);
    }
  }, [applyPortfolioBundle]);

  const handleSyncNow = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await replaySyncOutbox();
      setOutbox(result.remaining);
      if (result.latestPortfolio) {
        applyPortfolioBundle(result.latestPortfolio);
      } else if (result.syncedCount > 0) {
        await loadPortfolio();
      }
      if (result.syncedCount > 0) {
        showToast(`Synced ${result.syncedCount} offline change${result.syncedCount > 1 ? 's' : ''}`, 'success');
      }
      if (result.conflictCount > 0) {
        showToast(`${result.conflictCount} sync conflict(s) require your choice`, 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [applyPortfolioBundle, isSyncing, loadPortfolio, showToast]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      handleSyncNow();
    };
    const onOffline = () => setIsOnline(false);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        handleSyncNow();
      }
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [handleSyncNow]);

  // Build derived assessed farm entities
  const farms: MyFarmRecord[] = useMemo(
    () =>
      rawFarms.map((rf) =>
        buildAssessedFarmRecord(rf, fields, observations, tasks)
      ),
    [rawFarms, fields, observations, tasks]
  );

  // Sync active farm record to localStorage so Home, Header & Deep Analysis stay coherent
  useEffect(() => {
    if (farms.length === 0) return;
    const activeId = getActiveFarmId();
    const target = farms.find((f) => f.id === routeFarmId) || farms.find((f) => f.id === activeId);
    if (target) {
      syncFarmToLocalProfiles(target);
    }
  }, [farms, routeFarmId]);

  const aggregates = useMemo(
    () => computePortfolioAggregates(farms, fields),
    [farms, fields]
  );

  const uniqueRegions = useMemo(
    () =>
      Array.from(
        new Set(farms.map((f) => f.regionLabel).filter(Boolean))
      ).sort(),
    [farms]
  );

  const filteredFarms = useMemo(() => {
    const q = filter.search.trim().toLowerCase();
    const matching = farms.filter((farm) => {
      if (filter.status === 'archived') {
        if (!farm.archivedAt) return false;
      } else {
        if (farm.archivedAt) return false;
        if (filter.status === 'good' && farm.assessment.status !== 'good') return false;
        if (
          filter.status === 'needs_attention' &&
          farm.assessment.status !== 'needs_attention' &&
          farm.assessment.status !== 'needs_refresh'
        ) {
          return false;
        }
        if (filter.status === 'alert' && farm.assessment.status !== 'alert') return false;
        if (
          filter.status === 'not_assessed' &&
          farm.assessment.status !== 'not_assessed' &&
          farm.assessment.status !== 'partial'
        ) {
          return false;
        }
      }

      if (filter.region !== 'all' && farm.regionLabel !== filter.region) {
        return false;
      }

      if (q) {
        const farmFieldNames = fields
          .filter((fl) => fl.farmId === farm.id)
          .map((fl) => `${fl.name} ${fl.cropName || ''}`)
          .join(' ');
        const haystack = `${farm.name} ${farm.locationLabel} ${farm.regionLabel} ${farm.primaryCrop || ''} ${farmFieldNames}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const dir = filter.sortDir === 'asc' ? 1 : -1;
    return [...matching].sort((a, b) => {
      if (filter.sortBy === 'name') {
        return a.name.localeCompare(b.name) * dir;
      }
      if (filter.sortBy === 'area') {
        return (a.mappedAreaHa - b.mappedAreaHa) * dir;
      }
      if (filter.sortBy === 'status') {
        return ((STATUS_RANK[a.assessment.status] ?? 9) - (STATUS_RANK[b.assessment.status] ?? 9)) * dir;
      }
      const ta = a.assessment.assessedAt ? Date.parse(a.assessment.assessedAt) : 0;
      const tb = b.assessment.assessedAt ? Date.parse(b.assessment.assessedAt) : 0;
      return (ta - tb) * dir;
    });
  }, [farms, fields, filter]);

  const selectedDetailFarm = useMemo(
    () => (routeFarmId ? farms.find((f) => f.id === routeFarmId) ?? null : null),
    [farms, routeFarmId]
  );

  // Unified mutation helper with offline-tolerant queueing & 409 conflict surfacing
  const runMutationWithOfflineFallback = async (opts: {
    entityType: OutboxOperation['entityType'];
    entityId: string;
    farmId: string;
    baseVersion: number | null;
    conflictPolicy: OutboxOperation['conflictPolicy'];
    method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    endpoint: string;
    payload: Record<string, unknown>;
    summaryLabel: string;
    optimisticUpdate?: () => void;
    successMessage?: string;
  }) => {
    if (!isOnline) {
      opts.optimisticUpdate?.();
      const { outbox: nextQueue, storageResult } = enqueueOutboxOp({
        entityType: opts.entityType,
        entityId: opts.entityId,
        farmId: opts.farmId,
        baseVersion: opts.baseVersion,
        conflictPolicy: opts.conflictPolicy,
        method: opts.method,
        endpoint: opts.endpoint,
        payload: opts.payload,
        summaryLabel: opts.summaryLabel,
      });
      setOutbox(nextQueue);
      if (storageResult.quotaExceeded && storageResult.error) setQuotaError(storageResult.error);
      showToast(`Saved locally — queued for sync (${opts.summaryLabel})`, 'info');
      return;
    }

    try {
      const res = await executeDirectMutation<{ portfolio?: PortfolioApiResponse }>(
        opts.method,
        opts.endpoint,
        opts.method === 'DELETE' ? undefined : opts.payload
      );
      if (res.portfolio) {
        applyPortfolioBundle(res.portfolio);
      } else {
        await loadPortfolio();
      }
      if (opts.successMessage) showToast(opts.successMessage, 'success');
    } catch (err) {
      if (err instanceof ConflictApiError) {
        const { outbox: nextQueue } = enqueueOutboxOp({
          entityType: opts.entityType,
          entityId: opts.entityId,
          farmId: opts.farmId,
          baseVersion: opts.baseVersion,
          conflictPolicy: 'ask_user',
          method: opts.method,
          endpoint: opts.endpoint,
          payload: opts.payload,
          summaryLabel: opts.summaryLabel,
        });
        // Mark immediately as conflict in outbox so Sync Drawer shows diff
        const updated = nextQueue.map((o, idx) =>
          idx === nextQueue.length - 1
            ? {
                ...o,
                status: 'conflict' as const,
                lastError: err.message,
                conflictServerSnapshot: (err.serverFarm as unknown as Record<string, unknown>) ?? null,
              }
            : o
        );
        setOutbox(updated);
        showToast('Version conflict detected — review in Sync Outbox', 'error');
        throw err;
      }

      // Network drop fallback -> queue offline cleanly
      if (err instanceof TypeError || (err instanceof Error && err.message.toLowerCase().includes('fetch'))) {
        opts.optimisticUpdate?.();
        const { outbox: nextQueue, storageResult } = enqueueOutboxOp({
          entityType: opts.entityType,
          entityId: opts.entityId,
          farmId: opts.farmId,
          baseVersion: opts.baseVersion,
          conflictPolicy: opts.conflictPolicy,
          method: opts.method,
          endpoint: opts.endpoint,
          payload: opts.payload,
          summaryLabel: opts.summaryLabel,
        });
        setOutbox(nextQueue);
        if (storageResult.quotaExceeded && storageResult.error) setQuotaError(storageResult.error);
        showToast(`Connection interrupted — queued locally (${opts.summaryLabel})`, 'info');
        return;
      }

      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
      throw err;
    }
  };

  // Specific Handlers
  const handleCreateFarm = async (payload: Record<string, unknown>) => {
    if (!isOnline) {
      const { outbox: nextQueue } = enqueueOutboxOp({
        entityType: 'farm_create',
        entityId: `temp-${Date.now()}`,
        farmId: 'pending',
        baseVersion: null,
        conflictPolicy: 'append_only',
        method: 'POST',
        endpoint: '/api/my-farms/farms',
        payload,
        summaryLabel: `Create farm "${String(payload.name || 'New Farm')}"`,
      });
      setOutbox(nextQueue);
      showToast('Offline: new farm queued for creation once back online', 'info');
      return;
    }

    const res = await executeDirectMutation<{ farm?: ServerRawFarmDto; portfolio?: PortfolioApiResponse }>(
      'POST',
      '/api/my-farms/farms',
      payload
    );
    if (res.portfolio) applyPortfolioBundle(res.portfolio);
    if (res.farm) {
      setActiveFarmId(res.farm.id);
      showToast(`Created "${res.farm.name}"`, 'success');
      navigate(`/my-farms/${res.farm.id}`);
    }
  };

  const handlePatchFarm = async (
    farm: MyFarmRecord,
    patch: Record<string, unknown>,
    summaryLabel: string
  ) => {
    await runMutationWithOfflineFallback({
      entityType: 'farm_patch',
      entityId: farm.id,
      farmId: farm.id,
      baseVersion: farm.versionNumber,
      conflictPolicy: 'ask_user',
      method: 'PATCH',
      endpoint: `/api/my-farms/farms/${farm.id}`,
      payload: { ...patch, expectedVersion: farm.versionNumber },
      summaryLabel,
      optimisticUpdate: () => {
        setRawFarms((prev) =>
          prev.map((rf) =>
            rf.id === farm.id
              ? {
                  ...rf,
                  ...(typeof patch.name === 'string' ? { name: patch.name } : {}),
                  ...(patch.archived !== undefined
                    ? { archivedAt: patch.archived ? new Date().toISOString() : null }
                    : {}),
                  ...(patch.soil ? { soil: { ...rf.soil, ...(patch.soil as Record<string, unknown>) } as ServerRawFarmDto['soil'] } : {}),
                  ...(patch.water ? { water: { ...rf.water, ...(patch.water as Record<string, unknown>) } as ServerRawFarmDto['water'] } : {}),
                  updatedAt: new Date().toISOString(),
                }
              : rf
          )
        );
      },
      successMessage: summaryLabel,
    });
  };

  const handleRenameConfirm = async (farm: MyFarmRecord, newName: string) => {
    await handlePatchFarm(farm, { name: newName }, `Renamed "${farm.name}" → "${newName}"`);
  };

  const handleDuplicateConfirm = async (
    farm: MyFarmRecord,
    opts: { newName: string; includeFields: boolean; includeHistory: boolean }
  ) => {
    const res = await executeDirectMutation<{ farm?: ServerRawFarmDto; portfolio?: PortfolioApiResponse }>(
      'POST',
      `/api/my-farms/farms/${farm.id}/duplicate`,
      opts
    );
    if (res.portfolio) applyPortfolioBundle(res.portfolio);
    showToast(`Duplicated configuration as "${opts.newName}"`, 'success');
  };

  const handleDeleteConfirm = async (farm: MyFarmRecord) => {
    const res = await executeDirectMutation<{
      deletedFarmId: string;
      removedCounts?: Record<string, number>;
    }>('DELETE', `/api/my-farms/farms/${farm.id}`);

    const remainingIds = rawFarms.filter((f) => f.id !== farm.id).map((f) => f.id);
    handleLocalProfileDeletionCleanup(farm.id, remainingIds);

    await loadPortfolio();
    showToast(
      `Deleted "${farm.name}" (${res.removedCounts?.fields ?? 0} fields removed)`,
      'success'
    );
    if (routeFarmId === farm.id) {
      navigate('/my-farms');
    }
  };

  const handleExportJson = (farm: MyFarmRecord) => {
    const bundle = {
      exportedAt: new Date().toISOString(),
      privacyNotice: 'Private ANCHOR farm portfolio export',
      farm,
      fields: fields.filter((f) => f.farmId === farm.id),
      decisions: decisions.filter((d) => d.farmId === farm.id),
      observations: observations.filter((o) => o.farmId === farm.id),
      tasks: tasks.filter((t) => t.farmId === farm.id),
      irrigationLogs: irrigationLogs.filter((l) => l.farmId === farm.id),
      snapshots: snapshots.filter((s) => s.farmId === farm.id),
    };
    downloadJsonFile(
      `${farm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-record.json`,
      bundle
    );
    showToast(`Exported ${farm.name} JSON record`, 'success');
  };

  const handleExportGeoJson = (farm: MyFarmRecord) => {
    const farmFields = fields.filter((f) => f.farmId === farm.id);
    const features = farmFields.length > 0
      ? farmFields.map((fl) => ({
          type: 'Feature',
          properties: {
            farmId: farm.id,
            farmName: farm.name,
            fieldId: fl.id,
            fieldName: fl.name,
            crop: fl.cropName || null,
            areaHa: fl.versions[0]?.netAreaHectares ?? null,
            status: fl.status,
          },
          geometry: fl.versions[0]?.geometry ?? null,
        }))
      : farm.geometry
        ? [
            {
              type: 'Feature',
              properties: {
                farmId: farm.id,
                farmName: farm.name,
                areaHa: farm.mappedAreaHa,
              },
              geometry: farm.geometry,
            },
          ]
        : [];

    downloadJsonFile(`${farm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.geojson`, {
      type: 'FeatureCollection',
      crs: { type: 'name', properties: { name: 'EPSG:4326' } },
      features,
    });
    showToast(`Exported ${farm.name} GeoJSON`, 'success');
  };

  const handleResolveConflict = async (
    operationId: string,
    resolution: 'keep_mine' | 'accept_server'
  ) => {
    const op = outbox.find((o) => o.operationId === operationId);
    if (!op) return;
    if (resolution === 'accept_server') {
      const next = removeOutboxOp(operationId);
      setOutbox(next);
      await loadPortfolio();
      showToast('Accepted server version; discarded conflicting local edit', 'info');
      return;
    }

    try {
      const res = await executeDirectMutation<{ portfolio?: PortfolioApiResponse }>(
        op.method,
        op.endpoint,
        { ...op.payload, forceOverwrite: true, operationId: op.operationId }
      );
      const next = removeOutboxOp(operationId);
      setOutbox(next);
      if (res.portfolio) applyPortfolioBundle(res.portfolio);
      showToast('Applied your local edit cleanly', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to force apply edit', 'error');
    }
  };

  const handleOpenInMaps = (farm: MyFarmRecord) => {
    syncFarmToLocalProfiles(farm);
    setActiveFarmId(farm.id);
    navigate(`/maps?farmId=${encodeURIComponent(farm.id)}`);
  };

  const handleRunDeepAnalysis = (farm: MyFarmRecord) => {
    syncFarmToLocalProfiles(farm);
    setActiveFarmId(farm.id);
    navigate('/analyze?mode=farm');
  };

  const hasActiveFilters =
    filter.search.trim() !== '' || filter.status !== 'all' || filter.region !== 'all';

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-deep)] text-[var(--text-primary)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-5">
        {/* Top Utility Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              My Farms
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Manage farms and fields, review health and readiness, and open operational workspaces.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!routeFarmId && (
              <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setAdvancedMode(false)}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                    !advancedMode
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Simple
                </button>
                <button
                  type="button"
                  onClick={() => setAdvancedMode(true)}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                    advancedMode
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Advanced
                </button>
              </div>
            )}

            <OfflineSyncBar
              isOnline={isOnline}
              lastSyncedAt={lastSyncedAt}
              outbox={outbox}
              isSyncing={isSyncing}
              quotaError={quotaError}
              onSyncNow={handleSyncNow}
              onResolveConflict={handleResolveConflict}
              onDiscardOp={(opId) => setOutbox(removeOutboxOp(opId))}
              onExportBackup={() =>
                downloadJsonFile(`anchor-myfarms-backup-${Date.now()}.json`, {
                  farms: rawFarms,
                  fields,
                  decisions,
                  observations,
                  tasks,
                  outbox,
                })
              }
              onDismissQuotaError={() => setQuotaError(null)}
            />

            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:brightness-110 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Farm
            </button>
          </div>
        </div>

        {/* Network / Cache Banner */}
        {loadError && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loadError}</span>
            </div>
            <button
              type="button"
              onClick={loadPortfolio}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-amber-500/40 font-semibold hover:bg-amber-500/15 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* VIEW A: FARM DETAIL WORKSPACE */}
        {routeFarmId ? (
          loading && !selectedDetailFarm ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-10 text-center text-sm text-[var(--text-secondary)]">
              Loading farm workspace…
            </div>
          ) : !selectedDetailFarm ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center space-y-3">
              <div className="text-base font-bold text-[var(--text-primary)]">
                Farm record not found
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                It may have been deleted or renamed on another session.
              </p>
              <button
                type="button"
                onClick={() => navigate('/my-farms')}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold cursor-pointer"
              >
                Return to My Farms
              </button>
            </div>
          ) : (
            <FarmDetailWorkspace
              farm={selectedDetailFarm}
              allFields={fields}
              decisions={decisions}
              observations={observations}
              tasks={tasks}
              irrigationLogs={irrigationLogs}
              snapshots={snapshots}
              activeTab={detailTab}
              isOnline={isOnline}
              onChangeTab={setDetailTab}
              onBackToPortfolio={() => navigate('/my-farms')}
              onPatchFarm={handlePatchFarm}
              onCreateField={async (payload) => {
                await runMutationWithOfflineFallback({
                  entityType: 'field_create',
                  entityId: `temp-field-${Date.now()}`,
                  farmId: selectedDetailFarm.id,
                  baseVersion: null,
                  conflictPolicy: 'append_only',
                  method: 'POST',
                  endpoint: '/api/my-farms/fields',
                  payload,
                  summaryLabel: `Add field "${String(payload.name)}"`,
                  successMessage: `Created field "${String(payload.name)}"`,
                });
              }}
              onPatchField={async (fieldId, patch) => {
                await runMutationWithOfflineFallback({
                  entityType: 'field_patch',
                  entityId: fieldId,
                  farmId: selectedDetailFarm.id,
                  baseVersion: null,
                  conflictPolicy: 'server_wins',
                  method: 'PATCH',
                  endpoint: `/api/my-farms/fields/${fieldId}`,
                  payload: patch,
                  summaryLabel: 'Update field settings',
                  successMessage: 'Field updated',
                });
              }}
              onSaveFieldBoundary={async (fieldId, geometry: GeoJsonPolygonGeometry, editReason) => {
                await runMutationWithOfflineFallback({
                  entityType: 'field_boundary',
                  entityId: fieldId,
                  farmId: selectedDetailFarm.id,
                  baseVersion: null,
                  conflictPolicy: 'server_wins',
                  method: 'PUT',
                  endpoint: `/api/maps/fields/${fieldId}/boundary`,
                  payload: { geometry, source: 'edited', editReason },
                  summaryLabel: 'Update field boundary geometry',
                  successMessage: 'Boundary version saved',
                });
                await loadPortfolio();
              }}
              onDeleteField={async (fieldId) => {
                await executeDirectMutation('DELETE', `/api/maps/fields/${fieldId}`);
                await loadPortfolio();
                showToast('Field deleted', 'success');
              }}
              onRecordDecision={async ({
                fieldId,
                fieldName,
                action,
                candidate,
                isRecommendedPlan,
                reasonCode,
                reasonNote,
              }) => {
                await runMutationWithOfflineFallback({
                  entityType: 'decision_log',
                  entityId: candidate.id,
                  farmId: selectedDetailFarm.id,
                  baseVersion: null,
                  conflictPolicy: 'append_only',
                  method: 'POST',
                  endpoint: `/api/my-farms/farms/${selectedDetailFarm.id}/decisions`,
                  payload: {
                    fieldId,
                    fieldName,
                    action,
                    candidateId: candidate.id,
                    candidateTitle: candidate.title,
                    candidateScoreSnapshot: candidate.suitabilityScore,
                    candidateCrops: candidate.steps.map((s) => ({
                      cropId: s.cropId,
                      cropName: s.cropName,
                      cycleLabel: s.cycleLabel,
                    })),
                    isRecommendedPlan,
                    reasonCode,
                    reasonNote,
                  },
                  summaryLabel: `Plan decision (${action}): ${candidate.title}`,
                  successMessage: `Recorded ${action} decision in Plan History`,
                });
              }}
              onAddObservation={async (payload) => {
                await runMutationWithOfflineFallback({
                  entityType: 'observation_add',
                  entityId: `obs-${Date.now()}`,
                  farmId: selectedDetailFarm.id,
                  baseVersion: null,
                  conflictPolicy: 'append_only',
                  method: 'POST',
                  endpoint: `/api/my-farms/farms/${selectedDetailFarm.id}/observations`,
                  payload,
                  summaryLabel: `Observation: ${String(payload.title)}`,
                  successMessage: 'Observation logged',
                });
              }}
              onAddTask={async (payload) => {
                await runMutationWithOfflineFallback({
                  entityType: 'task_add',
                  entityId: `task-${Date.now()}`,
                  farmId: selectedDetailFarm.id,
                  baseVersion: null,
                  conflictPolicy: 'append_only',
                  method: 'POST',
                  endpoint: `/api/my-farms/farms/${selectedDetailFarm.id}/tasks`,
                  payload,
                  summaryLabel: `Task: ${String(payload.title)}`,
                  successMessage: 'Task added',
                });
              }}
              onToggleTask={async (taskId, completed) => {
                await runMutationWithOfflineFallback({
                  entityType: 'task_toggle',
                  entityId: taskId,
                  farmId: selectedDetailFarm.id,
                  baseVersion: null,
                  conflictPolicy: 'server_wins',
                  method: 'PATCH',
                  endpoint: `/api/my-farms/tasks/${taskId}`,
                  payload: { completed },
                  summaryLabel: `${completed ? 'Complete' : 'Reopen'} task`,
                  optimisticUpdate: () => {
                    setTasks((prev) =>
                      prev.map((t) => (t.id === taskId ? { ...t, completed } : t))
                    );
                  },
                });
              }}
              onAddIrrigation={async (payload) => {
                await runMutationWithOfflineFallback({
                  entityType: 'irrigation_add',
                  entityId: `irr-${Date.now()}`,
                  farmId: selectedDetailFarm.id,
                  baseVersion: null,
                  conflictPolicy: 'append_only',
                  method: 'POST',
                  endpoint: `/api/my-farms/farms/${selectedDetailFarm.id}/irrigation`,
                  payload,
                  summaryLabel: `Log ${String(payload.volumeM3)} m³ irrigation`,
                  successMessage: 'Irrigation run logged',
                });
              }}
              onCreateSnapshot={async (payload) => {
                await runMutationWithOfflineFallback({
                  entityType: 'snapshot_save',
                  entityId: `snap-${Date.now()}`,
                  farmId: selectedDetailFarm.id,
                  baseVersion: null,
                  conflictPolicy: 'append_only',
                  method: 'POST',
                  endpoint: `/api/my-farms/farms/${selectedDetailFarm.id}/snapshots`,
                  payload,
                  summaryLabel: 'Save assessment snapshot',
                  successMessage: 'Assessment snapshot saved',
                });
              }}
              onOpenRename={setRenameTarget}
              onOpenDuplicate={setDuplicateTarget}
              onOpenExport={setExportTarget}
              onArchiveToggle={(f) =>
                handlePatchFarm(
                  f,
                  { archived: !f.archivedAt },
                  f.archivedAt ? `Unarchived "${f.name}"` : `Archived "${f.name}"`
                )
              }
              onOpenDelete={setDeleteTarget}
              onOpenInMaps={handleOpenInMaps}
              onRunDeepAnalysis={handleRunDeepAnalysis}
            />
          )
        ) : (
          /* VIEW B: PORTFOLIO OVERVIEW */
          <>
            {/* Compact 4-Metric Portfolio Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
                <div className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Active Farms
                </div>
                <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums mt-0.5">
                  {aggregates.activeFarms}
                  {aggregates.archivedFarms > 0 && (
                    <span className="text-xs font-normal text-[var(--text-secondary)] ml-1.5">
                      ({aggregates.archivedFarms} archived)
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
                <div className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Total Mapped Area
                </div>
                <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums mt-0.5">
                  {formatArea(aggregates.totalMappedHa, 'hectares')}
                </div>
                {(aggregates.overlapWarningFarms > 0 || aggregates.areaMismatchFarms > 0) && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    {aggregates.overlapWarningFarms > 0
                      ? `${aggregates.overlapWarningFarms} overlap warning`
                      : `${aggregates.areaMismatchFarms} declared mismatch`}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
                <div className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Mapped Fields
                </div>
                <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums mt-0.5">
                  {aggregates.totalFields}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
                <div className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Alerts &amp; Attention
                </div>
                <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums mt-0.5">
                  {aggregates.needsAttentionOrAlertFarms} farm{aggregates.needsAttentionOrAlertFarms === 1 ? '' : 's'}
                  <span className="text-xs font-normal text-[var(--text-secondary)] ml-1.5">
                    · {aggregates.totalAlerts} open alert{aggregates.totalAlerts === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            </div>

            {advancedMode && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/45 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[var(--accent)]" />
                    Portfolio Comparability &amp; Risk Breakdown
                  </div>
                  <div className="text-[var(--text-secondary)]">
                    {aggregates.comparabilityNote}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 tabular-nums text-[var(--text-primary)] font-medium">
                  <span>Refresh needed: {aggregates.needsRefreshFarms}</span>
                  <span>Unassessed / Partial: {aggregates.unassessedFarms}</span>
                  <span>
                    Comparable Mean:{' '}
                    {aggregates.comparableScoreAverage !== null
                      ? `${aggregates.comparableScoreAverage}/100`
                      : 'Suppressed'}
                  </span>
                </div>
              </div>
            )}

            {/* Search & Filter Toolbar */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 flex flex-wrap items-center gap-2.5 text-xs">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={filter.search}
                  onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
                  placeholder="Search farms, fields, regions, or crops…"
                  aria-label="Search farms"
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <select
                  aria-label="Filter by status"
                  value={filter.status}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, status: e.target.value as PortfolioFilterState['status'] }))
                  }
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                >
                  <option value="all">All active ({aggregates.activeFarms})</option>
                  <option value="good">Good</option>
                  <option value="needs_attention">Needs attention / refresh</option>
                  <option value="alert">Critical alert</option>
                  <option value="not_assessed">Not assessed / draft</option>
                  <option value="archived">Archived ({aggregates.archivedFarms})</option>
                </select>
              </div>

              <select
                aria-label="Filter by region"
                value={filter.region}
                onChange={(e) => setFilter((f) => ({ ...f, region: e.target.value }))}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
              >
                <option value="all">All regions</option>
                {uniqueRegions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() =>
                    setFilter((f) => ({ ...f, search: '', status: 'all', region: 'all' }))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear filters
                </button>
              )}
            </div>

            {/* Table / Empty / Zero-Match */}
            {loading && farms.length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-10 text-center text-sm text-[var(--text-secondary)]">
                Loading farms…
              </div>
            ) : farms.length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-10 text-center space-y-3">
                <Sprout className="w-8 h-8 mx-auto text-[var(--accent)]" />
                <div className="text-base font-bold text-[var(--text-primary)]">No farms yet</div>
                <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                  Register your first farm parcel, import or draw field boundaries, and start tracking soil, water, weather, and rotation decisions.
                </p>
                <button
                  type="button"
                  onClick={() => setWizardOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add First Farm
                </button>
              </div>
            ) : filteredFarms.length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center space-y-2.5 text-xs">
                <div className="text-sm font-bold text-[var(--text-primary)]">
                  No farms match your current filters
                </div>
                <div className="text-[var(--text-secondary)]">
                  Active criteria: {filter.search ? `search "${filter.search}" · ` : ''}status={filter.status} · region={filter.region}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFilter((f) => ({ ...f, search: '', status: 'all', region: 'all' }))
                  }
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <PortfolioTable
                farms={filteredFarms}
                fields={fields}
                filter={filter}
                selectedFarmId={getActiveFarmId() || null}
                onChangeSort={(sortBy) =>
                  setFilter((f) => ({
                    ...f,
                    sortBy,
                    sortDir: f.sortBy === sortBy && f.sortDir === 'asc' ? 'desc' : 'asc',
                  }))
                }
                onOpenDetails={(farmId, subTab = 'overview') => {
                  const found = farms.find((x) => x.id === farmId);
                  if (found) syncFarmToLocalProfiles(found);
                  setActiveFarmId(farmId);
                  setDetailTab(subTab);
                  navigate(`/my-farms/${farmId}`);
                }}
                onRenameFarm={setRenameTarget}
                onDuplicateFarm={setDuplicateTarget}
                onExportFarm={setExportTarget}
                onArchiveToggle={(farm) =>
                  handlePatchFarm(
                    farm,
                    { archived: !farm.archivedAt },
                    farm.archivedAt ? `Unarchived "${farm.name}"` : `Archived "${farm.name}"`
                  )
                }
                onDeleteFarm={setDeleteTarget}
                onOpenInMaps={handleOpenInMaps}
                onRunDeepAnalysis={handleRunDeepAnalysis}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddFarmWizardModal
        open={wizardOpen}
        existingNames={farms.map((f) => f.name)}
        onClose={() => setWizardOpen(false)}
        onComplete={handleCreateFarm}
      />

      <RenameFarmModal
        farm={renameTarget}
        existingNames={farms.map((f) => f.name)}
        onClose={() => setRenameTarget(null)}
        onConfirm={handleRenameConfirm}
      />

      <DuplicateFarmModal
        farm={duplicateTarget}
        fieldCount={
          duplicateTarget ? fields.filter((f) => f.farmId === duplicateTarget.id).length : 0
        }
        onClose={() => setDuplicateTarget(null)}
        onConfirm={handleDuplicateConfirm}
      />

      <ExportFarmModal
        farm={exportTarget}
        onClose={() => setExportTarget(null)}
        onDownloadJson={handleExportJson}
        onDownloadGeoJson={handleExportGeoJson}
      />

      <DeleteFarmModal
        farm={deleteTarget}
        downstreamCounts={
          deleteTarget
            ? {
                fields: fields.filter((f) => f.farmId === deleteTarget.id).length,
                decisions: decisions.filter((d) => d.farmId === deleteTarget.id).length,
                observations: observations.filter((o) => o.farmId === deleteTarget.id).length,
                tasks: tasks.filter((t) => t.farmId === deleteTarget.id).length,
                snapshots: snapshots.filter((s) => s.farmId === deleteTarget.id).length,
              }
            : { fields: 0, decisions: 0, observations: 0, tasks: 0, snapshots: 0 }
        }
        isActiveFarm={Boolean(deleteTarget && getActiveFarmId() === deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
