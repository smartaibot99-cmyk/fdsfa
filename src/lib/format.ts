import { AnchorAnalysis, ScoreVerdict } from '../types';

export function getVerdictColor(verdict: ScoreVerdict): string {
  switch (verdict) {
    case 'Excellent':
      return 'var(--score-excellent)';
    case 'Good':
      return 'var(--score-good)';
    case 'Caution':
      return 'var(--score-caution)';
    case 'Poor':
      return 'var(--score-poor)';
    case 'Avoid':
      return 'var(--score-avoid)';
  }
}

export function getVerdictTextClass(verdict: ScoreVerdict): string {
  switch (verdict) {
    case 'Excellent':
      return 'text-[#16A34A] dark:text-[#22C55E]';
    case 'Good':
      return 'text-[#65A30D] dark:text-[#84CC16]';
    case 'Caution':
      return 'text-[#D97706] dark:text-[#F5B83D]';
    case 'Poor':
      return 'text-[#EA580C] dark:text-[#F97316]';
    case 'Avoid':
      return 'text-[#DC2626] dark:text-[#EF4444]';
  }
}

export function formatCoord(val: number, isLat: boolean): string {
  const dir = isLat ? (val >= 0 ? 'N' : 'S') : val >= 0 ? 'E' : 'W';
  return `${Math.abs(val).toFixed(4)}° ${dir}`;
}

export function formatDateShort(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function getDefaultTargetDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export function buildCsvExport(analysis: AnchorAnalysis): string {
  const rows: string[] = [];
  rows.push('Anchor NASA Earth Data Export');
  rows.push(`Location,"${analysis.place.displayName.replace(/"/g, '""')}"`);
  rows.push(`Latitude,${analysis.place.lat}`);
  rows.push(`Longitude,${analysis.place.lon}`);
  rows.push(`Target Date,${analysis.targetDate}`);
  if (analysis.endDate) rows.push(`End Date,${analysis.endDate}`);
  rows.push(`Activity,${analysis.activityId}`);
  rows.push(`Data Score,${analysis.deterministic.dataScore}`);
  rows.push(`Final Anchor Score,${analysis.finalScore}`);
  rows.push(`Verdict,${analysis.finalVerdict}`);
  rows.push(`Confidence,${Math.round(analysis.finalConfidence * 100)}%`);
  rows.push('');
  rows.push('Sub-Score Factor,Raw Value,Unit,Suitability (0-100),Weight,Contribution,Dataset');
  for (const s of analysis.deterministic.subScores) {
    rows.push(
      `"${s.label}",${s.rawValue ?? 'No data'},"${s.unit}",${s.suitabilityScore ?? 'No data'},${(s.weight * 100).toFixed(1)}%,${s.contribution},"${s.datasetCitation}"`
    );
  }
  rows.push('');
  rows.push('Historical NASA POWER Calendar Window Daily Samples');
  rows.push('Date,Year,T2M_MAX (C),T2M_MIN (C),T2M (C),PRECTOTCORR (mm),WS10M (m/s),RH2M (%),ALLSKY_SFC_SW_DWN (kWh/m2)');
  for (const pt of analysis.power?.windowDays ?? []) {
    rows.push(
      `${pt.date},${pt.year},${pt.tMaxC ?? ''},${pt.tMinC ?? ''},${pt.tMeanC ?? ''},${pt.precipMm ?? ''},${pt.windMs ?? ''},${pt.humidityPct ?? ''},${pt.solarKwhM2 ?? ''}`
    );
  }
  return rows.join('\n');
}
