import React, { useEffect, useState } from 'react';
import { useMode } from '../../context/ModeContext';

export const GrowthRevealTransition: React.FC = () => {
  const { transition } = useMode();
  const [phase, setPhase] = useState<'start' | 'end'>('start');

  useEffect(() => {
    if (!transition.active) {
      setPhase('start');
      return;
    }
    setPhase('start');
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase('end'));
    });
    return () => cancelAnimationFrame(raf);
  }, [transition.active, transition.nonce]);

  if (!transition.active) return null;

  const isEnteringPlant = transition.direction === 'to-plant';
  const { x, y } = transition.origin;

  // Entering Plant Mode: circular growth ring expands outward from button;
  // Exiting Plant Mode: circular reveal contracts back toward the button.
  const startClip = isEnteringPlant
    ? `circle(0px at ${x}px ${y}px)`
    : `circle(150vmax at ${x}px ${y}px)`;
  const endClip = isEnteringPlant
    ? `circle(150vmax at ${x}px ${y}px)`
    : `circle(0px at ${x}px ${y}px)`;

  const overlayColor = isEnteringPlant
    ? 'radial-gradient(circle at center, rgba(46,158,79,0.22), rgba(243,248,238,0.45))'
    : 'radial-gradient(circle at center, rgba(76,141,255,0.22), rgba(11,15,26,0.45))';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[90] pointer-events-none overflow-hidden"
    >
      {/* Circular clip-path growth veil */}
      <div
        style={{
          clipPath: phase === 'start' ? startClip : endClip,
          opacity: phase === 'end' ? 0 : 0.9,
          background: overlayColor,
          transition:
            'clip-path 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 820ms ease-out',
        }}
        className="absolute inset-0"
      />

      {/* Corner SVG vines and leaves growing inward during transition */}
      <div
        style={{
          opacity: phase === 'end' ? 0 : 1,
          transition: 'opacity 850ms ease-out',
        }}
        className="absolute inset-0"
      >
        {/* Top-left vine */}
        <svg
          viewBox="0 0 180 180"
          className="w-44 h-44 absolute -top-2 -left-2 text-[#2E9E4F]"
          fill="none"
        >
          <path
            d="M0 10 C 48 16, 86 44, 128 112"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="320"
            style={{ animation: 'vine-grow 860ms ease-out forwards' }}
          />
          <path
            d="M44 26 C 64 12, 76 20, 66 36 C 56 42, 48 34, 44 26 Z"
            fill="#4CC26E"
            opacity="0.88"
          />
          <path
            d="M84 58 C 106 46, 114 60, 100 72 C 90 76, 84 68, 84 58 Z"
            fill="#6B8E23"
            opacity="0.88"
          />
        </svg>

        {/* Top-right vine */}
        <svg
          viewBox="0 0 180 180"
          className="w-44 h-44 absolute -top-2 -right-2 text-[#2E9E4F] -scale-x-100"
          fill="none"
        >
          <path
            d="M0 14 C 52 24, 92 54, 134 118"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="320"
            style={{ animation: 'vine-grow 860ms ease-out forwards' }}
          />
          <path
            d="M48 30 C 70 16, 82 26, 68 42 C 58 46, 50 38, 48 30 Z"
            fill="#4CC26E"
            opacity="0.85"
          />
        </svg>

        {/* Bottom-left vine */}
        <svg
          viewBox="0 0 180 180"
          className="w-44 h-44 absolute -bottom-2 -left-2 text-[#6B8E23] -scale-y-100"
          fill="none"
        >
          <path
            d="M0 10 C 48 16, 86 44, 128 112"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="320"
            style={{ animation: 'vine-grow 860ms ease-out forwards' }}
          />
          <path
            d="M54 32 C 76 20, 88 30, 74 44 C 62 48, 56 40, 54 32 Z"
            fill="#2E9E4F"
            opacity="0.88"
          />
        </svg>

        {/* Bottom-right vine */}
        <svg
          viewBox="0 0 180 180"
          className="w-44 h-44 absolute -bottom-2 -right-2 text-[#2E9E4F] scale-[-1]"
          fill="none"
        >
          <path
            d="M0 10 C 48 16, 86 44, 128 112"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="320"
            style={{ animation: 'vine-grow 860ms ease-out forwards' }}
          />
          <path
            d="M66 44 C 88 32, 98 44, 84 58 C 72 60, 68 52, 66 44 Z"
            fill="#4CC26E"
            opacity="0.88"
          />
        </svg>
      </div>
    </div>
  );
};
