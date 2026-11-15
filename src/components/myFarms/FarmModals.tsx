import React, { useEffect, useState } from 'react';
import { AlertTriangle, Copy, Download, Edit3, Trash2, X } from 'lucide-react';
import { MyFarmRecord } from '../../types/myFarms';

interface RenameFarmModalProps {
  farm: MyFarmRecord | null;
  existingNames: string[];
  onClose: () => void;
  onConfirm: (farm: MyFarmRecord, newName: string) => Promise<void>;
}

export const RenameFarmModal: React.FC<RenameFarmModalProps> = ({
  farm,
  existingNames,
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState(farm?.name || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(farm?.name || '');
    setError('');
  }, [farm]);

  if (!farm) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Farm name cannot be blank.');
      return;
    }
    if (
      existingNames.some(
        (n) => n.trim().toLowerCase() === trimmed.toLowerCase() && trimmed.toLowerCase() !== farm.name.trim().toLowerCase()
      )
    ) {
      setError(`Another farm named "${trimmed}" already exists.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onConfirm(farm, trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to rename farm.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <Edit3 className="w-4 h-4 text-[var(--accent)]" />
            Rename Farm
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          Updates the display name across Portfolio, Fields &amp; Map, Analysis reports, and Header selector.
        </p>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            New farm name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            autoFocus
            maxLength={120}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-sm text-[var(--text-primary)]"
          />
          {error && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:brightness-110 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving…' : 'Save Name'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface DuplicateFarmModalProps {
  farm: MyFarmRecord | null;
  fieldCount: number;
  onClose: () => void;
  onConfirm: (farm: MyFarmRecord, opts: { newName: string; includeFields: boolean; includeHistory: boolean }) => Promise<void>;
}

export const DuplicateFarmModal: React.FC<DuplicateFarmModalProps> = ({
  farm,
  fieldCount,
  onClose,
  onConfirm,
}) => {
  const [newName, setNewName] = useState(farm ? `${farm.name} (Copy)` : '');
  const [includeFields, setIncludeFields] = useState(true);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNewName(farm ? `${farm.name} (Copy)` : '');
    setIncludeFields(true);
    setIncludeHistory(false);
  }, [farm]);

  if (!farm) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await onConfirm(farm, { newName: newName.trim(), includeFields, includeHistory });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <Copy className="w-4 h-4 text-[var(--accent)]" />
            Duplicate Farm Configuration
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          Creates an independent farm entry starting from <strong>{farm.name}</strong>’s soil and water settings. Choose which downstream items to copy:
        </p>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Duplicate farm name
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-sm text-[var(--text-primary)]"
          />
        </div>

        <div className="space-y-2 text-xs">
          <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/40 cursor-pointer">
            <input
              type="checkbox"
              checked={includeFields}
              onChange={(e) => setIncludeFields(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <strong className="block text-[var(--text-primary)]">Copy mapped fields ({fieldCount})</strong>
              <span className="text-[var(--text-secondary)]">Clones field boundaries into independent polygons.</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/40 cursor-pointer">
            <input
              type="checkbox"
              checked={includeHistory}
              onChange={(e) => setIncludeHistory(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <strong className="block text-[var(--text-primary)]">Carry active rotation plan &amp; decision log</strong>
              <span className="text-[var(--text-secondary)]">Leave unchecked to start with a clean rotation slate.</span>
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3.5 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] cursor-pointer">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:brightness-110 cursor-pointer">
            {saving ? 'Duplicating…' : 'Create Duplicate'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface DeleteFarmModalProps {
  farm: MyFarmRecord | null;
  downstreamCounts: {
    fields: number;
    decisions: number;
    observations: number;
    tasks: number;
    snapshots: number;
  };
  isActiveFarm: boolean;
  onClose: () => void;
  onConfirm: (farm: MyFarmRecord) => Promise<void>;
}

export const DeleteFarmModal: React.FC<DeleteFarmModalProps> = ({
  farm,
  downstreamCounts,
  isActiveFarm,
  onClose,
  onConfirm,
}) => {
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setConfirmName('');
    setDeleting(false);
  }, [farm]);

  if (!farm) return null;

  const matches = confirmName.trim().toLowerCase() === farm.name.trim().toLowerCase();

  const handleDelete = async () => {
    if (!matches) return;
    setDeleting(true);
    try {
      await onConfirm(farm);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-[var(--bg-surface)] p-5 space-y-4 shadow-2xl"
        role="alertdialog"
        aria-labelledby="delete-farm-title"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm" id="delete-farm-title">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Permanently Delete Farm?
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          You are about to permanently remove <strong className="text-[var(--text-primary)]">{farm.name}</strong> from your server workspace and local browser profile cache. To temporarily hide a farm without losing records, use <strong>Archive</strong> instead.
        </p>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/50 p-3 text-xs space-y-1">
          <div className="font-semibold text-[var(--text-primary)]">Downstream items to be deleted:</div>
          <div className="text-[var(--text-secondary)] tabular-nums">
            · {downstreamCounts.fields} mapped field{downstreamCounts.fields === 1 ? '' : 's'} &amp; polygon boundary history
          </div>
          <div className="text-[var(--text-secondary)] tabular-nums">
            · {downstreamCounts.decisions} rotation decision journal entr{downstreamCounts.decisions === 1 ? 'y' : 'ies'}
          </div>
          <div className="text-[var(--text-secondary)] tabular-nums">
            · {downstreamCounts.observations} scouting/lab observation{downstreamCounts.observations === 1 ? '' : 's'}, {downstreamCounts.tasks} task{downstreamCounts.tasks === 1 ? '' : 's'}, {downstreamCounts.snapshots} saved report{downstreamCounts.snapshots === 1 ? '' : 's'}
          </div>
          {isActiveFarm && (
            <div className="text-amber-700 dark:text-amber-300 font-medium pt-1">
              · Currently selected as Active Farm — header &amp; tracker will reassign to the next available farm.
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Type <strong>{farm.name}</strong> to confirm permanent deletion:
          </label>
          <input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={farm.name}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-sm text-[var(--text-primary)]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-3.5 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            disabled={!matches || deleting}
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? 'Deleting…' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ExportFarmModalProps {
  farm: MyFarmRecord | null;
  onClose: () => void;
  onDownloadJson: (farm: MyFarmRecord) => void;
  onDownloadGeoJson: (farm: MyFarmRecord) => void;
}

export const ExportFarmModal: React.FC<ExportFarmModalProps> = ({
  farm,
  onClose,
  onDownloadJson,
  onDownloadGeoJson,
}) => {
  if (!farm) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <Download className="w-4 h-4 text-[var(--accent)]" />
            Export {farm.name}
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[var(--text-secondary)] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              onDownloadJson(farm);
              onClose();
            }}
            className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/40 hover:bg-[var(--bg-elevated)] text-left cursor-pointer"
          >
            <div className="text-xs font-semibold text-[var(--text-primary)]">Complete Farm Record (JSON)</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Includes fields, soil/water logs, rotation decisions, tasks, and report snapshots.
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onDownloadGeoJson(farm);
              onClose();
            }}
            disabled={!farm.hasBoundary}
            className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/40 hover:bg-[var(--bg-elevated)] text-left disabled:opacity-45 cursor-pointer"
          >
            <div className="text-xs font-semibold text-[var(--text-primary)]">Field Boundaries (WGS84 GeoJSON)</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              {farm.hasBoundary
                ? 'Standard EPSG:4326 FeatureCollection compatible with QGIS and GIS tools.'
                : 'Unavailable — draw or import a boundary first.'}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
