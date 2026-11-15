import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Compass, Loader2, MapPin, Search } from 'lucide-react';
import { FarmLocationInfo, PlaceSelection } from '../../types';
import { reverseGeocode, searchPlaces } from '../../services/geocode';
import { useToast } from '../Toast';

interface FarmLocationPickerProps {
  value: FarmLocationInfo;
  onChange: (next: FarmLocationInfo) => void;
}

export const FarmLocationPicker: React.FC<FarmLocationPickerProps> = ({ value, onChange }) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState(value.locationLabel || '');
  const [suggestions, setSuggestions] = useState<PlaceSelection[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [manualOpen, setManualOpen] = useState(value.entryMode === 'manual');
  const [latDraft, setLatDraft] = useState(value.lat !== null ? String(value.lat) : '');
  const [lonDraft, setLonDraft] = useState(value.lon !== null ? String(value.lon) : '');

  const debounceRef = useRef<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const latestValueRef = useRef(value);
  latestValueRef.current = value;

  useEffect(() => {
    setLatDraft(value.lat !== null ? String(value.lat) : '');
    setLonDraft(value.lon !== null ? String(value.lon) : '');
    if (value.locationLabel && !searchQuery) {
      setSearchQuery(value.locationLabel);
    }
  }, [value.lat, value.lon, value.locationLabel]);

  // Initialize lightweight Leaflet picker reusing Anchor's Leaflet dependency
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const initLat = value.lat ?? 20;
    const initLon = value.lon ?? 0;
    const map = L.map(mapContainerRef.current, {
      center: [initLat, initLon],
      zoom: value.lat !== null ? 9 : 2,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    map.on('click', async (ev: L.LeafletMouseEvent) => {
      const rLat = Number(ev.latlng.lat.toFixed(4));
      const rLon = Number(ev.latlng.lng.toFixed(4));
      const p = await reverseGeocode(rLat, rLon);
      setSearchQuery(p.name);
      onChange({
        ...latestValueRef.current,
        locationLabel: p.name,
        regionOrAddress: p.displayName,
        lat: rLat,
        lon: rLon,
        country: p.country,
        entryMode: 'map',
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync pin marker when coordinates change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    if (value.lat !== null && value.lon !== null) {
      map.setView([value.lat, value.lon], Math.max(map.getZoom(), 7), { animate: true });
      const marker = L.circleMarker([value.lat, value.lon], {
        radius: 8,
        color: '#FFFFFF',
        weight: 2.5,
        fillColor: '#2E9E4F',
        fillOpacity: 1,
      }).addTo(map);
      markerRef.current = marker;
    }
  }, [value.lat, value.lon]);

  const handleSearchInput = (txt: string) => {
    setSearchQuery(txt);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (txt.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchPlaces(txt);
        setSuggestions(res);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 650);
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setManualOpen(true);
      showToast('GPS is unavailable in this browser — enter location manually below.', 'info');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const rLat = Number(pos.coords.latitude.toFixed(4));
        const rLon = Number(pos.coords.longitude.toFixed(4));
        const p = await reverseGeocode(rLat, rLon);
        setSearchQuery(p.name);
        onChange({
          ...value,
          locationLabel: p.name,
          regionOrAddress: p.displayName,
          lat: rLat,
          lon: rLon,
          country: p.country,
          entryMode: 'gps',
        });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setManualOpen(true);
        showToast('Location permission declined or unavailable — manual entry is ready below.', 'info');
      },
      { timeout: 8000 }
    );
  };

  const applyManualCoords = (nextLatStr: string, nextLonStr: string) => {
    setLatDraft(nextLatStr);
    setLonDraft(nextLonStr);
    const parsedLat = nextLatStr.trim() === '' ? null : Number(nextLatStr);
    const parsedLon = nextLonStr.trim() === '' ? null : Number(nextLonStr);
    const validLat = parsedLat !== null && !Number.isNaN(parsedLat) && parsedLat >= -90 && parsedLat <= 90;
    const validLon = parsedLon !== null && !Number.isNaN(parsedLon) && parsedLon >= -180 && parsedLon <= 180;
    onChange({
      ...value,
      lat: validLat ? Number(parsedLat!.toFixed(4)) : null,
      lon: validLon ? Number(parsedLon!.toFixed(4)) : null,
      entryMode: 'manual',
    });
  };

  return (
    <div className="space-y-4">
      {/* Place Search + Optional GPS + Manual toggle */}
      <div className="space-y-2 relative">
        <label htmlFor="farm-location-search" className="block text-xs font-medium text-[var(--text-secondary)]">
          Search town, district, or region (or click the map below)
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="farm-location-search"
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="e.g. Nakuru, Salinas Valley, Pune..."
            className="w-full min-h-[44px] pl-9 pr-9 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
          />
          {searching && (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)] absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-[74px] z-30 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl max-h-52 overflow-y-auto divide-y divide-[var(--border)]">
            {suggestions.map((s, idx) => (
              <li key={`${s.lat}-${s.lon}-${idx}`}>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(s.name);
                    setSuggestions([]);
                    onChange({
                      ...value,
                      locationLabel: s.name,
                      regionOrAddress: s.displayName,
                      lat: Number(s.lat.toFixed(4)),
                      lon: Number(s.lon.toFixed(4)),
                      country: s.country,
                      entryMode: 'search',
                    });
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] cursor-pointer"
                >
                  <div className="font-medium">{s.name}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] truncate">{s.displayName}</div>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleUseGps}
            disabled={locating}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--teal)] hover:underline cursor-pointer min-h-[36px]"
          >
            <Compass className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{locating ? 'Reading GPS...' : 'Use GPS (optional)'}</span>
          </button>
          <span className="text-[var(--border)]" aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setManualOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline cursor-pointer min-h-[36px]"
          >
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{manualOpen ? 'Hide manual entry' : 'Enter region / coordinates manually'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Pin Selector */}
      <div className="rounded-xl overflow-hidden border border-[var(--border)]">
        <div ref={mapContainerRef} className="w-full h-52 z-0" aria-label="Click map to pin farm location" />
        <div className="px-3 py-2 bg-[var(--bg-elevated)] border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)]">
          <span>Click anywhere on the map to pin your farm.</span>
          <span className="font-mono tabular-nums">
            {value.lat !== null && value.lon !== null
              ? `${value.lat.toFixed(4)}°, ${value.lon.toFixed(4)}°`
              : 'No coordinates pinned'}
          </span>
        </div>
      </div>

      {/* Manual Location Entry (GPS never required) */}
      {(manualOpen || (value.lat === null && value.lon === null)) && (
        <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-4 space-y-3">
          <div className="text-xs font-semibold text-[var(--text-primary)]">
            Manual Location Entry (no GPS needed)
          </div>
          <div className="space-y-1.5">
            <label htmlFor="manual-region" className="block text-xs text-[var(--text-secondary)]">
              Village, district, state, or region name
            </label>
            <input
              id="manual-region"
              type="text"
              value={value.regionOrAddress}
              onChange={(e) =>
                onChange({
                  ...value,
                  regionOrAddress: e.target.value,
                  locationLabel: value.locationLabel || e.target.value,
                  entryMode: 'manual',
                })
              }
              placeholder="e.g. Rift Valley, Nakuru County, Kenya"
              className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="manual-lat" className="block text-xs text-[var(--text-secondary)]">
                Latitude (-90 to 90, optional)
              </label>
              <input
                id="manual-lat"
                type="number"
                step="any"
                min={-90}
                max={90}
                value={latDraft}
                onChange={(e) => applyManualCoords(e.target.value, lonDraft)}
                placeholder="e.g. -0.3031"
                className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-sm font-mono tabular-nums text-[var(--text-primary)]"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="manual-lon" className="block text-xs text-[var(--text-secondary)]">
                Longitude (-180 to 180, optional)
              </label>
              <input
                id="manual-lon"
                type="number"
                step="any"
                min={-180}
                max={180}
                value={lonDraft}
                onChange={(e) => applyManualCoords(latDraft, e.target.value)}
                placeholder="e.g. 36.0800"
                className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-sm font-mono tabular-nums text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
