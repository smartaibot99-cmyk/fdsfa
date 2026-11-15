import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { PowerClimateResult } from '../types';
import { DataBadge } from './DataBadge';
import { ACTIVITY_PRESETS } from '../lib/weights';
import { ActivityPresetId } from '../types';

interface ChartPanelProps {
  power: PowerClimateResult;
  activityId: ActivityPresetId;
}

export const ChartPanel: React.FC<ChartPanelProps> = ({ power, activityId }) => {
  const [metricTab, setMetricTab] = useState<'temperature' | 'precipitation' | 'wind'>('temperature');
  const preset = ACTIVITY_PRESETS[activityId];

  const data = power.yearlySummaries.map((y) => ({
    year: String(y.year),
    meanMaxC: y.meanMaxC,
    meanMinC: y.meanMinC,
    maxPrecipMm: y.maxPrecipMm,
    totalPrecipMm: y.totalPrecipMm,
    meanWindMs: y.meanWindMs,
  }));

  return (
    <div className="anchor-card p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-display font-semibold text-[var(--text-primary)]">
              20+ Year Historical Window ({power.yearsAnalyzed[0]}–
              {power.yearsAnalyzed[power.yearsAnalyzed.length - 1]})
            </h3>
            <DataBadge dataset="NASA POWER (Daily Point)" />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Matching calendar window around {power.targetDate} (±3 days) · {power.windowDays.length} daily observations
          </p>
        </div>

        <div className="inline-flex items-center p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] self-start">
          {(
            [
              { id: 'temperature', label: 'Temp (°C)' },
              { id: 'precipitation', label: 'Rain (mm)' },
              { id: 'wind', label: 'Wind (m/s)' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMetricTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                metricTab === t.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)',
                borderRadius: 12,
                fontSize: 12,
                color: 'var(--text-primary)',
              }}
            />
            {metricTab === 'temperature' && (
              <>
                <ReferenceLine
                  y={preset.heatThresholdC}
                  stroke="#F97316"
                  strokeDasharray="4 4"
                  label={{
                    value: `Heat limit ${preset.heatThresholdC}°C`,
                    position: 'insideTopRight',
                    fill: '#F97316',
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  y={preset.coldThresholdC}
                  stroke="#38BDF8"
                  strokeDasharray="4 4"
                  label={{
                    value: `Cold limit ${preset.coldThresholdC}°C`,
                    position: 'insideBottomRight',
                    fill: '#38BDF8',
                    fontSize: 10,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="meanMaxC"
                  name="Mean High (°C)"
                  stroke="#F97316"
                  strokeWidth={2.2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="meanMinC"
                  name="Mean Low (°C)"
                  stroke="#4C8DFF"
                  strokeWidth={2.2}
                  dot={{ r: 3 }}
                />
              </>
            )}

            {metricTab === 'precipitation' && (
              <>
                <ReferenceLine
                  y={preset.rainThresholdMm}
                  stroke="#22C7B8"
                  strokeDasharray="4 4"
                  label={{
                    value: `Threshold ${preset.rainThresholdMm} mm/d`,
                    position: 'insideTopRight',
                    fill: '#22C7B8',
                    fontSize: 10,
                  }}
                />
                <Bar
                  dataKey="maxPrecipMm"
                  name="Peak Day Rain (mm)"
                  fill="#22C7B8"
                  radius={[4, 4, 0, 0]}
                />
              </>
            )}

            {metricTab === 'wind' && (
              <>
                <ReferenceLine
                  y={preset.windThresholdMs}
                  stroke="#F5B83D"
                  strokeDasharray="4 4"
                  label={{
                    value: `Wind limit ${preset.windThresholdMs} m/s`,
                    position: 'insideTopRight',
                    fill: '#F5B83D',
                    fontSize: 10,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="meanWindMs"
                  name="Mean Wind 10m (m/s)"
                  stroke="#F5B83D"
                  strokeWidth={2.4}
                  dot={{ r: 3 }}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
