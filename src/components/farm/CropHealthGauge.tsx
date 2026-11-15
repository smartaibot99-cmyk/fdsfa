import React from 'react';
import { CropHealthResult, GeminiScoreOutput, StepTimelineItem } from '../../types';
import { ScoreGauge } from '../ScoreGauge';
import { ThinkingTimeline } from '../ThinkingTimeline';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { AIBadge } from '../AIBadge';

interface CropHealthGaugeProps {
  cropName: string;
  deterministic: CropHealthResult;
  ai: GeminiScoreOutput | null;
  aiAvailable: boolean;
  aiFallbackNotice?: string;
  steps: StepTimelineItem[];
  thoughtSummary: string;
  isStreaming: boolean;
}

export const CropHealthGauge: React.FC<CropHealthGaugeProps> = ({
  cropName,
  deterministic,
  ai,
  aiAvailable,
  aiFallbackNotice,
  steps,
  thoughtSummary,
  isStreaming,
}) => {
  const finalScore = ai ? ai.anchorScore : deterministic.dataScore;
  const finalVerdict = ai ? ai.verdict : deterministic.verdict;
  const finalConf = ai ? ai.confidence : deterministic.confidence;
  const tips = ai?.recommendations?.length ? ai.recommendations.slice(0, 3) : deterministic.tips;

  return (
    <div className="space-y-4">
      <ScoreGauge
        label={`${cropName} Health Score`}
        score={finalScore}
        dataScore={deterministic.dataScore}
        verdict={finalVerdict}
        confidence={finalConf}
        aiAvailable={aiAvailable}
        aiFallbackNotice={aiFallbackNotice}
      />

      {/* Factor fit summary */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 space-y-2.5">
        <div className="text-xs font-semibold text-[var(--text-primary)]">
          NASA 30-Day Condition Fit
        </div>
        {deterministic.subScores.map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              {s.inIdealRange === true ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-[#F5B83D] shrink-0" />
              )}
              <span className="text-[var(--text-primary)] truncate">{s.label}</span>
            </div>
            <div className="font-mono tabular-nums text-[var(--text-secondary)] shrink-0">
              {s.observed !== null ? `${s.observed} ${s.unit}` : 'No data'} ·{' '}
              <span className="text-[var(--text-primary)] font-semibold">
                {s.score !== null ? `${s.score}/100` : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Practical farmer tips */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            3 Practical Tips for Growers
          </span>
          {aiAvailable && <AIBadge />}
        </div>
        <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] list-disc pl-4">
          {tips.map((tip, i) => (
            <li key={i} className="leading-relaxed">
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <ThinkingTimeline
        steps={steps}
        thoughtSummary={thoughtSummary}
        isStreamingThoughts={isStreaming}
      />
    </div>
  );
};
