import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  Download,
  RefreshCw,
  Wifi,
  X,
} from 'lucide-react';
import { OutboxOperation } from '../../types/myFarms';
import { downloadJsonFile } from '../../lib/myFarmsOutbox';

interface OfflineSyncBarProps {
  isOnline: boolean;
  lastSyncedAt: string | null;
  outbox: OutboxOperation[];
  isSyncing: boolean;
  quotaError: string | null;
  onSyncNow: () => void;
  onResolveConflict: (operationId: string, resolution: 'keep_mine' | 'accept_server') => void;
  onDiscardOp: (operationId: string) => void;
  onExportBackup: () => void;
  onDismissQuotaError: () => void;
}

export const OfflineSyncBar: React.FC<OfflineSyncBarProps> = ({
  isOnline,
  lastSyncedAt,
  outbox,
  isSyncing,
  quotaError,
  onSyncNow,
  onResolveConflict,
  onDiscardOp,
  onExportBackup,
  onDismissQuotaError,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pendingOps = outbox.filter((o) => o.status === 'pending' || o.status === 'syncing');
  const conflictOps = outbox.filter((o) => o.status === 'conflict');
  const failedOps = outbox.filter((o) => o.status === 'failed');
  const totalQueued = outbox.length;

  const statusTone = conflictOps.length > 0 || failedOps.length > 0
    ? 'issue'
    : !isOnline
      ? 'offline'
      : pendingOps.length > 0
        ? 'pending'
        : 'online';

  return (
    <>
      {quotaError && (
        <div
          role="alert"
          className="mb-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-200"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{quotaError}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportBackup}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-rose-500/40 font-semibold hover:bg-rose-500/15 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Backup JSON
            </button>
            <button
              type="button"
              onClick={onDismissQuotaError}
              aria-label="Dismiss storage warning"
              className="p-1 rounded hover:bg-rose-500/20 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
            statusTone === 'issue'
              ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
              : statusTone === 'offline'
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                : statusTone === 'pending'
                  ? 'border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300'
                  : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {statusTone === 'offline' ? (
            <CloudOff className="w-3.5 h-3.5 shrink-0" />
          ) : statusTone === 'issue' ? (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          ) : statusTone === 'pending' ? (
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
          ) : (
            <Wifi className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}

          <span>
            {statusTone === 'issue'
              ? `Sync issue (${conflictOps.length + failedOps.length})`
              : statusTone === 'offline'
                ? 'Offline mode'
                : statusTone === 'pending'
                  ? `Changes pending (${pendingOps.length})`
                  : 'Synced'}
          </span>

          {lastSyncedAt && statusTone === 'online' && (
            <span className="hidden sm:inline text-[11px] opacity-75 tabular-nums">
              · {new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </button>

        {totalQueued > 0 && isOnline && (
          <button
            type="button"
            onClick={onSyncNow}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-primary)] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing…' : 'Sync now'}
          </button>
        )}
      </div>

      {/* Sync Outbox & Conflict Resolution Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px]"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--border)] p-5 flex flex-col justify-between overflow-y-auto fs-thin-scroll"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Sync Outbox & Offline Queue"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Sync Outbox &amp; Offline Status
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {isOnline
                      ? 'Connected to workspace server. Local edits sync automatically.'
                      : 'Offline mode active. Supported edits queue locally and replay when connection returns.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close sync drawer"
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!isOnline && (
                <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-semibold">Offline capabilities &amp; restrictions</div>
                  <p>
                    Available offline: view cached portfolio/reports, rename farms, archive/restore, log scouting observations, complete tasks, and draft field polygons.
                  </p>
                  <p className="opacity-85">
                    Requires connection: live weather refresh, NASA POWER climatology, elevation sampling, and satellite imagery reload.
                  </p>
                </div>
              )}

              {outbox.length === 0 ? (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/50 p-4 text-center space-y-1.5">
                  <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600 dark:text-emerald-400" />
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    All local edits synced
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {lastSyncedAt
                      ? `Last server sync at ${new Date(lastSyncedAt).toLocaleString()}`
                      : 'Workspace is up to date.'}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {outbox.map((op) => (
                    <div
                      key={op.operationId}
                      className={`rounded-lg border p-3 text-xs space-y-2 ${
                        op.status === 'conflict'
                          ? 'border-rose-500/45 bg-rose-500/10'
                          : op.status === 'failed'
                            ? 'border-amber-500/45 bg-amber-500/10'
                            : 'border-[var(--border)] bg-[var(--bg-elevated)]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-[var(--text-primary)]">
                            {op.summaryLabel}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] tabular-nums mt-0.5">
                            {op.entityType} · {new Date(op.createdAt).toLocaleString()} · Status: {op.status}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDiscardOp(op.operationId)}
                          className="text-[11px] text-[var(--text-secondary)] hover:text-rose-600 underline cursor-pointer"
                        >
                          Discard
                        </button>
                      </div>

                      {op.lastError && (
                        <div className="text-[11px] text-rose-700 dark:text-rose-300">
                          {op.lastError}
                        </div>
                      )}

                      {op.status === 'conflict' && (
                        <div className="pt-2 border-t border-rose-500/25 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-2">
                              <div className="font-semibold text-[var(--text-primary)] mb-1">
                                Your Local Edit
                              </div>
                              <pre className="whitespace-pre-wrap break-all font-mono text-[10px] text-[var(--text-secondary)]">
                                {JSON.stringify(op.payload, null, 1).slice(0, 180)}
                              </pre>
                            </div>
                            <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-2">
                              <div className="font-semibold text-[var(--text-primary)] mb-1">
                                Server State
                              </div>
                              <pre className="whitespace-pre-wrap break-all font-mono text-[10px] text-[var(--text-secondary)]">
                                {op.conflictServerSnapshot
                                  ? JSON.stringify(
                                      {
                                        name: op.conflictServerSnapshot.name,
                                        version: op.conflictServerSnapshot.versionNumber,
                                        updatedAt: op.conflictServerSnapshot.updatedAt,
                                      },
                                      null,
                                      1
                                    )
                                  : 'Server record modified'}
                              </pre>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onResolveConflict(op.operationId, 'keep_mine')}
                              className="flex-1 py-1.5 px-2.5 rounded-md bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer"
                            >
                              Keep My Edit (Overwrite)
                            </button>
                            <button
                              type="button"
                              onClick={() => onResolveConflict(op.operationId, 'accept_server')}
                              className="flex-1 py-1.5 px-2.5 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-elevated)] cursor-pointer"
                            >
                              Accept Server Version
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => downloadJsonFile(`anchor-outbox-backup-${Date.now()}.json`, outbox)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Outbox JSON
              </button>
              <button
                type="button"
                onClick={onSyncNow}
                disabled={!isOnline || isSyncing || outbox.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:brightness-110 disabled:opacity-45 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                Replay Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
