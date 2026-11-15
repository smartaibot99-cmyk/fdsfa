import React from 'react';

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div
    className={`animate-pulse rounded-lg bg-[var(--bg-elevated)] ${className}`}
    aria-hidden="true"
  />
);

export const ScoreCardSkeleton: React.FC = () => (
  <div className="anchor-card p-6 space-y-5" aria-busy="true" aria-label="Loading Anchor Score">
    <div className="flex items-center justify-between">
      <SkeletonBlock className="h-5 w-32" />
      <SkeletonBlock className="h-5 w-20" />
    </div>
    <div className="flex items-center gap-5">
      <SkeletonBlock className="h-28 w-28 rounded-full shrink-0" />
      <div className="flex-1 space-y-2.5">
        <SkeletonBlock className="h-6 w-24" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-3 w-3/4" />
      </div>
    </div>
    <div className="space-y-2">
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-5/6" />
    </div>
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="anchor-card p-6 space-y-4" aria-busy="true" aria-label="Loading NASA POWER chart">
    <div className="flex items-center justify-between">
      <SkeletonBlock className="h-5 w-48" />
      <SkeletonBlock className="h-5 w-24" />
    </div>
    <SkeletonBlock className="h-56 w-full" />
  </div>
);
