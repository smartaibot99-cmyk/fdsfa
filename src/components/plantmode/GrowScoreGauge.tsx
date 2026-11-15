import React, { useEffect, useState } from 'react';
import { Info, Sprout } from 'lucide-react';
import { CropHealthResult, GeminiScoreOutput } from '../../types';
import { getVerdictColor, getVerdictTextClass } from '../../lib/format';
import { AIBadge } from '../AIBadge';
import { DataBadge } from '../DataBadge';

interface GrowScoreGaugeProps {
  cropName: string;
  deterministic: CropHealthResult;
  aiOutput: GeminiScoreOutput | null;
  aiAvailable: boolean;
  aiFallbackNotice?: string;
}

export const GrowScoreGauge: React.FC<GrowScoreGaugeProps> = ({
  cropName,
  deterministic,
  aiOutput,
  aiAvailable,
  aiFallbackNotice,
}) => {
  const finalScore = aiAvailable && aiOutput ? aiOutput.anchorScore : deterministic.dataScore;
  const finalVerdict = aiAvailable && aiOutput ? aiOutput.verdict : deterministic.verdict;
  const delta = finalScore - deterministic.dataScore;

  const [displayScore, setDisplayScore] = useState(finalScore);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplayScore(finalScore);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - (1 - t) ** 3;
      setDisplayScore(Math.round(finalScore * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [finalScore]);

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(100, displayScore)) / 100);
  const strokeColor = getVerdictColor(finalVerdict);

  const tips = aiOutput?.recommendations?.length ? aiOutput.recommendations.slice(0, 3) : deterministic.tips;

  return (
    <div className="space-y-4">
      {/* Gauge Header Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 text-sm font-display font-semibold text-[var(--text-primary)]">
            <Sprout className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
            <span>Grow Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DataBadge dataset="NASA POWER (30d)" />
            {aiAvailable && <AIBadge />}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-26 h-26 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 104 104" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="52" cy="52" r={radius} fill="none" stroke="var(--border)" strokeWidth="9" />
              <circle
                cx="52"
                cy="52"
                r={radius}
                fill="none"
                stroke={strokeColor}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-2xl font-bold tabular-nums text-[var(--text-primary)]">
                {displayScore}
              </span>
              <span className="font-mono text-[10px] text-[var(--text-secondary)]">/ 100</span>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className={`text-sm font-semibold ${getVerdictTextClass(finalVerdict)}`}>
              {finalVerdict} Conditions
            </div>
            <div className="text-[11px] font-mono text-[var(--text-secondary)] space-y-0.5">
              <div>Stage 1 Data Score: {deterministic.dataScore}/100</div>
              <div>
                {aiAvailable
                  ? `Stage 2 AI Adjustment: ${delta >= 0 ? `+${delta}` : delta} pts (bounded ±10)`
                  : 'Data-only score active'}
              </div>
            </div>
          </div>
        </div>

        {/* Plain-language ~50-word summary */}
        <p className="text-xs text-[var(--text-primary)] leading-relaxed border-t border-[var(--border)] pt-3">
          {aiOutput?.summary ??
            `Based on the past 30 days of NASA POWER satellite observations, ${cropName} earns a Grow Score of ${deterministic.dataScore}/100 (${deterministic.verdict}). Compare temperature, rainfall, sunlight, and humidity sub-scores below.`}
        </p>

        {aiFallbackNotice && (
          <div className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-[11px] text-[var(--text-secondary)]">
            <Info className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" aria-hidden="true" />
            <span>{aiFallbackNotice}</span>
          </div>
        )}
      </div>

      {/* Stage 1 Sub-Scores */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-2.5">
        <div className="text-xs font-semibold text-[var(--text-primary)]">
          Sub-Score Breakdown (% days in ideal range)
        </div>
        {deterministic.subScores.map((s) => (
          <div key={s.key} className="space-y-1">
            <div className="flex items-center justify-between text-[11px] gap-2">
              <span className="text-[var(--text-primary)] font-medium truncate">{s.label}</span>
              <span className="font-mono text-[var(--text-secondary)] shrink-0">
                {s.observed !== null ? `${s.observed} ${s.unit}` : 'No data'} ·{' '}
                <strong className="text-[var(--text-primary)]">
                  {s.score !== null ? s.score : '--'}
                </strong>
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--bg-surface)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${s.score ?? 0}%`,
                  backgroundColor:
                    (s.score ?? 0) >= 75
                      ? 'var(--score-excellent)'
                      : (s.score ?? 0) >= 55
                        ? 'var(--score-good)'
                        : (s.score ?? 0) >= 40
                          ? 'var(--score-caution)'
                          : 'var(--score-poor)',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 3 Practical Tips */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            3 Practical Field Tips
          </span>
          {aiAvailable && <AIBadge />}
        </div>
        <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] list-disc pl-4">
          {tips.map((tip, idx) => (
            <li key={idx} className="leading-relaxed text-[var(--text-primary)]">
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
