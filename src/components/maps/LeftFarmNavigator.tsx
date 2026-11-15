import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  MapPin,
  Plus,
  Search,
  Sprout,
  Upload,
} from 'lucide-react';
import { FarmProfile, PlaceSelection } from '../../types';
import { MapFieldRecord } from '../../types/maps';
import { formatArea } from '../../lib/mapGeometry';

interface LeftFarmNavigatorProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  farms: FarmProfile[];
  fields: MapFieldRecord[];
  selectedFarmId: string;
  selectedFieldId: string | null;
  areaUnit: 'hectares' | 'acres';
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  geocodeResults: PlaceSelection[];
  searchingGeocode: boolean;
  geocodeError: string | null;
  onSelectGeocodePlace: (place: PlaceSelection) => void;
  onSelectFarm: (farmId: string) => void;
  onSelectField: (fieldId: string) => void;
  onStartAddField: () => void;
  onOpenImportModal: () => void;
  onOpenManualCoords: () => void;
}

export const LeftFarmNavigator: React.FC<LeftFarmNavigatorProps> = ({
  collapsed,
  onToggleCollapse,
  farms,
  fields,
  selectedFarmId,
  selectedFieldId,
  areaUnit,
  searchQuery,
  onSearchQueryChange,
  geocodeResults,
  searchingGeocode,
  geocodeError,
  onSelectGeocodePlace,
  onSelectFarm,
  onSelectField,
  onStartAddField,
  onOpenImportModal,
  onOpenManualCoords,
}) => {
  const [expandedFarms, setExpandedFarms] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    farms.forEach((f) => {
      init[f.id] = true;
    });
    return init;
  });

  const matchingSavedFields = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return fields;
    return fields.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.cropName && f.cropName.toLowerCase().includes(q)) ||
        f.status.toLowerCase().includes(q)
    );
  }, [fields, searchQuery]);

  if (collapsed) {
    return (
      <div className="shrink-0 flex flex-col items-center py-2.5 px-1.5 rounded-2xl border border-[#243450] bg-[#091221]/90 backdrop-blur-[14px]">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Expand Farms and Fields navigator"
          title="Expand Farms & Fields"
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-teal-500/20 text-slate-200 hover:text-teal-300 flex items-center justify-center cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div
          className="mt-4 text-[11px] font-medium tracking-wider uppercase text-slate-400"
          style={{ writingMode: 'vertical-rl' }}
        >
          Farms &amp; Fields ({fields.length})
        </div>
      </div>
    );
  }

  return (
    <aside
      aria-label="Farms and fields navigator"
      className="w-full lg:w-[276px] xl:w-[290px] shrink-0 h-full flex flex-col rounded-2xl border border-[#243450] bg-[#0A1324]/[0.88] backdrop-blur-[14px] text-slate-100 overflow-hidden shadow-xl"
    >
      {/* Rail Header */}
      <div className="px-3.5 py-3 border-b border-[#1E2C45] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-4 h-4 text-teal-400 shrink-0" />
          <h2 className="text-sm font-semibold tracking-tight text-white truncate">
            Farms &amp; fields
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onStartAddField}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/35 hover:bg-teal-500/30 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add field</span>
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse Farms and Fields navigator"
            title="Collapse panel"
            className="hidden lg:inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Saved Fields OR Geocode Place */}
      <div className="p-3 border-b border-[#1E2C45] space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Filter fields or search place..."
            aria-label="Filter saved fields or search places"
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[#060D1A] border border-[#253652] text-slate-100 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
          />
          {searchingGeocode && (
            <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Utility row: Import & Manual Coords */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenImportModal}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-slate-200 cursor-pointer"
          >
            <Upload className="w-3 h-3 text-teal-300" />
            <span>Import GeoJSON/KML</span>
          </button>
          <button
            type="button"
            onClick={onOpenManualCoords}
            className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-slate-200 cursor-pointer"
            title="Jump to manual latitude & longitude"
          >
            <MapPin className="w-3 h-3 text-sky-300" />
            <span>Coords</span>
          </button>
        </div>

        {/* Differentiated Geocoder Place Suggestions (moves map only, never renames farm) */}
        {searchQuery.trim().length >= 2 && (geocodeResults.length > 0 || geocodeError) && (
          <div className="pt-1 space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
              Place Search Results (Moves Map Only)
            </div>
            {geocodeError ? (
              <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-500/30 text-[11px] text-amber-200">
                {geocodeError} Use manual Coordinates entry above.
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1 pr-0.5 fs-thin-scroll">
                {geocodeResults.map((place, i) => (
                  <button
                    key={`${place.lat}-${place.lon}-${i}`}
                    type="button"
                    onClick={() => onSelectGeocodePlace(place)}
                    className="w-full text-left px-2 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/20 text-[11px] text-slate-100 cursor-pointer"
                  >
                    <div className="font-medium truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-300 shrink-0" />
                      <span className="truncate">{place.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate pl-4">{place.displayName}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Farms & Child Fields Tree */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 fs-thin-scroll">
        {farms.length === 0 ? (
          <div className="p-4 text-center space-y-2 rounded-xl border border-dashed border-white/15">
            <p className="text-xs text-slate-300">No farm profile configured yet.</p>
            <button
              type="button"
              onClick={onStartAddField}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500 text-slate-950 cursor-pointer"
            >
              Add a farm boundary
            </button>
          </div>
        ) : (
          farms.map((farm) => {
            const farmFields = matchingSavedFields.filter((f) => f.farmId === farm.id);
            const allFarmFields = fields.filter((f) => f.farmId === farm.id);
            const isExpanded = expandedFarms[farm.id] ?? true;
            const isCurrentFarm = farm.id === selectedFarmId;

            const totalM2 = allFarmFields.reduce((sum, f) => {
              const ver =
                f.versions.find((v) => v.geometryVersionId === f.currentVersionId) ?? f.versions[0];
              return sum + (ver ? ver.netAreaHectares * 10000 : 0);
            }, 0);

            return (
              <div
                key={farm.id}
                className={`rounded-xl border transition-colors ${
                  isCurrentFarm
                    ? 'border-teal-400/40 bg-[#0E1B31]/90'
                    : 'border-[#1E2C45] bg-[#0B1527]/70'
                }`}
              >
                <div className="flex items-center gap-1.5 px-2.5 py-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedFarms((prev) => ({ ...prev, [farm.id]: !isExpanded }))
                    }
                    aria-label={isExpanded ? 'Collapse farm fields' : 'Expand farm fields'}
                    className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectFarm(farm.id)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-semibold text-white truncate">
                        {farm.location.farmName || 'Unnamed Farm'}
                      </span>
                      <span className="text-[10px] font-mono text-teal-300 shrink-0">
                        {totalM2 > 0 ? formatArea(totalM2, areaUnit) : 'No boundaries'}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-slate-400 truncate">
                      {farm.location.locationLabel || 'Location pending'} · {allFarmFields.length}{' '}
                      {allFarmFields.length === 1 ? 'field' : 'fields'}
                    </div>
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-2 pb-2 space-y-1">
                    {farmFields.length === 0 ? (
                      <div className="px-2 py-2 rounded-lg bg-black/20 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>{searchQuery ? 'No matching fields' : 'No drawn boundaries'}</span>
                        {!searchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectFarm(farm.id);
                              onStartAddField();
                            }}
                            className="text-teal-300 hover:underline font-medium cursor-pointer"
                          >
                            Draw
                          </button>
                        )}
                      </div>
                    ) : (
                      farmFields.map((field) => {
                        const ver =
                          field.versions.find((v) => v.geometryVersionId === field.currentVersionId) ??
                          field.versions[0];
                        const isSel = field.id === selectedFieldId;
                        const areaTxt = ver ? formatArea(ver.netAreaHectares * 10000, areaUnit) : '—';
                        return (
                          <button
                            key={field.id}
                            type="button"
                            onClick={() => onSelectField(field.id)}
                            className={`w-full text-left px-2.5 py-2 rounded-lg border transition-colors cursor-pointer ${
                              isSel
                                ? 'bg-teal-500/15 border-teal-400/60 text-white'
                                : 'bg-white/[0.02] hover:bg-white/[0.06] border-transparent text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium truncate">{field.name}</span>
                              <span className="text-[10.5px] font-mono text-slate-300 shrink-0">
                                {areaTxt}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-0.5 text-[10.5px]">
                              <span className="inline-flex items-center gap-1 text-slate-400 truncate">
                                <Sprout className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="truncate">{field.cropName || 'No active crop'}</span>
                              </span>
                              <span
                                className={`shrink-0 px-1.5 py-0.2 rounded text-[9.5px] font-medium ${
                                  field.status === 'Active'
                                    ? 'bg-emerald-500/15 text-emerald-300'
                                    : field.status === 'Needs Review'
                                      ? 'bg-amber-500/15 text-amber-300'
                                      : 'bg-slate-500/20 text-slate-300'
                                }`}
                              >
                                {field.status}
                              </span>
                            </div>
                            {field.staleCalculations.length > 0 && (
                              <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-300">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>Analysis refresh pending</span>
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
