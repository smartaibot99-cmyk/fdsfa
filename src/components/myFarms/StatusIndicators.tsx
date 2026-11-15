import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { PortfolioStatus, ProvenanceKind } from '../../types/myFarms';
import { FarmGeoJsonGeometry, LonLat } from '../../types/maps';

export const StatusLabel: React.FC<{ status: PortfolioStatus }> = ({ status }) => {
  switch (status) {
    case 'good':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Good
        </span>
      );
    case 'needs_attention':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Needs attention
        </span>
      );
    case 'alert':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
          Alert
        </span>
      );
    case 'needs_refresh':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          Needs refresh
        </span>
      );
    case 'partial':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
          <Layers className="w-3.5 h-3.5 shrink-0" />
          Partial
        </span>
      );
    case 'archived':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
          <Archive className="w-3.5 h-3.5 shrink-0" />
          Archived
        </span>
      );
    case 'not_assessed':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
          Not assessed
        </span>
      );
  }
};

export const ProvenanceText: React.FC<{ kind: ProvenanceKind; detail?: string }> = ({ kind, detail }) => {
  const labels: Record<ProvenanceKind, string> = {
    observed: 'Observed',
    remote_sensing: 'Remote-sensing',
    modelled: 'Modelled',
    farmer_reported: 'Farmer-reported',
    calculated: 'Calculated',
    unavailable: 'Unavailable',
    stale: 'Stale',
  };
  const colors: Record<ProvenanceKind, string> = {
    observed: 'text-emerald-700 dark:text-emerald-300',
    remote_sensing: 'text-teal-700 dark:text-teal-300',
    modelled: 'text-sky-700 dark:text-sky-300',
    farmer_reported: 'text-indigo-700 dark:text-indigo-300',
    calculated: 'text-slate-700 dark:text-slate-300',
    unavailable: 'text-slate-500 dark:text-slate-400',
    stale: 'text-amber-700 dark:text-amber-300',
  };
  return (
    <span className={`text-[11px] font-medium ${colors[kind]}`}>
      {labels[kind]}
      {detail ? ` · ${detail}` : ''}
    </span>
  );
};

export const FarmFootprintThumb: React.FC<{
  geometry: FarmGeoJsonGeometry | null;
  status: PortfolioStatus;
}> = ({ geometry, status }) => {
  const ring: LonLat[] = React.useMemo(() => {
    if (!geometry) return [];
    if (geometry.type === 'Polygon') return geometry.coordinates[0] ?? [];
    return geometry.coordinates[0]?.[0] ?? [];
  }, [geometry]);

  if (ring.length < 3) {
    return (
      <div
        aria-hidden="true"
        className="w-10 h-10 rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-elevated)]/60 flex items-center justify-center shrink-0"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 7l6-3 10 4-3 11-11-2-2-10z" strokeDasharray="3 2" />
        </svg>
      </div>
    );
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [lon, lat] of ring) {
    if (lon < minX) minX = lon;
    if (lon > maxX) maxX = lon;
    if (lat < minY) minY = lat;
    if (lat > maxY) maxY = lat;
  }
  const spanX = Math.max(1e-6, maxX - minX);
  const spanY = Math.max(1e-6, maxY - minY);
  const points = ring
    .map(([lon, lat]) => {
      const x = 6 + ((lon - minX) / spanX) * 28;
      const y = 34 - ((lat - minY) / spanY) * 28;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor =
    status === 'good'
      ? '#16A34A'
      : status === 'alert'
        ? '#DC2626'
        : status === 'needs_attention' || status === 'needs_refresh'
          ? '#D97706'
          : '#0EA5E9';

  return (
    <div
      aria-hidden="true"
      className="w-10 h-10 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/70 flex items-center justify-center shrink-0 overflow-hidden"
    >
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <polygon
          points={points}
          fill={strokeColor}
          fillOpacity={0.22}
          stroke={strokeColor}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
