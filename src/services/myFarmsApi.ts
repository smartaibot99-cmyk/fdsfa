import {
  FarmObservationItem,
  FarmTaskItem,
  IrrigationLogItem,
  OutboxOperation,
  PlanDecisionEvent,
  PortfolioFieldRecord,
  SavedFarmSnapshot,
} from '../types/myFarms';
import { ServerRawFarmDto } from '../lib/myFarmsEngine';
import { loadOutbox, removeOutboxOp, saveCachedPortfolio, updateOutboxOp } from '../lib/myFarmsOutbox';

export interface PortfolioApiResponse {
  farms: ServerRawFarmDto[];
  fields: PortfolioFieldRecord[];
  decisions: PlanDecisionEvent[];
  observations: FarmObservationItem[];
  tasks: FarmTaskItem[];
  irrigationLogs: IrrigationLogItem[];
  snapshots: SavedFarmSnapshot[];
  serverTimestamp: string;
}

export class ConflictApiError extends Error {
  serverVersion: number;
  serverFarm: ServerRawFarmDto | null;
  constructor(message: string, serverVersion: number, serverFarm: ServerRawFarmDto | null) {
    super(message);
    this.name = 'ConflictApiError';
    this.serverVersion = serverVersion;
    this.serverFarm = serverFarm;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    throw new Error(`Invalid JSON response (${res.status})`);
  }
  if (res.status === 409 && json.conflict && typeof json.conflict === 'object') {
    const c = json.conflict as { serverVersion?: number; serverFarm?: ServerRawFarmDto | null };
    throw new ConflictApiError(
      typeof json.error === 'string' ? json.error : 'Version conflict detected.',
      c.serverVersion ?? 0,
      c.serverFarm ?? null
    );
  }
  if (!res.ok) {
    throw new Error(typeof json.error === 'string' ? json.error : `Request failed (${res.status})`);
  }
  return json as unknown as T;
}

export async function fetchMyFarmsPortfolio(): Promise<PortfolioApiResponse> {
  const res = await fetch('/api/my-farms/portfolio', {
    headers: { Accept: 'application/json' },
  });
  const data = await handleResponse<PortfolioApiResponse>(res);
  saveCachedPortfolio({
    farms: data.farms,
    fields: data.fields,
    decisions: data.decisions,
    observations: data.observations,
    tasks: data.tasks,
    irrigationLogs: data.irrigationLogs,
    snapshots: data.snapshots,
  });
  return data;
}

export async function executeDirectMutation<T = PortfolioApiResponse>(
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  endpoint: string,
  payload?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(endpoint, {
    method,
    headers: payload ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  return handleResponse<T>(res);
}

/**
 * Replays queued offline OutboxOperations sequentially & idempotently.
 * Flags HTTP 409 version conflicts cleanly instead of blind-overwriting server data.
 */
export async function replaySyncOutbox(): Promise<{
  syncedCount: number;
  conflictCount: number;
  failedCount: number;
  remaining: OutboxOperation[];
  latestPortfolio: PortfolioApiResponse | null;
}> {
  const queue = loadOutbox().filter((op) => op.status === 'pending' || op.status === 'failed');
  let syncedCount = 0;
  let conflictCount = 0;
  let failedCount = 0;
  let latestPortfolio: PortfolioApiResponse | null = null;

  for (const op of queue) {
    updateOutboxOp(op.operationId, { status: 'syncing', attempts: op.attempts + 1 });
    try {
      const bodyWithIdempotency = {
        ...op.payload,
        operationId: op.operationId,
      };
      const result = await executeDirectMutation<{ portfolio?: PortfolioApiResponse }>(
        op.method,
        op.endpoint,
        op.method === 'DELETE' ? undefined : bodyWithIdempotency
      );
      if (result.portfolio) {
        latestPortfolio = result.portfolio;
      }
      removeOutboxOp(op.operationId);
      syncedCount++;
    } catch (err) {
      if (err instanceof ConflictApiError) {
        updateOutboxOp(op.operationId, {
          status: 'conflict',
          lastError: err.message,
          conflictServerSnapshot: (err.serverFarm as unknown as Record<string, unknown>) ?? null,
        });
        conflictCount++;
      } else {
        updateOutboxOp(op.operationId, {
          status: 'failed',
          lastError: err instanceof Error ? err.message : 'Network error during replay',
        });
        failedCount++;
      }
    }
  }

  return {
    syncedCount,
    conflictCount,
    failedCount,
    remaining: loadOutbox(),
    latestPortfolio,
  };
}
