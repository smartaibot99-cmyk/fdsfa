import React from 'react';
import { Info } from 'lucide-react';
import { ContextualOverview } from '../../lib/farmContextOverviews';

interface ContextualOverviewPanelProps {
  overview: ContextualOverview;
}

export const ContextualOverviewPanel: React.FC<ContextualOverviewPanelProps> = ({ overview }) => {
  return (
    <div
      role="region"
      aria-live="polite"
      className="rounded-xl bg-[var(--bg-elevated)] p-4 space-y-2 border border-[var(--border)]"
    >
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-[var(--teal)] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1 min-w-0">
          <div className="text-xs font-semibold text-[var(--text-primary)]">{overview.title}</div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{overview.body}</p>
          <div className="text-[11px] font-mono text-[var(--teal)] pt-0.5">
            {overview.provenanceNote}
          </div>
        </div>
      </div>
    </div>
  );
};
