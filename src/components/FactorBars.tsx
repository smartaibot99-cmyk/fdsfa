import React from 'react';
import { GeminiAdjustment, SubScore } from '../types';
import { DataBadge } from './DataBadge';
import { AIBadge } from './AIBadge';

interface FactorBarsProps {
  subScores: SubScore[];
  dataScore: number;
  adjustments?: GeminiAdjustment[];
}

function barColorForSuitability(score: number | null): string {
  if (score === null) return 'var(--border)';
  if (score >= 85) return 'var(--score-excellent)';
  if (score >= 70) return 'var(--score-good)';
  if (score >= 50) return 'var(--score-caution)';
  if (score >= 30) return 'var(--score-poor)';
  return 'var(--score-avoid)';
}

export const FactorBars: React.FC<FactorBarsProps> = ({
  subScores,
  dataScore,
  adjustments = [],
}) => {
  return (
    <div className="anchor-card p-6 space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-base font-display font-semibold text-[var(--text-primary)]">
            Why this score?
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Factor suitability × weight = points toward Data Score ({dataScore}/100)
          </p>
        </div>
        <DataBadge dataset="NASA POWER + EONET v3" />
      </div>

      <div className="space-y-4">
        {subScores.map((s) => {
          const pct = s.suitabilityScore ?? 0;
          const weightPct = Math.round(s.weight * 100);
          return (
            <div key={s.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <span className="font-medium text-[var(--text-primary)]">{s.label}</span>
                  <span className="text-[var(--text-secondary)] ml-1.5">
                    ·{' '}
                    {s.hasData && s.rawValue !== null
                      ? `${s.rawMetricLabel}: ${s.rawValue}${s.unit === 'events' ? '' : s.unit === '%' ? '%' : ` ${s.unit}`}`
                      : 'No data'}
                  </span>
                </div>
                <div className="font-mono tabular-nums text-[var(--text-primary)] shrink-0">
                  {s.hasData ? (
                    <span>
                      {s.suitabilityScore} × {weightPct}% ={' '}
                      <strong className="text-[var(--teal)]">+{s.contribution.toFixed(1)}</strong>
                    </span>
                  ) : (
                    <span className="text-[var(--text-secondary)]">No data</span>
                  )}
                </div>
              </div>

              <div
                className="h-2 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden"
                title={s.formulaDescription}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${s.hasData ? pct : 0}%`,
                    backgroundColor: barColorForSuitability(s.suitabilityScore),
                  }}
                />
              </div>

              <p className="text-[11px] text-[var(--text-secondary)]">
                Source: {s.datasetCitation} · {s.formulaDescription}
              </p>
            </div>
          );
        })}
      </div>

      {adjustments.length > 0 && (
        <div className="pt-4 border-t border-[var(--border)] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              AI Contextual Adjustments (capped at ±10)
            </span>
            <AIBadge />
          </div>
          <div className="space-y-2">
            {adjustments.map((adj, idx) => (
              <div
                key={`${adj.factor}-${idx}`}
                className="flex items-start gap-2.5 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3"
              >
                <span
                  className={`font-mono font-semibold tabular-nums shrink-0 ${
                    adj.delta >= 0 ? 'text-[#22C55E]' : 'text-[#F97316]'
                  }`}
                >
                  {adj.delta >= 0 ? `+${adj.delta}` : adj.delta}
                </span>
                <div className="min-w-0">
                  <span className="font-medium text-[var(--text-primary)]">{adj.factor}: </span>
                  <span className="text-[var(--text-secondary)]">{adj.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
