import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { dismissTour } from '../lib/storage';

interface OnboardingTourProps {
  onClose: () => void;
}

const STEPS = [
  {
    title: '1. Pick Any Place & Future Date',
    body: 'Search any city, field, or trail worldwide and pick your target date weeks or months ahead. Anchor pulls 20+ years of NASA POWER daily climate records for that exact calendar window.',
  },
  {
    title: '2. Transparent Two-Stage Scoring',
    body: 'First, pure TypeScript formulas compute 6 sub-scores from NASA POWER & EONET v3. Then Gemini AI reviews context and may adjust by at most ±10 points with explicit reasoning.',
  },
  {
    title: '3. Explore Real Satellites & Crops',
    body: 'On the Home globe, track 11 real NASA Earth-observing satellites live, click land to analyze anywhere, or visit 12 global 3D farms with live Crop Health Scores.',
  },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onClose }) => {
  const [stepIdx, setStepIdx] = useState(0);

  const finish = () => {
    dismissTour();
    onClose();
  };

  const current = STEPS[stepIdx];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Anchor Quick Tour"
      className="fixed bottom-5 left-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] anchor-card p-5 shadow-2xl border-[var(--accent)]/40 no-print"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[11px] font-mono text-[var(--teal)]">
          Quick Tour · {stepIdx + 1} / {STEPS.length}
        </span>
        <button
          type="button"
          onClick={finish}
          aria-label="Dismiss tour"
          className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <h3 className="text-sm font-display font-semibold text-[var(--text-primary)] mb-1.5">
        {current.title}
      </h3>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">{current.body}</p>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={finish}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          Skip tour
        </button>

        {stepIdx < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStepIdx((i) => i + 1)}
            className="inline-flex items-center gap-1.5 px-3.5 min-h-[38px] rounded-lg text-xs font-medium bg-[var(--accent)] text-white cursor-pointer"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="inline-flex items-center gap-1.5 px-3.5 min-h-[38px] rounded-lg text-xs font-medium bg-[var(--accent)] text-white cursor-pointer"
          >
            <span>Got it</span>
          </button>
        )}
      </div>
    </div>
  );
};
