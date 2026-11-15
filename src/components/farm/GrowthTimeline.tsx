import React from 'react';
import { CropGrowthStage, GrowthStageKey } from '../../types';

interface GrowthTimelineProps {
  stages: CropGrowthStage[];
  activeStage: GrowthStageKey;
  onSelectStage: (stage: GrowthStageKey) => void;
}

export const GrowthTimeline: React.FC<GrowthTimelineProps> = ({
  stages,
  activeStage,
  onSelectStage,
}) => {
  const current = stages.find((s) => s.stage === activeStage) ?? stages[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[var(--text-primary)]">Growth Stages</span>
        <span className="text-[var(--text-secondary)]">Tap stage to morph 3D crop</span>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {stages.map((st, idx) => {
          const isActive = st.stage === activeStage;
          return (
            <button
              key={st.stage}
              type="button"
              onClick={() => onSelectStage(st.stage)}
              className={`px-1.5 py-2 rounded-lg text-[11px] font-medium text-center transition-colors border cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="font-mono text-[10px] opacity-75">0{idx + 1}</div>
              <div className="truncate">{st.label}</div>
            </button>
          );
        })}
      </div>

      {current && (
        <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3 text-xs space-y-1">
          <div className="flex items-center justify-between font-medium text-[var(--text-primary)]">
            <span>{current.label}</span>
            <span className="font-mono text-[11px] text-[var(--teal)]">{current.dayRange}</span>
          </div>
          <p className="text-[var(--text-secondary)] leading-relaxed">{current.summary}</p>
        </div>
      )}
    </div>
  );
};
