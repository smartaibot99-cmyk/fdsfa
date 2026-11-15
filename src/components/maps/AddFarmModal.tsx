import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  MapPin,
  PenTool,
  Sprout,
  Upload,
  X,
} from 'lucide-react';
import { FarmGeoJsonGeometry, FarmMapRecord } from '../../types/maps';
import {
  computeFarmGeometryMetrics,
  parseImportedBoundariesFile,
} from '../../lib/mapGeometry';
import { createWorkspaceFarm } from '../../services/mapsApi';
import { loadFarmProfiles } from '../../lib/farmStorage';
import { loadRecentAnalyses } from '../../lib/storage';
import { getCropDisplayName } from '../../data/farmCropCatalog';

export interface AnalyzedFarmCandidate {
  id: string;
  name: string;
  crop: string | null;
  locationLabel: string;
  lat: number;
  lon: number;
  analyzedAt: string;
}

export interface PendingFarmDraftMeta {
  name: string;
  crop: string | null;
  locationLabel?: string;
  notes?: string;
  center?: { lat: number; lon: number };
}

interface AddFarmModalProps {
  open: boolean;
  existingFarms: FarmMapRecord[];
  onStartDrawOnMap: (meta: PendingFarmDraftMeta) => void;
  onClose: () => void;
  onFarmCreated: (farm: Awaited<ReturnType<typeof createWorkspaceFarm>>) => void;
}

export function getUnmappedAnalyzedFarms(existingFarms: FarmMapRecord[]): AnalyzedFarmCandidate[] {
  const mappedNames = new Set(
    existingFarms.map((f) => f.name.trim().toLowerCase()).filter(Boolean)
  );
  const seenNames = new Set<string>();
  const results: AnalyzedFarmCandidate[] = [];

  // 1. Smart Farm Workspace profiles where an analysis report has been generated and coordinates exist
  const profiles = loadFarmProfiles();
  for (const p of profiles) {
    const rawName = p.location?.farmName?.trim() ?? '';
    const lat = p.location?.lat;
    const lon = p.location?.lon;
    if (
      !p.lastReportGeneratedAt ||
      !rawName ||
      typeof lat !== 'number' ||
      typeof lon !== 'number' ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon)
    ) {
      continue;
    }
    const key = rawName.toLowerCase();
    if (mappedNames.has(key) || seenNames.has(key)) continue;
    seenNames.add(key);

    const firstCropId = p.crops?.currentCrops?.[0] || p.crops?.plannedCrops?.[0] || '';
    const cropLabel = firstCropId ? getCropDisplayName(firstCropId) : null;
    const locLabel =
      p.location.locationLabel?.trim() || p.location.regionOrAddress?.trim() || '';

    results.push({
      id: p.id,
      name: rawName,
      crop: cropLabel,
      locationLabel: locLabel,
      lat,
      lon,
      analyzedAt: p.lastReportGeneratedAt,
    });
  }

  // 2. Site analyses performed specifically for farming/agriculture with coordinates
  const recent = loadRecentAnalyses();
  for (const item of recent) {
    if (item.activityId !== 'farming') continue;
    const rawName = item.place?.name?.trim() ?? '';
    const lat = item.place?.lat;
    const lon = item.place?.lon;
    if (
      !rawName ||
      typeof lat !== 'number' ||
      typeof lon !== 'number' ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon)
    ) {
      continue;
    }
    const key = rawName.toLowerCase();
    if (mappedNames.has(key) || seenNames.has(key)) continue;
    seenNames.add(key);

    results.push({
      id: item.id,
      name: rawName,
      crop: null,
      locationLabel: item.place.displayName || rawName,
      lat,
      lon,
      analyzedAt: item.createdAt,
    });
  }

  return results;
}

const CROP_SUGGESTIONS = ['Wheat', 'Corn', 'Soybeans', 'Barley', 'Alfalfa', 'Rice', 'Cotton', 'Orchard'];

export const AddFarmModal: React.FC<AddFarmModalProps> = ({
  open,
  existingFarms,
  onStartDrawOnMap,
  onClose,
  onFarmCreated,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nameFieldRef = useRef<HTMLDivElement | null>(null);

  const [name, setName] = useState('');
  const [crop, setCrop] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showImportSection, setShowImportSection] = useState(false);

  const [importedGeometry, setImportedGeometry] = useState<FarmGeoJsonGeometry | null>(null);
  const [importFilename, setImportFilename] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Compute eligible analyzed unmapped farms whenever modal opens or existingFarms updates
  const analyzedFarms = useMemo(() => {
    if (!open) return [];
    return getUnmappedAnalyzedFarms(existingFarms);
  }, [open, existingFarms]);

  const filteredAnalyzedFarms = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return analyzedFarms;
    return analyzedFarms.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.locationLabel.toLowerCase().includes(q)
    );
  }, [analyzedFarms, name]);

  const importedMetrics = useMemo(() => {
    if (!importedGeometry) return null;
    return computeFarmGeometryMetrics(importedGeometry);
  }, [importedGeometry]);

  // Reset modal state on close
  useEffect(() => {
    if (!open) {
      setDropdownOpen(false);
      setFormError(null);
    }
  }, [open]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (nameFieldRef.current && !nameFieldRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [dropdownOpen]);

  if (!open) return null;

  const resetLocalState = () => {
    setName('');
    setCrop('');
    setLocationLabel('');
    setNotes('');
    setDropdownOpen(false);
    setShowImportSection(false);
    setImportedGeometry(null);
    setImportFilename('');
    setImportError(null);
    setFormError(null);
  };

  const handleSelectAnalyzedFarm = (candidate: AnalyzedFarmCandidate) => {
    setDropdownOpen(false);
    setFormError(null);
    const meta: PendingFarmDraftMeta = {
      name: candidate.name,
      crop: candidate.crop || crop.trim() || null,
      locationLabel: candidate.locationLabel || undefined,
      notes: notes.trim() || undefined,
      center: { lat: candidate.lat, lon: candidate.lon },
    };
    resetLocalState();
    onStartDrawOnMap(meta);
  };

  const handleProceedToDraw = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter a farm name or choose one from your analyzed farms.');
      return;
    }

    // If user uploaded a boundary file instead of drawing on map, save directly
    if (showImportSection && importedGeometry) {
      void handleSaveImportedFarm();
      return;
    }

    const matchedCandidate = analyzedFarms.find(
      (f) => f.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    const meta: PendingFarmDraftMeta = {
      name: name.trim(),
      crop: crop.trim() || matchedCandidate?.crop || null,
      locationLabel: locationLabel.trim() || matchedCandidate?.locationLabel || undefined,
      notes: notes.trim() || undefined,
      center: matchedCandidate
        ? { lat: matchedCandidate.lat, lon: matchedCandidate.lon }
        : undefined,
    };
    resetLocalState();
    onStartDrawOnMap(meta);
  };

  const handleSaveImportedFarm = async () => {
    if (!importedGeometry || !name.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      const created = await createWorkspaceFarm({
        name: name.trim(),
        crop: crop.trim() || null,
        locationLabel: locationLabel.trim() || undefined,
        notes: notes.trim() || undefined,
        geometry: importedGeometry,
      });
      resetLocalState();
      onFarmCreated(created);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to save imported farm. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setImportError(null);
    setImportFilename(file.name);
    try {
      const text = await file.text();
      const parsed = parseImportedBoundariesFile(file.name, text);
      const valid = parsed.candidates.find((c) => c.geometry && c.validation?.valid);
      if (!valid || !valid.geometry) {
        const firstErr =
          parsed.candidates.find((c) => c.error)?.error ||
          'No valid Polygon feature found in this file.';
        setImportedGeometry(null);
        setImportError(firstErr);
        return;
      }
      setImportedGeometry(valid.geometry);
      if (!name.trim() && valid.suggestedName) {
        setName(valid.suggestedName);
      }
    } catch (err) {
      setImportedGeometry(null);
      setImportError(err instanceof Error ? err.message : 'Unable to parse file.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[900] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-farm-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0B1521] text-slate-100 shadow-2xl overflow-visible flex flex-col"
      >
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#09121C] rounded-t-2xl">
          <div>
            <h2 id="add-farm-modal-title" className="text-base font-semibold text-white">
              Add Farm
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pick a previously analyzed farm with coordinates or enter a new name.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Add Farm modal"
            className="w-8 h-8 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleProceedToDraw} className="p-5 space-y-4">
          {/* Farm Name Input with Analyzed Farms Dropdown */}
          <div ref={nameFieldRef} className="relative">
            <label htmlFor="farm-name-input" className="block text-xs font-medium text-slate-300 mb-1.5">
              Farm Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                id="farm-name-input"
                type="text"
                autoComplete="off"
                autoFocus
                value={name}
                onFocus={() => setDropdownOpen(true)}
                onClick={() => setDropdownOpen(true)}
                onChange={(e) => {
                  setName(e.target.value);
                  setDropdownOpen(true);
                  setFormError(null);
                }}
                placeholder="Click to select an analyzed farm or type a name..."
                maxLength={120}
                className="w-full h-11 pl-3.5 pr-9 rounded-xl bg-[#071018] border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#16E0B8] transition-colors"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setDropdownOpen((o) => !o)}
                aria-label="Toggle analyzed farms list"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {/* Analyzed Farms Dropdown */}
            {dropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-[#091420] border border-white/15 shadow-[0_14px_34px_rgba(0,0,0,0.65)] overflow-hidden">
                <div className="px-3 py-1.5 border-b border-white/[0.07] text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Analyzed Farms (Not on Maps)</span>
                  <span>{filteredAnalyzedFarms.length}</span>
                </div>

                {analyzedFarms.length === 0 ? (
                  <div className="px-4 py-5 text-center space-y-1">
                    <div className="text-sm font-semibold text-slate-200">No farm</div>
                    <p className="text-[11.5px] text-slate-400 leading-relaxed">
                      No analyzed farms with coordinates waiting to be mapped. Type a custom farm name above to draw on the map.
                    </p>
                  </div>
                ) : filteredAnalyzedFarms.length === 0 ? (
                  <div className="px-4 py-4 text-center space-y-1">
                    <div className="text-xs font-semibold text-slate-200">No farm</div>
                    <p className="text-[11px] text-slate-400">
                      No unmapped analyzed farm matches "{name.trim()}".
                    </p>
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto fs-thin-scroll divide-y divide-white/[0.06]">
                    {filteredAnalyzedFarms.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectAnalyzedFarm(item)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-[#102A34] transition-colors flex items-start justify-between gap-3 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                            <Sprout className="w-3.5 h-3.5 text-[#43F5D0] shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">
                              {item.locationLabel || `${item.lat.toFixed(4)}, ${item.lon.toFixed(4)}`}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[10.5px] font-mono text-[#43F5D0] tabular-nums">
                            {item.lat.toFixed(3)}, {item.lon.toFixed(3)}
                          </div>
                          {item.crop && (
                            <div className="text-[10.5px] text-slate-400 mt-0.5">{item.crop}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Optional Primary Crop & Location Label */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="farm-crop-input" className="block text-xs font-medium text-slate-300 mb-1">
                Primary Crop
              </label>
              <input
                id="farm-crop-input"
                type="text"
                list="farm-crop-options"
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                placeholder="Optional (e.g., Wheat)"
                maxLength={80}
                className="w-full h-10 px-3 rounded-xl bg-[#071018] border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#16E0B8]"
              />
              <datalist id="farm-crop-options">
                {CROP_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="farm-location-input" className="block text-xs font-medium text-slate-300 mb-1">
                Location Label
              </label>
              <input
                id="farm-location-input"
                type="text"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                placeholder="Optional region"
                maxLength={120}
                className="w-full h-10 px-3 rounded-xl bg-[#071018] border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#16E0B8]"
              />
            </div>
          </div>

          {/* Optional GeoJSON / KML Boundary Import Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowImportSection((s) => !s)}
              className="text-[11.5px] text-slate-400 hover:text-[#43F5D0] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{showImportSection ? 'Hide GeoJSON / KML import' : 'Or import a GeoJSON / KML boundary file'}</span>
            </button>

            {showImportSection && (
              <div className="mt-2.5 p-3.5 rounded-xl border border-dashed border-white/20 bg-[#0D1A26] text-center space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".geojson,.json,.kml,application/geo+json,application/vnd.google-earth.kml+xml"
                  className="hidden"
                  onChange={(e) => handleImportFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-white cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#22E0B6]" />
                  <span>{importFilename || 'Choose .geojson or .kml file'}</span>
                </button>
                {importError && (
                  <div className="text-left p-2 rounded-lg bg-rose-950/50 border border-rose-500/40 text-[11px] text-rose-200 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                    <span>{importError}</span>
                  </div>
                )}
                {importedGeometry && importedMetrics && (
                  <div className="text-left p-2 rounded-lg bg-[#0E2B33] border border-[#16E0B8]/50 text-[11px] text-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#4CEB87]" />
                    <span>Valid polygon loaded ({importedMetrics.areaHa.toFixed(1)} ha)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {formError && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/45 text-xs text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/[0.08] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1CE2BD]/75 bg-gradient-to-r from-[#0F3F42] to-[#134D4C] text-white text-xs font-semibold hover:brightness-110 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
            >
              {showImportSection && importedGeometry ? (
                <span>{saving ? 'Saving Farm...' : 'Save Imported Farm'}</span>
              ) : (
                <>
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Draw Boundary on Map</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
