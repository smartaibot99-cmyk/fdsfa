import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Loader2, X } from 'lucide-react';
import { StepTimelineItem } from '../types';
import { AIBadge } from './AIBadge';

interface ThinkingTimelineProps {
  steps: StepTimelineItem[];
  thoughtSummary: string;
  isStreamingThoughts: boolean;
}

export const ThinkingTimeline: React.FC<ThinkingTimelineProps> = ({
  steps,
  thoughtSummary,
  isStreamingThoughts,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [typedLength, setTypedLength] = useState(0);

  // Subtle typewriter reveal for thought summary when expanded
  useEffect(() => {
    if (!thoughtSummary) {
      setTypedLength(0);
      return;
    }
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setTypedLength(thoughtSummary.length);
      return;
    }

    if (typedLength >= thoughtSummary.length) return;
    const timer = window.setTimeout(() => {
      setTypedLength((prev) => Math.min(thoughtSummary.length, prev + 8));
    }, 18);
    return () => window.clearTimeout(timer);
  }, [thoughtSummary, typedLength]);

  return (
    <div className="anchor-card p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-display font-semibold text-[var(--text-primary)]">
          Analysis Pipeline
        </h3>
        <AIBadge label="AI Thinking" />
      </div>

      <ol className="space-y-2.5" aria-label="Execution timeline">
        {steps.map((step) => (
          <li key={step.id} className="flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="mt-0.5 shrink-0">
                {step.status === 'running' && (
                  <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" aria-label="Running" />
                )}
                {step.status === 'success' && (
                  <Check className="w-3.5 h-3.5 text-[#22C55E]" aria-label="Completed" />
                )}
                {step.status === 'error' && (
                  <X className="w-3.5 h-3.5 text-[#EF4444]" aria-label="Failed" />
                )}
                {step.status === 'pending' && (
                  <span className="block w-3.5 h-3.5 rounded-full border border-[var(--border)]" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <span
                  className={
                    step.status === 'pending'
                      ? 'text-[var(--text-secondary)]'
                      : 'text-[var(--text-primary)] font-medium'
                  }
                >
                  {step.label}
                </span>
                {step.detail && (
                  <p className="text-[11px] text-[var(--text-secondary)] truncate">{step.detail}</p>
                )}
                {step.error && (
                  <p className="text-[11px] text-[#EF4444]">{step.error}</p>
                )}
              </div>
            </div>
            {step.elapsedMs !== undefined && (
              <span className="font-mono text-[11px] tabular-nums text-[var(--text-secondary)] shrink-0">
                {step.elapsedMs} ms
              </span>
            )}
          </li>
        ))}
      </ol>

      {(thoughtSummary || isStreamingThoughts) && (
        <div className="pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="w-full flex items-center justify-between py-2 text-xs font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <span>How Anchor thought about this</span>
              <span className="text-[11px] text-[var(--text-secondary)] font-normal">
                · Model-generated summary
              </span>
            </span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expanded && (
            <div className="mt-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3.5 text-xs leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
              {thoughtSummary
                ? thoughtSummary.slice(0, typedLength)
                : 'Synthesizing NASA POWER climatology and EONET hazards...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
