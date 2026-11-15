import React, { useState } from 'react';
import { Database } from 'lucide-react';

interface DataBadgeProps {
  dataset: string;
  className?: string;
}

export const DataBadge: React.FC<DataBadgeProps> = ({ dataset, className = '' }) => {
  const [showTip, setShowTip] = useState(false);

  return (
    <span
      style={{
        borderColor: 'color-mix(in srgb, var(--teal) 38%, transparent)',
        backgroundColor: 'color-mix(in srgb, var(--teal) 12%, transparent)',
        color: 'var(--teal)',
      }}
      className={`relative inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap shrink-0 border cursor-help ${className}`}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
      onFocus={() => setShowTip(true)}
      onBlur={() => setShowTip(false)}
      tabIndex={0}
      aria-label={`NASA data source: ${dataset}`}
    >
      <Database className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span>NASA data</span>
      {showTip && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 px-2.5 py-1.5 rounded-lg text-[11px] font-normal text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border)] shadow-lg whitespace-nowrap pointer-events-none"
        >
          Dataset: {dataset}
        </span>
      )}
    </span>
  );
};
