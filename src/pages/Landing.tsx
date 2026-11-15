import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { EonetFetchResult, FarmProfile, PowerClimateResult } from '../types';
import { getActiveFarmId, setActiveFarmId } from '../lib/farmStorage';
import { getDefaultTargetDate } from '../lib/format';
import {
  buildRealFarmFields,
  computeRealFarmHealth,
  ensureSyncedFarmProfiles,
  evaluateRealFarmAlerts,
  getWeeklyFarmHealthSlots,
  HomeFarmAlert,
  HomeFieldView,
  recordDailyFarmHealth,
} from '../lib/homeFarmEvaluator';
import { fetchLiveFarmWeather, LiveWeatherReading } from '../services/weather';
import { fetchNasaPowerClimatology } from '../services/nasaPower';
import { fetchEonetEvents } from '../services/eonet';
import { useDisplayPrefs } from '../context/DisplayPrefsContext';
import { MistyCloudTransition } from '../components/home/MistyCloudTransition';
import {
  DarkHeroSection,
  DarkMoonAndOrbitsOverlay,
  LightSunHaloOverlay,
} from '../components/home/DarkHeroSection';
import { Page2Dashboard } from '../components/home/Page2Dashboard';

interface LandingProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Landing: React.FC<LandingProps> = ({ theme }) => {
  const navigate = useNavigate();
  const isLight = theme === 'light';
  const {
    tempUnit,
    windUnit,
    setLiveAlerts,
    dismissAlert,
    dismissedAlertIds,
    refreshDismissedForFarm,
    setFarmHealthOverridePct,
  } = useDisplayPrefs();

  // Real synced farm profiles shared with /analyze Smart Farm Workspace
  const [farms] = useState<FarmProfile[]>(() => ensureSyncedFarmProfiles());
  const [selectedFarmId, setSelectedFarmId] = useState<string>(() => {
    const savedActive = getActiveFarmId();
    const list = ensureSyncedFarmProfiles();
    if (savedActive && list.some((f) => f.id === savedActive)) return savedActive;
    return list[0]?.id ?? '';
  });

  const currentFarm = useMemo(
    () => farms.find((f) => f.id === selectedFarmId) ?? farms[0],
    [farms, selectedFarmId]
  );

  // Modals
  const [activeAlert, setActiveAlert] = useState<HomeFarmAlert | null>(null);
  const [activeField, setActiveField] = useState<HomeFieldView | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  // Live API Telemetry State (Open-Meteo + NASA POWER + NASA EONET v3)
  const [liveWeather, setLiveWeather] = useState<LiveWeatherReading | null>(null);
  const [powerData, setPowerData] = useState<PowerClimateResult | null>(null);
  const [eonetData, setEonetData] = useState<EonetFetchResult | null>(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const [refreshSpinning, setRefreshSpinning] = useState(false);
  const [ringAnimated, setRingAnimated] = useState(false);

  // Fetch live meteorological & NASA satellite data for the active farm's coordinates
  const loadFarmTelemetry = useCallback(async (farm: FarmProfile) => {
    const lat = farm.location.lat ?? 42.0308;
    const lon = farm.location.lon ?? -93.6319;
    setTelemetryLoading(true);
    setTelemetryError(null);

    const targetDate = getDefaultTargetDate();
    const [weatherRes, powerRes, eonetRes] = await Promise.allSettled([
      fetchLiveFarmWeather(lat, lon),
      fetchNasaPowerClimatology(lat, lon, targetDate, undefined, 'farming'),
      fetchEonetEvents(lat, lon, 300),
    ]);

    if (weatherRes.status === 'fulfilled') {
      setLiveWeather(weatherRes.value);
    } else {
      setLiveWeather(null);
    }

    if (powerRes.status === 'fulfilled') {
      setPowerData(powerRes.value);
    } else {
      setPowerData(null);
    }

    if (eonetRes.status === 'fulfilled') {
      setEonetData(eonetRes.value);
    } else {
      setEonetData(null);
    }

    if (
      weatherRes.status === 'rejected' &&
      powerRes.status === 'rejected' &&
      eonetRes.status === 'rejected'
    ) {
      setTelemetryError('Unable to reach live weather & NASA APIs right now.');
    }

    setLastSyncedAt(Date.now());
    setTelemetryLoading(false);
  }, []);

  useEffect(() => {
    if (!currentFarm) return;
    setActiveFarmId(currentFarm.id);
    loadFarmTelemetry(currentFarm);
  }, [currentFarm, loadFarmTelemetry]);

  useEffect(() => {
    const timer = window.setTimeout(() => setRingAnimated(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!currentFarm) return;
    refreshDismissedForFarm(currentFarm.id);
  }, [currentFarm, refreshDismissedForFarm]);

  // Derive real fields, real conditional alerts, and calculated overall farm health
  const realFields = useMemo(
    () => buildRealFarmFields(currentFarm, liveWeather, powerData, eonetData),
    [currentFarm, liveWeather, powerData, eonetData]
  );

  const realAlerts = useMemo(
    () => evaluateRealFarmAlerts(currentFarm, realFields, liveWeather, powerData, eonetData),
    [currentFarm, realFields, liveWeather, powerData, eonetData]
  );

  useEffect(() => {
    if (currentFarm) {
      setLiveAlerts(currentFarm.id, realAlerts);
    }
  }, [currentFarm, realAlerts, setLiveAlerts]);

  const activeAlerts = useMemo(
    () => realAlerts.filter((a) => !dismissedAlertIds.includes(a.id)),
    [realAlerts, dismissedAlertIds]
  );

  const dismissedCount = realAlerts.length - activeAlerts.length;

  const handleDismissAlert = useCallback(
    (alertId: string) => {
      if (!currentFarm) return;
      dismissAlert(currentFarm.id, alertId);
    },
    [currentFarm, dismissAlert]
  );

  const healthBreakdown = useMemo(
    () =>
      computeRealFarmHealth(
        currentFarm,
        realFields,
        liveWeather,
        powerData,
        eonetData,
        realAlerts
      ),
    [currentFarm, realFields, liveWeather, powerData, eonetData, realAlerts]
  );

  // Persist today's real farm health reading for the Weekly Daily Health graph & Header summary
  useEffect(() => {
    if (!currentFarm) return;
    recordDailyFarmHealth(currentFarm.id, healthBreakdown.overallPct);
    setFarmHealthOverridePct(healthBreakdown.overallPct);
  }, [currentFarm, healthBreakdown.overallPct, lastSyncedAt, setFarmHealthOverridePct]);

  const { slots: weeklySlots, deltaVsPrevious } = useMemo(
    () => getWeeklyFarmHealthSlots(currentFarm.id),
    [currentFarm.id, healthBreakdown.overallPct, lastSyncedAt]
  );

  const handleRefreshConditions = async () => {
    setRefreshSpinning(true);
    await loadFarmTelemetry(currentFarm);
    setRefreshSpinning(false);
  };

  const handleOpenWorkspace = (path = '/analyze?mode=farm') => {
    setActiveFarmId(currentFarm.id);
    navigate(path);
  };

  const farmLocationText =
    currentFarm.location.locationLabel ||
    currentFarm.location.regionOrAddress ||
    (currentFarm.location.lat !== null && currentFarm.location.lon !== null
      ? `${currentFarm.location.lat.toFixed(2)}°, ${currentFarm.location.lon.toFixed(2)}°`
      : 'Coordinates not set');

  const scrollToDashboard = useCallback(() => {
    const el = document.getElementById('farm-dashboard');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-clip transition-colors duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] selection:bg-[#20E9C4]/30 ${
        isLight
          ? 'bg-[#C4E2FB] text-[#08223D] selection:text-[#04281B]'
          : 'bg-[#020B18] text-[#F3F6FF] selection:text-white'
      }`}
      style={{ fontFamily: '"Inter", "Manrope", sans-serif' }}
    >
      {/* ===================================================================== */}
      {/* PAGE 1 HERO SECTION (Scrolls upward naturally with top landscape)     */}
      {/* Dark: image_baca392f | Light: image_1c65eb53                          */}
      {/* ===================================================================== */}
      <div className="relative z-10 min-h-screen flex flex-col overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            src="/assets/aistudio/image_baca392f.png"
            alt=""
            className={`absolute inset-0 w-full h-full object-cover object-center transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isLight ? 'opacity-0 scale-[1.03]' : 'opacity-100 scale-100'
            }`}
          />
          <img
            src="/assets/aistudio/image_1c65eb53.png"
            alt=""
            className={`absolute inset-0 w-full h-full object-cover object-center transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isLight ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'
            }`}
          />

          {/* Directional atmospheric scrims matching Night & Daytime specifications */}
          <div
            className="absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              background: isLight
                ? 'linear-gradient(90deg, rgba(225, 244, 255, 0.22) 0%, rgba(220, 242, 255, 0.10) 34%, transparent 66%), linear-gradient(180deg, rgba(255, 255, 255, 0.025) 0%, transparent 50%, rgba(0, 35, 25, 0.12) 100%)'
                : 'linear-gradient(90deg, rgba(0, 8, 20, 0.72) 0%, rgba(0, 12, 29, 0.48) 28%, rgba(0, 14, 32, 0.08) 46%, rgba(0, 12, 27, 0.04) 68%, rgba(0, 12, 27, 0.18) 100%), linear-gradient(180deg, rgba(0, 7, 18, 0.56) 0%, rgba(0, 12, 27, 0.12) 26%, rgba(0, 12, 22, 0.02) 50%, rgba(0, 12, 19, 0.18) 70%, rgba(0, 9, 15, 0.56) 100%)',
            }}
          />

          {/* Celestial bloom & geospatial overlays */}
          {isLight ? <LightSunHaloOverlay /> : <DarkMoonAndOrbitsOverlay />}
        </div>

        <DarkHeroSection
          isLight={isLight}
          onExplorePlatform={() => handleOpenWorkspace('/analyze?mode=farm')}
          onScrollToDashboard={scrollToDashboard}
        />
      </div>

      {/* ===================================================================== */}
      {/* MISTY HYPER-REALISTIC ANIMATED CLOUDY OVERLAY BETWEEN THE 2 SECTIONS  */}
      {/* ===================================================================== */}
      <MistyCloudTransition isLight={isLight} />

      {/* ===================================================================== */}
      {/* PAGE 2 BELOW: Scrolls up to replace Page 1, then stays sticky while   */}
      {/* the cards scroll smoothly over it!                                    */}
      {/* Dark: image_f90e4497 | Light: image_73994810                          */}
      {/* ===================================================================== */}
      <div id="farm-dashboard" className="relative z-10 overflow-x-clip">
        {/* Sticky background layer inside Page 2 container (dual-layer cross-dissolve) */}
        <div
          aria-hidden="true"
          className="sticky top-0 h-screen w-full -mb-[100vh] pointer-events-none z-0 overflow-hidden"
        >
          <img
            src="/assets/aistudio/image_f90e4497.png"
            alt=""
            className={`absolute inset-0 w-full h-full object-cover object-center transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isLight ? 'opacity-0 scale-[1.03]' : 'opacity-100 scale-100'
            }`}
          />
          <img
            src="/assets/aistudio/image_73994810.png"
            alt=""
            className={`absolute inset-0 w-full h-full object-cover object-center brightness-[0.80] contrast-[1.03] saturate-[0.94] transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isLight ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'
            }`}
          />
          {/* Soft upper edge feather so Page 2 meets the drifting mist cleanly */}
          <div
            className="absolute inset-x-0 top-0 h-32 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              background: isLight
                ? 'linear-gradient(180deg, rgba(196, 224, 246, 0.52) 0%, rgba(196, 224, 246, 0.18) 55%, rgba(196, 224, 246, 0) 100%)'
                : 'linear-gradient(180deg, rgba(2, 16, 40, 0.72) 0%, rgba(2, 16, 40, 0.28) 55%, rgba(2, 16, 40, 0) 100%)',
            }}
          />
          {/* Subtle readability scrim */}
          <div
            className="absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              background: isLight
                ? 'linear-gradient(180deg, rgba(14, 46, 82, 0.14) 0%, rgba(12, 42, 74, 0.16) 70%, rgba(8, 30, 56, 0.26) 100%)'
                : 'linear-gradient(180deg, rgba(0, 11, 29, 0.14) 0%, rgba(0, 11, 29, 0.26) 65%, rgba(0, 5, 17, 0.50) 100%)',
            }}
          />
        </div>

        {/* Scrolling Three-Panel Luminous Glass Dashboard over sticky Page 2 farm landscape */}
        <Page2Dashboard
          isLight={isLight}
          currentFarm={currentFarm}
          farms={farms}
          onSelectFarm={setSelectedFarmId}
          realFields={realFields}
          activeAlerts={activeAlerts}
          dismissedCount={dismissedCount}
          weeklySlots={weeklySlots}
          deltaVsPrevious={deltaVsPrevious}
          healthBreakdown={healthBreakdown}
          liveWeather={liveWeather}
          telemetryLoading={telemetryLoading}
          telemetryError={telemetryError}
          lastSyncedAt={lastSyncedAt}
          refreshSpinning={refreshSpinning}
          ringAnimated={ringAnimated}
          tempUnit={tempUnit}
          windUnit={windUnit}
          farmLocationText={farmLocationText}
          onRefresh={handleRefreshConditions}
          onOpenBreakdown={() => setBreakdownOpen(true)}
          onSelectAlert={setActiveAlert}
          onDismissAlert={handleDismissAlert}
          onSelectField={setActiveField}
          onViewAllFields={() => handleOpenWorkspace('/analyze?mode=farm')}
          onOpenWorkspace={() => handleOpenWorkspace('/analyze?mode=farm')}
        />
      </div>

      {/* HEALTH CALCULATION BREAKDOWN MODAL */}
      {breakdownOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
            isLight ? 'bg-[#092340]/45' : 'bg-[#000817]/75'
          }`}
          onClick={() => setBreakdownOpen(false)}
        >
          <div
            className="fs-glass-card w-full max-w-lg rounded-[30px] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4
                  className={`text-lg font-semibold ${
                    isLight ? 'text-[#082441]' : 'text-[#F1F7FF]'
                  }`}
                >
                  Farm Health Calculation ({healthBreakdown.overallPct}%)
                </h4>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-[#284F76]' : 'text-[#B5C7DC]'}`}>
                  Deterministic score for {currentFarm.location.farmName || 'Active Farm'} · {farmLocationText}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBreakdownOpen(false)}
                className={`cursor-pointer ${
                  isLight ? 'text-[#3B628A] hover:text-[#082441]' : 'text-[#9AB4CE] hover:text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {healthBreakdown.components.map((c) => (
                <div
                  key={c.label}
                  className={`p-3.5 rounded-2xl border space-y-1.5 ${
                    isLight
                      ? 'bg-white/65 border-[#BEDDF5]'
                      : 'bg-white/[0.04] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`font-medium ${isLight ? 'text-[#082441]' : 'text-[#EAF4FF]'}`}
                    >
                      {c.label}
                    </span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        isLight ? 'text-[#058E61]' : 'text-[#23EBA0]'
                      }`}
                    >
                      {c.score}/100
                    </span>
                  </div>
                  <div
                    className={`h-1.5 rounded-full overflow-hidden ${
                      isLight ? 'bg-[#C8E4FA]' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0FD891] to-[#5AFFB4]"
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                  <p className={`text-xs ${isLight ? 'text-[#274C72]' : 'text-[#B5C7DC]'}`}>
                    {c.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBreakdownOpen(false)}
                className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer ${
                  isLight
                    ? 'text-[#1D4268] hover:bg-white/70'
                    : 'text-[#D4E2F1] hover:bg-white/10'
                }`}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setBreakdownOpen(false);
                  handleOpenWorkspace('/analyze?mode=farm');
                }}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#04281B] bg-[#20EDA0] hover:brightness-110 cursor-pointer"
              >
                Open Full Farm Report →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT DETAIL MODAL */}
      {activeAlert && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
            isLight ? 'bg-[#092340]/45' : 'bg-[#000817]/75'
          }`}
          onClick={() => setActiveAlert(null)}
        >
          <div
            className="fs-glass-card w-full max-w-md rounded-[28px] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle
                  className="w-5 h-5"
                  style={{
                    color: isLight
                      ? activeAlert.severity === 'critical'
                        ? '#C81E2B'
                        : '#B85D00'
                      : activeAlert.severity === 'critical'
                        ? '#FF555F'
                        : '#FFA52E',
                  }}
                />
                <span
                  className="text-sm font-bold"
                  style={{
                    color: isLight
                      ? activeAlert.severity === 'critical'
                        ? '#C81E2B'
                        : '#B85D00'
                      : activeAlert.severity === 'critical'
                        ? '#FF555F'
                        : '#FFA52E',
                  }}
                >
                  {activeAlert.source} Alert
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveAlert(null)}
                className={`cursor-pointer ${
                  isLight ? 'text-[#3B628A] hover:text-[#082441]' : 'text-[#9AB4CE] hover:text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h4
              className={`text-lg font-semibold ${isLight ? 'text-[#082441]' : 'text-[#F1F7FF]'}`}
            >
              {activeAlert.message}
            </h4>
            <p
              className={`text-sm leading-relaxed ${
                isLight ? 'text-[#1F446A]' : 'text-[#D4E2F1]'
              }`}
            >
              {activeAlert.recommendation}
            </p>
            <div
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-mono ${
                isLight
                  ? 'bg-white/70 border-[#BEDDF5] text-[#05734E]'
                  : 'bg-white/[0.05] border-white/10 text-[#8CFFD2]'
              }`}
            >
              {activeAlert.metric}
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveAlert(null)}
                className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer ${
                  isLight
                    ? 'text-[#1D4268] hover:bg-white/70'
                    : 'text-[#D4E2F1] hover:bg-white/10'
                }`}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveAlert(null);
                  handleOpenWorkspace('/analyze?mode=farm');
                }}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#04281B] bg-[#20EDA0] hover:brightness-110 cursor-pointer"
              >
                Run Full Farm Analysis →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIELD DETAIL MODAL */}
      {activeField && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
            isLight ? 'bg-[#092340]/45' : 'bg-[#000817]/75'
          }`}
          onClick={() => setActiveField(null)}
        >
          <div
            className="fs-glass-card w-full max-w-md rounded-[28px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-44">
              <img
                src={activeField.image}
                alt={`${activeField.name} ${activeField.cropName}`}
                className="w-full h-full object-cover"
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${
                  isLight ? 'from-[#E8F6FF]' : 'from-[#001631]'
                }`}
              />
              <button
                type="button"
                onClick={() => setActiveField(null)}
                aria-label="Close field details"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4
                    className={`text-xl font-semibold ${
                      isLight ? 'text-[#082441]' : 'text-[#F4F8FF]'
                    }`}
                  >
                    {activeField.name}
                  </h4>
                  <p
                    className={`text-sm font-medium ${
                      isLight ? 'text-[#058E61]' : 'text-[#5AFFB4]'
                    }`}
                  >
                    {activeField.cropName}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    isLight
                      ? 'bg-[#0DC487]/18 text-[#05734E] border-[#0DC487]/35'
                      : 'bg-[#19EAB2]/20 text-[#23EBA0] border-[#19EAB2]/35'
                  }`}
                >
                  {activeField.rotationLabel}
                </span>
              </div>
              <p
                className={`text-sm leading-relaxed ${
                  isLight ? 'text-[#1F446A]' : 'text-[#D4E2F1]'
                }`}
              >
                {activeField.notes}
              </p>
              <div
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs ${
                  isLight
                    ? 'bg-white/70 border-[#BEDDF5]'
                    : 'bg-white/[0.05] border-white/10'
                }`}
              >
                <span className={isLight ? 'text-[#284F76]' : 'text-[#B5C7DC]'}>
                  Nitrogen Profile
                </span>
                <span
                  className={`font-mono font-semibold capitalize ${
                    isLight ? 'text-[#0B66B8]' : 'text-[#3CCBFF]'
                  }`}
                >
                  {activeField.nitrogenRole}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveField(null)}
                  className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer ${
                    isLight
                      ? 'text-[#1D4268] hover:bg-white/70'
                      : 'text-[#D4E2F1] hover:bg-white/10'
                  }`}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveField(null);
                    handleOpenWorkspace('/analyze?mode=farm');
                  }}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#04281B] bg-[#20EDA0] hover:brightness-110 cursor-pointer"
                >
                  Plan Rotation for {activeField.name} →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
