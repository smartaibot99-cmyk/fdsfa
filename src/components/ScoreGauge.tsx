import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Info, Leaf } from 'lucide-react';
import { ScoreVerdict } from '../types';
import { getVerdictColor, getVerdictTextClass } from '../lib/format';
import { useMode } from '../context/ModeContext';
import { DataBadge } from './DataBadge';
import { AIBadge } from './AIBadge';

interface ScoreGaugeProps {
  score: number;
  dataScore: number;
  verdict: ScoreVerdict;
  confidence: number;
  aiAvailable: boolean;
  aiFallbackNotice?: string;
  label?: string;
}

function VerdictIcon({ verdict }: { verdict: ScoreVerdict }) {
  switch (verdict) {
    case 'Excellent':
      return <ShieldCheck className="w-4 h-4" aria-hidden="true" />;
    case 'Good':
      return <CheckCircle2 className="w-4 h-4" aria-hidden="true" />;
    case 'Caution':
      return <AlertTriangle className="w-4 h-4" aria-hidden="true" />;
    case 'Poor':
    case 'Avoid':
      return <XCircle className="w-4 h-4" aria-hidden="true" />;
  }
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  dataScore,
  verdict,
  confidence,
  aiAvailable,
  aiFallbackNotice,
  label,
}) => {
  const { isPlantMode } = useMode();
  const displayLabel = label ?? (isPlantMode ? 'Grow Score' : 'Anchor Score');
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplayScore(score);
      return;
    }

    let rafId = 0;
    const duration = 1200;
    const startTime = performance.now();
    const startVal = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Cubic ease-out
      const eased = 1 - (1 - t) ** 3;
      setDisplayScore(Math.round(startVal + (score - startVal) * eased));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [score]);

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, displayScore)) / 100;
  const strokeDashoffset = circumference * (1 - progress);
  const strokeColor = getVerdictColor(verdict);
  const confPct = Math.round(confidence * 100);

  return (
    <div className="anchor-card p-6 space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-base font-display font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
          {isPlantMode && <Leaf className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />}
          <span>{displayLabel}</span>
        </h2>
        <div className="flex items-center gap-1.5">
          <DataBadge dataset="NASA POWER + EONET v3" />
          {aiAvailable && <AIBadge />}
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Radial SVG Gauge */}
        <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 124 124" className="w-full h-full -rotate-90" aria-hidden="true">
            <circle
              cx="62"
              cy="62"
              r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth="10"
            />
            <circle
              cx="62"
              cy="62"
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl font-bold tabular-nums text-[var(--text-primary)]">
              {displayScore}
            </span>
            <span className="font-mono text-[11px] text-[var(--text-secondary)]">/ 100</span>
          </div>
        </div>

        {/* Verdict & Confidence */}
        <div className="flex-1 min-w-0 space-y-3">
          <div
            className={`inline-flex items-center gap-1.5 text-sm font-semibold ${getVerdictTextClass(
              verdict
            )}`}
          >
            <VerdictIcon verdict={verdict} />
            <span>{verdict}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Confidence</span>
              <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                {confPct}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${confPct}%`,
                  backgroundColor: 'var(--teal)',
                }}
              />
            </div>
          </div>

          <div className="text-xs text-[var(--text-secondary)] font-mono tabular-nums flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
            <span>Data Score: {dataScore}</span>
            {aiAvailable ? (
              <span>AI-Adjusted: {score}</span>
            ) : (
              <span>Data-only mode</span>
            )}
          </div>
        </div>
      </div>

      {aiFallbackNotice && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-xs text-[var(--text-secondary)]">
          <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" aria-hidden="true" />
          <span>{aiFallbackNotice}</span>
        </div>
      )}
    </div>
  );
};
