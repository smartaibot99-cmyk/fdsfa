import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Crosshair,
  Download,
  Edit3,
  Eye,
  History,
  Info,
  Layers,
  Loader2,
  Pin,
  Redo2,
  RotateCcw,
  Save,
  Scissors,
  ShieldCheck,
  SplitSquareHorizontal,
  Square,
  Trash2,
  Undo2,
  Users,
  X,
} from 'lucide-react';
import { FarmProfile } from '../../types';
import {
  BaseMapId,
  DiscoveryConsentSettings,
  DiscoveryMessageItem,
  GeometryEditorState,
  GeometryValidationResult,
  LayerGroupId,
  MapFieldRecord,
  MapLayerDefinition,
  MapLayerRuntimeState,
  MapPointInspectResult,
  MapWorkspaceMode,
  PublicDiscoveryProfile,
  RegionalCityAggregate,
} from '../../types/maps';
import { formatArea, formatPerimeter } from '../../lib/mapGeometry';
import {
  getAvailableObservationDates,
  getBaseMapTileSpec,
  MAP_LAYER_CATALOG,
} from '../../services/mapsApi';
import { RegionalDiscoveryPanel } from './RegionalDiscoveryPanel';

export type InspectorTab = 'overview' | 'layers' | 'inspect' | 'compare' | 'discovery';

interface RightMapInspectorProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: InspectorTab;
  onSelectTab: (tab: InspectorTab) => void;
  workspaceMode: MapWorkspaceMode;
  editorState: GeometryEditorState;
  drawingSubMode: 'exterior' | 'hole' | 'rectangle';
  onChangeDrawingSubMode: (mode: 'exterior' | 'hole' | 'rectangle') => void;
  currentFarm: FarmProfile | undefined;
  selectedField: MapFieldRecord | null;
  areaUnit: 'hectares' | 'acres';
  baseMapId: BaseMapId;
  onChangeBaseMap: (id: BaseMapId) => void;
  layersState: Record<string, MapLayerRuntimeState>;
  onToggleLayer: (id: string) => void;
  onChangeLayerOpacity: (id: string, opacity: number) => void;
  onTogglePinLayer: (id: string) => void;
  observationDate: string;
  onChangeObservationDate: (date: string) => void;
  compareBeforeDate: string;
  compareAfterDate: string;
  compareOverlayId: string;
  compareViewStyle: 'swipe' | 'split';
  onChangeCompareDates: (before: string, after: string) => void;
  onChangeCompareOverlay: (id: string) => void;
  onChangeCompareViewStyle: (style: 'swipe' | 'split') => void;
  // Draft editing controls
  draftFieldName: string;
  onChangeDraftFieldName: (name: string) => void;
  draftEditReason: string;
  onChangeDraftEditReason: (reason: string) => void;
  draftValidation: GeometryValidationResult | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onFinishDraft: () => void;
  onResetToSaved: () => void;
  onCancelDraft: () => void;
  onSaveDraft: () => Promise<void>;
  saveError: string | null;
  onStartDrawNew: () => void;
  onStartEditSelected: () => void;
  onDeleteSelectedField: () => Promise<void>;
  onExportGeoJson: () => void;
  // Point inspection
  inspectLoading: boolean;
  inspectError: string | null;
  inspectResult: MapPointInspectResult | null;
  onInspectSelectedCentroid: () => void;
  // Discovery
  discoveryRegions: RegionalCityAggregate[];
  discoveryProfiles: PublicDiscoveryProfile[];
  discoveryConsent: DiscoveryConsentSettings | null;
  discoveryMessages: DiscoveryMessageItem[];
  discoveryLoading: boolean;
  selectedCityKey: string | null;
  onSelectCity: (cityKey: string) => void;
  onSaveDiscoveryOptIn: (payload: {
    optedIn: boolean;
    displayAlias: string;
    cityName: string;
    shareCrops: boolean;
    shareSoilTexture: boolean;
    shareWaterMethod: boolean;
    acceptsMessages: boolean;
  }) => Promise<void>;
  onRevokeDiscoveryOptIn: () => Promise<void>;
  onSendDiscoveryMessage: (toPublicId: string, text: string) => Promise<void>;
  onBlockDiscoveryProfile: (publicId: string) => Promise<void>;
  // Downstream links
  onOpenFieldAnalysis: () => void;
  onOpenCropRotation: () => void;
  onOpenDataSources: () => void;
}

const LAYER_GROUPS: LayerGroupId[] = [
  'Boundaries & operations',
  'Satellite imagery',
  'Water & weather context',
  'Soil & terrain',
  'Regional discovery',
];

export const RightMapInspector: React.FC<RightMapInspectorProps> = ({
  collapsed,
  onToggleCollapse,
  activeTab,
  onSelectTab,
  workspaceMode,
  editorState,
  drawingSubMode,
  onChangeDrawingSubMode,
  currentFarm,
  selectedField,
  areaUnit,
  baseMapId,
  onChangeBaseMap,
  layersState,
  onToggleLayer,
  onChangeLayerOpacity,
  onTogglePinLayer,
  observationDate,
  onChangeObservationDate,
  compareBeforeDate,
  compareAfterDate,
  compareOverlayId,
  compareViewStyle,
  onChangeCompareDates,
  onChangeCompareOverlay,
  onChangeCompareViewStyle,
  draftFieldName,
  onChangeDraftFieldName,
  draftEditReason,
  onChangeDraftEditReason,
  draftValidation,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onFinishDraft,
  onResetToSaved,
  onCancelDraft,
  onSaveDraft,
  saveError,
  onStartDrawNew,
  onStartEditSelected,
  onDeleteSelectedField,
  onExportGeoJson,
  inspectLoading,
  inspectError,
  inspectResult,
  onInspectSelectedCentroid,
  discoveryRegions,
  discoveryProfiles,
  discoveryConsent,
  discoveryMessages,
  discoveryLoading,
  selectedCityKey,
  onSelectCity,
  onSaveDiscoveryOptIn,
  onRevokeDiscoveryOptIn,
  onSendDiscoveryMessage,
  onBlockDiscoveryProfile,
  onOpenFieldAnalysis,
  onOpenCropRotation,
  onOpenDataSources,
}) => {
  const [expandedLayerInfo, setExpandedLayerInfo] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [versionsExpanded, setVersionsExpanded] = useState(false);

  const availableDates = getAvailableObservationDates();

  if (collapsed) {
    return (
      <div className="shrink-0 flex flex-col items-center py-2.5 px-1.5 rounded-2xl border border-[#243450] bg-[#091221]/92">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Expand Map layers and inspector"
          title="Expand Map Inspector"
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-teal-500/20 text-slate-200 hover:text-teal-300 flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div
          className="mt-4 text-[11px] font-medium tracking-wider uppercase text-slate-400"
          style={{ writingMode: 'vertical-rl' }}
        >
          Map Layers &amp; Data
        </div>
      </div>
    );
  }

  const activeVersion = selectedField
    ? selectedField.versions.find((v) => v.geometryVersionId === selectedField.currentVersionId) ??
      selectedField.versions[0]
    : null;

  const isEditingMode = workspaceMode === 'edit_boundaries';

  const checkIncompatibilityReason = (def: MapLayerDefinition): string | null => {
    if (!def.incompatibleWith) return null;
    for (const conflictId of def.incompatibleWith) {
      if (layersState[conflictId]?.enabled) {
        const conflictDef = MAP_LAYER_CATALOG.find((l) => l.id === conflictId);
        return `Disable "${conflictDef?.label || conflictId}" first (mutually exclusive opaque satellite mosaics).`;
      }
    }
    return null;
  };

  return (
    <aside
      aria-label="Map layers and data inspector"
      className="w-full lg:w-[348px] xl:w-[376px] shrink-0 h-full flex flex-col rounded-2xl border border-[#243450] bg-[#0B1323]/[0.92] text-slate-100 overflow-hidden shadow-xl"
    >
      {/* Inspector Header */}
      <div className="px-4 py-3 border-b border-[#1E2C45] flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white truncate">
            {isEditingMode ? 'Boundary Geometry Editor' : 'Map layers & data'}
          </h2>
          <p className="text-[11px] text-slate-400 truncate">
            {selectedField
              ? `${selectedField.name} · ${currentFarm?.location.farmName || 'Active Farm'}`
              : currentFarm?.location.farmName || 'Select a field or layer'}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Collapse inspector"
          title="Collapse inspector"
          className="hidden lg:inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Contextual Tabs (hidden while actively locked in Boundary Edit Mode) */}
      {!isEditingMode && (
        <div className="px-2.5 pt-2 pb-1.5 border-b border-[#1E2C45] flex items-center gap-1 overflow-x-auto">
          {(
            [
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'layers', label: 'Layers', icon: Layers },
              { id: 'inspect', label: 'Inspect', icon: Crosshair },
              { id: 'compare', label: 'Compare', icon: SplitSquareHorizontal },
              { id: 'discovery', label: 'Discovery', icon: Users },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-400/40'
                    : 'text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 fs-thin-scroll">
        {/* ================================================================= */}
        {/* BOUNDARY EDIT MODE: Strictly focused geometry editor workflow      */}
        {/* ================================================================= */}
        {isEditingMode ? (
          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-400/35 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-teal-300 uppercase tracking-wider text-[10.5px]">
                  Editor State: {editorState.replace('_', ' ')}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 text-[10px] font-medium">
                  Unsaved Draft
                </span>
              </div>
              <p className="text-[11.5px] text-slate-200 leading-relaxed">
                {editorState === 'editing_vertices'
                  ? 'Drag corner handles to move vertices, click smaller teal midpoint dots to insert points, or right-click a handle to remove.'
                  : drawingSubMode === 'rectangle'
                    ? 'Click two opposite corners on the map to form a rectangular parcel boundary.'
                    : drawingSubMode === 'hole'
                      ? 'Click points inside the outer parcel to cut out buildings, ponds, or roads, then click Finish Ring.'
                      : 'Click around the outside edge of the field. Click the first point or choose Finish to close the boundary.'}
              </p>
            </div>

            {/* Required Field Name Input (Never overwritten by geocoder) */}
            <div className="space-y-1">
              <label htmlFor="fs-draft-field-name" className="block text-[11px] font-medium text-slate-300">
                Field Name (required)
              </label>
              <input
                id="fs-draft-field-name"
                type="text"
                value={draftFieldName}
                onChange={(e) => onChangeDraftFieldName(e.target.value)}
                placeholder="e.g. North Ridge Block 1"
                className="w-full px-3 py-2 rounded-xl bg-[#060D1A] border border-[#283B5E] text-xs text-white focus:border-teal-400 focus:outline-none"
              />
            </div>

            {/* Geometry Sub-Tool Selector */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-slate-300">Drawing &amp; Cutout Tools</div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onChangeDrawingSubMode('exterior')}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium inline-flex items-center justify-center gap-1 cursor-pointer ${
                    drawingSubMode === 'exterior'
                      ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                      : 'bg-white/[0.04] border-white/10 text-slate-300'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  Polygon
                </button>
                <button
                  type="button"
                  disabled={editorState === 'editing_vertices'}
                  onClick={() => onChangeDrawingSubMode('rectangle')}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 ${
                    drawingSubMode === 'rectangle'
                      ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                      : 'bg-white/[0.04] border-white/10 text-slate-300'
                  }`}
                >
                  <Square className="w-3 h-3" />
                  Rectangle
                </button>
                <button
                  type="button"
                  disabled={!draftValidation || draftValidation.vertexCount < 3}
                  onClick={() => onChangeDrawingSubMode('hole')}
                  title="Cut out ponds, roads, or buildings from net usable area"
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 ${
                    drawingSubMode === 'hole'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-white/[0.04] border-white/10 text-slate-300'
                  }`}
                >
                  <Scissors className="w-3 h-3" />
                  Exclusion
                </button>
              </div>
            </div>

            {/* Undo / Redo / Finish / Reset Bar */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={!canUndo}
                onClick={onUndo}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 text-[11px] inline-flex items-center gap-1 disabled:opacity-35 cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" /> Undo
              </button>
              <button
                type="button"
                disabled={!canRedo}
                onClick={onRedo}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 text-[11px] inline-flex items-center gap-1 disabled:opacity-35 cursor-pointer"
              >
                <Redo2 className="w-3.5 h-3.5" /> Redo
              </button>
              {editorState === 'drawing' && (
                <button
                  type="button"
                  onClick={onFinishDraft}
                  className="px-2.5 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-200 text-[11px] font-semibold cursor-pointer"
                >
                  Finish Ring
                </button>
              )}
              {selectedField && (
                <button
                  type="button"
                  onClick={onResetToSaved}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 text-[11px] inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* Live Geodesic Area / Perimeter & Validation Readout */}
            {draftValidation && (
              <div className="p-3 rounded-xl bg-[#07101F] border border-[#223452] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Estimated mapped metrics (Draft)</span>
                  <span className="font-mono">{draftValidation.vertexCount} vertices</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-white/[0.03]">
                    <div className="text-[10px] text-slate-400">Net Usable Area</div>
                    <div className="text-sm font-mono font-semibold text-white">
                      {formatArea(draftValidation.netAreaM2, areaUnit)}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.03]">
                    <div className="text-[10px] text-slate-400">Perimeter</div>
                    <div className="text-sm font-mono font-semibold text-white">
                      {formatPerimeter(draftValidation.perimeterM)}
                    </div>
                  </div>
                </div>
                {draftValidation.excludedAreaM2 > 0 && (
                  <div className="text-[11px] text-amber-200 flex items-center justify-between border-t border-white/10 pt-1.5">
                    <span>Gross: {formatArea(draftValidation.grossAreaM2, areaUnit)}</span>
                    <span>
                      Excluded ({draftValidation.holeCount}): −{formatArea(draftValidation.excludedAreaM2, areaUnit)}
                    </span>
                  </div>
                )}

                {draftValidation.issues.length > 0 ? (
                  <div className="space-y-1 pt-1">
                    {draftValidation.issues.map((iss, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border text-[11px] flex items-start gap-1.5 ${
                          iss.severity === 'error'
                            ? 'bg-rose-950/60 border-rose-400/45 text-rose-200'
                            : 'bg-amber-950/50 border-amber-400/40 text-amber-200'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{iss.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>WGS84 polygon checks passed (closed, simple, non-zero area).</span>
                  </div>
                )}
              </div>
            )}

            {/* Edit Reason & Mandatory Non-Cadastral Caveat */}
            <div className="space-y-1">
              <label htmlFor="fs-edit-reason" className="block text-[11px] text-slate-400">
                Revision Note (optional)
              </label>
              <input
                id="fs-edit-reason"
                type="text"
                value={draftEditReason}
                onChange={(e) => onChangeDraftEditReason(e.target.value)}
                placeholder="e.g. Excluded pond & north buffer strip"
                className="w-full px-3 py-1.5 rounded-lg bg-[#060D1A] border border-white/15 text-xs text-white"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-[10.5px] text-slate-400 leading-relaxed">
              Note: Drawn boundaries are user-defined planning polygons (WGS84 geodesic calculation), not independently verified cadastral/legal survey boundaries.
            </div>

            {saveError && (
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-400/50 text-xs text-rose-200">
                Save failed: {saveError}
              </div>
            )}

            {/* Save & Cancel */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onCancelDraft}
                className="px-3.5 py-2 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/10 text-xs font-medium text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  editorState === 'save_pending' ||
                  !draftFieldName.trim() ||
                  !draftValidation ||
                  !draftValidation.valid
                }
                onClick={onSaveDraft}
                className="flex-1 py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-45 cursor-pointer"
              >
                {editorState === 'save_pending' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving GeometryVersion...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Boundary</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : activeTab === 'overview' ? (
          /* ================================================================= */
          /* TAB 1: FIELD OVERVIEW                                             */
          /* ================================================================= */
          !selectedField || !activeVersion ? (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Select a field polygon on the map or in the left navigator to inspect its geometry, soil/water provenance, and climate context.
              </p>
              <button
                type="button"
                onClick={onStartDrawNew}
                className="px-3.5 py-2 rounded-xl bg-teal-500 text-slate-950 font-semibold text-xs cursor-pointer hover:bg-teal-400"
              >
                + Draw New Field Boundary
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 text-xs">
              {/* Field Identity + Edit Action */}
              <div className="p-3 rounded-xl bg-[#0E1A30] border border-[#243757] space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{selectedField.name}</h3>
                    <div className="text-[11px] text-slate-400">
                      {currentFarm?.location.farmName || 'Active Farm'} ·{' '}
                      {selectedField.cropName || 'No active crop'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onStartEditSelected}
                    className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-200 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>

                {/* Geodesic Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-black/25 border border-white/5">
                    <div className="text-[10px] text-slate-400">Net Area (Geodesic)</div>
                    <div className="font-mono font-semibold text-white mt-0.5">
                      {formatArea(activeVersion.netAreaHectares * 10000, areaUnit)}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-black/25 border border-white/5">
                    <div className="text-[10px] text-slate-400">Perimeter</div>
                    <div className="font-mono font-semibold text-white mt-0.5">
                      {formatPerimeter(activeVersion.perimeterM)}
                    </div>
                  </div>
                </div>

                <div className="text-[10.5px] text-slate-400 space-y-0.5">
                  <div>
                    Centroid:{' '}
                    <span className="font-mono text-slate-200">
                      {activeVersion.centroid.lat.toFixed(5)}°, {activeVersion.centroid.lon.toFixed(5)}°
                    </span>
                  </div>
                  <div>
                    Version:{' '}
                    <span className="font-mono text-teal-300">
                      v{activeVersion.versionNumber} ({activeVersion.crs})
                    </span>{' '}
                    · {activeVersion.source}
                  </div>
                </div>
              </div>

              {/* Stale Analysis Warning After Geometry Update */}
              {selectedField.staleCalculations.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-400/40 space-y-1.5">
                  <div className="font-semibold text-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Boundary updated — stale calculations</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-100/90">
                    {selectedField.staleCalculations.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Provenance-Tagged Agronomic Context */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Agronomic Context</span>
                  <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 text-[10px]">
                    Farmer-reported
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div>
                    <span className="text-slate-400">Soil:</span>{' '}
                    {selectedField.soilSummary || currentFarm?.soil.texture || 'Untested'}
                  </div>
                  <div>
                    <span className="text-slate-400">Water:</span>{' '}
                    {selectedField.waterSummary || currentFarm?.water.wateringMethod || 'Not specified'}
                  </div>
                </div>
              </div>

              {/* Version History Disclosure */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setVersionsExpanded((v) => !v)}
                  className="w-full px-3 py-2 flex items-center justify-between text-[11.5px] font-medium text-slate-200 hover:bg-white/5 cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-teal-300" />
                    Geometry Revisions ({selectedField.versions.length})
                  </span>
                  {versionsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {versionsExpanded && (
                  <div className="px-3 pb-2.5 space-y-1.5 border-t border-white/10 pt-2">
                    {selectedField.versions.map((ver) => (
                      <div key={ver.geometryVersionId} className="text-[10.5px] text-slate-300 flex justify-between">
                        <span>
                          v{ver.versionNumber} · {ver.editReason || ver.source}
                        </span>
                        <span className="font-mono text-slate-400">
                          {formatArea(ver.netAreaHectares * 10000, areaUnit)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deep Workflow Action Links */}
              <div className="space-y-1.5">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                  Connected Workflows
                </div>
                <button
                  type="button"
                  onClick={onInspectSelectedCentroid}
                  className="w-full px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/35 text-sky-200 font-medium flex items-center justify-between cursor-pointer"
                >
                  <span>Inspect Soil Grid &amp; DEM Slope at Field</span>
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onOpenCropRotation}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-emerald-200 font-medium flex items-center justify-between cursor-pointer"
                >
                  <span>Plan Crop Rotations (Smart Farm)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onOpenFieldAnalysis}
                  className="w-full px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold flex items-center justify-between cursor-pointer"
                >
                  <span>Run Deep Analysis at Field Centroid</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onOpenDataSources}
                  className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-slate-300 text-[11px] flex items-center justify-between cursor-pointer"
                >
                  <span>View NASA &amp; Meteorological Data Provenance</span>
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Export & Delete */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onExportGeoJson}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-200 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-teal-300" /> Export GeoJSON
                </button>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-rose-300 hover:bg-rose-500/15 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Field
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={async () => {
                        setDeleting(true);
                        try {
                          await onDeleteSelectedField();
                          setConfirmDelete(false);
                        } finally {
                          setDeleting(false);
                        }
                      }}
                      className="px-2 py-1 rounded bg-rose-500 text-white text-[10.5px] font-semibold cursor-pointer"
                    >
                      {deleting ? 'Deleting...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 rounded bg-white/10 text-[10.5px] cursor-pointer"
                    >
                      Keep
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        ) : activeTab === 'layers' ? (
          /* ================================================================= */
          /* TAB 2: GROUPED REAL LAYERS, TEMPORAL DATE & PROVENANCE            */
          /* ================================================================= */
          <div className="space-y-4 text-xs">
            {/* Base Map Selection */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Base Map (Natural Color — Unfiltered)
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['satellite', 'street', 'terrain', 'neutral'] as BaseMapId[]).map((bid) => (
                  <button
                    key={bid}
                    type="button"
                    onClick={() => onChangeBaseMap(bid)}
                    className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-medium capitalize cursor-pointer ${
                      baseMapId === bid
                        ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                        : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07]'
                    }`}
                  >
                    {bid === 'satellite' ? 'True-Color Satellite' : bid}
                  </button>
                ))}
              </div>
              <p className="text-[10.5px] text-slate-400">{getBaseMapTileSpec(baseMapId).note}</p>
            </div>

            {/* Canonical Observation Period Picker */}
            <div className="p-2.5 rounded-xl bg-[#0E1A30] border border-[#243757] space-y-1.5">
              <label htmlFor="fs-obs-date" className="block text-[11px] font-semibold text-teal-300">
                Canonical Observation Period (GIBS &amp; Inspect)
              </label>
              <select
                id="fs-obs-date"
                value={observationDate}
                onChange={(e) => onChangeObservationDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#060D1A] border border-white/15 text-xs text-white cursor-pointer"
              >
                {availableDates.map((d) => (
                  <option key={d.date} value={d.date}>
                    {d.label} — {d.note}
                  </option>
                ))}
              </select>
            </div>

            {/* Grouped Implemented Overlay Layers */}
            {LAYER_GROUPS.map((group) => {
              const items = MAP_LAYER_CATALOG.filter((l) => l.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group} className="space-y-1.5">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                    {group}
                  </div>
                  <div className="space-y-2">
                    {items.map((def) => {
                      const st = layersState[def.id];
                      const enabled = st?.enabled ?? false;
                      const opacity = st?.opacity ?? 0.8;
                      const conflictReason = checkIncompatibilityReason(def);
                      const infoOpen = expandedLayerInfo === def.id;

                      return (
                        <div
                          key={def.id}
                          className={`p-2.5 rounded-xl border transition-colors space-y-2 ${
                            enabled
                              ? 'bg-[#0F1E36] border-teal-400/45'
                              : 'bg-white/[0.03] border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium text-white text-xs">{def.label}</div>
                              <div className="text-[10.5px] text-slate-400 truncate">
                                {def.sourceProvider} · {def.resolutionLabel}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => onTogglePinLayer(def.id)}
                                title={st?.pinned ? 'Unpin favourite layer' : 'Pin layer'}
                                className={`p-1 rounded cursor-pointer ${
                                  st?.pinned ? 'text-amber-300' : 'text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpandedLayerInfo(infoOpen ? null : def.id)}
                                title="Inspect source metadata & caveats"
                                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="checkbox"
                                checked={enabled}
                                disabled={Boolean(conflictReason && !enabled)}
                                onChange={() => onToggleLayer(def.id)}
                                aria-label={`Toggle ${def.label}`}
                                className="w-4 h-4 accent-teal-400 cursor-pointer disabled:opacity-35"
                              />
                            </div>
                          </div>

                          {/* Status Pill & Conflict Warning */}
                          <div className="flex items-center justify-between text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded font-medium ${
                                st?.status === 'Unavailable'
                                  ? 'bg-rose-500/20 text-rose-200'
                                  : st?.status === 'Loading'
                                    ? 'bg-sky-500/20 text-sky-200'
                                    : 'bg-emerald-500/15 text-emerald-300'
                              }`}
                            >
                              {st?.status || 'Available'}
                              {def.supportsTemporalDate ? ` · ${observationDate}` : ''}
                            </span>
                            {enabled && def.supportsOpacity && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">{Math.round(opacity * 100)}%</span>
                                <input
                                  type="range"
                                  min={15}
                                  max={100}
                                  value={Math.round(opacity * 100)}
                                  onChange={(e) =>
                                    onChangeLayerOpacity(def.id, Number(e.target.value) / 100)
                                  }
                                  aria-label={`${def.label} opacity`}
                                  className="w-20 accent-teal-400 cursor-pointer"
                                />
                              </div>
                            )}
                          </div>

                          {conflictReason && !enabled && (
                            <div className="text-[10.5px] text-amber-300">{conflictReason}</div>
                          )}
                          {st?.statusReason && (
                            <div className="text-[10.5px] text-rose-200">{st.statusReason}</div>
                          )}

                          {infoOpen && (
                            <div className="pt-1.5 border-t border-white/10 text-[10.5px] text-slate-300 space-y-1">
                              <div><strong>Product:</strong> {def.productName}</div>
                              <div><strong>Units:</strong> {def.units} ({def.rangeLabel})</div>
                              <div><strong>Method:</strong> {def.processingMethod}</div>
                              <div className="text-amber-200/90"><strong>Limitation:</strong> {def.qualityCaveat}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeTab === 'inspect' ? (
          /* ================================================================= */
          /* TAB 3: INSPECT POINT / PARCEL EVIDENCE                            */
          /* ================================================================= */
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-400/30 space-y-1">
              <div className="font-semibold text-sky-200 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" />
                Click Any Location on the Map
              </div>
              <p className="text-[11px] text-slate-300">
                Samples real Open-Meteo weather/soil moisture grid (~11 km) &amp; SRTM 90m elevation/slope for <strong>{observationDate}</strong>.
              </p>
            </div>

            {inspectLoading && (
              <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2.5 text-slate-200">
                <Loader2 className="w-4 h-4 animate-spin text-teal-300" />
                <span>Querying real DEM slope &amp; weather/soil telemetry...</span>
              </div>
            )}

            {inspectError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-400/40 text-rose-200">
                {inspectError}
              </div>
            )}

            {inspectResult && !inspectLoading && (
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-[#0E1A30] border border-[#243757] text-[11px] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">
                      {inspectResult.inspectedFieldName || 'Point Coordinate Sample'}
                    </div>
                    <div className="font-mono text-slate-400">
                      {inspectResult.lat.toFixed(5)}°, {inspectResult.lon.toFixed(5)}°
                    </div>
                  </div>
                  <span className="font-mono text-teal-300">{inspectResult.observationDate}</span>
                </div>

                {inspectResult.datasets.map((ds) => (
                  <div
                    key={ds.layerId}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-white">{ds.title}</div>
                        <div className="text-[10.5px] text-slate-400">
                          {ds.provider} · {ds.spatialResolution}
                        </div>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                          ds.provenance === 'Unavailable'
                            ? 'bg-rose-500/20 text-rose-200'
                            : ds.provenance === 'Observed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-sky-500/20 text-sky-200'
                        }`}
                      >
                        {ds.provenance}
                      </span>
                    </div>

                    {ds.resolutionWarning && (
                      <div className="p-2 rounded-lg bg-amber-950/45 border border-amber-400/35 text-[10.5px] text-amber-200">
                        Resolution Caveat: {ds.resolutionWarning}
                      </div>
                    )}

                    {ds.metrics.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5">
                        {ds.metrics.map((m) => (
                          <div key={m.label} className="p-2 rounded-lg bg-black/25">
                            <div className="text-[10px] text-slate-400">{m.label}</div>
                            <div className="font-mono font-semibold text-white mt-0.5">
                              {m.value} <span className="text-[10px] text-slate-400">{m.unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-[10.5px] text-slate-400">{ds.qualityNote}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'compare' ? (
          /* ================================================================= */
          /* TAB 4: HISTORICAL IMAGERY COMPARISON                              */
          /* ================================================================= */
          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-[#0E1A30] border border-[#243757] space-y-2">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <SplitSquareHorizontal className="w-4 h-4 text-teal-300" />
                Synchronised Multi-Date Comparison
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Both map panes share identical geometry outlines, projection (EPSG:3857 / WGS84 bounds), and synced pan/zoom.
              </p>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onChangeCompareViewStyle('swipe')}
                  className={`py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer ${
                    compareViewStyle === 'swipe'
                      ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                      : 'bg-white/[0.04] border-white/10 text-slate-300'
                  }`}
                >
                  Swipe Divider
                </button>
                <button
                  type="button"
                  onClick={() => onChangeCompareViewStyle('split')}
                  className={`py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer ${
                    compareViewStyle === 'split'
                      ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                      : 'bg-white/[0.04] border-white/10 text-slate-300'
                  }`}
                >
                  Side-by-Side Split
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Comparable Satellite Product</label>
                <select
                  value={compareOverlayId}
                  onChange={(e) => onChangeCompareOverlay(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#060D1A] border border-white/15 text-xs text-white cursor-pointer"
                >
                  <option value="gibs_modis_true_color">NASA Terra MODIS True Color (250 m)</option>
                  <option value="gibs_viirs_true_color">NASA Suomi NPP VIIRS True Color (375 m)</option>
                  <option value="gibs_imerg_precip">NASA GPM IMERG Precipitation Rate</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Before Capture Date</label>
                  <select
                    value={compareBeforeDate}
                    onChange={(e) => onChangeCompareDates(e.target.value, compareAfterDate)}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#060D1A] border border-white/15 text-xs text-white cursor-pointer"
                  >
                    {availableDates.map((d) => (
                      <option key={d.date} value={d.date}>
                        {d.date}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">After Capture Date</label>
                  <select
                    value={compareAfterDate}
                    onChange={(e) => onChangeCompareDates(compareBeforeDate, e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#060D1A] border border-white/15 text-xs text-white cursor-pointer"
                  >
                    {availableDates.map((d) => (
                      <option key={d.date} value={d.date}>
                        {d.date}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {compareBeforeDate === compareAfterDate && (
              <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-400/40 text-[11px] text-amber-200">
                Select two different capture dates to compare temporal change.
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] text-slate-300 space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                Scientific Integrity Caveat
              </div>
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                NASA GIBS MODIS/VIIRS true-color mosaics resolve regional landscape features (250–375 m pixels). Cloud cover or illumination differences do not imply synthetic spectral change; no fabricated difference rasters are generated.
              </p>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* TAB 5: REGIONAL DISCOVERY (PRIVACY-FILTERED CITY COHORTS)         */
          /* ================================================================= */
          <RegionalDiscoveryPanel
            currentFarm={currentFarm}
            regions={discoveryRegions}
            profiles={discoveryProfiles}
            myConsent={discoveryConsent}
            messages={discoveryMessages}
            selectedCityKey={selectedCityKey}
            loading={discoveryLoading}
            onSelectCity={onSelectCity}
            onSaveOptIn={onSaveDiscoveryOptIn}
            onRevokeOptIn={onRevokeDiscoveryOptIn}
            onSendMessage={onSendDiscoveryMessage}
            onBlockProfile={onBlockDiscoveryProfile}
          />
        )}
      </div>
    </aside>
  );
};
