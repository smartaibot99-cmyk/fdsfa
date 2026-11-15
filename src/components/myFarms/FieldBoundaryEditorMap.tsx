import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle,
  Check,
  Edit3,
  Info,
  Layers,
  PenTool,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import {
  BaseMapId,
  FarmGeoJsonGeometry,
  GeoJsonPolygonGeometry,
  LonLat,
  MapFieldRecord,
} from '../../types/maps';
import { PortfolioFieldRecord } from '../../types/myFarms';
import { getBaseMapTileSpec } from '../../services/mapsApi';
import {
  closeRing,
  computeRingCentroid,
  stripClosingVertex,
  validatePolygonGeometry,
} from '../../lib/mapGeometry';
import { formatArea } from '../../lib/myFarmsEngine';
import { AreaUnit } from '../../types/farm';

interface FieldBoundaryEditorMapProps {
  center: { lat: number; lon: number } | null;
  farmGeometry: FarmGeoJsonGeometry | null;
  fields: PortfolioFieldRecord[];
  selectedFieldId?: string | null;
  areaUnit?: AreaUnit;
  heightClassName?: string;
  initialMode?: 'view' | 'draw' | 'edit' | 'pick_point';
  editingFieldId?: string | null;
  onSelectField?: (fieldId: string) => void;
  onPickPoint?: (lat: number, lon: number) => void;
  onSavePolygon?: (payload: {
    geometry: GeoJsonPolygonGeometry;
    areaHa: number;
    perimeterM: number;
    centroid: { lat: number; lon: number };
    mode: 'draw' | 'edit';
    editingFieldId?: string | null;
    editReason?: string;
  }) => Promise<void> | void;
  onCancelDraft?: () => void;
}

export const FieldBoundaryEditorMap: React.FC<FieldBoundaryEditorMapProps> = ({
  center,
  farmGeometry,
  fields,
  selectedFieldId = null,
  areaUnit = 'hectares',
  heightClassName = 'h-[420px]',
  initialMode = 'view',
  editingFieldId = null,
  onSelectField,
  onPickPoint,
  onSavePolygon,
  onCancelDraft,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const displayGroupRef = useRef<L.LayerGroup | null>(null);
  const editGroupRef = useRef<L.LayerGroup | null>(null);

  const [baseMap, setBaseMap] = useState<BaseMapId>('satellite');
  const [showScaleCaveat, setShowScaleCaveat] = useState(false);
  const [editorMode, setEditorMode] = useState<'view' | 'draw' | 'edit' | 'pick_point'>(initialMode);
  const [activeEditFieldId, setActiveEditFieldId] = useState<string | null>(editingFieldId);
  const [editReason, setEditReason] = useState('');
  const [saving, setSaving] = useState(false);

  // Vertex stack for undo/redo during draw or edit
  const [vertices, setVertices] = useState<LonLat[]>([]);
  const [undoStack, setUndoStack] = useState<LonLat[][]>([]);
  const [redoStack, setRedoStack] = useState<LonLat[][]>([]);

  useEffect(() => {
    setEditorMode(initialMode);
  }, [initialMode]);

  // Seed vertices when entering edit mode for a specific field
  useEffect(() => {
    if (editorMode === 'edit' && activeEditFieldId) {
      const target = fields.find((f) => f.id === activeEditFieldId);
      const ring = target?.versions[0]?.geometry?.coordinates?.[0];
      if (ring && ring.length >= 3) {
        setVertices(stripClosingVertex(ring));
        setUndoStack([]);
        setRedoStack([]);
      }
    }
  }, [editorMode, activeEditFieldId, fields]);

  const commitVertices = (next: LonLat[]) => {
    setUndoStack((prev) => [...prev.slice(-24), vertices]);
    setRedoStack([]);
    setVertices(next);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, vertices]);
    setUndoStack((u) => u.slice(0, -1));
    setVertices(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, vertices]);
    setRedoStack((r) => r.slice(0, -1));
    setVertices(next);
  };

  const liveValidation = useMemo(() => {
    if (editorMode !== 'draw' && editorMode !== 'edit') return null;
    if (vertices.length < 3) {
      return {
        valid: false,
        issues: [{ code: 'TOO_FEW_VERTICES', severity: 'error' as const, message: `Add ${3 - vertices.length} more point(s) to close polygon.` }],
        netAreaM2: 0,
        perimeterM: 0,
        centroid: null,
      };
    }
    const geom: GeoJsonPolygonGeometry = { type: 'Polygon', coordinates: [closeRing(vertices)] };
    return validatePolygonGeometry(
      geom,
      fields as unknown as MapFieldRecord[],
      editorMode === 'edit' ? activeEditFieldId : null
    );
  }, [vertices, editorMode, fields, activeEditFieldId]);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const startLat = center?.lat ?? 44.855;
    const startLon = center?.lon ?? -123.15;
    const map = L.map(containerRef.current, {
      center: [startLat, startLon],
      zoom: center ? 14 : 4,
      zoomControl: false,
      attributionControl: true,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

    displayGroupRef.current = L.layerGroup().addTo(map);
    editGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const timer = window.setTimeout(() => map.invalidateSize(), 150);
    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update tile layer when baseMap changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const spec = getBaseMapTileSpec(baseMap);
    const layer = L.tileLayer(spec.url, {
      attribution: spec.attribution,
      maxZoom: spec.maxZoom,
    }).addTo(map);
    tileLayerRef.current = layer;
  }, [baseMap]);

  // Re-center map when center prop changes significantly in view mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    if (fields.length === 0 && !farmGeometry) {
      map.setView([center.lat, center.lon], 14, { animate: true });
    }
  }, [center?.lat, center?.lon]);

  // Render saved farm boundary + saved fields
  useEffect(() => {
    const map = mapRef.current;
    const group = displayGroupRef.current;
    if (!map || !group) return;
    group.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. Render whole-farm perimeter outline if present
    if (farmGeometry) {
      const rings =
        farmGeometry.type === 'Polygon'
          ? [farmGeometry.coordinates[0]]
          : farmGeometry.coordinates.map((p) => p[0]);
      for (const ring of rings) {
        if (!ring || ring.length < 3) continue;
        const latLngs = ring.map(([lon, lat]) => [lat, lon] as [number, number]);
        latLngs.forEach((ll) => bounds.extend(ll));
        L.polygon(latLngs, {
          color: '#38BDF8',
          weight: 2,
          dashArray: '6 4',
          fillColor: '#0EA5E9',
          fillOpacity: fields.length > 0 ? 0.05 : 0.22,
          interactive: false,
        }).addTo(group);
      }
    }

    // 2. Render field polygons
    for (const field of fields) {
      if (editorMode === 'edit' && field.id === activeEditFieldId) continue;
      const ring = field.versions[0]?.geometry?.coordinates?.[0];
      if (!ring || ring.length < 3) continue;
      const latLngs = ring.map(([lon, lat]) => [lat, lon] as [number, number]);
      latLngs.forEach((ll) => bounds.extend(ll));

      const isSel = selectedFieldId === field.id;
      const stroke =
        field.status === 'Needs Review'
          ? '#F59E0B'
          : isSel
            ? '#20EDA0'
            : '#22C55E';

      const poly = L.polygon(latLngs, {
        color: stroke,
        weight: isSel ? 3 : 2,
        fillColor: stroke,
        fillOpacity: isSel ? 0.34 : 0.2,
      }).addTo(group);

      const areaHa = field.versions[0]?.netAreaHectares ?? 0;
      poly.bindTooltip(`${field.name} · ${formatArea(areaHa, areaUnit)}`, {
        sticky: true,
        direction: 'top',
      });

      poly.on('click', (ev) => {
        if (editorMode === 'view' && onSelectField) {
          L.DomEvent.stopPropagation(ev);
          onSelectField(field.id);
        }
      });
    }

    if (center && fields.length === 0 && !farmGeometry) {
      L.circleMarker([center.lat, center.lon], {
        radius: 7,
        color: '#20EDA0',
        fillColor: '#0EA5E9',
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(group);
    }

    if (bounds.isValid() && editorMode === 'view') {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 });
    }
  }, [farmGeometry, fields, selectedFieldId, editorMode, activeEditFieldId, center, areaUnit]);

  // Render active drawing/editing vertices & handles
  useEffect(() => {
    const group = editGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (editorMode !== 'draw' && editorMode !== 'edit') return;

    if (vertices.length >= 2) {
      const latLngs = vertices.map(([lon, lat]) => [lat, lon] as [number, number]);
      const hasError = liveValidation ? liveValidation.issues.some((i) => i.severity === 'error') : false;

      if (vertices.length >= 3) {
        L.polygon(latLngs, {
          color: hasError ? '#EF4444' : '#20EDA0',
          weight: 2.5,
          fillColor: hasError ? '#EF4444' : '#20EDA0',
          fillOpacity: 0.24,
        }).addTo(group);
      } else {
        L.polyline(latLngs, { color: '#20EDA0', weight: 2.5, dashArray: '4 4' }).addTo(group);
      }
    }

    vertices.forEach(([lon, lat], idx) => {
      const marker = L.marker([lat, lon], {
        draggable: true,
        icon: L.divIcon({
          className: 'anchor-vertex-handle',
          html: `<div style="width:12px;height:12px;border-radius:9999px;background:${idx === 0 ? '#F59E0B' : '#FFFFFF'};border:2.5px solid #047857;box-shadow:0 1px 4px rgba(0,0,0,0.45);cursor:grab;"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        }),
      }).addTo(group);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const next = vertices.map((v, i) =>
          i === idx ? ([Number(pos.lng.toFixed(6)), Number(pos.lat.toFixed(6))] as LonLat) : v
        );
        commitVertices(next);
      });
    });
  }, [vertices, editorMode, liveValidation]);

  // Map click handler for drawing / picking coordinate
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      const pt: LonLat = [Number(e.latlng.lng.toFixed(6)), Number(e.latlng.lat.toFixed(6))];
      if (editorMode === 'pick_point' && onPickPoint) {
        onPickPoint(pt[1], pt[0]);
      } else if (editorMode === 'draw') {
        commitVertices([...vertices, pt]);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [editorMode, vertices, onPickPoint]);

  const handleSave = async () => {
    if (!onSavePolygon || !liveValidation || !liveValidation.valid || vertices.length < 3) return;
    const closed = closeRing(vertices);
    const geom: GeoJsonPolygonGeometry = { type: 'Polygon', coordinates: [closed] };
    const centroid = liveValidation.centroid ?? computeRingCentroid(closed) ?? { lat: closed[0][1], lon: closed[0][0] };
    setSaving(true);
    try {
      await onSavePolygon({
        geometry: geom,
        areaHa: Number((liveValidation.netAreaM2 / 10000).toFixed(2)),
        perimeterM: Math.round(liveValidation.perimeterM),
        centroid,
        mode: editorMode === 'edit' ? 'edit' : 'draw',
        editingFieldId: editorMode === 'edit' ? activeEditFieldId : null,
        editReason: editReason.trim() || undefined,
      });
      setVertices([]);
      setUndoStack([]);
      setRedoStack([]);
      setEditReason('');
      setEditorMode('view');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setVertices([]);
    setUndoStack([]);
    setRedoStack([]);
    setEditReason('');
    setEditorMode('view');
    onCancelDraft?.();
  };

  const errorIssues = liveValidation?.issues.filter((i) => i.severity === 'error') ?? [];
  const warningIssues = liveValidation?.issues.filter((i) => i.severity === 'warning') ?? [];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Compact Toolbar */}
      <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-elevated)]/45 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {editorMode === 'view' && onSavePolygon && (
            <>
              <button
                type="button"
                onClick={() => {
                  setVertices([]);
                  setUndoStack([]);
                  setRedoStack([]);
                  setEditorMode('draw');
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--accent)] text-white font-semibold hover:brightness-110 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Draw Field Boundary
              </button>
              {selectedFieldId && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveEditFieldId(selectedFieldId);
                    setEditorMode('edit');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-elevated)] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Selected Vertices
                </button>
              )}
            </>
          )}

          {(editorMode === 'draw' || editorMode === 'edit') && (
            <>
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300 px-1.5">
                <PenTool className="w-3.5 h-3.5" />
                {editorMode === 'draw' ? 'Click map to place corners' : 'Drag corners to reshape'}
              </span>
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                title="Undo last vertex edit"
                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-surface)] disabled:opacity-40 cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                title="Redo vertex edit"
                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-surface)] disabled:opacity-40 cursor-pointer"
              >
                <Redo2 className="w-3.5 h-3.5" />
                Redo
              </button>
              <button
                type="button"
                onClick={() => commitVertices([])}
                disabled={vertices.length === 0}
                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-rose-600 dark:text-rose-400 disabled:opacity-40 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </>
          )}

          {editorMode === 'pick_point' && (
            <span className="text-xs font-medium text-sky-700 dark:text-sky-300 px-1.5">
              Click anywhere on the map to set farm center coordinates
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setBaseMap((m) => (m === 'satellite' ? 'street' : 'satellite'))}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            {baseMap === 'satellite' ? 'Satellite' : 'Street'}
          </button>
          <button
            type="button"
            onClick={() => setShowScaleCaveat((v) => !v)}
            aria-expanded={showScaleCaveat}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            Scale &amp; coverage
          </button>
        </div>
      </div>

      {showScaleCaveat && (
        <div className="px-3.5 py-2 border-b border-[var(--border)] bg-sky-500/10 text-[11.5px] text-sky-900 dark:text-sky-200 flex items-start justify-between gap-3">
          <span>
            <strong>Measurement &amp; resolution note:</strong> Field boundaries compute geodesic area in WGS84 (Chamberlain–Duquette spherical excess). NASA POWER (0.5°) &amp; Open-Meteo ERA5 (~11 km) cells provide regional climate context—not plant-level measurements.
          </span>
          <button type="button" onClick={() => setShowScaleCaveat(false)} className="shrink-0 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Map Canvas */}
      <div className={`relative w-full ${heightClassName}`}>
        <div ref={containerRef} className="w-full h-full z-10" />
      </div>

      {/* Live Draw / Edit Save Footer */}
      {(editorMode === 'draw' || editorMode === 'edit') && (
        <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-elevated)]/45 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-semibold text-[var(--text-primary)] tabular-nums">
                {vertices.length} vertices ·{' '}
                {liveValidation && liveValidation.netAreaM2 > 0
                  ? `${formatArea(liveValidation.netAreaM2 / 10000, areaUnit)} · ${Math.round(liveValidation.perimeterM)} m perimeter`
                  : 'Place at least 3 corners'}
              </div>
              {errorIssues.map((iss, idx) => (
                <div key={idx} className="text-rose-700 dark:text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {iss.message}
                </div>
              ))}
              {warningIssues.map((iss, idx) => (
                <div key={idx} className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {iss.message}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {editorMode === 'edit' && (
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Optional reason for edit…"
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] w-44"
                />
              )}
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!liveValidation?.valid || saving || vertices.length < 3}
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-45 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save Boundary'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
