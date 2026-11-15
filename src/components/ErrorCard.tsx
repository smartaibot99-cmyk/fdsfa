import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorCardProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  title,
  message,
  onRetry,
  retryLabel = 'Retry',
}) => {
  return (
    <div
      role="alert"
      className="anchor-card p-5 border-[#EF4444]/40 bg-[#EF4444]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h4>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-lg text-xs font-medium bg-[var(--bg-elevated)] hover:border-[var(--accent)] border border-[var(--border)] text-[var(--text-primary)] transition-colors shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
};
