import React, { useEffect, useState } from 'react';

interface ThemeMorphOverlayProps {
  active: boolean;
  toLight: boolean;
  origin: { x: number; y: number };
  nonce: number;
}

/**
 * Smooth radial atmospheric glass-morphism transition wave
 * expanding from the theme toggle trigger when switching Dark <-> Light mode.
 */
export const ThemeMorphOverlay: React.FC<ThemeMorphOverlayProps> = ({
  active,
  toLight,
  origin,
  nonce,
}) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!active) {
      setExpanded(false);
      return;
    }
    setExpanded(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setExpanded(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [active, nonce]);

  if (!active) return null;

  const { x, y } = origin;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[80] pointer-events-none overflow-hidden"
    >
      {/* Expanding frosted atmospheric veil */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: expanded
            ? `circle(155vmax at ${x}px ${y}px)`
            : `circle(0px at ${x}px ${y}px)`,
          opacity: expanded ? 0 : 0.85,
          background: toLight
            ? 'radial-gradient(circle at center, rgba(162, 224, 255, 0.38) 0%, rgba(226, 246, 255, 0.56) 65%, rgba(255, 255, 255, 0.72) 100%)'
            : 'radial-gradient(circle at center, rgba(24, 118, 224, 0.34) 0%, rgba(4, 26, 58, 0.58) 65%, rgba(0, 10, 28, 0.75) 100%)',
          transition:
            'clip-path 760ms cubic-bezier(0.22, 1, 0.36, 1), opacity 840ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />

      {/* Luminous expanding edge pulse */}
      <div
        className="absolute rounded-full"
        style={{
          left: x,
          top: y,
          width: expanded ? '260vmax' : '16px',
          height: expanded ? '260vmax' : '16px',
          transform: 'translate(-50%, -50%)',
          opacity: expanded ? 0 : 0.9,
          border: toLight
            ? '2px solid rgba(110, 214, 255, 0.75)'
            : '2px solid rgba(56, 189, 248, 0.75)',
          boxShadow: toLight
            ? '0 0 42px rgba(130, 224, 255, 0.65), inset 0 0 36px rgba(255, 255, 255, 0.55)'
            : '0 0 48px rgba(34, 156, 255, 0.75), inset 0 0 36px rgba(28, 128, 240, 0.45)',
          transition:
            'width 740ms cubic-bezier(0.22, 1, 0.36, 1), height 740ms cubic-bezier(0.22, 1, 0.36, 1), opacity 780ms ease-out',
        }}
      />
    </div>
  );
};
