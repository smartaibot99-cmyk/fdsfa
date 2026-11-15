import React from 'react';
import { DataBadge } from '../DataBadge';

interface ConditionChartProps {
  title: string;
  parameter: string;
  unit: string;
  dates: string[];
  values: Array<number | null>;
  secondaryValues?: Array<number | null>;
  idealMin: number;
  idealMax: number;
  strokeColor: string;
  mode?: 'line' | 'bar';
  latestSummary: string;
}

export const ConditionChart: React.FC<ConditionChartProps> = ({
  title,
  parameter,
  unit,
  dates,
  values,
  secondaryValues,
  idealMin,
  idealMax,
  strokeColor,
  mode = 'line',
  latestSummary,
}) => {
  const valid = values.filter((v): v is number => v !== null);
  const validSec = (secondaryValues ?? []).filter((v): v is number => v !== null);

  if (valid.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[var(--text-primary)]">{title}</span>
          <DataBadge dataset={`NASA POWER (${parameter})`} />
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          No recent {parameter} readings returned for this coordinate.
        </p>
      </div>
    );
  }

  const allNums = [...valid, ...validSec, idealMin, idealMax];
  const rawMin = Math.min(...allNums);
  const rawMax = Math.max(...allNums);
  const pad = Math.max(1, (rawMax - rawMin) * 0.14);
  const yMin = mode === 'bar' ? 0 : rawMin - pad;
  const yMax = rawMax + pad;
  const span = Math.max(0.001, yMax - yMin);

  const W = 320;
  const H = 88;
  const padX = 6;
  const padY = 8;
  const plotW = W - padX * 2;
  const plotH = H - padY * 2;

  const toY = (v: number) => padY + plotH - ((v - yMin) / span) * plotH;
  const toX = (i: number) =>
    values.length <= 1 ? padX + plotW / 2 : padX + (i / (values.length - 1)) * plotW;

  const bandTop = Math.max(padY, Math.min(H - padY, toY(idealMax)));
  const bandBottom = Math.max(padY, Math.min(H - padY, toY(idealMin)));
  const bandHeight = Math.max(2, bandBottom - bandTop);

  const buildPath = (series: Array<number | null>) =>
    series
      .map((v, i) => {
        if (v === null) return null;
        return `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`;
      })
      .filter((pt): pt is string => pt !== null)
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'}${pt}`)
      .join(' ');

  const primaryPath = mode === 'line' ? buildPath(values) : '';
  const secondaryPath = mode === 'line' && secondaryValues ? buildPath(secondaryValues) : '';

  const startDate = dates[0]?.slice(5) ?? '';
  const endDate = dates[dates.length - 1]?.slice(5) ?? '';

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h4 className="text-xs font-semibold text-[var(--text-primary)]">{title}</h4>
          <p className="text-[11px] font-mono text-[var(--text-secondary)]">
            {latestSummary} · Ideal {idealMin}–{idealMax} {unit}
          </p>
        </div>
        <DataBadge dataset={`NASA POWER (${parameter})`} />
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-22 overflow-visible"
        role="img"
        aria-label={`${title} 30-day NASA POWER chart`}
      >
        {/* Shaded ideal range band */}
        <rect
          x={padX}
          y={bandTop}
          width={plotW}
          height={bandHeight}
          rx={4}
          fill="#2E9E4F"
          opacity={0.16}
        />
        <line
          x1={padX}
          y1={bandTop}
          x2={W - padX}
          y2={bandTop}
          stroke="#2E9E4F"
          strokeOpacity={0.45}
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <line
          x1={padX}
          y1={bandBottom}
          x2={W - padX}
          y2={bandBottom}
          stroke="#2E9E4F"
          strokeOpacity={0.45}
          strokeDasharray="3 3"
          strokeWidth={1}
        />

        {mode === 'bar' ? (
          values.map((v, i) => {
            if (v === null) return null;
            const barW = Math.max(3, plotW / Math.max(1, values.length) - 2);
            const y = toY(v);
            const h = Math.max(1.5, H - padY - y);
            return (
              <rect
                key={i}
                x={toX(i) - barW / 2}
                y={y}
                width={barW}
                height={h}
                rx={1.5}
                fill={strokeColor}
                opacity={0.9}
              >
                <title>{`${dates[i] ?? ''}: ${v.toFixed(1)} ${unit}`}</title>
              </rect>
            );
          })
        ) : (
          <>
            {secondaryPath && (
              <path
                d={secondaryPath}
                fill="none"
                stroke={strokeColor}
                strokeOpacity={0.48}
                strokeWidth={1.6}
                strokeDasharray="3 2"
                strokeLinecap="round"
              />
            )}
            {primaryPath && (
              <path
                d={primaryPath}
                fill="none"
                stroke={strokeColor}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </>
        )}
      </svg>

      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)]">
        <span>{startDate}</span>
        <span className="inline-flex items-center gap-1 text-[var(--accent)]">
          <span className="inline-block w-2.5 h-2 rounded-xs bg-[#2E9E4F]/30 border border-[#2E9E4F]/60" />
          <span>Ideal zone</span>
        </span>
        <span>{endDate}</span>
      </div>
    </div>
  );
};
