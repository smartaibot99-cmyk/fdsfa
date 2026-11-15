import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Check,
  Crosshair,
  Layers,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  PenTool,
  Plus,
  Redo2,
  Search,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import {
  BaseMapId,
  FarmGeoJsonGeometry,
  FarmHealthStatus,
  FarmMapRecord,
  LonLat,
} from '../../types/maps';
import {
  getBaseMapReferenceOverlaySpec,
  getBaseMapTileSpec,
} from '../../services/mapsApi';
import { GeocodePlaceResult, searchPlacesDetailed } from '../../services/geocode';
import {
  closeRing,
  computeRingGeodesicAreaM2,
  computeRingPerimeterM,
  findSelfIntersections,
  getGeometryBounds,
} from '../../lib/mapGeometry';

interface WorkspaceMapCanvasProps {
  farms: FarmMapRecord[];
  selectedFarmId: string | null;
  baseMapId: BaseMapId;
  onChangeBaseMap: (id: BaseMapId) => void;
  onSelectFarm: (farmId: string) => void;
  fitRequestNonce: number;
  fitTargetBounds: L.LatLngBounds | null;
  onResetOverview: () => void;
  onLocateUser: (lat: number, lon: number) => void;
  onLocateError: (message: string) => void;
  isDrawing: boolean;
  drawingFarmName?: string | null;
  savingDrawing?: boolean;
  onCompleteDrawing: (geometry: FarmGeoJsonGeometry) => void;
  onCancelDrawing: () => void;
  workspaceContainerRef: React.RefObject<HTMLDivElement | null>;
}

const POLYGON_STATUS_STYLES: Record<
  FarmHealthStatus,
  {
    stroke: string;
    selectedStroke: string;
    fill: string;
    fillOpacity: number;
    selectedFillOpacity: number;
  }
> = {
  healthy: {
    stroke: '#46EE7E',
    selectedStroke: '#5CF892',
    fill: '#38DF6E',
    fillOpacity: 0.34,
    selectedFillOpacity: 0.42,
  },
  moderate: {
    stroke: '#F6B129',
    selectedStroke: '#FFC74E',
    fill: '#EEA21A',
    fillOpacity: 0.34,
    selectedFillOpacity: 0.44,
  },
  at_risk: {
    stroke: '#EE464E',
    selectedStroke: '#FF5E66',
    fill: '#DF363E',
    fillOpacity: 0.38,
    selectedFillOpacity: 0.48,
  },
  no_data: {
    stroke: '#94A0AC',
    selectedStroke: '#B8C4D0',
    fill: '#7E8A96',
    fillOpacity: 0.28,
    selectedFillOpacity: 0.38,
  },
};

const BASEMAP_OPTIONS: Array<{ id: BaseMapId; label: string; desc: string }> = [
  { id: 'satellite', label: 'Satellite', desc: 'True-color aerial imagery' },
  { id: 'satellite-labels', label: 'Satellite with Labels', desc: 'Imagery + place names' },
  { id: 'street', label: 'Streets', desc: 'OpenStreetMap roads' },
  { id: 'terrain', label: 'Terrain', desc: 'Topographic elevation contours' },
];

export const WorkspaceMapCanvas: React.FC<WorkspaceMapCanvasProps> = ({
  farms,
  selectedFarmId,
  baseMapId,
  onChangeBaseMap,
  onSelectFarm,
  fitRequestNonce,
  fitTargetBounds,
  onResetOverview,
  onLocateUser,
  onLocateError,
  isDrawing,
  drawingFarmName,
  savingDrawing = false,
  onCompleteDrawing,
  onCancelDrawing,
  workspaceContainerRef,
}) => {
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const refOverlayLayerRef = useRef<L.TileLayer | null>(null);
  const farmPolygonsGroupRef = useRef<L.LayerGroup | null>(null);
  const farmVerticesGroupRef = useRef<L.LayerGroup | null>(null);
  const farmLabelsGroupRef = useRef<L.LayerGroup | null>(null);
  const drawGroupRef = useRef<L.LayerGroup | null>(null);
  const searchPinGroupRef = useRef<L.LayerGroup | null>(null);
  const initialFitDoneRef = useRef(false);

  const [zoomLevel, setZoomLevel] = useState(14);
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [locateBusy, setLocateBusy] = useState(false);

  // Global Geocode Search State
  const [geoQuery, setGeoQuery] = useState('');
  const [geoResults, setGeoResults] = useState<GeocodePlaceResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoDropdownOpen, setGeoDropdownOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const searchReqIdRef = useRef(0);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);

  // Drawing vertices state with full Undo/Redo history ([lon, lat][])
  const [drawHistory, setDrawHistory] = useState<{ stack: LonLat[][]; idx: number }>({
    stack: [[]],
    idx: 0,
  });
  const [drawError, setDrawError] = useState<string | null>(null);

  const draftPoints = drawHistory.stack[drawHistory.idx] ?? [];
  const canUndo = drawHistory.idx > 0;
  const canRedo = drawHistory.idx < drawHistory.stack.length - 1;

  // Reset draft vertices when entering/leaving draw mode
  useEffect(() => {
    if (!isDrawing) {
      setDrawHistory({ stack: [[]], idx: 0 });
      setDrawError(null);
    }
  }, [isDrawing]);

  const handleUndoVertex = () => {
    setDrawError(null);
    setDrawHistory((prev) => (prev.idx > 0 ? { ...prev, idx: prev.idx - 1 } : prev));
  };

  const handleRedoVertex = () => {
    setDrawError(null);
    setDrawHistory((prev) =>
      prev.idx < prev.stack.length - 1 ? { ...prev, idx: prev.idx + 1 } : prev
    );
  };

  const handleDeleteDrawing = () => {
    setDrawError(null);
    setDrawHistory({ stack: [[]], idx: 0 });
    onCancelDrawing();
  };

  // Keyboard shortcuts during drawing: Ctrl/Cmd+Z undo, Ctrl/Cmd+Y / Shift+Z redo, Escape cancel
  useEffect(() => {
    if (!isDrawing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedoVertex();
        } else {
          handleUndoVertex();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedoVertex();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleDeleteDrawing();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDrawing]);

  // Close geocode dropdown and layers popover on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setGeoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Track browser fullscreen state
  useEffect(() => {
    const onFsChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      window.setTimeout(() => {
        mapRef.current?.invalidateSize({ animate: false });
      }, 150);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;

    const worldBounds = L.latLngBounds([-85, -180], [85, 180]);
    const map = L.map(mapElRef.current, {
      center: [44.855, -123.153],
      zoom: 14,
      minZoom: 3,
      maxZoom: 19,
      maxBounds: worldBounds,
      maxBoundsViscosity: 0.85,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: false,
    });

    // Real Leaflet metric scale bar in bottom-left
    L.control
      .scale({
        position: 'bottomleft',
        imperial: false,
        metric: true,
        maxWidth: 130,
      })
      .addTo(map);

    farmPolygonsGroupRef.current = L.layerGroup().addTo(map);
    farmVerticesGroupRef.current = L.layerGroup().addTo(map);
    farmLabelsGroupRef.current = L.layerGroup().addTo(map);
    drawGroupRef.current = L.layerGroup().addTo(map);
    searchPinGroupRef.current = L.layerGroup().addTo(map);

    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    mapRef.current = map;

    const ro = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    ro.observe(mapElRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Swap basemap & optional labels overlay smoothly
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const spec = getBaseMapTileSpec(baseMapId);
    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
      baseLayerRef.current = null;
    }
    if (refOverlayLayerRef.current) {
      map.removeLayer(refOverlayLayerRef.current);
      refOverlayLayerRef.current = null;
    }

    baseLayerRef.current = L.tileLayer(spec.url, {
      maxNativeZoom: spec.maxNativeZoom,
      maxZoom: spec.maxZoom,
      noWrap: true,
      bounds: [
        [-85, -180],
        [85, 180],
      ],
    }).addTo(map);
    baseLayerRef.current.bringToBack();

    const refSpec = getBaseMapReferenceOverlaySpec(baseMapId);
    if (refSpec) {
      refOverlayLayerRef.current = L.tileLayer(refSpec.url, {
        maxNativeZoom: refSpec.maxNativeZoom,
        maxZoom: refSpec.maxZoom,
        noWrap: true,
        opacity: 0.9,
      }).addTo(map);
    }
  }, [baseMapId]);

  // Fit bounds when explicitly triggered (initial load, farm click, search, reset)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitTargetBounds) return;
    if (!fitTargetBounds.isValid()) return;

    const animate = initialFitDoneRef.current;
    initialFitDoneRef.current = true;
    map.fitBounds(fitTargetBounds, {
      padding: [70, 70],
      maxZoom: 16,
      animate,
      duration: animate ? 0.65 : 0,
    });
  }, [fitTargetBounds, fitRequestNonce]);

  // Render farms polygons, vertex markers, and centered ha labels
  useEffect(() => {
    const polyGroup = farmPolygonsGroupRef.current;
    const vertGroup = farmVerticesGroupRef.current;
    const labelGroup = farmLabelsGroupRef.current;
    if (!polyGroup || !vertGroup || !labelGroup) return;

    polyGroup.clearLayers();
    vertGroup.clearLayers();
    labelGroup.clearLayers();

    const showLabels = zoomLevel >= 10;
    const showVertices = zoomLevel >= 12;

    farms.forEach((farm) => {
      const isSelected = farm.id === selectedFarmId;
      const styleCfg = POLYGON_STATUS_STYLES[farm.healthStatus] ?? POLYGON_STATUS_STYLES.no_data;

      const polys: LonLat[][][] =
        farm.geometry.type === 'MultiPolygon'
          ? farm.geometry.coordinates
          : [farm.geometry.coordinates];

      polys.forEach((rings) => {
        const latLngRings = rings.map((ring) =>
          ring.map(([lon, lat]) => [lat, lon] as [number, number])
        );

        const polyLayer = L.polygon(latLngRings, {
          color: isSelected ? styleCfg.selectedStroke : styleCfg.stroke,
          weight: isSelected ? 2.6 : 2,
          opacity: isSelected ? 1 : 0.92,
          fillColor: styleCfg.fill,
          fillOpacity: isSelected ? styleCfg.selectedFillOpacity : styleCfg.fillOpacity,
          interactive: !isDrawing,
          smoothFactor: 0.6,
        });

        if (!isDrawing) {
          polyLayer.on('click', (ev) => {
            L.DomEvent.stopPropagation(ev);
            onSelectFarm(farm.id);
          });
          polyLayer.on('mouseover', () => {
            polyLayer.setStyle({
              weight: 3,
              fillOpacity: styleCfg.selectedFillOpacity + 0.08,
            });
          });
          polyLayer.on('mouseout', () => {
            polyLayer.setStyle({
              weight: isSelected ? 2.6 : 2,
              fillOpacity: isSelected ? styleCfg.selectedFillOpacity : styleCfg.fillOpacity,
            });
          });
        }

        polyLayer.addTo(polyGroup);

        // Crisp white vertex dots along outer ring matching screenshot
        if (showVertices && rings[0]) {
          const outer = rings[0];
          const len =
            outer.length > 1 &&
            Math.abs(outer[0][0] - outer[outer.length - 1][0]) < 1e-10 &&
            Math.abs(outer[0][1] - outer[outer.length - 1][1]) < 1e-10
              ? outer.length - 1
              : outer.length;

          for (let i = 0; i < len; i++) {
            const [lon, lat] = outer[i];
            L.circleMarker([lat, lon], {
              radius: isSelected ? 3.8 : 3.2,
              color: '#0D1722',
              weight: 1.5,
              fillColor: '#FFFFFF',
              fillOpacity: 1,
              interactive: false,
            }).addTo(vertGroup);
          }
        }
      });

      // Centered interior area badge (hidden below zoom 10 to prevent clutter)
      if (showLabels) {
        const labelHtml = `<div style="transform:translate(-50%,-50%);background:rgba(11,22,34,0.88);border:1px solid ${
          isSelected ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.16)'
        };color:#F8FAFC;padding:3px 9px;border-radius:7px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.4);letter-spacing:0.01em;font-variant-numeric:tabular-nums;">${farm.areaHa.toFixed(1)} ha</div>`;

        const marker = L.marker([farm.labelPoint.lat, farm.labelPoint.lon], {
          icon: L.divIcon({
            className: 'fs-map-label-reset',
            html: labelHtml,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          }),
          interactive: !isDrawing,
        });

        if (!isDrawing) {
          marker.on('click', () => onSelectFarm(farm.id));
        }

        marker.addTo(labelGroup);
      }
    });
  }, [farms, selectedFarmId, zoomLevel, isDrawing, onSelectFarm]);

  const polygonValidation = useMemo(() => {
    if (draftPoints.length < 3) {
      return { valid: false, areaHa: 0, warning: null as string | null };
    }
    const uniqueKeys = new Set(draftPoints.map(([x, y]) => `${x.toFixed(6)},${y.toFixed(6)}`));
    if (uniqueKeys.size < 3) {
      return { valid: false, areaHa: 0, warning: null as string | null };
    }
    if (findSelfIntersections(draftPoints).length > 0) {
      return {
        valid: false,
        areaHa: 0,
        warning: 'Boundary edges cross each other. Undo to uncross.',
      };
    }
    const areaM2 = computeRingGeodesicAreaM2(draftPoints);
    const perimeterM = computeRingPerimeterM(draftPoints);
    const isoperimetric =
      perimeterM > 0 ? (4 * Math.PI * areaM2) / (perimeterM * perimeterM) : 0;

    // Require enclosed 2D area >= 100 m² and non-collinear width (not a flat 2D line)
    if (areaM2 < 100 || isoperimetric < 0.015) {
      return {
        valid: false,
        areaHa: areaM2 / 10000,
        warning: 'Widen vertices into a 2D farm area (not a line).',
      };
    }
    return {
      valid: true,
      areaHa: areaM2 / 10000,
      warning: null as string | null,
    };
  }, [draftPoints]);

  // Interactive drawing mode map click & live preview rendering
  useEffect(() => {
    const map = mapRef.current;
    const drawGroup = drawGroupRef.current;
    if (!map || !drawGroup) return;

    drawGroup.clearLayers();
    const container = map.getContainer();
    container.style.cursor = isDrawing ? 'crosshair' : '';

    if (!isDrawing) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (savingDrawing) return;
      const pt: LonLat = [
        Number(e.latlng.lng.toFixed(6)),
        Number(e.latlng.lat.toFixed(6)),
      ];
      setDrawError(null);
      setDrawHistory((prev) => {
        const current = prev.stack[prev.idx] ?? [];
        const nextStack = [...prev.stack.slice(0, prev.idx + 1), [...current, pt]];
        return { stack: nextStack, idx: nextStack.length - 1 };
      });
    };

    map.on('click', handleMapClick);

    const strokeColor =
      draftPoints.length >= 3 && !polygonValidation.valid ? '#F43F5E' : '#1CE2BD';

    if (draftPoints.length >= 2) {
      const latLngs = draftPoints.map(([lon, lat]) => [lat, lon] as [number, number]);
      if (draftPoints.length >= 3) {
        L.polygon(latLngs, {
          color: strokeColor,
          weight: 2.5,
          dashArray: '6 4',
          fillColor: strokeColor,
          fillOpacity: polygonValidation.valid ? 0.25 : 0.14,
          interactive: false,
        }).addTo(drawGroup);
      } else {
        L.polyline(latLngs, {
          color: '#1CE2BD',
          weight: 2.5,
          dashArray: '6 4',
          interactive: false,
        }).addTo(drawGroup);
      }
    }

    draftPoints.forEach(([lon, lat], idx) => {
      const isFirst = idx === 0;
      const canClose = isFirst && polygonValidation.valid;
      const cm = L.circleMarker([lat, lon], {
        radius: canClose ? 6 : 4.5,
        color: '#09131E',
        weight: 2,
        fillColor: isFirst ? '#43F5D0' : '#FFFFFF',
        fillOpacity: 1,
        interactive: canClose,
      });
      if (canClose) {
        cm.on('click', (ev) => {
          L.DomEvent.stopPropagation(ev);
          finishDrawing(draftPoints);
        });
      }
      cm.addTo(drawGroup);
    });

    return () => {
      map.off('click', handleMapClick);
      container.style.cursor = '';
    };
  }, [isDrawing, draftPoints, savingDrawing, polygonValidation]);

  const finishDrawing = (pts: LonLat[]) => {
    if (savingDrawing) return;
    if (pts.length < 3) {
      setDrawError('Add at least 3 vertices before completing the farm boundary.');
      return;
    }
    if (findSelfIntersections(pts).length > 0) {
      setDrawError('Boundary edges cross each other. Undo the crossing point before finishing.');
      return;
    }
    const areaM2 = computeRingGeodesicAreaM2(pts);
    const perimeterM = computeRingPerimeterM(pts);
    const isoperimetric =
      perimeterM > 0 ? (4 * Math.PI * areaM2) / (perimeterM * perimeterM) : 0;
    if (areaM2 < 100 || isoperimetric < 0.015) {
      setDrawError('Farm boundary must enclose a 2D area (not a flat line).');
      return;
    }
    onCompleteDrawing({
      type: 'Polygon',
      coordinates: [closeRing(pts)],
    });
  };

  // Debounced Global Place Geocoding (350ms + stale request guard)
  useEffect(() => {
    const q = geoQuery.trim();
    if (q.length < 2) {
      setGeoResults([]);
      setGeoLoading(false);
      setGeoError(null);
      setHighlightedIdx(-1);
      return;
    }

    const reqId = ++searchReqIdRef.current;
    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setGeoLoading(true);
      setGeoError(null);
      try {
        const res = await searchPlacesDetailed(q, controller.signal);
        if (reqId !== searchReqIdRef.current) return;
        setGeoResults(res);
        setGeoDropdownOpen(true);
        setHighlightedIdx(res.length > 0 ? 0 : -1);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError' || reqId !== searchReqIdRef.current) return;
        setGeoResults([]);
        setGeoError('Search temporarily unavailable.');
        setGeoDropdownOpen(true);
      } finally {
        if (reqId === searchReqIdRef.current) {
          setGeoLoading(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [geoQuery]);

  const flyToGeocodePlace = (place: GeocodePlaceResult) => {
    const map = mapRef.current;
    if (!map) return;

    setGeoDropdownOpen(false);
    setGeoQuery(place.name);

    // Clear previous search pin and place subtle cyan location marker
    if (searchPinGroupRef.current) {
      searchPinGroupRef.current.clearLayers();
      L.circleMarker([place.lat, place.lon], {
        radius: 6,
        color: '#FFFFFF',
        weight: 2,
        fillColor: '#16E0B8',
        fillOpacity: 0.95,
      })
        .bindPopup(
          `<div style="font-size:12px;line-height:1.4"><strong>${place.name}</strong><br/><span style="opacity:0.75">${place.displayName}</span></div>`
        )
        .addTo(searchPinGroupRef.current);
    }

    if (place.boundingBox) {
      const [south, north, west, east] = place.boundingBox;
      const spanLat = Math.abs(north - south);
      const spanLon = Math.abs(east - west);
      // Use bounding box when meaningful, or fall back to type-aware zoom
      if (spanLat > 0.002 || spanLon > 0.002) {
        map.flyToBounds(
          [
            [south, west],
            [north, east],
          ],
          { padding: [50, 50], maxZoom: 15, duration: 0.85 }
        );
        return;
      }
    }

    const type = (place.type || '').toLowerCase();
    const zoom =
      type === 'country'
        ? 5
        : type === 'state' || type === 'administrative'
          ? 7
          : type === 'city' || type === 'town'
            ? 11
            : type === 'village' || type === 'suburb'
              ? 13
              : 15;

    map.flyTo([place.lat, place.lon], zoom, { duration: 0.85 });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      onLocateError('Geolocation is not supported in this browser.');
      return;
    }
    setLocateBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocateBusy(false);
        const { latitude, longitude } = pos.coords;
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 14, { duration: 0.85 });
        }
        onLocateUser(latitude, longitude);
      },
      () => {
        setLocateBusy(false);
        onLocateError('Location permission denied or unavailable.');
      },
      { enableHighAccuracy: false, timeout: 7000 }
    );
  };

  const handleToggleFullscreen = async () => {
    const target = workspaceContainerRef.current;
    if (!target) return;
    try {
      if (!document.fullscreenElement) {
        await target.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen denial in restricted iframes
    }
  };

  const handleResetView = () => {
    const map = mapRef.current;
    if (!map) return;
    if (selectedFarmId) {
      const selected = farms.find((f) => f.id === selectedFarmId);
      if (selected) {
        const b = getGeometryBounds(selected.geometry);
        map.flyToBounds(
          [
            [b.south, b.west],
            [b.north, b.east],
          ],
          { padding: [70, 70], maxZoom: 15, duration: 0.65 }
        );
        return;
      }
    }
    onResetOverview();
  };

  const activeSpec = getBaseMapTileSpec(baseMapId);

  return (
    <div className="relative flex-1 min-w-0 h-full bg-[#07111A] overflow-hidden">
      {/* Full-bleed Natural Color Satellite Leaflet Container */}
      <div ref={mapElRef} className="w-full h-full z-0" />

      {/* ================================================================= */}
      {/* TOP-LEFT FLOATING GLOBAL GEOCODER + LOCATE ME BUTTON (HIDDEN IN DRAW) */}
      {/* ================================================================= */}
      {!isDrawing && (
        <div
          ref={searchWrapperRef}
          className="absolute top-3.5 left-3.5 right-3.5 z-[500] flex items-start gap-2.5 pointer-events-none"
        >
          <div className="relative w-full max-w-[325px] pointer-events-auto">
            <div className="flex items-center h-10 rounded-xl bg-[#0B1622]/90 backdrop-blur-md border border-white/[0.12] shadow-[0_8px_24px_rgba(0,0,0,0.45)] focus-within:border-[#16E0B8]/70 transition-colors">
              <Search className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
              <input
                type="text"
                value={geoQuery}
                onFocus={() => {
                  if (geoResults.length > 0 || geoError) setGeoDropdownOpen(true);
                }}
                onChange={(e) => setGeoQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (!geoDropdownOpen || geoResults.length === 0) return;
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedIdx((i) => (i + 1) % geoResults.length);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedIdx((i) => (i <= 0 ? geoResults.length - 1 : i - 1));
                  } else if (e.key === 'Enter' && highlightedIdx >= 0) {
                    e.preventDefault();
                    flyToGeocodePlace(geoResults[highlightedIdx]);
                  } else if (e.key === 'Escape') {
                    setGeoDropdownOpen(false);
                  }
                }}
                placeholder="Search anywhere in the world..."
                aria-label="Search any global location"
                className="w-full h-full px-2.5 bg-transparent text-[13.5px] text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
              {geoLoading ? (
                <Loader2 className="w-4 h-4 text-[#22E0B6] mr-3 shrink-0 animate-spin" />
              ) : (
                geoQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setGeoQuery('');
                      setGeoResults([]);
                      setGeoDropdownOpen(false);
                      searchPinGroupRef.current?.clearLayers();
                    }}
                    aria-label="Clear location search"
                    className="mr-2 p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>

            {/* Geocode Autocomplete Dropdown */}
            {geoDropdownOpen && (geoResults.length > 0 || geoError || (!geoLoading && geoQuery.trim().length >= 2)) && (
              <div className="mt-1.5 rounded-xl bg-[#0B1622]/95 backdrop-blur-md border border-white/[0.12] shadow-2xl overflow-hidden max-h-64 overflow-y-auto fs-thin-scroll">
                {geoError ? (
                  <div className="px-3.5 py-2.5 text-xs text-rose-300">{geoError}</div>
                ) : geoResults.length === 0 ? (
                  <div className="px-3.5 py-2.5 text-xs text-slate-400">
                    No places matched "{geoQuery.trim()}".
                  </div>
                ) : (
                  geoResults.map((place, idx) => (
                    <button
                      key={`${place.lat}-${place.lon}-${idx}`}
                      type="button"
                      onClick={() => flyToGeocodePlace(place)}
                      className={`w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 border-b last:border-b-0 border-white/[0.06] text-xs transition-colors cursor-pointer ${
                        idx === highlightedIdx
                          ? 'bg-[#12333D] text-white'
                          : 'text-slate-200 hover:bg-white/[0.06]'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#22E0B6] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate">{place.name}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {place.displayName}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Locate-Me Crosshair Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locateBusy}
            title="Center map on my current location"
            aria-label="Center map on my current location"
            className="pointer-events-auto w-10 h-10 shrink-0 rounded-xl bg-[#0B1622]/90 backdrop-blur-md border border-white/[0.12] text-slate-200 hover:text-white hover:border-white/25 shadow-[0_8px_24px_rgba(0,0,0,0.45)] flex items-center justify-center cursor-pointer transition-colors disabled:opacity-60"
          >
            {locateBusy ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#22E0B6]" />
            ) : (
              <Crosshair className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* ACTIVE DRAWING TOOLS: LEFT-MOST TOP PEN / UNDO / REDO / DELETE    */}
      {/* ================================================================= */}
      {isDrawing && (
        <div className="absolute top-3.5 left-3.5 z-[520] flex items-center gap-1 p-1 rounded-xl bg-[#0B1622]/92 backdrop-blur-md border border-white/[0.14] shadow-[0_10px_28px_rgba(0,0,0,0.5)]">
          {/* Active Pen Tool Indicator */}
          <div
            title={
              drawingFarmName
                ? `Drawing boundary for ${drawingFarmName}`
                : 'Pen drawing tool active'
            }
            aria-label="Pen drawing tool active"
            className="w-9 h-9 rounded-lg bg-[#123A40] border border-[#16E0B8]/55 text-[#43F5D0] flex items-center justify-center shrink-0"
          >
            <PenTool className="w-4 h-4" />
          </div>

          <div className="w-px h-5 bg-white/[0.1] mx-0.5" />

          {/* Undo */}
          <button
            type="button"
            disabled={!canUndo || savingDrawing}
            onClick={handleUndoVertex}
            title="Undo last point"
            aria-label="Undo last point"
            className="w-9 h-9 rounded-lg text-slate-200 hover:text-white hover:bg-white/[0.08] disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Redo */}
          <button
            type="button"
            disabled={!canRedo || savingDrawing}
            onClick={handleRedoVertex}
            title="Redo point"
            aria-label="Redo point"
            className="w-9 h-9 rounded-lg text-slate-200 hover:text-white hover:bg-white/[0.08] disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-white/[0.1] mx-0.5" />

          {/* Delete / Cancel Entire Drawing */}
          <button
            type="button"
            disabled={savingDrawing}
            onClick={handleDeleteDrawing}
            title="Delete boundary draft and cancel"
            aria-label="Delete boundary draft and cancel"
            className="w-9 h-9 rounded-lg text-slate-300 hover:text-rose-300 hover:bg-rose-500/20 disabled:opacity-35 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* TOP-CENTER FINISH BUTTON (ONLY WHEN FARM POLYGON REQUIREMENTS MET) */}
      {/* ================================================================= */}
      {isDrawing && polygonValidation.valid && (
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-[520]">
          <button
            type="button"
            disabled={savingDrawing}
            onClick={() => finishDrawing(draftPoints)}
            className="h-10 px-4 rounded-xl bg-[#16E0B8] hover:bg-[#32ECC6] text-slate-950 font-semibold text-xs shadow-[0_8px_24px_rgba(22,224,184,0.35)] border border-[#6DF7DA]/70 inline-flex items-center gap-2 transition-all cursor-pointer disabled:opacity-65"
          >
            {savingDrawing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Farm...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Finish</span>
                <span className="px-1.5 py-0.5 rounded-md bg-slate-950/15 font-mono text-[11px] tabular-nums">
                  {polygonValidation.areaHa.toFixed(1)} ha
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Subtle geometry warning pill only if user tries closing/crossing invalid polygon */}
      {isDrawing && (drawError || polygonValidation.warning) && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[520] px-3 py-1.5 rounded-lg bg-[#251318]/92 backdrop-blur-md border border-rose-500/45 text-[11.5px] text-rose-200 font-medium shadow-xl pointer-events-none">
          {drawError || polygonValidation.warning}
        </div>
      )}

      {/* ================================================================= */}
      {/* BOTTOM-RIGHT VERTICAL CONTROL STACK & BASEMAP SWITCHER            */}
      {/* ================================================================= */}
      <div className="absolute bottom-4 right-4 z-[500] flex items-end gap-2.5 pointer-events-none">
        {/* Attribution Pill (bottom-right, left of the button stack just like screenshot) */}
        <div className="pointer-events-auto hidden sm:flex items-center px-2.5 py-1.5 rounded-lg bg-[#0B1622]/85 backdrop-blur-md border border-white/[0.1] text-[11px] text-slate-300 shadow-lg">
          <span>{activeSpec.attribution}</span>
        </div>

        {/* Vertical Control Stack */}
        <div className="pointer-events-auto relative flex flex-col items-center gap-2">
          {/* Basemap Layers Popover */}
          {layersMenuOpen && (
            <div className="absolute right-12 bottom-10 w-56 rounded-xl bg-[#0B1622]/95 backdrop-blur-md border border-white/[0.14] shadow-2xl p-1.5 z-20">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-white/[0.07] mb-1">
                Map Layers
              </div>
              {BASEMAP_OPTIONS.map((opt) => {
                const active = baseMapId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChangeBaseMap(opt.id);
                      setLayersMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#123B43] text-[#43F5D0] font-semibold'
                        : 'text-slate-200 hover:bg-white/[0.07]'
                    }`}
                  >
                    <div>
                      <div>{opt.label}</div>
                      <div className="text-[10.5px] text-slate-400 font-normal">{opt.desc}</div>
                    </div>
                    {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Reset / Re-center Button */}
          <button
            type="button"
            onClick={handleResetView}
            title="Fit selected farm or overview"
            aria-label="Center map on farms"
            className="w-10 h-10 rounded-xl bg-[#0B1622]/90 backdrop-blur-md border border-white/[0.12] text-slate-200 hover:text-white hover:border-white/25 shadow-lg flex items-center justify-center cursor-pointer transition-colors"
          >
            <Navigation className="w-4 h-4" />
          </button>

          {/* Joined + / - Zoom Control */}
          <div className="flex flex-col rounded-xl bg-[#0B1622]/90 backdrop-blur-md border border-white/[0.12] shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn()}
              title="Zoom in"
              aria-label="Zoom in"
              className="w-10 h-10 text-slate-200 hover:text-white hover:bg-white/[0.08] flex items-center justify-center border-b border-white/[0.1] cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut()}
              title="Zoom out"
              aria-label="Zoom out"
              className="w-10 h-10 text-slate-200 hover:text-white hover:bg-white/[0.08] flex items-center justify-center cursor-pointer transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Layers Switcher */}
          <button
            type="button"
            onClick={() => setLayersMenuOpen((o) => !o)}
            title="Switch basemap layers"
            aria-label="Switch basemap layers"
            aria-expanded={layersMenuOpen}
            className={`w-10 h-10 rounded-xl backdrop-blur-md border shadow-lg flex items-center justify-center cursor-pointer transition-colors ${
              layersMenuOpen
                ? 'bg-[#123A40] border-[#16E0B8]/70 text-[#43F5D0]'
                : 'bg-[#0B1622]/90 border-white/[0.12] text-slate-200 hover:text-white hover:border-white/25'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen map'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen map'}
            className="w-10 h-10 rounded-xl bg-[#0B1622]/90 backdrop-blur-md border border-white/[0.12] text-slate-200 hover:text-white hover:border-white/25 shadow-lg flex items-center justify-center cursor-pointer transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
