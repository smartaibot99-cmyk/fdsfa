import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { AlertTriangle, RotateCw, Sprout } from 'lucide-react';
import { BaseMapId, FarmGeoJsonGeometry, FarmMapRecord, LonLat } from '../types/maps';
import { createWorkspaceFarm, fetchWorkspaceFarms } from '../services/mapsApi';
import { getGeometryBounds } from '../lib/mapGeometry';
import { useToast } from '../components/Toast';
import { FarmSidebar } from '../components/maps/FarmSidebar';
import { WorkspaceMapCanvas } from '../components/maps/WorkspaceMapCanvas';
import { AddFarmModal, PendingFarmDraftMeta } from '../components/maps/AddFarmModal';

function computeFarmsBounds(farms: FarmMapRecord[]): L.LatLngBounds | null {
  if (farms.length === 0) return null;
  const pts: L.LatLngTuple[] = [];
  farms.forEach((f) => {
    const polys: LonLat[][][] =
      f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
    polys.forEach((poly) => {
      (poly[0] ?? []).forEach(([lon, lat]) => {
        pts.push([lat, lon]);
      });
    });
  });
  return pts.length > 0 ? L.latLngBounds(pts) : null;
}

export const Maps: React.FC = () => {
  const { showToast } = useToast();
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const [farms, setFarms] = useState<FarmMapRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [baseMapId, setBaseMapId] = useState<BaseMapId>('satellite');
  const [fitTargetBounds, setFitTargetBounds] = useState<L.LatLngBounds | null>(null);
  const [fitRequestNonce, setFitRequestNonce] = useState(0);

  // Add Farm modal & interactive map draw state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pendingFarmMeta, setPendingFarmMeta] = useState<PendingFarmDraftMeta | null>(null);
  const [savingDrawing, setSavingDrawing] = useState(false);

  const loadFarms = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await fetchWorkspaceFarms();
      setFarms(list);
      if (list.length > 0) {
        setSelectedFarmId((prev) =>
          prev && list.some((f) => f.id === prev) ? prev : list[0].id
        );
        const clusterBounds = computeFarmsBounds(list.slice(0, 3)) ?? computeFarmsBounds(list);
        if (clusterBounds) {
          setFitTargetBounds(clusterBounds);
          setFitRequestNonce((n) => n + 1);
        }
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Unable to load saved farms. Please retry.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  const handleSelectFarmFromSidebar = useCallback(
    (farmId: string) => {
      const farm = farms.find((f) => f.id === farmId);
      if (!farm) return;
      setSelectedFarmId(farm.id);
      const b = getGeometryBounds(farm.geometry);
      setFitTargetBounds(L.latLngBounds([b.south, b.west], [b.north, b.east]));
      setFitRequestNonce((n) => n + 1);
    },
    [farms]
  );

  const handleSelectFarmFromMap = useCallback(
    (farmId: string) => {
      const farm = farms.find((f) => f.id === farmId);
      if (!farm) return;
      setSelectedFarmId(farm.id);
      // Clear filter if clicked farm isn't currently shown in sidebar search
      if (sidebarSearch.trim()) {
        const q = sidebarSearch.trim().toLowerCase();
        const visible =
          farm.name.toLowerCase().includes(q) ||
          (farm.crop ?? '').toLowerCase().includes(q) ||
          farm.locationLabel.toLowerCase().includes(q);
        if (!visible) setSidebarSearch('');
      }
      const b = getGeometryBounds(farm.geometry);
      setFitTargetBounds(L.latLngBounds([b.south, b.west], [b.north, b.east]));
      setFitRequestNonce((n) => n + 1);
    },
    [farms, sidebarSearch]
  );

  const handleResetOverview = useCallback(() => {
    const allBounds = computeFarmsBounds(farms);
    if (allBounds) {
      setFitTargetBounds(allBounds);
      setFitRequestNonce((n) => n + 1);
    }
  }, [farms]);

  return (
    <div
      ref={workspaceRef}
      className="fs-maps-workspace relative h-[calc(100dvh-80px)] w-full flex overflow-hidden bg-[#071018]"
    >
      {/* Left Sidebar (Desktop fixed/collapsible + Mobile drawer) */}
      <FarmSidebar
        farms={farms}
        selectedFarmId={selectedFarmId}
        searchQuery={sidebarSearch}
        onSearchQueryChange={setSidebarSearch}
        onSelectFarm={handleSelectFarmFromSidebar}
        onOpenAddFarm={() => {
          setIsDrawing(false);
          setAddModalOpen(true);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        loading={loading}
        mobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
      />

      {/* Main Map Area */}
      <div className="relative flex-1 min-w-0 h-full flex">
        {/* Mobile Drawer Toggle Button (only visible on < md viewports) */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="md:hidden absolute top-16 left-3.5 z-[510] h-9 px-3 rounded-xl bg-[#0B1622]/90 backdrop-blur-md border border-white/15 text-xs font-semibold text-white inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
        >
          <Sprout className="w-3.5 h-3.5 text-[#49EA80]" />
          <span>My Farms ({farms.length})</span>
        </button>

        {/* Network / API Error Banner with Retry */}
        {loadError && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[530] px-4 py-2.5 rounded-xl bg-[#2A1216]/95 border border-rose-500/45 text-xs text-rose-100 flex items-center gap-3 shadow-2xl">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{loadError}</span>
            <button
              type="button"
              onClick={loadFarms}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        <WorkspaceMapCanvas
          farms={farms}
          selectedFarmId={selectedFarmId}
          baseMapId={baseMapId}
          onChangeBaseMap={setBaseMapId}
          onSelectFarm={handleSelectFarmFromMap}
          fitRequestNonce={fitRequestNonce}
          fitTargetBounds={fitTargetBounds}
          onResetOverview={handleResetOverview}
          onLocateUser={(lat, lon) =>
            showToast(`Centered map at ${lat.toFixed(3)}, ${lon.toFixed(3)}.`, 'info')
          }
          onLocateError={(msg) => showToast(msg, 'error')}
          isDrawing={isDrawing}
          drawingFarmName={pendingFarmMeta?.name ?? null}
          savingDrawing={savingDrawing}
          onCompleteDrawing={async (geom: FarmGeoJsonGeometry) => {
            if (!pendingFarmMeta?.name) {
              setIsDrawing(false);
              setAddModalOpen(true);
              return;
            }
            setSavingDrawing(true);
            try {
              const created = await createWorkspaceFarm({
                name: pendingFarmMeta.name,
                crop: pendingFarmMeta.crop,
                locationLabel: pendingFarmMeta.locationLabel,
                notes: pendingFarmMeta.notes,
                geometry: geom,
              });
              setFarms((prev) => [created, ...prev]);
              setSelectedFarmId(created.id);
              setIsDrawing(false);
              setPendingFarmMeta(null);
              const b = getGeometryBounds(created.geometry);
              setFitTargetBounds(L.latLngBounds([b.south, b.west], [b.north, b.east]));
              setFitRequestNonce((n) => n + 1);
              showToast(
                `Added "${created.name}" (${created.areaHa.toFixed(1)} ha).`,
                'success'
              );
            } catch (err) {
              showToast(
                err instanceof Error
                  ? err.message
                  : 'Failed to save farm boundary. Please try again.',
                'error'
              );
            } finally {
              setSavingDrawing(false);
            }
          }}
          onCancelDrawing={() => {
            setIsDrawing(false);
            setPendingFarmMeta(null);
          }}
          workspaceContainerRef={workspaceRef}
        />
      </div>

      {/* Add Farm Modal (Name with analyzed farms lookup -> Draw on Map or Import) */}
      <AddFarmModal
        open={addModalOpen}
        existingFarms={farms}
        onStartDrawOnMap={(meta) => {
          setPendingFarmMeta(meta);
          setAddModalOpen(false);
          setIsDrawing(true);
          if (meta.center) {
            const dLat = 0.006;
            const dLon = 0.008;
            setFitTargetBounds(
              L.latLngBounds(
                [meta.center.lat - dLat, meta.center.lon - dLon],
                [meta.center.lat + dLat, meta.center.lon + dLon]
              )
            );
            setFitRequestNonce((n) => n + 1);
          }
          showToast(`Draw the boundary for "${meta.name}" on the map.`, 'info');
        }}
        onClose={() => {
          setAddModalOpen(false);
        }}
        onFarmCreated={(created) => {
          setFarms((prev) => [created, ...prev]);
          setSelectedFarmId(created.id);
          setAddModalOpen(false);
          setPendingFarmMeta(null);
          const b = getGeometryBounds(created.geometry);
          setFitTargetBounds(L.latLngBounds([b.south, b.west], [b.north, b.east]));
          setFitRequestNonce((n) => n + 1);
          showToast(
            `Added "${created.name}" (${created.areaHa.toFixed(1)} ha).`,
            'success'
          );
        }}
      />
    </div>
  );
};
