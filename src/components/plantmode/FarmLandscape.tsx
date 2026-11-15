import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Compass,
  Eye,
  Loader2,
  MapPin,
  Search,
  ZoomOut,
} from 'lucide-react';
import hotspotsJson from '../../data/plantHotspots.json';
import cropsJson from '../../data/crops.json';
import { CropEntry, PlaceSelection, PlantHotspot, SeasonKey } from '../../types';
import { reverseGeocode, searchPlaces } from '../../services/geocode';
import { useToast } from '../Toast';
import { ParallaxLayer } from './ParallaxLayer';
import { MistLayer } from './MistLayer';
import { Wildlife } from './Wildlife';
import { CropSprites } from './CropSprites';
import { Hotspot } from './Hotspot';
import { PlantModeToggle } from './PlantModeToggle';
import { PlantProfilePanel } from './PlantProfilePanel';
import { PlantGuideDrawer } from './PlantGuideDrawer';

const HOTSPOTS = hotspotsJson as PlantHotspot[];
const CROPS = cropsJson as CropEntry[];

const DEFAULT_FARM_LOCATION: PlaceSelection = {
  name: 'Shenandoah Valley, Virginia',
  displayName: 'Shenandoah Valley Farmstead, Virginia, United States',
  lat: 38.4496,
  lon: -78.8689,
  country: 'United States',
};

type DayPhase = 'sunrise' | 'day' | 'sunset' | 'night';

function getLocalDayPhase(): DayPhase {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) return 'sunrise';
  if (hour >= 8 && hour < 18) return 'day';
  if (hour >= 18 && hour < 21) return 'sunset';
  return 'night';
}

export const FarmLandscape: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ w: 1280, h: 760 });

  const cropsById = useMemo(() => {
    const map: Record<string, CropEntry> = {};
    for (const c of CROPS) map[c.id] = c;
    return map;
  }, []);

  // Search / location state
  const [selectedPlace, setSelectedPlace] = useState<PlaceSelection>(DEFAULT_FARM_LOCATION);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSelection[]>([]);
  const [searching, setSearching] = useState(false);
  const [locatingMe, setLocatingMe] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Interactive hotspot & panel state
  const [selectedHotspot, setSelectedHotspot] = useState<PlantHotspot | null>(null);
  const [highlightAll, setHighlightAll] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [treeSeasons, setTreeSeasons] = useState<Record<string, SeasonKey>>({});
  const highlightTimerRef = useRef<number | null>(null);

  const dayPhase = getLocalDayPhase();

  // Keep exact container width & height synchronized with CSS object-fit: cover math
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageSize({ w: rect.width, h: rect.height });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchPlaces(val);
        setSuggestions(res);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 800);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setLocatingMe(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const place = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setSelectedPlace(place);
        setSearchQuery(place.name);
        setSuggestions([]);
        setLocatingMe(false);
        showToast(`Field location set to ${place.name}`, 'success');
      },
      () => {
        setLocatingMe(false);
        showToast('Could not detect location. Search a town or region instead.', 'error');
      },
      { timeout: 8000 }
    );
  };

  const handleCheckField = async (e?: React.FormEvent) => {
    e?.preventDefault();
    let target = selectedPlace;
    if (searchQuery.trim().length >= 2 && searchQuery.trim() !== selectedPlace.name) {
      setSearching(true);
      try {
        const res = await searchPlaces(searchQuery);
        if (res.length > 0) {
          target = res[0];
          setSelectedPlace(res[0]);
        }
      } catch {
        // Fallback to current selectedPlace
      } finally {
        setSearching(false);
      }
    }
    const sp = new URLSearchParams({
      name: target.name,
      display: target.displayName,
      lat: target.lat.toFixed(4),
      lon: target.lon.toFixed(4),
      activity: 'farming',
    });
    navigate(`/analyze?${sp.toString()}`);
  };

  const triggerShowAllPlants = () => {
    if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
    setHighlightAll(true);
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightAll(false);
    }, 3000);
  };

  const handleSelectHotspot = (hotspot: PlantHotspot) => {
    setSelectedHotspot(hotspot);
  };

  const activeCrop = selectedHotspot ? cropsById[selectedHotspot.cropId] ?? null : null;

  const zoomTarget = selectedHotspot
    ? {
        xPct: selectedHotspot.x + selectedHotspot.w / 2,
        yPct: selectedHotspot.y + selectedHotspot.h / 2,
      }
    : null;

  const lightingOverlayStyle: Record<DayPhase, string> = {
    sunrise: 'linear-gradient(180deg, rgba(255, 183, 107, 0.22) 0%, rgba(255, 224, 178, 0.08) 50%, transparent 100%)',
    day: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 60%)',
    sunset: 'linear-gradient(180deg, rgba(245, 130, 62, 0.28) 0%, rgba(168, 85, 247, 0.12) 48%, transparent 100%)',
    night: 'linear-gradient(180deg, rgba(10, 22, 34, 0.56) 0%, rgba(15, 26, 18, 0.42) 60%, rgba(15, 26, 18, 0.52) 100%)',
  };

  return (
    <section
      ref={stageRef}
      aria-label="Interactive Plant Mode Farm Landscape"
      className="relative w-full h-screen min-h-[680px] overflow-hidden bg-[#1F2E1A] select-none"
    >
      {/* Parallax + Zooming Farm Stage */}
      <ParallaxLayer zoomTarget={zoomTarget}>
        <img
          src="/plant-mode-hero.webp"
          alt="Sunny valley farmstead with stone farmhouse, solar panels, grazing cows, wildflowers, and hillside trees"
          className="w-full h-full object-cover object-center"
        />

        {/* Local-time sky lighting layer */}
        <div
          aria-hidden="true"
          style={{ background: lightingOverlayStyle[dayPhase] }}
          className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        />

        {/* Drifting valley morning mist */}
        <MistLayer />

        {/* 8 Animated SVG crop sprites + seasonal tree tints */}
        <CropSprites
          hotspots={HOTSPOTS}
          containerW={stageSize.w}
          containerH={stageSize.h}
          treeSeasons={treeSeasons}
        />

        {/* Animated birds, butterflies, and night fireflies */}
        <Wildlife isNight={dayPhase === 'night' || dayPhase === 'sunset'} />

        {/* Interactive Hotspot Buttons */}
        <div className="absolute inset-0 z-10">
          {HOTSPOTS.map((h) => (
            <Hotspot
              key={h.id}
              hotspot={h}
              containerW={stageSize.w}
              containerH={stageSize.h}
              highlightedAll={highlightAll}
              selected={selectedHotspot?.id === h.id}
              onSelect={handleSelectHotspot}
            />
          ))}
        </div>
      </ParallaxLayer>

      {/* Top-Left Frosted Glass Farm Search HUD */}
      <div className="relative z-20 max-w-[1440px] mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-[390px] rounded-[20px] border border-[#CFE3C0]/80 bg-[#FFFFFF]/88 dark:bg-[#16241A]/90 dark:border-[#2C4433] backdrop-blur-md p-4 sm:p-5 shadow-2xl space-y-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[var(--text-primary)] text-balance">
              Grow smarter with NASA Earth data
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Tap any crop, tree, cow, wildflower, or solar roof in the valley—or enter your own town to compute a live Grow Score.
            </p>
          </div>

          <form onSubmit={handleCheckField} className="space-y-2.5 relative">
            <div className="relative">
              <Search
                className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search your farm, town, or region..."
                aria-label="Search field location"
                className="w-full min-h-[44px] pl-10 pr-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />
              {searching && (
                <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {suggestions.length > 0 && (
              <ul
                role="listbox"
                className="absolute left-0 right-0 top-12 z-30 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl max-h-52 overflow-y-auto divide-y divide-[var(--border)]"
              >
                {suggestions.map((s, idx) => (
                  <li key={`${s.lat}-${s.lon}-${idx}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlace(s);
                        setSearchQuery(s.name);
                        setSuggestions([]);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] cursor-pointer"
                    >
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] truncate">
                        {s.displayName}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locatingMe}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[42px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors cursor-pointer"
              >
                {locatingMe ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
                ) : (
                  <Compass className="w-3.5 h-3.5 text-[var(--teal)]" />
                )}
                <span>Use my location</span>
              </button>

              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 min-h-[42px] rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-95 transition-opacity cursor-pointer"
              >
                <span>Check my field</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border)] text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-[var(--teal)] truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate font-mono">{selectedPlace.name}</span>
            </span>
            <span className="font-mono text-[var(--text-secondary)] shrink-0">
              {HOTSPOTS.length} hotspots
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar: Show All Plants, Plant Guide, Reset Zoom, Floating Plant Mode Toggle */}
      <div className="absolute bottom-4 left-4 right-4 z-20 max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={triggerShowAllPlants}
            className="inline-flex items-center gap-1.5 px-3.5 min-h-[42px] rounded-xl border border-[#CFE3C0] bg-[#FFFFFF]/92 dark:bg-[#16241A]/92 dark:border-[#2C4433] text-xs font-semibold text-[var(--text-primary)] shadow-lg hover:border-[var(--accent)] cursor-pointer backdrop-blur-md"
          >
            <Eye className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>{highlightAll ? 'Showing all plants...' : 'Show all plants'}</span>
          </button>

          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 min-h-[42px] rounded-xl border border-[#CFE3C0] bg-[#FFFFFF]/92 dark:bg-[#16241A]/92 dark:border-[#2C4433] text-xs font-semibold text-[var(--text-primary)] shadow-lg hover:border-[var(--accent)] cursor-pointer backdrop-blur-md"
          >
            <BookOpen className="w-3.5 h-3.5 text-[var(--earth)]" />
            <span>Plant Guide</span>
          </button>

          {selectedHotspot && (
            <button
              type="button"
              onClick={() => setSelectedHotspot(null)}
              className="inline-flex items-center gap-1.5 px-3.5 min-h-[42px] rounded-xl bg-[#1F2E1A]/90 text-white text-xs font-semibold shadow-lg hover:opacity-95 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
              <span>Whole farm</span>
            </button>
          )}
        </div>

        {/* Floating Hero Plant Mode Pill Toggle */}
        <div className="pointer-events-auto">
          <PlantModeToggle variant="hero" />
        </div>
      </div>

      {/* Keyboard / Screen-Reader Plant Guide Drawer */}
      <PlantGuideDrawer
        open={guideOpen}
        hotspots={HOTSPOTS}
        cropsById={cropsById}
        onSelectHotspot={handleSelectHotspot}
        onClose={() => setGuideOpen(false)}
      />

      {/* Slide-in 420px Desktop / Swipeable Mobile Bottom Sheet Plant Profile */}
      {selectedHotspot && activeCrop && (
        <PlantProfilePanel
          crop={activeCrop}
          location={selectedPlace}
          treeSeason={treeSeasons[activeCrop.id] ?? 'summer'}
          onChangeTreeSeason={(cropId, season) =>
            setTreeSeasons((prev) => ({ ...prev, [cropId]: season }))
          }
          onClose={() => setSelectedHotspot(null)}
        />
      )}
    </section>
  );
};
