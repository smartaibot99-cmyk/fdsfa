import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Loader2, X } from 'lucide-react';
import { StepTimelineItem } from '../../types';
import { AIBadge } from '../AIBadge';

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

  useEffect(() => {
    if (!thoughtSummary) {
      setTypedLength(0);
      return;
    }
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setTypedLength(thoughtSummary.length);
      return;
    }
    if (typedLength >= thoughtSummary.length) return;
    const t = window.setTimeout(() => {
      setTypedLength((p) => Math.min(thoughtSummary.length, p + 8));
    }, 16);
    return () => window.clearTimeout(t);
  }, [thoughtSummary, typedLength]);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-[var(--text-primary)]">
          Grow Score Pipeline
        </h4>
        <AIBadge label="AI Thinking" />
      </div>

      {/* Horizontal / compact step trail */}
      <ol className="space-y-2" aria-label="Grow Score calculation steps">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {step.status === 'running' && (
                <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin shrink-0" />
              )}
              {step.status === 'success' && (
                <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
              )}
              {step.status === 'error' && (
                <X className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
              )}
              {step.status === 'pending' && (
                <span className="w-3.5 h-3.5 rounded-full border border-[var(--border)] shrink-0" />
              )}
              <span
                className={`truncate ${
                  step.status === 'pending'
                    ? 'text-[var(--text-secondary)]'
                    : 'text-[var(--text-primary)] font-medium'
                }`}
              >
                {step.label}
              </span>
            </div>
            {step.detail && (
              <span className="font-mono text-[10px] text-[var(--text-secondary)] shrink-0">
                {step.detail}
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
            className="w-full flex items-center justify-between py-1 text-xs font-medium text-[var(--text-primary)] hover:text-[var(--accent)] cursor-pointer"
          >
            <span>AI summary of its reasoning</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expanded && (
            <div className="mt-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-3 text-[11px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
              {thoughtSummary
                ? thoughtSummary.slice(0, typedLength)
                : 'Comparing 30-day NASA POWER readings with ideal growing ranges...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
