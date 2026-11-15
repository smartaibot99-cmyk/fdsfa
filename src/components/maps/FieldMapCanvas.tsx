import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Crosshair,
  LocateFixed,
  Maximize2,
  Minus,
  Plus,
  Ruler,
  SplitSquareHorizontal,
  AlertTriangle,
} from 'lucide-react';
import { EonetEvent } from '../../types';
import {
  BaseMapId,
  GeoJsonPolygonGeometry,
  GeometryEditorState,
  GeometryValidationResult,
  LonLat,
  MapFieldRecord,
  MapLayerRuntimeState,
  MapWorkspaceMode,
  RegionalCityAggregate,
} from '../../types/maps';
import {
  closeRing,
  findSelfIntersections,
  formatArea,
  formatPerimeter,
  haversineDistanceM,
  isPointInPolygon,
  stripClosingVertex,
} from '../../lib/mapGeometry';
import { getBaseMapTileSpec, getOverlayGibsTileUrl } from '../../services/mapsApi';

export interface FieldMapCanvasProps {
  workspaceMode: MapWorkspaceMode;
  editorState: GeometryEditorState;
  drawingSubMode: 'exterior' | 'hole' | 'rectangle';
  baseMapId: BaseMapId;
  layersState: Record<string, MapLayerRuntimeState>;
  observationDate: string;
  compareBeforeDate: string;
  compareAfterDate: string;
  compareOverlayId: string;
  compareViewStyle: 'swipe' | 'split';
  fields: MapFieldRecord[];
  selectedFieldId: string | null;
  draftRings: LonLat[][];
  draftValidation: GeometryValidationResult | null;
  areaUnit: 'hectares' | 'acres';
  eonetEvents: EonetEvent[];
  regionalCities: RegionalCityAggregate[];
  inspectMarker: { lat: number; lon: number } | null;
  fitRequestNonce: number;
  fitTargetBounds: L.LatLngBoundsExpression | null;
  panelLayoutSignature: string;
  measureActive: boolean;
  onToggleMeasure: () => void;
  onSelectField: (fieldId: string | null) => void;
  onSelectCity: (cityKey: string) => void;
  onAddDraftVertex: (pt: LonLat) => void;
  onFinishDraftRing: () => void;
  onUpdateDraftRing: (ringIndex: number, nextRing: LonLat[]) => void;
  onInspectPoint: (lat: number, lon: number) => void;
  onFitAll: () => void;
  onFitSelected: () => void;
  onLocateMe: () => void;
  locateBusy: boolean;
  onGibsLayerStatus: (layerId: string, status: 'Available' | 'Loading' | 'Unavailable', reason?: string) => void;
}

const WORLD_BOUNDS = L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180));

function eonetColor(catTitle: string): string {
  const lower = catTitle.toLowerCase();
  if (lower.includes('wildfire') || lower.includes('fire')) return '#EF4444';
  if (lower.includes('storm') || lower.includes('cyclone')) return '#38BDF8';
  if (lower.includes('flood')) return '#22C7B8';
  return '#F59E0B';
}

function toLatLng(pt: LonLat): [number, number] {
  return [pt[1], pt[0]];
}

function ringsToLatLngs(rings: LonLat[][]): [number, number][][] {
  return rings.map((r) => stripClosingVertex(r).map(toLatLng));
}

export const FieldMapCanvas: React.FC<FieldMapCanvasProps> = ({
  workspaceMode,
  editorState,
  drawingSubMode,
  baseMapId,
  layersState,
  observationDate,
  compareBeforeDate,
  compareAfterDate,
  compareOverlayId,
  compareViewStyle,
  fields,
  selectedFieldId,
  draftRings,
  draftValidation,
  areaUnit,
  eonetEvents,
  regionalCities,
  inspectMarker,
  fitRequestNonce,
  fitTargetBounds,
  panelLayoutSignature,
  measureActive,
  onToggleMeasure,
  onSelectField,
  onSelectCity,
  onAddDraftVertex,
  onFinishDraftRing,
  onUpdateDraftRing,
  onInspectPoint,
  onFitAll,
  onFitSelected,
  onLocateMe,
  locateBusy,
  onGibsLayerStatus,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const afterContainerRef = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const afterMapRef = useRef<L.Map | null>(null);
  const baseTileRef = useRef<L.TileLayer | null>(null);
  const gibsOverlayRefs = useRef<Map<string, L.TileLayer>>(new Map());

  const fieldsLayerRef = useRef<L.LayerGroup | null>(null);
  const draftLayerRef = useRef<L.LayerGroup | null>(null);
  const previewLayerRef = useRef<L.LayerGroup | null>(null);
  const eonetLayerRef = useRef<L.LayerGroup | null>(null);
  const discoveryLayerRef = useRef<L.LayerGroup | null>(null);
  const inspectLayerRef = useRef<L.LayerGroup | null>(null);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);

  const afterBaseTileRef = useRef<L.TileLayer | null>(null);
  const afterOverlayTileRef = useRef<L.TileLayer | null>(null);
  const afterFieldsLayerRef = useRef<L.LayerGroup | null>(null);

  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(13);
  const [tileErrorNotice, setTileErrorNotice] = useState<string | null>(null);
  const [swipePct, setSwipePct] = useState<number>(50);
  const [measurePts, setMeasurePts] = useState<LonLat[]>([]);
  const [overlappingChoice, setOverlappingChoice] = useState<MapFieldRecord[] | null>(null);

  // Refs to avoid stale closure listeners inside Leaflet event callbacks
  const latestPropsRef = useRef({
    workspaceMode,
    editorState,
    drawingSubMode,
    fields,
    draftRings,
    measureActive,
    onAddDraftVertex,
    onFinishDraftRing,
    onUpdateDraftRing,
    onSelectField,
    onInspectPoint,
  });
  latestPropsRef.current = {
    workspaceMode,
    editorState,
    drawingSubMode,
    fields,
    draftRings,
    measureActive,
    onAddDraftVertex,
    onFinishDraftRing,
    onUpdateDraftRing,
    onSelectField,
    onInspectPoint,
  };

  // Clear measurement points when toggled off
  useEffect(() => {
    if (!measureActive) setMeasurePts([]);
  }, [measureActive]);

  // 1. Initialize Primary Leaflet Map (Single World, noWrap, strict bounds)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [42.033, -93.636],
      zoom: 13,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: false,
      worldCopyJump: false,
      maxBounds: WORLD_BOUNDS,
      maxBoundsViscosity: 1.0,
      attributionControl: true,
    });

    L.control.scale({ position: 'bottomleft', imperial: true, metric: true }).addTo(map);

    fieldsLayerRef.current = L.layerGroup().addTo(map);
    eonetLayerRef.current = L.layerGroup().addTo(map);
    discoveryLayerRef.current = L.layerGroup().addTo(map);
    draftLayerRef.current = L.layerGroup().addTo(map);
    previewLayerRef.current = L.layerGroup().addTo(map);
    inspectLayerRef.current = L.layerGroup().addTo(map);
    measureLayerRef.current = L.layerGroup().addTo(map);

    map.on('zoomend', () => setZoomLevel(map.getZoom()));

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const clampedLon = Math.max(-180, Math.min(180, e.latlng.lng));
      const clampedLat = Math.max(-85, Math.min(85, e.latlng.lat));
      setCursorCoords({ lat: clampedLat, lon: clampedLon });

      const cur = latestPropsRef.current;
      const previewGroup = previewLayerRef.current;
      if (!previewGroup) return;
      previewGroup.clearLayers();

      const isDrawing =
        cur.workspaceMode === 'edit_boundaries' &&
        (cur.editorState === 'drawing' || cur.editorState === 'draft_valid' || cur.editorState === 'draft_invalid') &&
        cur.draftRings.length > 0;

      if (isDrawing) {
        const activeIdx = cur.drawingSubMode === 'hole' && cur.draftRings.length > 1 ? cur.draftRings.length - 1 : 0;
        const activeRing = cur.draftRings[activeIdx] ?? [];
        if (activeRing.length > 0 && cur.drawingSubMode !== 'rectangle') {
          const last = activeRing[activeRing.length - 1];
          L.polyline([toLatLng(last), [clampedLat, clampedLon]], {
            color: '#5EEAD4',
            weight: 1.5,
            dashArray: '4 4',
            interactive: false,
          }).addTo(previewGroup);
        } else if (cur.drawingSubMode === 'rectangle' && activeRing.length === 1) {
          const p0 = activeRing[0];
          const rectBounds = L.latLngBounds(toLatLng(p0), [clampedLat, clampedLon]);
          L.rectangle(rectBounds, {
            color: '#2DD4BF',
            weight: 1.8,
            dashArray: '5 4',
            fillColor: '#14B8A6',
            fillOpacity: 0.12,
            interactive: false,
          }).addTo(previewGroup);
        }
      }
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const cur = latestPropsRef.current;
      const clampedLon = Number(Math.max(-180, Math.min(180, e.latlng.lng)).toFixed(7));
      const clampedLat = Number(Math.max(-90, Math.min(90, e.latlng.lat)).toFixed(7));
      const pt: LonLat = [clampedLon, clampedLat];

      if (cur.measureActive) {
        setMeasurePts((prev) => [...prev, pt]);
        return;
      }

      // Exclusive pointer-owning mode: Drawing clicks NEVER select underlying polygons
      if (
        cur.workspaceMode === 'edit_boundaries' &&
        (cur.editorState === 'drawing' ||
          cur.editorState === 'draft_valid' ||
          cur.editorState === 'draft_invalid')
      ) {
        const activeIdx = cur.drawingSubMode === 'hole' && cur.draftRings.length > 1 ? cur.draftRings.length - 1 : 0;
        const ring = cur.draftRings[activeIdx] ?? [];

        // Check if user clicked close to Vertex 1 to close the polygon
        if (cur.drawingSubMode !== 'rectangle' && ring.length >= 3) {
          const p1Screen = map.latLngToContainerPoint(toLatLng(ring[0]));
          const clickScreen = e.containerPoint;
          if (p1Screen.distanceTo(clickScreen) <= 16) {
            cur.onFinishDraftRing();
            return;
          }
        }
        cur.onAddDraftVertex(pt);
        return;
      }

      // Inspect mode: sample the clicked coordinate / parcel
      if (cur.workspaceMode === 'inspect_data') {
        cur.onInspectPoint(clampedLat, clampedLon);
        return;
      }

      // Viewing / Explore mode: check if click lands inside overlapping fields for disambiguation
      if (cur.workspaceMode === 'explore' && cur.editorState === 'viewing') {
        const hits = cur.fields.filter((f) => {
          const ver = f.versions.find((v) => v.geometryVersionId === f.currentVersionId) ?? f.versions[0];
          return ver ? isPointInPolygon(pt, ver.geometry) : false;
        });
        if (hits.length > 1) {
          setOverlappingChoice(hits);
        } else if (hits.length === 1) {
          setOverlappingChoice(null);
          cur.onSelectField(hits[0].id);
        } else {
          setOverlappingChoice(null);
          cur.onSelectField(null);
        }
      }
    });

    mapRef.current = map;

    const ro = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      baseTileRef.current = null;
      gibsOverlayRefs.current.clear();
    };
  }, []);

  // Re-invalidate map size cleanly whenever left/right panels collapse or expand
  useEffect(() => {
    const timer = window.setTimeout(() => {
      mapRef.current?.invalidateSize({ animate: true });
      afterMapRef.current?.invalidateSize({ animate: true });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [panelLayoutSignature, workspaceMode, compareViewStyle]);

  // 2. Manage Base Tile Layer (NO global dark/invert filter!)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (baseTileRef.current) {
      map.removeLayer(baseTileRef.current);
      baseTileRef.current = null;
    }

    setTileErrorNotice(null);
    const spec = getBaseMapTileSpec(baseMapId);
    let errCount = 0;
    const layer = L.tileLayer(spec.url, {
      attribution: spec.attribution,
      maxNativeZoom: spec.maxNativeZoom,
      maxZoom: spec.maxZoom,
      noWrap: true,
      bounds: WORLD_BOUNDS,
    });

    layer.on('tileerror', () => {
      errCount++;
      if (errCount >= 4) {
        setTileErrorNotice(
          `Map tiles (${baseMapId}) could not load from provider. Field boundary tools and coordinates remain active.`
        );
      }
    });
    layer.on('tileload', () => {
      if (errCount > 0) {
        errCount = 0;
        setTileErrorNotice(null);
      }
    });

    layer.addTo(map);
    layer.bringToBack();
    baseTileRef.current = layer;
  }, [baseMapId]);

  // 3. Manage Active Raster Overlays (NASA GIBS MODIS / VIIRS / GPM IMERG) with real opacity & date
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const rasterIds = ['gibs_modis_true_color', 'gibs_viirs_true_color', 'gibs_imerg_precip'];
    const activeRasterIds =
      workspaceMode === 'compare' && compareViewStyle === 'swipe'
        ? [] // handled by compare layers below
        : rasterIds.filter((id) => layersState[id]?.enabled);

    // Remove disabled overlays
    for (const [id, tileLayer] of gibsOverlayRefs.current.entries()) {
      if (!activeRasterIds.includes(id)) {
        map.removeLayer(tileLayer);
        gibsOverlayRefs.current.delete(id);
      }
    }

    for (const id of activeRasterIds) {
      const st = layersState[id];
      const dateToUse = st?.observationDate || observationDate;
      const spec = getOverlayGibsTileUrl(id, dateToUse);
      if (!spec) continue;

      // Recreate layer if date changed or create new
      const existing = gibsOverlayRefs.current.get(id);
      const currentUrl = (existing as unknown as { _url?: string } | undefined)?._url;
      if (existing && currentUrl === spec.url) {
        existing.setOpacity(st?.opacity ?? 0.8);
      } else {
        if (existing) {
          map.removeLayer(existing);
          gibsOverlayRefs.current.delete(id);
        }
        onGibsLayerStatus(id, 'Loading');
        let loadedOnce = false;
        let tileErrs = 0;
        const tile = L.tileLayer(spec.url, {
          attribution: spec.attribution,
          maxNativeZoom: spec.maxNativeZoom,
          maxZoom: spec.maxZoom,
          opacity: st?.opacity ?? 0.8,
          noWrap: true,
          bounds: WORLD_BOUNDS,
        });
        tile.on('tileload', () => {
          if (!loadedOnce) {
            loadedOnce = true;
            onGibsLayerStatus(id, 'Available');
          }
        });
        tile.on('tileerror', () => {
          tileErrs++;
          if (tileErrs >= 4 && !loadedOnce) {
            onGibsLayerStatus(id, 'Unavailable', `No GIBS capture available for ${dateToUse}. Try an earlier date.`);
          }
        });
        tile.addTo(map);
        gibsOverlayRefs.current.set(id, tile);
      }
    }
  }, [layersState, observationDate, workspaceMode, compareViewStyle]);

  // 4. Manage Historical Compare Map (Split side-by-side or Synchronised Swipe slider)
  useEffect(() => {
    const primaryMap = mapRef.current;
    if (!primaryMap) return;

    if (workspaceMode !== 'compare') {
      if (afterMapRef.current) {
        afterMapRef.current.remove();
        afterMapRef.current = null;
        afterBaseTileRef.current = null;
        afterOverlayTileRef.current = null;
        afterFieldsLayerRef.current = null;
      }
      return;
    }

    if (!afterContainerRef.current) return;

    let afterMap = afterMapRef.current;
    if (!afterMap) {
      afterMap = L.map(afterContainerRef.current, {
        center: primaryMap.getCenter(),
        zoom: primaryMap.getZoom(),
        minZoom: 2,
        maxZoom: 19,
        zoomControl: false,
        worldCopyJump: false,
        maxBounds: WORLD_BOUNDS,
        maxBoundsViscosity: 1.0,
        attributionControl: false,
      });
      afterFieldsLayerRef.current = L.layerGroup().addTo(afterMap);
      afterMapRef.current = afterMap;

      let syncing = false;
      const syncFromPrimary = () => {
        if (syncing || !afterMapRef.current) return;
        syncing = true;
        afterMapRef.current.setView(primaryMap.getCenter(), primaryMap.getZoom(), { animate: false });
        syncing = false;
      };
      const syncFromAfter = () => {
        if (syncing || !afterMapRef.current) return;
        syncing = true;
        primaryMap.setView(afterMapRef.current.getCenter(), afterMapRef.current.getZoom(), { animate: false });
        syncing = false;
      };

      primaryMap.on('move', syncFromPrimary);
      primaryMap.on('zoom', syncFromPrimary);
      afterMap.on('move', syncFromAfter);
      afterMap.on('zoom', syncFromAfter);
    }

    // Update base + before/after GIBS overlays
    const baseSpec = getBaseMapTileSpec(baseMapId);
    if (afterBaseTileRef.current) afterMap.removeLayer(afterBaseTileRef.current);
    afterBaseTileRef.current = L.tileLayer(baseSpec.url, {
      maxNativeZoom: baseSpec.maxNativeZoom,
      maxZoom: baseSpec.maxZoom,
      noWrap: true,
      bounds: WORLD_BOUNDS,
    }).addTo(afterMap);

    // Primary shows Before Date, Secondary shows After Date
    const beforeSpec = getOverlayGibsTileUrl(compareOverlayId, compareBeforeDate);
    const afterSpec = getOverlayGibsTileUrl(compareOverlayId, compareAfterDate);

    // Ensure primary has Before overlay when in compare mode
    for (const [id, l] of gibsOverlayRefs.current.entries()) {
      primaryMap.removeLayer(l);
      gibsOverlayRefs.current.delete(id);
    }
    if (beforeSpec) {
      const bLayer = L.tileLayer(beforeSpec.url, {
        attribution: beforeSpec.attribution,
        maxNativeZoom: beforeSpec.maxNativeZoom,
        maxZoom: beforeSpec.maxZoom,
        opacity: 0.9,
        noWrap: true,
        bounds: WORLD_BOUNDS,
      }).addTo(primaryMap);
      gibsOverlayRefs.current.set('compare_before', bLayer);
    }

    if (afterOverlayTileRef.current) {
      afterMap.removeLayer(afterOverlayTileRef.current);
      afterOverlayTileRef.current = null;
    }
    if (afterSpec) {
      afterOverlayTileRef.current = L.tileLayer(afterSpec.url, {
        maxNativeZoom: afterSpec.maxNativeZoom,
        maxZoom: afterSpec.maxZoom,
        opacity: 0.9,
        noWrap: true,
        bounds: WORLD_BOUNDS,
      }).addTo(afterMap);
    }

    // Sync same field geometries onto afterMap
    if (afterFieldsLayerRef.current) {
      afterFieldsLayerRef.current.clearLayers();
      for (const f of fields) {
        const ver = f.versions.find((v) => v.geometryVersionId === f.currentVersionId) ?? f.versions[0];
        if (!ver) continue;
        const isSel = f.id === selectedFieldId;
        L.polygon(ringsToLatLngs(ver.geometry.coordinates), {
          color: isSel ? '#14B8A6' : '#E2E8F0',
          weight: isSel ? 2.5 : 1.5,
          fillColor: isSel ? '#14B8A6' : '#94A3B8',
          fillOpacity: isSel ? 0.14 : 0.06,
        }).addTo(afterFieldsLayerRef.current);
      }
    }

    window.setTimeout(() => afterMap?.invalidateSize({ animate: false }), 100);
  }, [workspaceMode, compareBeforeDate, compareAfterDate, compareOverlayId, compareViewStyle, baseMapId, fields, selectedFieldId]);

  // 5. Render Saved Field Polygons & Labels (strict Section 29A symbology)
  useEffect(() => {
    const group = fieldsLayerRef.current;
    const map = mapRef.current;
    if (!group || !map) return;
    group.clearLayers();

    const boundariesEnabled = layersState.field_boundaries?.enabled ?? true;
    if (!boundariesEnabled) return;

    const isEditingSelected =
      workspaceMode === 'edit_boundaries' && editorState === 'editing_vertices';

    fields.forEach((field, idx) => {
      // Hide saved version of the field currently being vertex-edited so draft overlay replaces it cleanly
      if (isEditingSelected && field.id === selectedFieldId) return;

      const ver = field.versions.find((v) => v.geometryVersionId === field.currentVersionId) ?? field.versions[0];
      if (!ver) return;

      const isSelected = field.id === selectedFieldId;
      const latLngs = ringsToLatLngs(ver.geometry.coordinates);

      const poly = L.polygon(latLngs, {
        color: isSelected ? '#14B8A6' : '#E2E8F0',
        weight: isSelected ? 2.5 : 1.5,
        fillColor: isSelected ? '#14B8A6' : '#CBD5E1',
        fillOpacity: isSelected ? 0.15 : 0.06,
        interactive: workspaceMode === 'explore' || workspaceMode === 'inspect_data',
      });

      if (workspaceMode === 'explore') {
        poly.on('mouseover', () => {
          poly.setStyle({ weight: isSelected ? 2.8 : 2, fillOpacity: isSelected ? 0.2 : 0.14 });
        });
        poly.on('mouseout', () => {
          poly.setStyle({ weight: isSelected ? 2.5 : 1.5, fillOpacity: isSelected ? 0.15 : 0.06 });
        });
        poly.on('click', (ev) => {
          L.DomEvent.stopPropagation(ev);
          const pt: LonLat = [ev.latlng.lng, ev.latlng.lat];
          const hits = fields.filter((f) => {
            const v = f.versions.find((vr) => vr.geometryVersionId === f.currentVersionId) ?? f.versions[0];
            return v ? isPointInPolygon(pt, v.geometry) : false;
          });
          if (hits.length > 1) {
            setOverlappingChoice(hits);
          } else {
            setOverlappingChoice(null);
            onSelectField(field.id);
          }
        });
      }

      // Accessible label / numbered fallback marker
      const areaLabel = formatArea(ver.netAreaHectares * 10000, areaUnit);
      const labelHtml =
        zoomLevel >= 12 || isSelected
          ? `<div style="font-size:11px;font-weight:600;color:#F8FAFC;background:rgba(10,16,28,0.82);border:1px solid ${
              isSelected ? 'rgba(20,184,166,0.85)' : 'rgba(148,163,184,0.35)'
            };padding:2px 7px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.45);">${
              field.name
            } <span style="opacity:0.75;font-family:monospace;">(${areaLabel})</span></div>`
          : `<div style="font-size:10px;font-weight:700;color:#F8FAFC;background:rgba(10,16,28,0.88);border:1px solid rgba(20,184,166,0.7);width:20px;height:20px;border-radius:999px;display:flex;align-items:center;justify-content:center;">${
              idx + 1
            }</div>`;

      poly.bindTooltip(labelHtml, {
        permanent: true,
        direction: 'center',
        className: 'fs-map-label-reset',
        opacity: 1,
      });

      poly.addTo(group);
    });
  }, [fields, selectedFieldId, layersState, workspaceMode, editorState, zoomLevel, areaUnit]);

  // 6. Render Draft / Editable Polygon & Interactive Vertex / Midpoint Handles
  useEffect(() => {
    const group = draftLayerRef.current;
    const map = mapRef.current;
    if (!group || !map) return;
    group.clearLayers();

    if (workspaceMode !== 'edit_boundaries' || draftRings.length === 0) return;

    const isInvalid =
      editorState === 'draft_invalid' || (draftValidation !== null && !draftValidation.valid);
    const strokeColor = isInvalid ? '#F97316' : '#2DD4BF';

    // Exterior ring + interior holes
    const extOpen = stripClosingVertex(draftRings[0] ?? []);
    if (extOpen.length >= 3) {
      const polyRings = draftRings
        .filter((r) => stripClosingVertex(r).length >= 3)
        .map((r) => stripClosingVertex(r).map(toLatLng));

      L.polygon(polyRings, {
        color: strokeColor,
        weight: 2.2,
        dashArray: '6 4',
        fillColor: isInvalid ? '#EF4444' : '#14B8A6',
        fillOpacity: isInvalid ? 0.14 : 0.16,
        interactive: false,
      }).addTo(group);

      // Highlight crossing self-intersection edges clearly in red/coral
      const crossings = findSelfIntersections(extOpen);
      crossings.forEach(([e1, e2]) => {
        const seg1: [number, number][] = [toLatLng(extOpen[e1]), toLatLng(extOpen[(e1 + 1) % extOpen.length])];
        const seg2: [number, number][] = [toLatLng(extOpen[e2]), toLatLng(extOpen[(e2 + 1) % extOpen.length])];
        L.polyline(seg1, { color: '#EF4444', weight: 3.5, interactive: false }).addTo(group);
        L.polyline(seg2, { color: '#EF4444', weight: 3.5, interactive: false }).addTo(group);
      });
    } else if (extOpen.length === 2) {
      L.polyline(extOpen.map(toLatLng), {
        color: '#2DD4BF',
        weight: 2.2,
        dashArray: '6 4',
        interactive: false,
      }).addTo(group);
    }

    // Render any active hole ring in progress (<3 pts)
    for (let h = 1; h < draftRings.length; h++) {
      const holeOpen = stripClosingVertex(draftRings[h]);
      if (holeOpen.length >= 2 && holeOpen.length < 3) {
        L.polyline(holeOpen.map(toLatLng), {
          color: '#F59E0B',
          weight: 2,
          dashArray: '4 4',
          interactive: false,
        }).addTo(group);
      } else if (holeOpen.length >= 3) {
        L.polygon(holeOpen.map(toLatLng), {
          color: '#F59E0B',
          weight: 2,
          dashArray: '4 4',
          fillColor: '#0B1220',
          fillOpacity: 0.35,
          interactive: false,
        }).addTo(group);
      }
    }

    // Vertex handles (minimum 16px hit target wrapping crisp 8px dot) + midpoint insertion in edit mode
    draftRings.forEach((rawRing, ringIdx) => {
      const open = stripClosingVertex(rawRing);
      const isHole = ringIdx > 0;
      const isClosedDraft = rawRing.length > open.length && open.length >= 3;

      open.forEach((pt, vIdx) => {
        const isFirstOpenDrawPoint =
          vIdx === 0 && !isClosedDraft && open.length >= 3 && editorState !== 'editing_vertices';

        const icon = L.divIcon({
          className: 'fs-vertex-hit',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          html: `<div style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;cursor:${
            editorState === 'editing_vertices' ? 'grab' : isFirstOpenDrawPoint ? 'pointer' : 'crosshair'
          };">
            <span style="width:${isFirstOpenDrawPoint ? 11 : 8}px;height:${
            isFirstOpenDrawPoint ? 11 : 8
          }px;border-radius:999px;background:${
            isInvalid ? '#F97316' : isHole ? '#F59E0B' : '#FFFFFF'
          };border:2px solid ${
            isInvalid ? '#7C2D12' : '#0F766E'
          };box-shadow:0 1px 4px rgba(0,0,0,0.6);"></span>
          </div>`,
        });

        const marker = L.marker(toLatLng(pt), {
          icon,
          draggable: editorState === 'editing_vertices' || isClosedDraft,
        });

        marker.on('click', (ev) => {
          L.DomEvent.stopPropagation(ev);
          if (isFirstOpenDrawPoint) {
            onFinishDraftRing();
          }
        });

        // Right-click or double-click vertex to remove (if >3 vertices remain)
        marker.on('contextmenu', (ev) => {
          L.DomEvent.stopPropagation(ev);
          if (open.length > 3) {
            const nextOpen = open.filter((_, i) => i !== vIdx);
            onUpdateDraftRing(ringIdx, isClosedDraft ? closeRing(nextOpen) : nextOpen);
          }
        });

        marker.on('dragend', () => {
          const ll = marker.getLatLng();
          const nextLon = Number(Math.max(-180, Math.min(180, ll.lng)).toFixed(7));
          const nextLat = Number(Math.max(-90, Math.min(90, ll.lat)).toFixed(7));
          const nextOpen = open.map((p, i) => (i === vIdx ? ([nextLon, nextLat] as LonLat) : p));
          onUpdateDraftRing(ringIdx, isClosedDraft ? closeRing(nextOpen) : nextOpen);
        });

        marker.addTo(group);

        // Midpoint insertion handle when editing vertices on a closed ring
        if ((editorState === 'editing_vertices' || isClosedDraft) && open.length >= 3) {
          const nextPt = open[(vIdx + 1) % open.length];
          const midPt: LonLat = [
            Number(((pt[0] + nextPt[0]) / 2).toFixed(7)),
            Number(((pt[1] + nextPt[1]) / 2).toFixed(7)),
          ];
          const midIcon = L.divIcon({
            className: 'fs-midpoint-hit',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            html: `<div title="Click to insert vertex" style="width:14px;height:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
              <span style="width:7px;height:7px;border-radius:999px;background:rgba(45,212,191,0.75);border:1.5px solid #042F2E;"></span>
            </div>`,
          });
          const midMarker = L.marker(toLatLng(midPt), { icon: midIcon });
          midMarker.on('click', (ev) => {
            L.DomEvent.stopPropagation(ev);
            const inserted = [...open.slice(0, vIdx + 1), midPt, ...open.slice(vIdx + 1)];
            onUpdateDraftRing(ringIdx, closeRing(inserted));
          });
          midMarker.addTo(group);
        }
      });
    });
  }, [workspaceMode, editorState, draftRings, draftValidation]);

  // 7. NASA EONET Natural Hazard Markers
  useEffect(() => {
    const group = eonetLayerRef.current;
    if (!group) return;
    group.clearLayers();
    if (!layersState.eonet_hazards?.enabled) return;

    eonetEvents.forEach((ev) => {
      const cat = ev.categories[0]?.title || 'Hazard';
      const color = eonetColor(cat);
      const m = L.circleMarker([ev.lat, ev.lon], {
        radius: 6.5,
        color: '#0F172A',
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.9,
      });
      m.bindPopup(
        `<div style="font-size:12px;max-width:210px;">
          <strong style="color:${color}">${cat}</strong><br/>
          <strong>${ev.title}</strong><br/>
          <span>${new Date(ev.date).toLocaleDateString()}</span>
          ${ev.distanceKm !== undefined ? ` · ${ev.distanceKm} km away` : ''}
        </div>`
      );
      m.addTo(group);
    });
  }, [eonetEvents, layersState]);

  // 8. Privacy-Safe Regional Discovery City Clusters (City-level ONLY — never farm pins)
  useEffect(() => {
    const group = discoveryLayerRef.current;
    if (!group) return;
    group.clearLayers();
    const showDiscovery =
      workspaceMode === 'discovery' || layersState.regional_discovery_clusters?.enabled;
    if (!showDiscovery) return;

    regionalCities.forEach((city) => {
      const color = city.meetsThreshold ? '#14B8A6' : '#F59E0B';
      const ring = L.circle([city.approximateLat, city.approximateLon], {
        radius: 12_000, // 12 km coarse city radius circle (privacy-safe)
        color,
        weight: 1.8,
        dashArray: city.meetsThreshold ? undefined : '4 4',
        fillColor: color,
        fillOpacity: 0.14,
      });
      ring.on('click', (ev) => {
        L.DomEvent.stopPropagation(ev);
        onSelectCity(city.cityKey);
      });
      ring.bindTooltip(
        `<div style="font-size:11px;font-weight:600;color:#F8FAFC;background:rgba(10,16,28,0.88);border:1px solid ${color};padding:3px 8px;border-radius:8px;">
          ${city.cityName} · ${city.cohortCount} opted-in farms
        </div>`,
        { permanent: true, direction: 'top', className: 'fs-map-label-reset' }
      );
      ring.addTo(group);
    });
  }, [regionalCities, workspaceMode, layersState]);

  // 9. Inspect Crosshair Marker
  useEffect(() => {
    const group = inspectLayerRef.current;
    if (!group) return;
    group.clearLayers();
    if (!inspectMarker) return;

    const icon = L.divIcon({
      className: 'fs-inspect-pin',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      html: `<div style="width:24px;height:24px;border-radius:999px;border:2px solid #2DD4BF;background:rgba(20,184,166,0.22);display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(45,212,191,0.6);">
        <span style="width:6px;height:6px;border-radius:999px;background:#FFFFFF;"></span>
      </div>`,
    });
    L.marker([inspectMarker.lat, inspectMarker.lon], { icon, interactive: false }).addTo(group);
  }, [inspectMarker]);

  // 10. Interactive Distance Measurement Overlay
  useEffect(() => {
    const group = measureLayerRef.current;
    if (!group) return;
    group.clearLayers();
    if (measurePts.length === 0) return;

    measurePts.forEach((pt) => {
      L.circleMarker(toLatLng(pt), {
        radius: 4.5,
        color: '#FFFFFF',
        weight: 1.5,
        fillColor: '#38BDF8',
        fillOpacity: 1,
      }).addTo(group);
    });

    if (measurePts.length >= 2) {
      L.polyline(measurePts.map(toLatLng), {
        color: '#38BDF8',
        weight: 2.2,
        dashArray: '5 4',
      }).addTo(group);
    }
  }, [measurePts]);

  // 11. Fit Map Camera When Requested
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitTargetBounds) return;
    try {
      map.fitBounds(fitTargetBounds, { padding: [48, 48], maxZoom: 16, animate: true });
    } catch {
      // Ignore empty bounds
    }
  }, [fitRequestNonce]);

  // Distance readouts
  const measureSummary = useMemo(() => {
    if (measurePts.length < 2) return null;
    let total = 0;
    for (let i = 0; i < measurePts.length - 1; i++) {
      total += haversineDistanceM(measurePts[i], measurePts[i + 1]);
    }
    return formatPerimeter(total);
  }, [measurePts]);

  const activeLegendOverlay = useMemo(() => {
    if (layersState.gibs_imerg_precip?.enabled) return 'imerg';
    if (layersState.eonet_hazards?.enabled) return 'eonet';
    if (workspaceMode === 'discovery' || layersState.regional_discovery_clusters?.enabled) return 'discovery';
    return null;
  }, [layersState, workspaceMode]);

  return (
    <div className="relative flex-1 min-w-0 h-full overflow-hidden rounded-2xl border border-[#23324D] bg-[#070E1A]">
      {/* Primary Map Container (Split or Full Width) */}
      <div
        className={`relative w-full h-full grid ${
          workspaceMode === 'compare' && compareViewStyle === 'split'
            ? 'grid-cols-1 md:grid-cols-2 gap-0.5 bg-[#1B2A42]'
            : 'grid-cols-1'
        }`}
      >
        <div className="relative w-full h-full min-h-[360px]">
          <div
            ref={containerRef}
            className="w-full h-full z-0"
            aria-label="Field Shift interactive geospatial map"
          />

          {workspaceMode === 'compare' && (
            <div className="absolute top-3 left-3 z-[400] px-2.5 py-1 rounded-lg bg-[#0A1322]/90 border border-white/15 text-[11px] font-medium text-white pointer-events-none">
              Before: {compareBeforeDate}
            </div>
          )}
        </div>

        {/* Synchronised Second Map (Compare Mode: either Side-by-Side Split OR Clipped Swipe Layer) */}
        {workspaceMode === 'compare' && (
          <div
            className={
              compareViewStyle === 'split'
                ? 'relative w-full h-full min-h-[360px]'
                : 'absolute inset-0 z-[200] pointer-events-auto'
            }
            style={
              compareViewStyle === 'swipe'
                ? { clipPath: `inset(0 0 0 ${swipePct}%)` }
                : undefined
            }
          >
            <div ref={afterContainerRef} className="w-full h-full" aria-label="Historical after comparison map" />
            <div className="absolute top-3 right-14 z-[400] px-2.5 py-1 rounded-lg bg-[#0A1322]/90 border border-teal-400/35 text-[11px] font-medium text-teal-200 pointer-events-none">
              After: {compareAfterDate}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Swipe Slider Handle */}
      {workspaceMode === 'compare' && compareViewStyle === 'swipe' && (
        <div
          className="absolute inset-y-0 z-[410] w-0.5 bg-teal-300 pointer-events-none"
          style={{ left: `${swipePct}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-auto flex items-center justify-center w-9 h-9 rounded-full bg-[#0B1628] border-2 border-teal-400 text-teal-300 shadow-lg">
            <SplitSquareHorizontal className="w-4 h-4" />
          </div>
          <input
            type="range"
            min={5}
            max={95}
            value={swipePct}
            onChange={(e) => setSwipePct(Number(e.target.value))}
            aria-label="Comparison swipe divider"
            className="fixed opacity-0 pointer-events-none"
          />
        </div>
      )}
      {workspaceMode === 'compare' && compareViewStyle === 'swipe' && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-[420] px-3 py-1.5 rounded-full bg-[#091322]/90 border border-white/15 flex items-center gap-2.5">
          <span className="text-[11px] text-slate-300">Swipe dates</span>
          <input
            type="range"
            min={5}
            max={95}
            value={swipePct}
            onChange={(e) => setSwipePct(Number(e.target.value))}
            aria-label="Adjust before and after swipe position"
            className="w-36 accent-teal-400 cursor-ew-resize"
          />
        </div>
      )}

      {/* Tile Provider Failure Banner (never blocks boundary editing) */}
      {tileErrorNotice && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[450] max-w-md px-3.5 py-2 rounded-xl bg-amber-950/90 border border-amber-400/50 text-amber-100 text-xs flex items-center gap-2 shadow-lg">
          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{tileErrorNotice}</span>
        </div>
      )}

      {/* Overlapping Field Disambiguation Popover */}
      {overlappingChoice && overlappingChoice.length > 1 && (
        <div className="absolute top-14 left-4 z-[460] w-64 p-2.5 rounded-xl bg-[#0A1322]/95 border border-teal-400/40 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-teal-300">
            <span>Select overlapping field ({overlappingChoice.length})</span>
            <button
              type="button"
              onClick={() => setOverlappingChoice(null)}
              className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
            >
              ×
            </button>
          </div>
          {overlappingChoice.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                onSelectField(f.id);
                setOverlappingChoice(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-teal-500/20 text-xs text-slate-100 flex items-center justify-between cursor-pointer"
            >
              <span className="truncate font-medium">{f.name}</span>
              <span className="text-[10px] text-slate-400">{f.cropName || 'No crop'}</span>
            </button>
          ))}
        </div>
      )}

      {/* Top-Right Floating Vertical Zoom + Fit + Locate + Measure Controls (within safe margin) */}
      <div className="absolute top-3 right-3 z-[420] flex flex-col gap-1.5">
        <div className="flex flex-col rounded-xl overflow-hidden bg-[#0A1322]/90 border border-[#2C3E5D] backdrop-blur-md shadow-lg">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            title="Zoom in"
            aria-label="Zoom in"
            className="w-9 h-9 flex items-center justify-center text-slate-200 hover:bg-white/10 hover:text-teal-300 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="h-px bg-[#23324D]" />
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            title="Zoom out"
            aria-label="Zoom out"
            className="w-9 h-9 flex items-center justify-center text-slate-200 hover:bg-white/10 hover:text-teal-300 transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={selectedFieldId ? onFitSelected : onFitAll}
          title={selectedFieldId ? 'Fit selected field' : 'Fit all fields'}
          aria-label={selectedFieldId ? 'Fit selected field' : 'Fit all fields'}
          className="w-9 h-9 rounded-xl bg-[#0A1322]/90 border border-[#2C3E5D] text-slate-200 hover:text-teal-300 hover:border-teal-400/50 backdrop-blur-md flex items-center justify-center shadow-lg cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onLocateMe}
          disabled={locateBusy}
          title="Locate me (uses browser permission once)"
          aria-label="Locate my position"
          className="w-9 h-9 rounded-xl bg-[#0A1322]/90 border border-[#2C3E5D] text-slate-200 hover:text-teal-300 hover:border-teal-400/50 backdrop-blur-md flex items-center justify-center shadow-lg cursor-pointer disabled:opacity-50"
        >
          <LocateFixed className={`w-4 h-4 ${locateBusy ? 'animate-pulse text-teal-300' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onToggleMeasure}
          title="Measure distance on map"
          aria-label="Toggle distance measurement tool"
          className={`w-9 h-9 rounded-xl border backdrop-blur-md flex items-center justify-center shadow-lg cursor-pointer transition-colors ${
            measureActive
              ? 'bg-sky-500/25 border-sky-400 text-sky-200'
              : 'bg-[#0A1322]/90 border-[#2C3E5D] text-slate-200 hover:text-teal-300'
          }`}
        >
          <Ruler className="w-4 h-4" />
        </button>
      </div>

      {/* Live Cursor / Draft / Measure Status Readout (Top-Left safe margin) */}
      <div className="absolute top-3 left-3 z-[410] flex flex-wrap items-center gap-2 pointer-events-none">
        {workspaceMode === 'edit_boundaries' && (
          <div className="px-3 py-1.5 rounded-xl bg-[#0A1322]/92 border border-teal-400/45 text-xs text-slate-100 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="font-semibold text-teal-300">
              {drawingSubMode === 'hole'
                ? 'Exclusion Hole Mode'
                : drawingSubMode === 'rectangle'
                  ? 'Rectangle Draw Mode'
                  : editorState === 'editing_vertices'
                    ? 'Editing Vertices (Drag points · Click midpoints to add)'
                    : 'Draw Boundary Mode'}
            </span>
            {draftValidation && draftValidation.vertexCount >= 3 && (
              <span className="font-mono text-[11px] text-slate-300 border-l border-white/15 pl-2">
                Est. {formatArea(draftValidation.netAreaM2, areaUnit)} ·{' '}
                {formatPerimeter(draftValidation.perimeterM)}
              </span>
            )}
          </div>
        )}

        {workspaceMode === 'inspect_data' && (
          <div className="px-3 py-1.5 rounded-xl bg-[#0A1322]/92 border border-sky-400/45 text-xs text-sky-100 flex items-center gap-2 shadow-lg">
            <Crosshair className="w-3.5 h-3.5 text-sky-300" />
            <span>Click any parcel or point to inspect weather, soil grid & DEM slope ({observationDate})</span>
          </div>
        )}

        {measureActive && (
          <div className="px-3 py-1.5 rounded-xl bg-[#0A1322]/92 border border-sky-400/50 text-xs text-sky-100 flex items-center gap-2 shadow-lg pointer-events-auto">
            <span>
              Distance tool: {measurePts.length === 0 ? 'Click points' : measureSummary || 'Add 2nd point'}
            </span>
            {measurePts.length > 0 && (
              <button
                type="button"
                onClick={() => setMeasurePts([])}
                className="underline text-[11px] text-sky-300 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Legend + Live Coordinates Strip (never overlaps attribution) */}
      <div className="absolute bottom-7 left-3 z-[410] flex flex-col gap-1.5 pointer-events-none max-w-[320px]">
        {activeLegendOverlay === 'imerg' && (
          <div className="px-3 py-2 rounded-xl bg-[#0A1322]/90 border border-[#2C3E5D] text-[11px] text-slate-200 backdrop-blur-md">
            <div className="font-semibold text-white mb-1">GPM IMERG Precipitation Rate (mm/hr)</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8]" /> 0.1–2</span>
              <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" /> 2–10</span>
              <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-[#9333EA]" /> 10–25</span>
              <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]" /> 25+</span>
            </div>
          </div>
        )}

        {activeLegendOverlay === 'eonet' && (
          <div className="px-3 py-1.5 rounded-xl bg-[#0A1322]/90 border border-[#2C3E5D] text-[11px] text-slate-200 backdrop-blur-md flex items-center gap-2.5 flex-wrap">
            <span className="font-semibold text-white">EONET:</span>
            <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#EF4444]" /> Fire</span>
            <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#38BDF8]" /> Storm</span>
            <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#22C7B8]" /> Flood</span>
          </div>
        )}

        {activeLegendOverlay === 'discovery' && (
          <div className="px-3 py-1.5 rounded-xl bg-[#0A1322]/90 border border-[#2C3E5D] text-[11px] text-slate-200 backdrop-blur-md flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full border border-teal-400 bg-teal-400/30" /> ≥ 3 farms (Cohort)</span>
            <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full border border-dashed border-amber-400 bg-amber-400/20" /> &lt; 3 farms (Private)</span>
          </div>
        )}

        {/* Boundary Symbology Legend */}
        <div className="px-2.5 py-1 rounded-lg bg-[#0A1322]/85 border border-white/10 text-[10.5px] text-slate-300 flex items-center gap-2.5 flex-wrap backdrop-blur-sm">
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#14B8A6] inline-block" /> Selected
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#E2E8F0] inline-block" /> Saved
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-0.5 border-b border-dashed border-[#2DD4BF] inline-block" /> Draft
          </span>
          {cursorCoords && (
            <span className="font-mono text-slate-400 border-l border-white/15 pl-2">
              {cursorCoords.lat.toFixed(4)}°, {cursorCoords.lon.toFixed(4)}° · Z{zoomLevel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
