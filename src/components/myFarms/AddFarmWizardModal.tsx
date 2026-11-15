import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Lock,
  MapPin,
  Search,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { GeocodePlaceResult, searchPlacesDetailed } from '../../services/geocode';
import { GeoJsonPolygonGeometry } from '../../types/maps';
import { AreaUnit, DrainageRate, SoilTexture, WaterReliability, WaterSource } from '../../types/farm';
import { buildStarterRectanglePolygon, formatArea } from '../../lib/myFarmsEngine';
import { FieldBoundaryEditorMap } from './FieldBoundaryEditorMap';

const DRAFT_STORAGE_KEY = 'anchor_myfarms_add_draft_v1';

interface WizardDraftState {
  step: number;
  name: string;
  primaryCrop: string;
  regionLabel: string;
  country: string;
  timezone: string;
  latStr: string;
  lonStr: string;
  locationLabel: string;
  boundaryMode: 'draw' | 'starter' | 'import' | 'skip';
  geometry: GeoJsonPolygonGeometry | null;
  mappedAreaHa: number;
  initialFieldName: string;
  declaredAreaStr: string;
  areaUnit: AreaUnit;
  soilTexture: SoilTexture;
  soilMoistureKnown: boolean;
  soilMoistureStr: string;
  soilPhTested: boolean;
  soilPhStr: string;
  drainage: DrainageRate;
  waterSource: WaterSource;
  waterReliability: WaterReliability;
  notes: string;
}

function createFreshBlankDraft(): WizardDraftState {
  return {
    step: 1,
    name: '',
    primaryCrop: '',
    regionLabel: '',
    country: 'United States',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    latStr: '',
    lonStr: '',
    locationLabel: '',
    boundaryMode: 'draw',
    geometry: null,
    mappedAreaHa: 0,
    initialFieldName: 'Main Block',
    declaredAreaStr: '',
    areaUnit: 'hectares',
    soilTexture: 'Unknown',
    soilMoistureKnown: false,
    soilMoistureStr: '',
    soilPhTested: false,
    soilPhStr: '',
    drainage: 'Unknown',
    waterSource: 'Unknown',
    waterReliability: 'Unknown',
    notes: '',
  };
}

interface AddFarmWizardModalProps {
  open: boolean;
  existingNames: string[];
  onClose: () => void;
  onComplete: (payload: Record<string, unknown>) => Promise<void>;
}

export const AddFarmWizardModal: React.FC<AddFarmWizardModalProps> = ({
  open,
  existingNames,
  onClose,
  onComplete,
}) => {
  const [draft, setDraft] = useState<WizardDraftState>(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) return { ...createFreshBlankDraft(), ...JSON.parse(saved) };
    } catch {
      // Ignore
    }
    return createFreshBlankDraft();
  });

  const [hasSavedDraftBanner, setHasSavedDraftBanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodePlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string>('');
  const [geoJsonText, setGeoJsonText] = useState('');
  const [importError, setImportError] = useState('');
  const [stepError, setStepError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check if there was a leftover incomplete draft when opened
  useEffect(() => {
    if (!open) return;
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WizardDraftState>;
        if (parsed.name && parsed.name.trim()) {
          setHasSavedDraftBanner(true);
        }
      }
    } catch {
      // Ignore
    }
  }, [open]);

  // Persist draft automatically while open so reloading/closing never drops progress
  useEffect(() => {
    if (!open) return;
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore quota errors on draft scratch
    }
  }, [draft, open]);

  if (!open) return null;

  const parsedLat = Number(draft.latStr);
  const parsedLon = Number(draft.lonStr);
  const hasCoords =
    draft.latStr.trim() !== '' &&
    draft.lonStr.trim() !== '' &&
    Number.isFinite(parsedLat) &&
    Number.isFinite(parsedLon) &&
    parsedLat >= -90 &&
    parsedLat <= 90 &&
    parsedLon >= -180 &&
    parsedLon <= 180;

  const handleStartBlank = () => {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    setDraft(createFreshBlankDraft());
    setHasSavedDraftBanner(false);
    setStepError('');
  };

  const handlePlaceSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    setGeoStatus('');
    try {
      const list = await searchPlacesDetailed(searchQuery);
      setSearchResults(list);
      if (list.length === 0) setGeoStatus('No matching places found.');
    } catch (err) {
      setGeoStatus(err instanceof Error ? err.message : 'Location search failed.');
    } finally {
      setSearching(false);
    }
  };

  const handleBrowserGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Browser geolocation is unavailable in this environment. Use search or coordinates.');
      return;
    }
    setGeoStatus('Requesting device location permission…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lon = Number(pos.coords.longitude.toFixed(5));
        setDraft((d) => ({
          ...d,
          latStr: String(lat),
          lonStr: String(lon),
          locationLabel: d.locationLabel || `${lat.toFixed(3)}°, ${lon.toFixed(3)}°`,
        }));
        setGeoStatus(`Located (${lat.toFixed(4)}°, ${lon.toFixed(4)}°).`);
      },
      (err) => {
        setGeoStatus(`Location permission denied or unavailable (${err.message}). Enter coordinates or search above.`);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const handleGenerateStarterRect = () => {
    if (!hasCoords) {
      setStepError('Enter or select farm coordinates in Step 2 first.');
      return;
    }
    const decl = Number(draft.declaredAreaStr);
    const targetHa = Number.isFinite(decl) && decl > 0
      ? draft.areaUnit === 'acres'
        ? decl / 2.4710538
        : decl
      : 25;
    const starter = buildStarterRectanglePolygon(parsedLat, parsedLon, targetHa);
    setDraft((d) => ({
      ...d,
      boundaryMode: 'starter',
      geometry: { type: 'Polygon', coordinates: starter.coordinates },
      mappedAreaHa: starter.areaHa,
    }));
    setStepError('');
  };

  const handleParseGeoJson = () => {
    setImportError('');
    try {
      const raw = JSON.parse(geoJsonText) as Record<string, unknown>;
      let coords: unknown = null;
      if (raw.type === 'FeatureCollection' && Array.isArray(raw.features) && raw.features[0]) {
        coords = (raw.features[0] as { geometry?: { coordinates?: unknown } }).geometry?.coordinates;
      } else if (raw.type === 'Feature') {
        coords = (raw.geometry as { coordinates?: unknown })?.coordinates;
      } else if (raw.type === 'Polygon') {
        coords = raw.coordinates;
      }
      if (!Array.isArray(coords) || !Array.isArray(coords[0]) || coords[0].length < 3) {
        setImportError('Paste a valid GeoJSON Polygon, Feature, or FeatureCollection.');
        return;
      }
      const geom: GeoJsonPolygonGeometry = {
        type: 'Polygon',
        coordinates: coords as [number, number][][],
      };
      setDraft((d) => ({
        ...d,
        boundaryMode: 'import',
        geometry: geom,
      }));
    } catch {
      setImportError('Invalid JSON syntax.');
    }
  };

  const validateAndNext = () => {
    setStepError('');
    if (draft.step === 1) {
      const trimmed = draft.name.trim();
      if (!trimmed) {
        setStepError('Enter a unique name for this farm.');
        return;
      }
      if (existingNames.some((n) => n.trim().toLowerCase() === trimmed.toLowerCase())) {
        setStepError(`A farm named "${trimmed}" already exists.`);
        return;
      }
    }
    if (draft.step === 2 && (draft.latStr.trim() || draft.lonStr.trim()) && !hasCoords) {
      setStepError('Latitude must be -90..90 and Longitude must be -180..180.');
      return;
    }
    setDraft((d) => ({ ...d, step: Math.min(5, d.step + 1) }));
  };

  const handleSubmit = async (saveAsDraft: boolean) => {
    if (!draft.name.trim()) {
      setStepError('Farm name is required.');
      return;
    }
    setSubmitting(true);
    setStepError('');
    try {
      const declNum = Number(draft.declaredAreaStr);
      const declaredHa =
        draft.declaredAreaStr.trim() && Number.isFinite(declNum) && declNum > 0
          ? Number((draft.areaUnit === 'acres' ? declNum / 2.4710538 : declNum).toFixed(2))
          : null;

      await onComplete({
        name: draft.name.trim(),
        primaryCrop: draft.primaryCrop.trim() || null,
        locationLabel:
          draft.locationLabel.trim() ||
          draft.regionLabel.trim() ||
          (hasCoords ? `${parsedLat.toFixed(3)}°, ${parsedLon.toFixed(3)}°` : 'Location pending'),
        regionLabel: draft.regionLabel.trim() || draft.locationLabel.trim() || 'Unspecified',
        country: draft.country.trim() || 'Unspecified',
        timezone: draft.timezone.trim() || 'UTC',
        centroid: hasCoords ? { lat: parsedLat, lon: parsedLon } : null,
        geometry: draft.boundaryMode === 'skip' ? null : draft.geometry,
        declaredAreaHa: declaredHa,
        areaUnit: draft.areaUnit,
        isDraft: saveAsDraft,
        notes: draft.notes.trim(),
        initialFieldName: draft.geometry ? draft.initialFieldName.trim() || 'Main Block' : undefined,
        soil: {
          texture: draft.soilTexture,
          moistureStatus: draft.soilMoistureKnown && draft.soilMoistureStr ? 'measured' : 'unknown',
          moisturePct: draft.soilMoistureKnown && draft.soilMoistureStr ? Number(draft.soilMoistureStr) : null,
          phStatus: draft.soilPhTested && draft.soilPhStr ? 'tested' : 'not_tested',
          phValue: draft.soilPhTested && draft.soilPhStr ? Number(draft.soilPhStr) : null,
          drainage: draft.drainage,
        },
        water: {
          sources: [draft.waterSource],
          reliability: draft.waterReliability,
        },
      });
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraft(createFreshBlankDraft());
      onClose();
    } catch (err) {
      setStepError(err instanceof Error ? err.message : 'Unable to save farm.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[92vh] rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] flex flex-col overflow-hidden shadow-2xl"
        role="dialog"
        aria-labelledby="add-farm-wizard-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
          <div>
            <h2 id="add-farm-wizard-title" className="text-base font-bold text-[var(--text-primary)]">
              Add New Farm (Step {draft.step} of 5)
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Starts blank — unknown soil or boundary items remain clearly unassessed until provided.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasSavedDraftBanner && (
              <button
                type="button"
                onClick={handleStartBlank}
                className="px-2.5 py-1 rounded-md border border-[var(--border)] text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Discard draft &amp; start blank
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close wizard"
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Track */}
        <div className="px-5 py-2.5 border-b border-[var(--border)] bg-[var(--bg-elevated)]/40 flex items-center gap-2 text-xs overflow-x-auto">
          {['1. Identity', '2. Location', '3. Boundary', '4. Agronomy', '5. Review'].map((label, i) => {
            const num = i + 1;
            const active = draft.step === num;
            const done = draft.step > num;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (num < draft.step) setDraft((d) => ({ ...d, step: num }));
                }}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium ${
                  active
                    ? 'bg-[var(--accent)] text-white'
                    : done
                      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 cursor-pointer'
                      : 'text-[var(--text-secondary)]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 fs-thin-scroll text-sm">
          {draft.step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Farm name *
                  </label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="e.g., Alder Creek Block"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Primary crop (optional)
                  </label>
                  <input
                    type="text"
                    value={draft.primaryCrop}
                    onChange={(e) => setDraft((d) => ({ ...d, primaryCrop: e.target.value }))}
                    placeholder="e.g., Winter Wheat, Maize, or leave blank"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Region / County label
                  </label>
                  <input
                    type="text"
                    value={draft.regionLabel}
                    onChange={(e) => setDraft((d) => ({ ...d, regionLabel: e.target.value }))}
                    placeholder="e.g., Willamette Valley, OR"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={draft.timezone}
                    onChange={(e) => setDraft((d) => ({ ...d, timezone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
                <Lock className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Private by default:</strong> Farm names, field polygons, soil logs, and reports stay isolated inside your workspace and never publish to community discovery unless explicitly opted in later.
                </span>
              </div>
            </div>
          )}

          {draft.step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[200px] flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handlePlaceSearch();
                      }
                    }}
                    placeholder="Search city, valley, or address…"
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-sm text-[var(--text-primary)]"
                  />
                  <button
                    type="button"
                    onClick={handlePlaceSearch}
                    disabled={searching}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    {searching ? 'Searching…' : 'Search'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleBrowserGeolocation}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Use Device GPS
                </button>
              </div>

              {geoStatus && <p className="text-xs text-[var(--text-secondary)]">{geoStatus}</p>}

              {searchResults.length > 0 && (
                <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)] max-h-36 overflow-y-auto fs-thin-scroll text-xs">
                  {searchResults.map((res, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDraft((d) => ({
                          ...d,
                          latStr: res.lat.toFixed(5),
                          lonStr: res.lon.toFixed(5),
                          locationLabel: res.displayName.split(',').slice(0, 2).join(', ').trim(),
                          regionLabel: d.regionLabel || res.displayName.split(',').slice(1, 3).join(', ').trim(),
                          country: res.country || d.country,
                        }));
                        setSearchResults([]);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[var(--bg-elevated)] flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="truncate text-[var(--text-primary)]">{res.displayName}</span>
                      <span className="tabular-nums text-[var(--text-secondary)] shrink-0">
                        {res.lat.toFixed(2)}°, {res.lon.toFixed(2)}°
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Latitude (°)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={draft.latStr}
                    onChange={(e) => setDraft((d) => ({ ...d, latStr: e.target.value }))}
                    placeholder="e.g., 44.855"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] tabular-nums text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Longitude (°)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={draft.lonStr}
                    onChange={(e) => setDraft((d) => ({ ...d, lonStr: e.target.value }))}
                    placeholder="e.g., -123.150"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] tabular-nums text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Location label
                  </label>
                  <input
                    type="text"
                    value={draft.locationLabel}
                    onChange={(e) => setDraft((d) => ({ ...d, locationLabel: e.target.value }))}
                    placeholder="City / Locality"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <FieldBoundaryEditorMap
                center={hasCoords ? { lat: parsedLat, lon: parsedLon } : { lat: 44.855, lon: -123.15 }}
                farmGeometry={null}
                fields={[]}
                initialMode="pick_point"
                heightClassName="h-[240px]"
                onPickPoint={(lat, lon) => {
                  setDraft((d) => ({
                    ...d,
                    latStr: lat.toFixed(5),
                    lonStr: lon.toFixed(5),
                    locationLabel: d.locationLabel || `${lat.toFixed(3)}°, ${lon.toFixed(3)}°`,
                  }));
                }}
              />
            </div>
          )}

          {draft.step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'draw', label: 'Draw polygon' },
                  { id: 'starter', label: 'Quick parcel box' },
                  { id: 'import', label: 'Paste GeoJSON' },
                  { id: 'skip', label: 'Skip / Add later' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({ ...d, boundaryMode: opt.id as WizardDraftState['boundaryMode'] }))
                    }
                    className={`py-2 px-3 rounded-lg border font-semibold cursor-pointer ${
                      draft.boundaryMode === opt.id
                        ? 'border-[var(--accent)] bg-[var(--accent)]/12 text-[var(--text-primary)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {draft.boundaryMode === 'draw' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                        First field name
                      </label>
                      <input
                        type="text"
                        value={draft.initialFieldName}
                        onChange={(e) => setDraft((d) => ({ ...d, initialFieldName: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-xs text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                  <FieldBoundaryEditorMap
                    center={hasCoords ? { lat: parsedLat, lon: parsedLon } : { lat: 44.855, lon: -123.15 }}
                    farmGeometry={draft.geometry}
                    fields={[]}
                    areaUnit={draft.areaUnit}
                    initialMode="draw"
                    heightClassName="h-[270px]"
                    onSavePolygon={({ geometry, areaHa, centroid }) => {
                      setDraft((d) => ({
                        ...d,
                        geometry,
                        mappedAreaHa: areaHa,
                        latStr: d.latStr || String(centroid.lat),
                        lonStr: d.lonStr || String(centroid.lon),
                      }));
                    }}
                  />
                </div>
              )}

              {draft.boundaryMode === 'starter' && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-4 space-y-3 text-xs">
                  <p className="text-[var(--text-secondary)]">
                    Generates a starter polygon around your Step 2 coordinate using your approximate area so you can refine exact vertices later.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateStarterRect}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent)] text-white font-semibold cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Parcel Boundary
                  </button>
                  {draft.geometry && (
                    <div className="text-emerald-700 dark:text-emerald-300 font-medium tabular-nums">
                      Starter polygon ready ({formatArea(draft.mappedAreaHa, draft.areaUnit)} measured geodesic).
                    </div>
                  )}
                </div>
              )}

              {draft.boundaryMode === 'import' && (
                <div className="space-y-2 text-xs">
                  <label className="block font-medium text-[var(--text-secondary)]">
                    Paste WGS84 GeoJSON Polygon or FeatureCollection:
                  </label>
                  <textarea
                    rows={4}
                    value={geoJsonText}
                    onChange={(e) => setGeoJsonText(e.target.value)}
                    placeholder='{"type":"Polygon","coordinates":[[[-123.15,44.86],[-123.14,44.86],[-123.14,44.85],[-123.15,44.85],[-123.15,44.86]]]}'
                    className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] font-mono text-[11px] text-[var(--text-primary)]"
                  />
                  <button
                    type="button"
                    onClick={handleParseGeoJson}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] font-semibold cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Validate &amp; Attach GeoJSON
                  </button>
                  {importError && <p className="text-rose-600 dark:text-rose-400">{importError}</p>}
                  {draft.geometry && !importError && (
                    <p className="text-emerald-700 dark:text-emerald-300 font-medium">GeoJSON boundary attached.</p>
                  )}
                </div>
              )}

              {draft.boundaryMode === 'skip' && (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-xs text-[var(--text-secondary)]">
                  Boundary skipped — farm will register as an unmapped record until fields are added in <strong>Fields &amp; Map</strong>.
                </div>
              )}
            </div>
          )}

          {draft.step === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Declared whole-farm area
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={draft.declaredAreaStr}
                    onChange={(e) => setDraft((d) => ({ ...d, declaredAreaStr: e.target.value }))}
                    placeholder="Optional"
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-sm text-[var(--text-primary)] tabular-nums"
                  />
                  <select
                    value={draft.areaUnit}
                    onChange={(e) => setDraft((d) => ({ ...d, areaUnit: e.target.value as AreaUnit }))}
                    className="px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)]"
                  >
                    <option value="hectares">hectares</option>
                    <option value="acres">acres</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Soil texture
                </label>
                <select
                  value={draft.soilTexture}
                  onChange={(e) => setDraft((d) => ({ ...d, soilTexture: e.target.value as SoilTexture }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-sm text-[var(--text-primary)]"
                >
                  {['Unknown', 'Sandy', 'Loamy sand', 'Sandy loam', 'Loam', 'Silt loam', 'Clay loam', 'Clay'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/35 space-y-2">
                <label className="flex items-center gap-2 font-medium text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.soilMoistureKnown}
                    onChange={(e) => setDraft((d) => ({ ...d, soilMoistureKnown: e.target.checked }))}
                  />
                  Measured soil moisture known (%)
                </label>
                {draft.soilMoistureKnown ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={draft.soilMoistureStr}
                    onChange={(e) => setDraft((d) => ({ ...d, soilMoistureStr: e.target.value }))}
                    placeholder="e.g., 26"
                    className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)] tabular-nums"
                  />
                ) : (
                  <div className="text-[11px] text-[var(--text-secondary)]">Recorded transparently as Unknown.</div>
                )}
              </div>

              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/35 space-y-2">
                <label className="flex items-center gap-2 font-medium text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.soilPhTested}
                    onChange={(e) => setDraft((d) => ({ ...d, soilPhTested: e.target.checked }))}
                  />
                  Lab soil pH tested
                </label>
                {draft.soilPhTested ? (
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="10"
                    value={draft.soilPhStr}
                    onChange={(e) => setDraft((d) => ({ ...d, soilPhStr: e.target.value }))}
                    placeholder="e.g., 6.5"
                    className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)] tabular-nums"
                  />
                ) : (
                  <div className="text-[11px] text-[var(--text-secondary)]">Recorded transparently as Not tested.</div>
                )}
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Primary water source
                </label>
                <select
                  value={draft.waterSource}
                  onChange={(e) => setDraft((d) => ({ ...d, waterSource: e.target.value as WaterSource }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-sm text-[var(--text-primary)]"
                >
                  {['Unknown', 'Groundwater / Well', 'River / Stream', 'Reservoir', 'Canal', 'Rainwater collection', 'Recycled water', 'Other'].map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Supply reliability
                </label>
                <select
                  value={draft.waterReliability}
                  onChange={(e) => setDraft((d) => ({ ...d, waterReliability: e.target.value as WaterReliability }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-sm text-[var(--text-primary)]"
                >
                  {['Unknown', 'Always available', 'Usually available', 'Sometimes limited', 'Frequently limited', 'Highly unreliable'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {draft.step === 5 && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-4 space-y-2">
                <div className="font-bold text-sm text-[var(--text-primary)]">{draft.name || 'Unnamed Farm'}</div>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[var(--text-secondary)]">
                  <div>Location: <strong className="text-[var(--text-primary)]">{draft.locationLabel || (hasCoords ? `${parsedLat.toFixed(3)}°, ${parsedLon.toFixed(3)}°` : 'Pending')}</strong></div>
                  <div>Crop: <strong className="text-[var(--text-primary)]">{draft.primaryCrop || 'Not specified'}</strong></div>
                  <div>Mapped boundary: <strong className="text-[var(--text-primary)]">{draft.geometry && draft.boundaryMode !== 'skip' ? `${draft.mappedAreaHa > 0 ? formatArea(draft.mappedAreaHa, draft.areaUnit) : 'Attached'}` : 'None (unmapped)'}</strong></div>
                  <div>Soil texture: <strong className="text-[var(--text-primary)]">{draft.soilTexture}</strong></div>
                  <div>Water source: <strong className="text-[var(--text-primary)]">{draft.waterSource}</strong></div>
                  <div>Visibility: <strong className="text-emerald-700 dark:text-emerald-300">Private workspace only</strong></div>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border)] p-3 text-[var(--text-secondary)] space-y-1">
                <div className="font-semibold text-[var(--text-primary)]">Attribution &amp; Map Limits Disclosure</div>
                <p>
                  Place search uses OpenStreetMap Nominatim (attribution © OpenStreetMap contributors); map imagery uses Esri World Imagery / OSM tiles; geodesic areas use WGS84 Chamberlain–Duquette spherical excess.
                </p>
              </div>
            </div>
          )}

          {stepError && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
              {stepError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--border)] bg-[var(--bg-elevated)]/30 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {draft.step > 1 && (
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, step: d.step - 1 }))}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <button
              type="button"
              disabled={submitting || !draft.name.trim()}
              onClick={() => handleSubmit(true)}
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-45 cursor-pointer"
            >
              Save as Draft
            </button>
          </div>

          <div className="flex items-center gap-2">
            {draft.step < 5 ? (
              <button
                type="button"
                onClick={validateAndNext}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:brightness-110 cursor-pointer"
              >
                Continue
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {submitting ? 'Creating Farm…' : 'Create Farm'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
