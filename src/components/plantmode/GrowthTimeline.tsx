import React from 'react';
import { CropGrowthStage, GrowthStageKey } from '../../types';

interface GrowthTimelineProps {
  stages: CropGrowthStage[];
  activeStage: GrowthStageKey;
  onSelectStage: (stage: GrowthStageKey) => void;
  accentColor?: string;
}

const STAGE_ORDER: GrowthStageKey[] = ['seed', 'sprout', 'vegetative', 'flowering', 'harvest'];

function StageIllustration({ stage, color }: { stage: GrowthStageKey; color: string }) {
  switch (stage) {
    case 'seed':
      return (
        <svg viewBox="0 0 120 72" className="w-28 h-16 shrink-0" aria-hidden="true">
          <path d="M8 56 Q60 48 112 56 L112 68 L8 68 Z" fill="var(--earth)" opacity="0.28" />
          <path d="M12 56 Q60 50 108 56" stroke="var(--earth)" strokeWidth="2.5" fill="none" />
          <ellipse cx="60" cy="48" rx="11" ry="7" transform="rotate(-18 60 48)" fill="var(--earth)" />
          <path d="M62 42 Q66 34 72 32" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <circle cx="42" cy="58" r="2" fill="var(--earth)" opacity="0.6" />
          <circle cx="78" cy="60" r="2.2" fill="var(--earth)" opacity="0.6" />
        </svg>
      );
    case 'sprout':
      return (
        <svg viewBox="0 0 120 72" className="w-28 h-16 shrink-0" aria-hidden="true">
          <path d="M12 60 Q60 54 108 60" stroke="var(--earth)" strokeWidth="3" fill="none" />
          <g className="animate-sway-gentle">
            <path d="M60 58 Q60 40 60 28" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M60 36 Q43 26 40 38 Q48 44 60 39" fill="var(--accent)" />
            <path d="M60 32 Q77 22 80 34 Q72 40 60 35" fill="#4CC26E" />
          </g>
        </svg>
      );
    case 'vegetative':
      return (
        <svg viewBox="0 0 120 72" className="w-28 h-16 shrink-0" aria-hidden="true">
          <circle cx="96" cy="18" r="8" fill="var(--sun)" opacity="0.85" />
          <path d="M12 62 Q60 56 108 62" stroke="var(--earth)" strokeWidth="3" fill="none" />
          <g className="animate-sway-gentle">
            <path d="M60 60 L60 16" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M60 48 Q36 36 32 48 Q44 55 60 51" fill="var(--accent)" />
            <path d="M60 42 Q84 30 88 42 Q76 49 60 45" fill="#4CC26E" />
            <path d="M60 30 Q40 18 38 30 Q48 35 60 32" fill="var(--accent)" />
            <path d="M60 24 Q78 14 80 24 Q70 29 60 26" fill="#4CC26E" />
          </g>
        </svg>
      );
    case 'flowering':
      return (
        <svg viewBox="0 0 120 72" className="w-28 h-16 shrink-0" aria-hidden="true">
          <path d="M12 62 Q60 56 108 62" stroke="var(--earth)" strokeWidth="3" fill="none" />
          <g className="animate-sway-gentle">
            <path d="M60 60 L60 24" stroke="var(--accent)" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M60 48 Q42 38 40 48 Q48 54 60 50" fill="var(--accent)" />
            <path d="M60 44 Q78 34 80 44 Q72 50 60 46" fill="#4CC26E" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <ellipse
                key={deg}
                cx="60"
                cy="14"
                rx="4.5"
                ry="8"
                transform={`rotate(${deg} 60 22)`}
                fill={color || 'var(--sun)'}
                opacity="0.9"
              />
            ))}
            <circle cx="60" cy="22" r="5" fill="var(--earth)" />
          </g>
        </svg>
      );
    case 'harvest':
      return (
        <svg viewBox="0 0 120 72" className="w-28 h-16 shrink-0" aria-hidden="true">
          <path d="M12 62 Q60 56 108 62" stroke="var(--earth)" strokeWidth="3" fill="none" />
          <g className="animate-sway-gentle">
            <path d="M60 60 L60 22" stroke="var(--earth)" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M60 36 Q42 26 42 36" stroke="var(--accent)" strokeWidth="2.6" fill="none" />
            <path d="M60 34 Q78 24 78 34" stroke="var(--accent)" strokeWidth="2.6" fill="none" />
            <circle cx="44" cy="40" r="8" fill={color || '#F4B942'} />
            <circle cx="76" cy="39" r="8.5" fill={color || '#EA580C'} />
            <circle cx="60" cy="26" r="9.5" fill={color || '#F4B942'} />
            <circle cx="57" cy="23" r="2.2" fill="#FFFFFF" opacity="0.5" />
          </g>
        </svg>
      );
  }
}

export const GrowthTimeline: React.FC<GrowthTimelineProps> = ({
  stages,
  activeStage,
  onSelectStage,
  accentColor = '#2E9E4F',
}) => {
  const activeIdx = Math.max(
    0,
    stages.findIndex((s) => s.stage === activeStage)
  );
  const current = stages[activeIdx] ?? stages[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
        <span>Growth Cycle Timeline</span>
        <span className="font-mono text-[11px] text-[var(--text-secondary)]">
          Tap a stage
        </span>
      </div>

      {/* Soil-brown progress track + 5 interactive stage nodes */}
      <div className="relative pt-1 pb-2">
        <div
          aria-hidden="true"
          className="absolute left-5 right-5 top-4 h-1.5 rounded-full"
          style={{ backgroundColor: 'color-mix(in srgb, var(--earth) 25%, transparent)' }}
        />
        <div
          aria-hidden="true"
          className="absolute left-5 top-4 h-1.5 rounded-full transition-all duration-400"
          style={{
            width: `calc(${(activeIdx / Math.max(1, stages.length - 1)) * 100}% - 20px)`,
            backgroundColor: 'var(--accent)',
          }}
        />

        <div className="relative flex items-start justify-between gap-1">
          {STAGE_ORDER.map((key, idx) => {
            const st = stages.find((s) => s.stage === key);
            if (!st) return null;
            const selected = st.stage === activeStage;
            const reached = idx <= activeIdx;
            return (
              <button
                key={st.stage}
                type="button"
                onClick={() => onSelectStage(st.stage)}
                className="flex flex-col items-center gap-1.5 flex-1 text-center cursor-pointer group"
                aria-pressed={selected}
              >
                <span
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold transition-transform ${
                    selected
                      ? 'scale-115 bg-[var(--accent)] border-white text-white shadow-md'
                      : reached
                        ? 'bg-[var(--accent)]/85 border-[var(--bg-surface)] text-white'
                        : 'bg-[var(--bg-elevated)] border-[var(--earth)]/50 text-[var(--text-secondary)] group-hover:border-[var(--accent)]'
                  }`}
                >
                  {idx + 1}
                </span>
                <span
                  className={`text-[10px] leading-tight ${
                    selected
                      ? 'font-semibold text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {st.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Animated stage illustration card */}
      {current && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 flex items-center gap-3">
          <StageIllustration stage={current.stage} color={accentColor} />
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {current.label}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--earth)]">
                {current.dayRange}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {current.summary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
