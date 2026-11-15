import React, { useEffect, useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { CropEntry, HotspotKind, PlantHotspot } from '../../types';

interface PlantGuideDrawerProps {
  open: boolean;
  hotspots: PlantHotspot[];
  cropsById: Record<string, CropEntry>;
  onSelectHotspot: (hotspot: PlantHotspot) => void;
  onClose: () => void;
}

const KIND_FILTERS: Array<{ id: 'all' | HotspotKind; label: string }> = [
  { id: 'all', label: 'All (16)' },
  { id: 'crop', label: 'Crops' },
  { id: 'tree', label: 'Trees' },
  { id: 'wildflower', label: 'Wildflowers' },
  { id: 'pasture', label: 'Pasture' },
  { id: 'meadow', label: 'Grass' },
  { id: 'solar', label: 'Solar' },
];

export const PlantGuideDrawer: React.FC<PlantGuideDrawerProps> = ({
  open,
  hotspots,
  cropsById,
  onSelectHotspot,
  onClose,
}) => {
  const [filterKind, setFilterKind] = useState<'all' | HotspotKind>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = hotspots.filter((h) => {
    if (filterKind !== 'all' && h.kind !== filterKind) return false;
    const crop = cropsById[h.cropId];
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      h.label.toLowerCase().includes(q) ||
      (crop?.name.toLowerCase().includes(q) ?? false) ||
      (crop?.scientificName.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex justify-start"
      role="dialog"
      aria-modal="true"
      aria-label="Plant Guide directory"
    >
      <div className="fixed inset-0 bg-black/45" onClick={onClose} />
      <aside className="relative z-10 w-full max-w-sm bg-[var(--bg-surface)] border-r border-[var(--border)] h-full flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
            <h2 className="text-base font-display font-bold text-[var(--text-primary)]">
              Farm & Plant Guide
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Plant Guide"
            className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-[var(--border)] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter crops, trees, solar..."
              aria-label="Filter Plant Guide items"
              className="w-full min-h-[40px] pl-9 pr-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {KIND_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterKind(f.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-colors cursor-pointer ${
                  filterKind === f.id
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto p-3 space-y-1.5" role="list">
          {filtered.map((h) => {
            const crop = cropsById[h.cropId];
            return (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectHotspot(h);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <span className="text-2xl shrink-0" aria-hidden="true">
                    {h.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {crop?.name ?? h.label}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate">
                      {crop?.scientificName ?? h.kind}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--accent)] shrink-0">
                    {h.kind}
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="py-8 text-center text-xs text-[var(--text-secondary)]">
              No farm items match "{query}".
            </li>
          )}
        </ul>
      </aside>
    </div>
  );
};
