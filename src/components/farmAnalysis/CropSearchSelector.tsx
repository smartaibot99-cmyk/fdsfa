import React, { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import {
  AGRICULTURAL_CROP_CATALOG,
  CROP_CATEGORY_ORDER,
  getCropDisplayName,
} from '../../data/farmCropCatalog';
import { CropCategoryGroup } from '../../types';

interface CropSearchSelectorProps {
  id: string;
  label: string;
  helperText?: string;
  selected: string[];
  onChange: (next: string[]) => void;
  allowNoRestrictions?: boolean;
  noRestrictions?: boolean;
  onToggleNoRestrictions?: (val: boolean) => void;
  allowOther?: boolean;
  otherText?: string;
  onOtherTextChange?: (val: string) => void;
  excludedIds?: string[];
  placeholder?: string;
}

export const CropSearchSelector: React.FC<CropSearchSelectorProps> = ({
  id,
  label,
  helperText,
  selected,
  onChange,
  allowNoRestrictions = false,
  noRestrictions = false,
  onToggleNoRestrictions,
  allowOther = false,
  otherText = '',
  onOtherTextChange,
  excludedIds = [],
  placeholder = 'Search crops by name or family...',
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CropCategoryGroup | 'All'>('All');
  const [customInput, setCustomInput] = useState('');
  const [otherChecked, setOtherChecked] = useState(() => Boolean(otherText.trim()));

  useEffect(() => {
    if (noRestrictions) {
      setOtherChecked(false);
    } else if (otherText.trim()) {
      setOtherChecked(true);
    }
  }, [noRestrictions, otherText]);

  const excludedSet = useMemo(() => new Set(excludedIds), [excludedIds]);

  const filteredByCategory = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups = new Map<CropCategoryGroup, typeof AGRICULTURAL_CROP_CATALOG>();
    for (const cat of CROP_CATEGORY_ORDER) {
      if (activeCategory !== 'All' && cat !== activeCategory) continue;
      const items = AGRICULTURAL_CROP_CATALOG.filter((c) => {
        if (c.category !== cat) return false;
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          c.scientificName.toLowerCase().includes(q) ||
          c.botanicalFamily.toLowerCase().includes(q)
        );
      });
      if (items.length > 0) groups.set(cat, items);
    }
    return groups;
  }, [query, activeCategory]);

  const toggleCrop = (cropId: string) => {
    if (allowNoRestrictions && noRestrictions && onToggleNoRestrictions) {
      onToggleNoRestrictions(false);
    }
    if (selected.includes(cropId)) {
      onChange(selected.filter((x) => x !== cropId));
    } else {
      onChange([...selected, cropId]);
    }
  };

  const addCustomCrop = () => {
    const cleaned = customInput.trim();
    if (!cleaned) return;
    if (allowNoRestrictions && noRestrictions && onToggleNoRestrictions) {
      onToggleNoRestrictions(false);
    }
    if (!selected.includes(cleaned)) {
      onChange([...selected, cleaned]);
    }
    setCustomInput('');
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label htmlFor={id} className="block text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
        {helperText && (
          <p className="text-xs text-[var(--text-secondary)]">{helperText}</p>
        )}
      </div>

      {/* Selected summary bar */}
      {allowNoRestrictions && noRestrictions ? (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)] text-xs text-[var(--text-primary)]">
          <span>No crop restrictions active — all crop families allowed.</span>
          <button
            type="button"
            onClick={() => onToggleNoRestrictions?.(false)}
            className="text-[var(--accent)] hover:underline font-medium shrink-0 cursor-pointer"
          >
            Clear
          </button>
        </div>
      ) : selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((cropId) => (
            <button
              key={cropId}
              type="button"
              onClick={() => toggleCrop(cropId)}
              className="inline-flex items-center gap-1.5 px-2.5 min-h-[32px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-xs text-[var(--text-primary)] cursor-pointer"
              title="Click to remove"
            >
              <span>{getCropDisplayName(cropId)}</span>
              <X className="w-3 h-3 text-[var(--text-secondary)]" aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-xs text-[var(--text-secondary)]">None selected yet.</div>
      )}

      {/* Search & Category Tabs */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id={id}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-[42px] pl-9 pr-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setActiveCategory('All')}
            className={`px-2.5 min-h-[32px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeCategory === 'All'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All groups
          </button>
          {CROP_CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 min-h-[32px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Categorized Scrollable Checklist */}
      <div className="max-h-60 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] divide-y divide-[var(--border)]">
        {Array.from(filteredByCategory.entries()).length === 0 ? (
          <div className="p-4 text-xs text-[var(--text-secondary)]">
            No matching crops in catalog. Add a custom crop below if needed.
          </div>
        ) : (
          Array.from(filteredByCategory.entries()).map(([cat, items]) => (
            <div key={cat} className="p-3 space-y-2">
              <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
                {cat}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {items.map((crop) => {
                  const isSelected = !noRestrictions && selected.includes(crop.id);
                  const isExcluded = excludedSet.has(crop.id);
                  return (
                    <button
                      key={crop.id}
                      type="button"
                      onClick={() => toggleCrop(crop.id)}
                      className={`flex items-center justify-between gap-2 px-3 min-h-[40px] rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--bg-elevated)] border-[var(--accent)] text-[var(--text-primary)] font-medium'
                          : 'border-[var(--border)] hover:border-[var(--accent)]/60 text-[var(--text-primary)]'
                      }`}
                    >
                      <span className="truncate">
                        {crop.name}
                        {isExcluded ? ' (Restricted)' : ''}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Custom crop entry & optional Q15 controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustomCrop();
            }
          }}
          placeholder="Add another crop name..."
          className="flex-1 min-h-[40px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)]"
        />
        <button
          type="button"
          onClick={addCustomCrop}
          disabled={!customInput.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[40px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-primary)] disabled:opacity-45 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Add crop</span>
        </button>
      </div>

      {allowNoRestrictions && (
        <div className="pt-1 space-y-2">
          <button
            type="button"
            onClick={() => {
              const next = !noRestrictions;
              onToggleNoRestrictions?.(next);
              if (next) {
                onChange([]);
                setOtherChecked(false);
                onOtherTextChange?.('');
              }
            }}
            className={`w-full sm:w-auto inline-flex items-center gap-2 px-3.5 min-h-[40px] rounded-xl border text-xs font-medium cursor-pointer ${
              noRestrictions
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--accent)]'
            }`}
          >
            <span>{noRestrictions ? '✓ No restrictions selected' : 'No restrictions (allow all crops)'}</span>
          </button>
        </div>
      )}

      {allowOther && (
        <div className="space-y-2 pt-1">
          <label className="inline-flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer">
            <input
              type="checkbox"
              checked={otherChecked && !noRestrictions}
              onChange={(e) => {
                const checked = e.target.checked;
                setOtherChecked(checked);
                if (checked && noRestrictions) {
                  onToggleNoRestrictions?.(false);
                }
                if (!checked) {
                  onOtherTextChange?.('');
                }
              }}
              className="w-4 h-4 accent-[var(--accent)]"
            />
            <span>Other restricted crop or rule</span>
          </label>
          {otherChecked && !noRestrictions && (
            <input
              type="text"
              value={otherText}
              onChange={(e) => onOtherTextChange?.(e.target.value)}
              placeholder="Specify restricted crop or local restriction..."
              className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
            />
          )}
        </div>
      )}
    </div>
  );
};
