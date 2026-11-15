import React, { useState } from 'react';
import { PlantHotspot } from '../../types';
import { HERO_IMAGE_HEIGHT, HERO_IMAGE_WIDTH, percentBoxToScreen } from '../../lib/coverMath';

interface HotspotProps {
  hotspot: PlantHotspot;
  containerW: number;
  containerH: number;
  highlightedAll: boolean;
  selected: boolean;
  onSelect: (hotspot: PlantHotspot) => void;
}

export const Hotspot: React.FC<HotspotProps> = ({
  hotspot,
  containerW,
  containerH,
  highlightedAll,
  selected,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null);

  if (containerW <= 0 || containerH <= 0) return null;

  const box = percentBoxToScreen(
    hotspot,
    containerW,
    containerH,
    HERO_IMAGE_WIDTH,
    HERO_IMAGE_HEIGHT
  );

  // Skip hotspots clipped completely outside the viewport
  if (
    box.left + box.width < 0 ||
    box.top + box.height < 0 ||
    box.left > containerW ||
    box.top > containerH
  ) {
    return null;
  }

  const showLabel = hovered || highlightedAll || selected;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({
      x: e.clientX ? e.clientX - rect.left : rect.width / 2,
      y: e.clientY ? e.clientY - rect.top : rect.height / 2,
      key: Date.now(),
    });
    window.setTimeout(() => setRipple(null), 650);
    onSelect(hotspot);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-label={`Explore ${hotspot.label}`}
      style={{
        left: box.left,
        top: box.top,
        width: Math.max(44, box.width),
        height: Math.max(44, box.height),
        boxShadow:
          hovered || highlightedAll || selected
            ? '0 0 28px 6px rgba(255, 255, 255, 0.55), inset 0 0 18px rgba(255, 255, 255, 0.25)'
            : 'none',
      }}
      className={`group absolute rounded-2xl border transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-white ${
        hovered || highlightedAll || selected
          ? 'border-white/80 bg-white/10'
          : 'border-transparent bg-transparent'
      }`}
    >
      {/* Mobile pulsing dot indicator (visible below md breakpoint) */}
      <span
        aria-hidden="true"
        className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center"
      >
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/80 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#2E9E4F] border-2 border-white shadow-md" />
      </span>

      {/* Tap ripple feedback */}
      {ripple && (
        <span
          key={ripple.key}
          aria-hidden="true"
          style={{ left: ripple.x, top: ripple.y }}
          className="animate-ripple-out absolute w-12 h-12 rounded-full border-2 border-white bg-white/30 pointer-events-none"
        />
      )}

      {/* Floating desktop/highlight label */}
      {showLabel && (
        <span
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${
            box.top < 80 ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
          } z-30 px-2.5 py-1 rounded-lg bg-[#1F2E1A]/92 border border-[#CFE3C0]/60 text-white text-xs font-medium whitespace-nowrap shadow-xl`}
        >
          {hotspot.emoji} {hotspot.label} — click to explore
        </span>
      )}
    </button>
  );
};
