import {
  FarmObservationItem,
  FarmTaskItem,
  IrrigationLogItem,
  OutboxOperation,
  PlanDecisionEvent,
  PortfolioFieldRecord,
  SavedFarmSnapshot,
} from '../types/myFarms';
import { ServerRawFarmDto } from './myFarmsEngine';

const OUTBOX_STORAGE_KEY = 'anchor_myfarms_outbox_v1';
const CACHE_STORAGE_KEY = 'anchor_myfarms_portfolio_cache_v1';

export interface CachedPortfolioBundle {
  farms: ServerRawFarmDto[];
  fields: PortfolioFieldRecord[];
  decisions: PlanDecisionEvent[];
  observations: FarmObservationItem[];
  tasks: FarmTaskItem[];
  irrigationLogs: IrrigationLogItem[];
  snapshots: SavedFarmSnapshot[];
  cachedAt: string;
}

export interface StorageWriteResult {
  ok: boolean;
  quotaExceeded: boolean;
  error?: string;
}

export function loadOutbox(): OutboxOperation[] {
  try {
    const raw = window.localStorage.getItem(OUTBOX_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OutboxOperation[]) : [];
  } catch {
    return [];
  }
}

export function saveOutbox(ops: OutboxOperation[]): StorageWriteResult {
  try {
    window.localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(ops));
    return { ok: true, quotaExceeded: false };
  } catch (err) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.code === 22);
    return {
      ok: false,
      quotaExceeded: isQuota,
      error: isQuota
        ? 'Browser local storage limit reached. Export a backup JSON now before clearing cached items.'
        : 'Unable to persist local sync outbox.',
    };
  }
}

export function enqueueOutboxOp(
  op: Omit<OutboxOperation, 'operationId' | 'payloadSchemaVersion' | 'createdAt' | 'status' | 'attempts'> & {
    operationId?: string;
  }
): { outbox: OutboxOperation[]; storageResult: StorageWriteResult; operation: OutboxOperation } {
  const existing = loadOutbox();
  const operation: OutboxOperation = {
    ...op,
    operationId: op.operationId || `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    payloadSchemaVersion: 1,
    createdAt: new Date().toISOString(),
    status: 'pending',
    attempts: 0,
  };
  const next = [...existing, operation];
  const storageResult = saveOutbox(next);
  return { outbox: next, storageResult, operation };
}

export function updateOutboxOp(operationId: string, patch: Partial<OutboxOperation>): OutboxOperation[] {
  const current = loadOutbox();
  const next = current.map((op) => (op.operationId === operationId ? { ...op, ...patch } : op));
  saveOutbox(next);
  return next;
}

export function removeOutboxOp(operationId: string): OutboxOperation[] {
  const next = loadOutbox().filter((op) => op.operationId !== operationId);
  saveOutbox(next);
  return next;
}

export function loadCachedPortfolio(): CachedPortfolioBundle | null {
  try {
    const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedPortfolioBundle;
  } catch {
    return null;
  }
}

export function saveCachedPortfolio(bundle: Omit<CachedPortfolioBundle, 'cachedAt'>): StorageWriteResult {
  try {
    const payload: CachedPortfolioBundle = {
      ...bundle,
      cachedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(payload));
    return { ok: true, quotaExceeded: false };
  } catch (err) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.code === 22);
    return {
      ok: false,
      quotaExceeded: isQuota,
      error: isQuota
        ? 'Browser storage quota exceeded while caching offline portfolio.'
        : 'Failed to write offline cache.',
    };
  }
}

export function downloadJsonFile(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
