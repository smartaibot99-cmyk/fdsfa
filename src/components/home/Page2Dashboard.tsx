import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  Layers,
  Loader2,
  Navigation,
  RefreshCw,
  Wind,
  X,
} from 'lucide-react';
import { FarmProfile } from '../../types';
import { LiveWeatherReading } from '../../services/weather';
import {
  HomeFarmAlert,
  HomeFieldView,
  HomeHealthBreakdown,
  WeeklyHealthSlot,
} from '../../lib/homeFarmEvaluator';
import { ConditionsLeafIcon, DropletGlossIcon, PartlyCloudy3DIcon } from './FieldShiftIcons';

interface Page2DashboardProps {
  isLight: boolean;
  currentFarm: FarmProfile;
  farms: FarmProfile[];
  onSelectFarm: (farmId: string) => void;
  realFields: HomeFieldView[];
  activeAlerts: HomeFarmAlert[];
  dismissedCount: number;
  weeklySlots: WeeklyHealthSlot[];
  deltaVsPrevious: number | null;
  healthBreakdown: HomeHealthBreakdown;
  liveWeather: LiveWeatherReading | null;
  telemetryLoading: boolean;
  telemetryError: string | null;
  lastSyncedAt: number | null;
  refreshSpinning: boolean;
  ringAnimated: boolean;
  tempUnit: 'C' | 'F';
  windUnit: 'km/h' | 'mph';
  farmLocationText: string;
  onRefresh: () => void;
  onOpenBreakdown: () => void;
  onSelectAlert: (alert: HomeFarmAlert) => void;
  onDismissAlert: (alertId: string) => void;
  onSelectField: (field: HomeFieldView) => void;
  onViewAllFields: () => void;
  onOpenWorkspace: () => void;
}

const GoldenSunWeatherIcon: React.FC<{ className?: string }> = ({
  className = 'w-[76px] h-[76px]',
}) => (
  <svg viewBox="0 0 88 88" fill="none" className={className} aria-hidden="true">
    <defs>
      <radialGradient id="fsDashSunHalo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(255, 214, 70, 0.42)" />
        <stop offset="65%" stopColor="rgba(255, 194, 34, 0.14)" />
        <stop offset="100%" stopColor="rgba(255, 180, 0, 0)" />
      </radialGradient>
      <radialGradient id="fsDashSunCore" cx="38%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FFF59E" />
        <stop offset="52%" stopColor="#FFD23F" />
        <stop offset="100%" stopColor="#F59E0B" />
      </radialGradient>
      <filter id="fsSunRayGlow" x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#FFC72C" floodOpacity="0.55" />
      </filter>
    </defs>
    <circle cx="44" cy="44" r="42" fill="url(#fsDashSunHalo)" />
    <g stroke="#FFD44A" strokeWidth="4.2" strokeLinecap="round" filter="url(#fsSunRayGlow)">
      <line x1="44" y1="10" x2="44" y2="17.5" />
      <line x1="44" y1="70.5" x2="44" y2="78" />
      <line x1="10" y1="44" x2="17.5" y2="44" />
      <line x1="70.5" y1="44" x2="78" y2="44" />
      <line x1="20" y1="20" x2="25.3" y2="25.3" />
      <line x1="62.7" y1="62.7" x2="68" y2="68" />
      <line x1="20" y1="68" x2="25.3" y2="62.7" />
      <line x1="62.7" y1="25.3" x2="68" y2="20" />
    </g>
    <circle cx="44" cy="44" r="20.5" fill="url(#fsDashSunCore)" filter="url(#fsSunRayGlow)" />
  </svg>
);

const LuminousLocationPin: React.FC<{ isLight: boolean; className?: string }> = ({
  isLight,
  className = 'w-[38px] h-[44px]',
}) => (
  <svg viewBox="0 0 44 50" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="fsPinGrad" x1="10" y1="6" x2="34" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor={isLight ? '#0B4A74' : '#E6FBFF'} />
        <stop offset="100%" stopColor={isLight ? '#06729C' : '#94DCE8'} />
      </linearGradient>
      <filter id="fsPinGlow" x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow
          dx="0"
          dy="0"
          stdDeviation="3"
          floodColor={isLight ? '#0EA5E9' : '#48E5DC'}
          floodOpacity={isLight ? '0.28' : '0.48'}
        />
      </filter>
    </defs>
    <path
      d="M22 4C13.163 4 6 11.163 6 20C6 31.4 20.1 44.5 21.15 45.45C21.63 45.88 22.37 45.88 22.85 45.45C23.9 44.5 38 31.4 38 20C38 11.163 30.837 4 22 4Z"
      fill="url(#fsPinGrad)"
      filter="url(#fsPinGlow)"
    />
    <circle cx="22" cy="19.5" r="6" fill={isLight ? '#E6F7FF' : '#0B506B'} />
  </svg>
);

function buildSmoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function formatUpdatedAgo(ts: number | null): string {
  if (!ts) return 'Updated: syncing...';
  const diffMin = Math.floor((Date.now() - ts) / 60000);
  if (diffMin <= 0) return 'Updated: just now';
  if (diffMin === 1) return 'Updated: 1 min ago';
  return `Updated: ${diffMin} min ago`;
}

export const Page2Dashboard: React.FC<Page2DashboardProps> = ({
  isLight,
  currentFarm,
  farms,
  onSelectFarm,
  realFields,
  activeAlerts,
  weeklySlots,
  deltaVsPrevious,
  healthBreakdown,
  liveWeather,
  telemetryLoading,
  telemetryError,
  lastSyncedAt,
  refreshSpinning,
  ringAnimated,
  tempUnit,
  windUnit,
  farmLocationText,
  onRefresh,
  onOpenBreakdown,
  onSelectAlert,
  onDismissAlert,
  onSelectField,
  onViewAllFields,
  onOpenWorkspace,
}) => {
  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(null);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);

  const fmtTemp = (tempC: number) =>
    tempUnit === 'C' ? `${tempC}°C` : `${Math.round((tempC * 9) / 5 + 32)}°F`;

  const displayTemp = liveWeather ? fmtTemp(liveWeather.tempC) : '--';
  const displayHigh = liveWeather ? fmtTemp(liveWeather.tempHighC) : '--';
  const displayLow = liveWeather ? fmtTemp(liveWeather.tempLowC) : '--';
  const displayHumidity = liveWeather ? `${liveWeather.humidityPct}%` : '--';
  const displayWind = liveWeather
    ? windUnit === 'km/h'
      ? `${liveWeather.windKmh} km/h`
      : `${Math.round(liveWeather.windKmh * 0.621371)} mph`
    : '--';
  const displayCondition =
    telemetryLoading && !liveWeather
      ? 'Syncing...'
      : liveWeather?.conditionLabel ?? 'Weather unavailable';

  // Gauge geometry matching spec (viewBox 360x360, r=148, strokeWidth=26)
  const gaugeRadius = 148;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = ringAnimated
    ? gaugeCircumference * (1 - healthBreakdown.overallPct / 100)
    : gaugeCircumference;

  // Weekly 7-day coordinate mapping strictly for STORED days (days 1..7)
  const chartW = 620;
  const chartH = 228;
  const leftPad = 46;
  const rightPad = 34;
  const usableW = chartW - leftPad - rightPad;

  const dayColumns = useMemo(() => {
    return weeklySlots.map((slot, idx) => {
      const x = leftPad + (idx / 6) * usableW;
      const y =
        slot.healthPct !== null
          ? 202 - (Math.max(0, Math.min(100, slot.healthPct)) / 100) * 168
          : null;
      return { ...slot, x, y };
    });
  }, [weeklySlots, usableW]);

  const storedPoints = useMemo(
    () =>
      dayColumns
        .filter((col): col is typeof col & { y: number; healthPct: number } => col.y !== null && col.healthPct !== null)
        .map((col) => ({
          dayNumber: col.dayNumber,
          dayShort: col.dayShort,
          isToday: col.isToday,
          x: col.x,
          y: col.y,
          val: col.healthPct,
        })),
    [dayColumns]
  );

  // Default selected point: user selection, or Today if stored, or latest stored day
  const activePoint = useMemo(() => {
    if (storedPoints.length === 0) return null;
    if (selectedDayNum !== null) {
      const match = storedPoints.find((p) => p.dayNumber === selectedDayNum);
      if (match) return match;
    }
    return storedPoints.find((p) => p.isToday) ?? storedPoints[storedPoints.length - 1];
  }, [storedPoints, selectedDayNum]);

  const storedLinePath = useMemo(() => buildSmoothPath(storedPoints), [storedPoints]);
  const storedAreaPath = useMemo(() => {
    if (storedPoints.length < 2) return '';
    const first = storedPoints[0];
    const last = storedPoints[storedPoints.length - 1];
    return `${storedLinePath} L ${last.x.toFixed(1)} 202 L ${first.x.toFixed(1)} 202 Z`;
  }, [storedLinePath, storedPoints]);

  // Real Humidity & Wind sparklines strictly when liveWeather is present (no fake fallback)
  const humiditySpark = useMemo(() => {
    if (!liveWeather || liveWeather.humiditySeries.length < 2) return null;
    const raw = liveWeather.humiditySeries;
    const min = Math.min(...raw) - 3;
    const max = Math.max(...raw) + 3;
    const span = Math.max(1, max - min);
    const pts = raw.map((v, i) => ({
      x: 4 + (i / (raw.length - 1)) * 142,
      y: 26 - ((v - min) / span) * 20,
    }));
    return buildSmoothPath(pts);
  }, [liveWeather]);

  const windSpark = useMemo(() => {
    if (!liveWeather || !Array.isArray(liveWeather.windSeries)) return null;
    const raw = liveWeather.windSeries.filter(
      (v): v is number => typeof v === 'number' && Number.isFinite(v)
    );
    if (raw.length < 2) return null;
    const dataMin = Math.min(...raw);
    const dataMax = Math.max(...raw);
    if (dataMax === dataMin) {
      const pts = raw.map((_, i) => ({
        x: 4 + (i / (raw.length - 1)) * 142,
        y: 16,
      }));
      return buildSmoothPath(pts);
    }
    const min = dataMin - 2;
    const max = dataMax + 2;
    const span = Math.max(1, max - min);
    const pts = raw.map((v, i) => ({
      x: 4 + (i / (raw.length - 1)) * 142,
      y: 26 - ((v - min) / span) * 20,
    }));
    return buildSmoothPath(pts);
  }, [liveWeather]);

  const showSunPrimaryIcon = !liveWeather || liveWeather.weatherCode <= 2;

  return (
    <div className="relative z-10 max-w-[1620px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-14 pt-24 sm:pt-28 pb-16 sm:pb-20">
      {/* ================================================================= */}
      {/* TOP ROW: FARM CONDITIONS (Left) + ALL FIELDS (Right)              */}
      {/* Equal top & bottom alignment via CSS Grid stretch                 */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.15fr)_minmax(340px,1fr)] gap-6 xl:gap-7 items-stretch">
        {/* --------------------------------------------------------------- */}
        {/* 1. UPPER-LEFT CARD: FARM CONDITIONS                             */}
        {/* --------------------------------------------------------------- */}
        <section
          aria-label="Farm Conditions"
          className="fs-dash-panel px-5 sm:px-7 py-6 sm:py-7 flex flex-col justify-between min-h-[565px]"
        >
          {/* Header Row */}
          <div className="flex flex-wrap items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <ConditionsLeafIcon
                className="w-[44px] h-[46px] sm:w-[51px] sm:h-[53px] shrink-0 drop-shadow-[0_0_10px_rgba(24,238,192,0.40)]"
              />
              <div>
                <h2
                  className={`text-[24px] sm:text-[28px] xl:text-[30px] font-semibold tracking-[-0.02em] leading-tight ${
                    isLight ? 'text-[#07213D]' : 'text-[#F5FAFF]'
                  }`}
                >
                  Farm Conditions
                </h2>
                <p
                  className={`text-[14.5px] sm:text-[17px] xl:text-[18.5px] mt-0.5 leading-snug ${
                    isLight ? 'text-[#1B4063]' : 'text-[#C4E0F2]'
                  }`}
                >
                  Real-time insights for smarter farming
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-3.5 ml-auto">
              <span
                className={`inline-flex items-center gap-2 h-[38px] sm:h-[41px] px-4 rounded-full text-[13.5px] sm:text-[14px] font-semibold ${
                  isLight ? 'text-[#047857]' : 'text-[#00F1C6]'
                }`}
                style={{
                  background: isLight
                    ? 'rgba(16, 185, 129, 0.16)'
                    : 'rgba(0, 133, 147, 0.66)',
                  border: isLight
                    ? '1px solid rgba(16, 185, 129, 0.36)'
                    : '1px solid rgba(0, 232, 200, 0.34)',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25)',
                }}
              >
                {telemetryLoading ? (
                  <Loader2
                    className={`w-3.5 h-3.5 animate-spin ${
                      isLight ? 'text-[#048C68]' : 'text-[#00F1C6]'
                    }`}
                  />
                ) : (
                  <span
                    className={`w-2.5 h-2.5 rounded-full fs-live-dot ${
                      isLight ? 'bg-[#059669]' : 'bg-[#00F1C6]'
                    }`}
                  />
                )}
                <span>Live</span>
              </span>

              <span
                className={`text-[13px] sm:text-[14px] whitespace-nowrap ${
                  isLight ? 'text-[#193E62]' : 'text-[#DCEBF7]'
                }`}
              >
                {telemetryError ? 'Offline fallback' : formatUpdatedAgo(lastSyncedAt)}
              </span>

              <button
                type="button"
                onClick={onRefresh}
                aria-label="Refresh farm conditions"
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors cursor-pointer ${
                  isLight
                    ? 'text-[#0A2B4C] hover:bg-white/50'
                    : 'text-[#E3F3FF] hover:text-white hover:bg-white/10'
                }`}
              >
                <RefreshCw
                  className={`w-[22px] h-[22px] transition-transform duration-500 ${
                    refreshSpinning || telemetryLoading ? 'animate-spin' : ''
                  }`}
                  strokeWidth={2}
                />
              </button>
            </div>
          </div>

          {/* Main Content Region: Circular Gauge (Left) + Weekly Stored Health Chart (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-[295px_1fr] xl:grid-cols-[330px_1fr] items-center gap-6 my-auto py-4">
            {/* Circular Crop-Health Gauge */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={onOpenBreakdown}
                title="View crop health calculation breakdown"
                className="group relative w-[265px] h-[265px] sm:w-[295px] sm:h-[295px] xl:w-[318px] xl:h-[318px] flex items-center justify-center cursor-pointer focus:outline-none transition-transform duration-200 hover:scale-[1.015]"
              >
                <svg viewBox="0 0 360 360" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="fsDashHealthGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={isLight ? '#049688' : '#00D5C6'} />
                      <stop offset="48%" stopColor={isLight ? '#0CC5A8' : '#20E9CE'} />
                      <stop offset="100%" stopColor={isLight ? '#0284C7' : '#00AFCB'} />
                    </linearGradient>
                    <filter id="fsGaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow
                        dx="0"
                        dy="0"
                        stdDeviation="6"
                        floodColor={isLight ? '#0EA5E9' : '#1CE8D0'}
                        floodOpacity={isLight ? '0.28' : '0.42'}
                      />
                    </filter>
                  </defs>

                  {/* Outer scientific measurement outline + ticks */}
                  <circle
                    cx="180"
                    cy="180"
                    r="172"
                    fill="none"
                    stroke={isLight ? 'rgba(6, 128, 168, 0.25)' : 'rgba(76, 224, 240, 0.24)'}
                    strokeWidth="1.2"
                  />
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <line
                      key={deg}
                      x1="180"
                      y1="4"
                      x2="180"
                      y2="11"
                      stroke={isLight ? 'rgba(6, 128, 168, 0.36)' : 'rgba(120, 234, 248, 0.36)'}
                      strokeWidth="1.4"
                      transform={`rotate(${deg} 180 180)`}
                    />
                  ))}

                  {/* Subtle inner shaded dial */}
                  <circle
                    cx="180"
                    cy="180"
                    r="133"
                    fill={isLight ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 22, 46, 0.22)'}
                  />

                  {/* Track */}
                  <circle
                    cx="180"
                    cy="180"
                    r={gaugeRadius}
                    fill="none"
                    stroke={isLight ? 'rgba(14, 116, 144, 0.16)' : 'rgba(0, 170, 202, 0.19)'}
                    strokeWidth="26"
                  />

                  {/* Active gradient progress arc */}
                  <circle
                    cx="180"
                    cy="180"
                    r={gaugeRadius}
                    fill="none"
                    stroke="url(#fsDashHealthGrad)"
                    strokeWidth="26"
                    strokeLinecap="round"
                    strokeDasharray={gaugeCircumference}
                    strokeDashoffset={gaugeOffset}
                    transform="rotate(128 180 180)"
                    filter="url(#fsGaugeGlow)"
                    style={{
                      transition: 'stroke-dashoffset 1300ms cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  />
                </svg>

                {/* Centered Typography inside Gauge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                  <ConditionsLeafIcon className="w-[34px] h-[36px] mb-1.5" />
                  <div
                    className={`text-[52px] sm:text-[60px] font-bold leading-none tracking-[-2.5px] tabular-nums ${
                      isLight ? 'text-[#07213D]' : 'text-[#F7FCFF]'
                    }`}
                  >
                    {healthBreakdown.overallPct}%
                  </div>
                  <div
                    className={`text-[17px] sm:text-[18.5px] font-medium mt-1.5 ${
                      isLight ? 'text-[#15395B]' : 'text-[#F0F8FF]'
                    }`}
                  >
                    Crop Health
                  </div>
                  {deltaVsPrevious !== null ? (
                    <div
                      className={`inline-flex items-center gap-1 text-[16px] sm:text-[17px] font-semibold mt-1 tabular-nums ${
                        deltaVsPrevious >= 0
                          ? isLight
                            ? 'text-[#048C68]'
                            : 'text-[#1FEEC7]'
                          : 'text-[#F59E0B]'
                      }`}
                    >
                      {deltaVsPrevious >= 0 ? (
                        <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                      ) : (
                        <ArrowDown className="w-4 h-4" strokeWidth={2.5} />
                      )}
                      <span>
                        {deltaVsPrevious >= 0 ? `+${deltaVsPrevious}%` : `${deltaVsPrevious}%`}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`text-[13px] font-semibold mt-1.5 ${
                        isLight ? 'text-[#048C68]' : 'text-[#1FEEC7]'
                      }`}
                    >
                      Current score
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Weekly Daily Health Graph (Days 1..7 on X-axis, strictly stored data only) */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span
                  className={`text-[12.5px] font-medium ${
                    isLight ? 'text-[#173D61]' : 'text-[#B9DCF0]'
                  }`}
                >
                  Weekly Daily Health
                </span>
                <span
                  className={`text-[11.5px] tabular-nums ${
                    isLight ? 'text-[#285178]' : 'text-[#8EC4DF]'
                  }`}
                >
                  {storedPoints.length}/7 days stored
                </span>
              </div>

              <div className="relative h-[242px] sm:h-[262px] w-full fs-chart-grid rounded-2xl">
                <svg
                  viewBox={`0 0 ${chartW} ${chartH + 34}`}
                  preserveAspectRatio="none"
                  className="w-full h-full overflow-visible"
                  role="img"
                  aria-label="Weekly daily crop health chart for Days 1 to 7"
                >
                  <defs>
                    <linearGradient id="fsDashChartArea" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop
                        offset="0%"
                        stopColor={
                          isLight ? 'rgba(4, 150, 136, 0.30)' : 'rgba(0, 232, 222, 0.34)'
                        }
                      />
                      <stop
                        offset="65%"
                        stopColor={
                          isLight ? 'rgba(4, 150, 136, 0.09)' : 'rgba(0, 196, 214, 0.12)'
                        }
                      />
                      <stop offset="100%" stopColor="rgba(0, 175, 200, 0)" />
                    </linearGradient>
                    <filter id="fsLineGlow" x="-10%" y="-20%" width="120%" height="140%">
                      <feDropShadow
                        dx="0"
                        dy="0"
                        stdDeviation="4"
                        floodColor={isLight ? '#0891B2' : '#00EBE1'}
                        floodOpacity={isLight ? '0.35' : '0.65'}
                      />
                    </filter>
                  </defs>

                  {/* Vertical lines aligned strictly to Days 1..7 & horizontal baseline */}
                  {dayColumns.map((col) => (
                    <line
                      key={`vline-${col.dayNumber}`}
                      x1={col.x}
                      y1="20"
                      x2={col.x}
                      y2="202"
                      stroke={
                        isLight ? 'rgba(14, 106, 152, 0.18)' : 'rgba(92, 208, 229, 0.16)'
                      }
                      strokeWidth="1"
                      strokeDasharray="3 4"
                    />
                  ))}
                  <line
                    x1="28"
                    y1="202"
                    x2={chartW - 14}
                    y2="202"
                    stroke={isLight ? 'rgba(14, 106, 152, 0.34)' : 'rgba(135, 226, 245, 0.32)'}
                    strokeWidth="1.2"
                  />

                  {/* Subtle Y-axis labels (0%, 50%, 100%) */}
                  {[0, 50, 100].map((pct) => {
                    const py = 202 - (pct / 100) * 168;
                    return (
                      <text
                        key={`y-${pct}`}
                        x="22"
                        y={py + 4}
                        textAnchor="end"
                        fill={isLight ? 'rgba(18, 56, 92, 0.72)' : 'rgba(186, 226, 248, 0.70)'}
                        fontSize="11"
                        fontWeight="500"
                      >
                        {pct}%
                      </text>
                    );
                  })}

                  {/* Vertical guide line down from selected stored point */}
                  {activePoint && (
                    <line
                      x1={activePoint.x}
                      y1={activePoint.y}
                      x2={activePoint.x}
                      y2="202"
                      stroke={
                        isLight ? 'rgba(4, 145, 138, 0.55)' : 'rgba(105, 235, 245, 0.45)'
                      }
                      strokeWidth="1.3"
                    />
                  )}

                  {/* Translucent gradient area & connecting line ONLY if 2+ stored points exist */}
                  {storedPoints.length >= 2 && (
                    <>
                      <path d={storedAreaPath} fill="url(#fsDashChartArea)" />
                      <path
                        d={storedLinePath}
                        fill="none"
                        stroke={isLight ? '#029688' : '#00DCCB'}
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#fsLineGlow)"
                      />
                    </>
                  )}

                  {/* Plot ONLY stored days (unstored days have no dot or fake data) */}
                  {storedPoints.map((pt) => {
                    const isSelected = activePoint?.dayNumber === pt.dayNumber;
                    return (
                      <g
                        key={`pt-${pt.dayNumber}`}
                        className="cursor-pointer"
                        onMouseEnter={() => setSelectedDayNum(pt.dayNumber)}
                        onClick={() => setSelectedDayNum(pt.dayNumber)}
                      >
                        <circle cx={pt.x} cy={pt.y} r="16" fill="transparent" />
                        {isSelected ? (
                          <>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="13"
                              fill={
                                isLight
                                  ? 'rgba(4, 150, 136, 0.20)'
                                  : 'rgba(0, 236, 224, 0.24)'
                              }
                            />
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="6.2"
                              fill={isLight ? '#048C82' : '#08556B'}
                              stroke="#FFFFFF"
                              strokeWidth="3.2"
                              filter="url(#fsLineGlow)"
                            />
                          </>
                        ) : (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="4.5"
                            fill="#FFFFFF"
                            stroke={isLight ? '#029688' : '#00DCCB'}
                            strokeWidth="2"
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* X-axis numbers 1, 2, 3, 4, 5, 6, 7 aligned under each vertical line */}
                  {dayColumns.map((col) => {
                    const hasData = col.healthPct !== null;
                    return (
                      <text
                        key={`xlabel-${col.dayNumber}`}
                        x={col.x}
                        y="222"
                        textAnchor="middle"
                        fill={
                          hasData
                            ? isLight
                              ? '#07213D'
                              : '#FFFFFF'
                            : isLight
                              ? 'rgba(20, 58, 94, 0.62)'
                              : 'rgba(182, 222, 244, 0.58)'
                        }
                        fontSize="12.5"
                        fontWeight={hasData ? '700' : '500'}
                      >
                        {col.dayNumber}
                      </text>
                    );
                  })}

                  {/* "Days" axis title */}
                  <text
                    x={(leftPad + (chartW - rightPad)) / 2}
                    y="243"
                    textAnchor="middle"
                    fill={isLight ? 'rgba(16, 54, 90, 0.85)' : 'rgba(196, 230, 248, 0.88)'}
                    fontSize="12"
                    fontWeight="600"
                    letterSpacing="0.04em"
                  >
                    Days
                  </text>
                </svg>

                {/* Floating Percentage Tooltip above Selected Stored Point */}
                {activePoint && (
                  <div
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-full transition-all duration-200"
                    style={{
                      left: `${(activePoint.x / chartW) * 100}%`,
                      top: `${Math.max(15, ((activePoint.y - 16) / (chartH + 34)) * 100)}%`,
                    }}
                  >
                    <div
                      className={`relative px-3.5 py-1 rounded-[14px] text-[15px] sm:text-[16px] font-semibold tabular-nums whitespace-nowrap ${
                        isLight ? 'text-white' : 'text-white'
                      }`}
                      style={{
                        background: isLight
                          ? 'rgba(8, 52, 92, 0.90)'
                          : 'rgba(12, 52, 92, 0.88)',
                        border: '1px solid rgba(110, 224, 255, 0.48)',
                        boxShadow: '0 6px 18px rgba(0, 20, 46, 0.30)',
                      }}
                    >
                      {activePoint.val}% · Day {activePoint.dayNumber}
                      <span
                        aria-hidden="true"
                        className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-3 h-3 rotate-45"
                        style={{
                          background: isLight
                            ? 'rgba(8, 52, 92, 0.90)'
                            : 'rgba(12, 52, 92, 0.88)',
                          borderRight: '1px solid rgba(110, 224, 255, 0.48)',
                          borderBottom: '1px solid rgba(110, 224, 255, 0.48)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Condition / Scrollable & Dismissible Alerts Container */}
          {activeAlerts.length === 0 ? (
            <button
              type="button"
              onClick={onOpenBreakdown}
              className="fs-dash-banner w-full text-left flex items-center justify-between gap-4 px-5 sm:px-6 min-h-[88px] sm:min-h-[96px] py-3 cursor-pointer group"
            >
              <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                <span
                  className="w-[50px] h-[50px] sm:w-[55px] sm:h-[55px] rounded-full grid place-items-center shrink-0 text-white"
                  style={{
                    background: 'linear-gradient(135deg, #12E9BB 0%, #00CBA9 100%)',
                    boxShadow:
                      '0 0 16px rgba(0, 239, 190, 0.42), inset 0 1px 2px rgba(255,255,255,0.45)',
                  }}
                >
                  <Check className="w-[26px] h-[26px]" strokeWidth={2.8} />
                </span>
                <div className="min-w-0">
                  <div
                    className={`text-[17px] sm:text-[19.5px] font-semibold leading-snug ${
                      isLight ? 'text-[#07213D]' : 'text-white'
                    }`}
                  >
                    Your crops are in excellent condition!
                  </div>
                  <div
                    className={`text-[14px] sm:text-[16.5px] mt-0.5 leading-snug ${
                      isLight ? 'text-[#1E476A]' : 'text-[#C8E4F2]'
                    }`}
                  >
                    No immediate action required.
                  </div>
                </div>
              </div>
              <ChevronRight
                className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${
                  isLight ? 'text-[#0A2B4C]' : 'text-[#DCEEFB]'
                }`}
              />
            </button>
          ) : (
            <div>
              {activeAlerts.length > 1 && (
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <span
                    className={`text-[11.5px] font-medium ${
                      isLight ? 'text-[#1B4266]' : 'text-[#B9DCF0]'
                    }`}
                  >
                    {activeAlerts.length} active alerts — scroll inside to view all
                  </span>
                </div>
              )}
              <div
                aria-label="Active farm alerts"
                className="max-h-[100px] overflow-y-auto pr-1 space-y-2 fs-thin-scroll"
              >
                {activeAlerts.map((alert) => {
                  const isCritical = alert.severity === 'critical';
                  return (
                    <div
                      key={alert.id}
                      className="fs-dash-banner w-full flex items-center justify-between gap-3 px-4 sm:px-5 min-h-[86px] py-2.5 group"
                      style={{
                        background: isLight
                          ? isCritical
                            ? 'linear-gradient(100deg, rgba(255, 224, 230, 0.62) 0%, rgba(255, 240, 244, 0.56) 100%)'
                            : 'linear-gradient(100deg, rgba(255, 242, 214, 0.64) 0%, rgba(255, 248, 232, 0.56) 100%)'
                          : isCritical
                            ? 'linear-gradient(100deg, rgba(122, 34, 58, 0.44) 0%, rgba(28, 62, 92, 0.48) 100%)'
                            : 'linear-gradient(100deg, rgba(126, 78, 22, 0.42) 0%, rgba(16, 76, 98, 0.46) 100%)',
                        borderColor: isLight
                          ? isCritical
                            ? 'rgba(220, 38, 38, 0.42)'
                            : 'rgba(217, 119, 6, 0.42)'
                          : isCritical
                            ? 'rgba(255, 118, 132, 0.56)'
                            : 'rgba(255, 198, 86, 0.56)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectAlert(alert)}
                        className="flex items-center gap-4 min-w-0 flex-1 text-left cursor-pointer focus:outline-none"
                      >
                        <span
                          className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-full grid place-items-center shrink-0 text-white"
                          style={{
                            background: isCritical
                              ? 'linear-gradient(135deg, #FF6475 0%, #DC2642 100%)'
                              : 'linear-gradient(135deg, #FFC43D 0%, #F58E0B 100%)',
                            boxShadow: isCritical
                              ? '0 0 14px rgba(255, 85, 105, 0.35)'
                              : '0 0 14px rgba(255, 180, 42, 0.35)',
                          }}
                        >
                          <AlertTriangle className="w-[22px] h-[22px]" strokeWidth={2.4} />
                        </span>
                        <div className="min-w-0">
                          <div
                            className={`text-[16px] sm:text-[18px] font-semibold leading-snug truncate ${
                              isLight ? 'text-[#07213D]' : 'text-white'
                            }`}
                          >
                            {alert.message}
                          </div>
                          <div
                            className={`text-[13px] sm:text-[15px] mt-0.5 leading-snug truncate ${
                              isLight ? 'text-[#23486B]' : 'text-[#DCEEFB]'
                            }`}
                          >
                            {alert.metric} · Tap for recommendation
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDismissAlert(alert.id)}
                        aria-label={`Dismiss alert: ${alert.message}`}
                        title="Dismiss alert"
                        className={`w-8 h-8 rounded-full grid place-items-center shrink-0 transition-colors cursor-pointer ${
                          isLight
                            ? 'text-[#1D3F60] hover:bg-black/10 hover:text-[#07213D]'
                            : 'text-[#DCEEFB] hover:bg-white/15 hover:text-white'
                        }`}
                      >
                        <X className="w-4 h-4" strokeWidth={2.3} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* --------------------------------------------------------------- */}
        {/* 2. UPPER-RIGHT CARD: ALL FIELDS                                 */}
        {/* --------------------------------------------------------------- */}
        <aside
          aria-label="All Fields"
          className="fs-dash-panel fs-dash-fields px-5 sm:px-6 pt-7 pb-6 flex flex-col justify-between min-h-[565px]"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3.5">
              <Layers
                className={`w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] shrink-0 ${
                  isLight ? 'text-[#048C68]' : 'text-[#1EEAD1]'
                }`}
                strokeWidth={1.9}
              />
              <h3
                className={`text-[24px] sm:text-[26px] font-semibold tracking-[-0.015em] ${
                  isLight ? 'text-[#07213D]' : 'text-white'
                }`}
              >
                All Fields
              </h3>
            </div>
            <button
              type="button"
              onClick={onViewAllFields}
              className={`inline-flex items-center gap-1.5 text-[14.5px] font-medium transition-colors cursor-pointer ${
                isLight
                  ? 'text-[#047A8F] hover:text-[#07213D]'
                  : 'text-[#7FE8FF] hover:text-white'
              }`}
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3 Vertically Stacked Field Cards (strictly real computed field health) */}
          {realFields.length === 0 ? (
            <div className="fs-dash-field-item flex-1 p-6 flex flex-col items-center justify-center text-center gap-3">
              <p className={`text-sm ${isLight ? 'text-[#1B4063]' : 'text-[#D7EBF9]'}`}>
                No crops assigned to this farm yet.
              </p>
              <button
                type="button"
                onClick={onOpenWorkspace}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#04281B] bg-[#20EDA0] cursor-pointer"
              >
                Configure Crops in Workspace
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between gap-4">
              {realFields.slice(0, 3).map((field) => {
                const needsMonitor = field.status === 'Monitor';
                return (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => onSelectField(field)}
                    className="fs-dash-field-item w-full text-left flex items-center gap-4 sm:gap-5 p-2.5 sm:p-3 flex-1 min-h-[138px] cursor-pointer group"
                  >
                    <img
                      src={field.image}
                      alt={`${field.name} ${field.cropName}`}
                      className="w-[118px] sm:w-[144px] xl:w-[154px] h-[108px] sm:h-[124px] rounded-[19px] object-cover shrink-0 border border-[rgba(207,244,255,0.48)] shadow-[0_2px_8px_rgba(0,25,45,0.22)]"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`text-[19px] sm:text-[20px] font-semibold leading-tight ${
                            isLight ? 'text-[#07213D]' : 'text-white'
                          }`}
                        >
                          {field.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[14px] sm:text-[14.5px] font-semibold ${
                            needsMonitor
                              ? isLight
                                ? 'text-[#B45309]'
                                : 'text-[#FFD45C]'
                              : isLight
                                ? 'text-[#047857]'
                                : 'text-[#13E6B7]'
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              needsMonitor ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
                            }`}
                          />
                          <span>{field.status}</span>
                        </span>
                      </div>

                      <div
                        className={`mt-2 text-[15px] sm:text-[16px] tabular-nums truncate ${
                          isLight ? 'text-[#1B4266]' : 'text-[#D7EBF9]'
                        }`}
                      >
                        {field.healthPct}% Health | {liveWeather ? displayTemp : field.cropName}
                      </div>

                      <div
                        className={`mt-3.5 w-full max-w-[212px] h-[7px] rounded-full overflow-hidden ${
                          isLight ? 'bg-[rgba(12,74,110,0.20)]' : 'bg-[rgba(0,52,82,0.62)]'
                        }`}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${field.healthPct}%`,
                            background: needsMonitor
                              ? 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)'
                              : 'linear-gradient(90deg, #10B981 0%, #25E7D2 100%)',
                          }}
                        />
                      </div>
                    </div>

                    <span
                      aria-hidden="true"
                      className={`w-[37px] h-[37px] sm:w-[39px] sm:h-[39px] rounded-full grid place-items-center shrink-0 mr-1 transition-transform duration-200 group-hover:translate-x-0.5 ${
                        isLight
                          ? 'bg-white/55 border border-white/80 text-[#07213D]'
                          : 'bg-[rgba(120,200,238,0.22)] border border-[rgba(165,232,255,0.42)] text-white'
                      }`}
                    >
                      <ChevronRight className="w-[18px] h-[18px]" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>
      </div>

      {/* ================================================================= */}
      {/* 3. BOTTOM CARD: FULL-WIDTH WEATHER INFORMATION PANEL              */}
      {/* ================================================================= */}
      <section
        aria-label="Weather"
        className="fs-dash-panel fs-dash-weather mt-6 xl:mt-7 px-5 sm:px-7 py-4 sm:py-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.34fr_1px_1fr_1px_1.12fr_1px_1.16fr] items-center gap-6 lg:gap-0">
          {/* Column 1: Weather */}
          <div className="flex items-center gap-4 sm:gap-5 lg:pr-5 min-w-0">
            {showSunPrimaryIcon ? (
              <GoldenSunWeatherIcon className="w-[70px] h-[70px] sm:w-[78px] sm:h-[78px] shrink-0" />
            ) : (
              <PartlyCloudy3DIcon className="w-[70px] h-[70px] sm:w-[78px] sm:h-[78px] shrink-0" />
            )}
            <div className="min-w-0">
              <div
                className={`text-[18px] sm:text-[19.5px] font-semibold leading-snug ${
                  isLight ? 'text-[#07213D]' : 'text-white'
                }`}
              >
                Weather
              </div>
              <div className="flex items-baseline gap-3 mt-0.5 flex-wrap">
                <span
                  className={`text-[36px] sm:text-[42px] font-bold leading-none tabular-nums ${
                    isLight ? 'text-[#07213D]' : 'text-white'
                  }`}
                >
                  {displayTemp}
                </span>
                <span
                  className={`text-[15px] sm:text-[16px] ${
                    isLight ? 'text-[#1B4266]' : 'text-[#DCEEFB]'
                  }`}
                >
                  {displayCondition}
                </span>
              </div>
              <div
                className={`text-[13px] sm:text-[14px] mt-1.5 tabular-nums ${
                  isLight ? 'text-[#285178]' : 'text-[#B8D9E9]'
                }`}
              >
                High: {displayHigh} | Low: {displayLow}
              </div>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="hidden lg:block w-px h-[88px] justify-self-center"
            style={{
              background: isLight
                ? 'linear-gradient(180deg, transparent, rgba(16, 98, 148, 0.28) 20%, rgba(16, 98, 148, 0.25) 80%, transparent)'
                : 'linear-gradient(180deg, transparent, rgba(145, 225, 247, 0.40) 18%, rgba(145, 225, 247, 0.36) 82%, transparent)',
            }}
          />

          {/* Column 2: Humidity */}
          <div className="flex items-center gap-4 lg:px-6 min-w-0">
            <DropletGlossIcon className="w-[38px] h-[46px] shrink-0 drop-shadow-[0_0_8px_rgba(47,196,255,0.40)]" />
            <div className="min-w-0">
              <div
                className={`text-[17px] sm:text-[18px] leading-snug ${
                  isLight ? 'text-[#1B4266]' : 'text-[#D6EAF5]'
                }`}
              >
                Humidity
              </div>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span
                  className={`text-[26px] sm:text-[28px] font-semibold leading-tight tabular-nums ${
                    isLight ? 'text-[#07213D]' : 'text-white'
                  }`}
                >
                  {displayHumidity}
                </span>
                {liveWeather && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[14px] sm:text-[15px] font-semibold tabular-nums ${
                      isLight ? 'text-[#048C68]' : 'text-[#1FEEC7]'
                    }`}
                  >
                    {liveWeather.humidityDeltaPct >= 0 ? (
                      <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.4} />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5" strokeWidth={2.4} />
                    )}
                    <span>
                      {liveWeather.humidityDeltaPct >= 0
                        ? `+${liveWeather.humidityDeltaPct}%`
                        : `${liveWeather.humidityDeltaPct}%`}
                    </span>
                  </span>
                )}
              </div>
              {humiditySpark && (
                <svg
                  viewBox="0 0 150 30"
                  className="w-[140px] h-[26px] mt-1 overflow-visible"
                  aria-hidden="true"
                >
                  <path
                    d={humiditySpark}
                    fill="none"
                    stroke={isLight ? '#028489' : '#00DCCB'}
                    strokeWidth="2.1"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          </div>

          <div
            aria-hidden="true"
            className="hidden lg:block w-px h-[88px] justify-self-center"
            style={{
              background: isLight
                ? 'linear-gradient(180deg, transparent, rgba(16, 98, 148, 0.28) 20%, rgba(16, 98, 148, 0.25) 80%, transparent)'
                : 'linear-gradient(180deg, transparent, rgba(145, 225, 247, 0.40) 18%, rgba(145, 225, 247, 0.36) 82%, transparent)',
            }}
          />

          {/* Column 3: Wind Speed */}
          <div className="flex items-center gap-4 lg:px-6 min-w-0">
            <Wind
              className={`w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] shrink-0 ${
                isLight ? 'text-[#0A4A76]' : 'text-[#DCEFFF]'
              }`}
              strokeWidth={1.8}
            />
            <div className="min-w-0 flex-1">
              <div
                className={`text-[17px] sm:text-[18px] leading-snug ${
                  isLight ? 'text-[#1B4266]' : 'text-[#D6EAF5]'
                }`}
              >
                Wind Speed
              </div>
              <div className="flex items-baseline gap-2.5 mt-0.5 flex-wrap">
                <span
                  className={`text-[26px] sm:text-[28px] font-semibold leading-tight tabular-nums whitespace-nowrap ${
                    isLight ? 'text-[#07213D]' : 'text-white'
                  }`}
                >
                  {displayWind}
                </span>
                {liveWeather && (
                  <span
                    className={`inline-flex items-center gap-1 text-[13.5px] sm:text-[14.5px] font-semibold whitespace-nowrap ${
                      isLight ? 'text-[#047A8F]' : 'text-[#52E8DC]'
                    }`}
                  >
                    <Navigation className="w-3 h-3 fill-current shrink-0" />
                    <span>{liveWeather.windDirCompass}</span>
                  </span>
                )}
              </div>
              {windSpark && (
                <svg
                  viewBox="0 0 150 30"
                  preserveAspectRatio="xMinYMid meet"
                  className="block w-full max-w-[140px] h-[26px] mt-1 overflow-hidden"
                  aria-hidden="true"
                >
                  <path
                    d={windSpark}
                    fill="none"
                    stroke={isLight ? '#028489' : '#00DCCB'}
                    strokeWidth="2.1"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          </div>

          <div
            aria-hidden="true"
            className="hidden lg:block w-px h-[88px] justify-self-center"
            style={{
              background: isLight
                ? 'linear-gradient(180deg, transparent, rgba(16, 98, 148, 0.28) 20%, rgba(16, 98, 148, 0.25) 80%, transparent)'
                : 'linear-gradient(180deg, transparent, rgba(145, 225, 247, 0.40) 18%, rgba(145, 225, 247, 0.36) 82%, transparent)',
            }}
          />

          {/* Column 4: Location (click to switch between active farms cleanly) */}
          <div className="relative lg:pl-6 min-w-0">
            <button
              type="button"
              onClick={() => setLocationMenuOpen((v) => !v)}
              aria-expanded={locationMenuOpen}
              title="Switch active farm location"
              className="w-full text-left flex items-center gap-3.5 group cursor-pointer focus:outline-none"
            >
              <LuminousLocationPin
                isLight={isLight}
                className="w-[36px] h-[42px] sm:w-[40px] sm:h-[46px] shrink-0"
              />
              <div className="min-w-0">
                <div
                  className={`text-[17px] sm:text-[18px] leading-snug ${
                    isLight ? 'text-[#1B4266]' : 'text-[#D6EAF5]'
                  }`}
                >
                  Location
                </div>
                <div
                  className={`text-[15.5px] sm:text-[17px] font-semibold truncate mt-0.5 transition-colors ${
                    isLight
                      ? 'text-[#07213D] group-hover:text-[#047A8F]'
                      : 'text-white group-hover:text-[#7FE8FF]'
                  }`}
                >
                  {farmLocationText}
                </div>
              </div>
            </button>

            {locationMenuOpen && (
              <div className="fs-dash-panel absolute right-0 bottom-[calc(100%+18px)] z-40 w-[290px] !rounded-[24px] p-2 space-y-1">
                <div
                  className={`px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-wider ${
                    isLight ? 'text-[#17466E]' : 'text-[#9BD8F0]'
                  }`}
                >
                  Active Farm Profile
                </div>
                {farms.map((farm) => {
                  const isSelected = farm.id === currentFarm.id;
                  return (
                    <button
                      key={farm.id}
                      type="button"
                      onClick={() => {
                        onSelectFarm(farm.id);
                        setLocationMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-left text-[13px] transition-colors cursor-pointer ${
                        isSelected
                          ? isLight
                            ? 'bg-[#048C68]/18 text-[#07213D] font-semibold'
                            : 'bg-[#00DCCB]/22 text-white font-semibold'
                          : isLight
                            ? 'text-[#173D61] hover:bg-white/45'
                            : 'text-[#D7EBF9] hover:bg-white/10'
                      }`}
                    >
                      <span className="truncate">{farm.location.farmName || 'Unnamed Farm'}</span>
                      <span
                        className={`text-[11px] ml-2 shrink-0 ${
                          isLight ? 'text-[#047A8F]' : 'text-[#8ADAF0]'
                        }`}
                      >
                        {farm.location.locationLabel?.split(',')[0] || 'Select'}
                      </span>
                    </button>
                  );
                })}
                <div
                  className={`pt-1 mt-1 border-t ${
                    isLight ? 'border-[#0E4A6F]/15' : 'border-white/15'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setLocationMenuOpen(false);
                      onOpenWorkspace();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-2xl text-[12px] font-medium cursor-pointer ${
                      isLight
                        ? 'text-[#048C68] hover:bg-white/45'
                        : 'text-[#5AFFB4] hover:bg-white/10'
                    }`}
                  >
                    + Manage farms in Workspace →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
