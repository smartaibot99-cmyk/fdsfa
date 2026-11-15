import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
} from 'recharts';
import { DataBadge } from '../DataBadge';

interface ConditionChartProps {
  title: string;
  unit: string;
  data: Array<{ date: string; value: number | null }>;
  idealMin: number;
  idealMax: number;
  color: string;
}

export const ConditionChart: React.FC<ConditionChartProps> = ({
  title,
  unit,
  data,
  idealMin,
  idealMax,
  color,
}) => {
  const validVals = data.map((d) => d.value).filter((v): v is number => v !== null);
  const meanVal =
    validVals.length > 0
      ? (validVals.reduce((a, b) => a + b, 0) / validVals.length).toFixed(1)
      : 'No data';

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold text-[var(--text-primary)]">{title}</h4>
          <p className="text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
            30d avg: {meanVal} {meanVal !== 'No data' ? unit : ''} · Ideal: {idealMin}–{idealMax} {unit}
          </p>
        </div>
        <DataBadge dataset="NASA POWER 30d" />
      </div>

      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(v: string) => v.slice(5)}
              tick={{ fontSize: 9, fill: 'var(--text-secondary)' }}
              interval={7}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)',
                borderRadius: 10,
                fontSize: 11,
                color: 'var(--text-primary)',
              }}
            />
            <ReferenceArea
              y1={idealMin}
              y2={idealMax}
              fill="#22C55E"
              fillOpacity={0.14}
              strokeOpacity={0}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.22}
              strokeWidth={1.8}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
