import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { EonetEvent, PlaceSelection } from '../types';
import { getGibsLayers } from '../services/gibs';
import { DataBadge } from './DataBadge';
import { Layers } from 'lucide-react';

interface MapViewProps {
  place: PlaceSelection;
  events: EonetEvent[];
}

function colorForCategory(catTitle: string): string {
  const lower = catTitle.toLowerCase();
  if (lower.includes('wildfire') || lower.includes('fire')) return '#EF4444';
  if (lower.includes('storm') || lower.includes('cyclone')) return '#4C8DFF';
  if (lower.includes('volcano')) return '#F97316';
  if (lower.includes('flood')) return '#22C7B8';
  return '#F5B83D';
}

export const MapView: React.FC<MapViewProps> = ({ place, events }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayLayerRef = useRef<L.LayerGroup | null>(null);
  const layers = getGibsLayers();
  const [activeLayerId, setActiveLayerId] = useState<string>(layers[0].id);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [place.lat, place.lon],
      zoom: 6,
      zoomControl: true,
    });

    // Base OSM layer underneath GIBS overlays for coastline & label clarity
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    const overlayGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    overlayLayerRef.current = overlayGroup;

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      overlayLayerRef.current = null;
    };
  }, []);

  // Update active GIBS tile layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const cfg = layers.find((l) => l.id === activeLayerId) ?? layers[0];
    if (cfg.id !== 'osm_base') {
      const gibsLayer = L.tileLayer(cfg.tileUrl, {
        attribution: cfg.attribution,
        maxNativeZoom: cfg.maxZoom,
        maxZoom: 14,
        opacity: cfg.opacity,
      });
      gibsLayer.addTo(map);
      tileLayerRef.current = gibsLayer;
    }
  }, [activeLayerId]);

  // Update target pin, 300km ring, and EONET event markers
  useEffect(() => {
    const map = mapRef.current;
    const group = overlayLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();
    map.setView([place.lat, place.lon], 6, { animate: true });

    // 300 km hazard radius ring
    L.circle([place.lat, place.lon], {
      radius: 300_000,
      color: '#4C8DFF',
      weight: 1.5,
      dashArray: '6 4',
      fillColor: '#4C8DFF',
      fillOpacity: 0.06,
    }).addTo(group);

    // Target location marker
    const targetMarker = L.circleMarker([place.lat, place.lon], {
      radius: 8,
      color: '#FFFFFF',
      weight: 2.5,
      fillColor: '#4C8DFF',
      fillOpacity: 1,
    }).addTo(group);
    targetMarker.bindPopup(
      `<div style="font-size:12px;"><strong>${place.name}</strong><br/>${place.lat.toFixed(
        3
      )}°, ${place.lon.toFixed(3)}°<br/><span style="opacity:0.8">300 km hazard scan radius</span></div>`
    );

    // EONET events
    for (const ev of events) {
      const cat = ev.categories[0]?.title || 'Natural Event';
      const color = colorForCategory(cat);
      const marker = L.circleMarker([ev.lat, ev.lon], {
        radius: 7,
        color: '#0B0F1A',
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.92,
      }).addTo(group);
      marker.bindPopup(
        `<div style="font-size:12px;max-width:220px;">
          <strong style="color:${color}">${cat}</strong><br/>
          <strong>${ev.title}</strong><br/>
          <span>${new Date(ev.date).toLocaleDateString()}</span>
          ${ev.distanceKm !== undefined ? ` · <span>${ev.distanceKm} km away</span>` : ''}
        </div>`
      );
    }
  }, [place.lat, place.lon, place.name, events]);

  const activeCfg = layers.find((l) => l.id === activeLayerId) ?? layers[0];

  return (
    <div className="anchor-card overflow-hidden">
      <div className="p-4 sm:px-6 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="text-base font-display font-semibold text-[var(--text-primary)]">
            Satellite & Hazard Map
          </h3>
          <DataBadge dataset="NASA GIBS WMTS + EONET v3" />
        </div>

        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--text-secondary)] shrink-0" aria-hidden="true" />
          <label htmlFor="gibs-layer-select" className="sr-only">
            Satellite map layer
          </label>
          <select
            id="gibs-layer-select"
            value={activeLayerId}
            onChange={(e) => setActiveLayerId(e.target.value)}
            className="min-h-[38px] px-3 rounded-lg text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer"
          >
            {layers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative h-[340px] sm:h-[380px] w-full">
        <div ref={containerRef} className="w-full h-full z-0" aria-label="Interactive NASA GIBS and EONET map" />
      </div>

      <div className="px-4 sm:px-6 py-2.5 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)]">
        <span>{activeCfg.description}</span>
        <span>
          Wildfire (red) · Storm (blue) · Volcano (orange) · Flood (teal) · Dashed ring: 300 km
        </span>
      </div>
    </div>
  );
};
