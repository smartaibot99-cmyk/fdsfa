import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Database,
  Home,
  Info,
  Map as MapIcon,
  Menu,
  Moon,
  Scale,
  Settings,
  Sprout,
  Sun,
  X,
} from 'lucide-react';
import { FieldShiftLogoLeaf } from './home/FieldShiftIcons';
import { useDisplayPrefs } from '../context/DisplayPrefsContext';
import { ensureSyncedFarmProfiles, HomeFarmAlert } from '../lib/homeFarmEvaluator';
import { getActiveFarmId, setActiveFarmId } from '../lib/farmStorage';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: (e?: React.MouseEvent<HTMLElement>) => void;
  overlay?: boolean;
}

export const AnchorLogo: React.FC<{ className?: string; plantMode?: boolean }> = ({
  className = 'w-7 h-7',
}) => <FieldShiftLogoLeaf className={className} />;

const NAV_ITEMS = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/my-farms', label: 'My Farms', Icon: Sprout },
  { to: '/maps', label: 'Maps', Icon: MapIcon },
  { to: '/analyze', label: 'Analyze', Icon: BarChart3 },
  { to: '/compare', label: 'Compare', Icon: Scale },
  { to: '/data', label: 'Data Sources', Icon: Database },
  { to: '/about', label: 'About', Icon: Info },
] as const;

export const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme, overlay = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLight = theme === 'light';

  const {
    tempUnit,
    setTempUnit,
    windUnit,
    setWindUnit,
    activeAlerts,
    dismissedCount,
    dismissAlert,
    restoreAlerts,
    farmHealthOverridePct,
  } = useDisplayPrefs();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedAlertModal, setSelectedAlertModal] = useState<HomeFarmAlert | null>(null);

  const currentFarm = useMemo(() => {
    const farms = ensureSyncedFarmProfiles();
    const activeId = getActiveFarmId();
    return farms.find((f) => f.id === activeId) ?? farms[0];
  }, [location.pathname, profileMenuOpen, notifOpen]);

  const farmLocationText = currentFarm
    ? currentFarm.location.locationLabel ||
      currentFarm.location.regionOrAddress ||
      (currentFarm.location.lat !== null && currentFarm.location.lon !== null
        ? `${currentFarm.location.lat.toFixed(2)}°, ${currentFarm.location.lon.toFixed(2)}°`
        : 'Coordinates not set')
    : 'No active farm';

  const handleOpenWorkspace = (path = '/analyze?mode=farm') => {
    if (currentFarm) {
      setActiveFarmId(currentFarm.id);
    }
    setProfileMenuOpen(false);
    setSelectedAlertModal(null);
    navigate(path);
  };

  return (
    <>
      <div
        className={`no-print fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${
          overlay
            ? 'pointer-events-none pt-5 sm:pt-6'
            : isLight
              ? 'bg-[#CFE7FC]/92 backdrop-blur-md border-b border-[#8AC4F2]/55 py-3'
              : 'bg-[#03101F]/92 backdrop-blur-md border-b border-white/[0.08] py-3'
        }`}
      >
        <div
          className={`max-w-[1520px] w-full mx-auto px-5 sm:px-8 lg:px-14 xl:px-[74px]`}
        >
          <header className="relative z-30 pointer-events-auto flex items-center justify-between gap-4">
            {/* Left Brand Wordmark: Leaf Icon + ANCHOR */}
            <Link
              to="/"
              className="inline-flex items-center gap-3 shrink-0 focus:outline-none group"
              aria-label="ANCHOR Home"
            >
              <FieldShiftLogoLeaf className="w-[44px] h-[44px] sm:w-[49px] sm:h-[49px] shrink-0 transition-transform duration-200 group-hover:scale-105" />
              <span
                className={`text-[19px] sm:text-[22px] font-extrabold leading-none tracking-[0.9px] uppercase ${
                  isLight ? 'text-[#071C39]' : 'text-[#F3F6FF]'
                }`}
              >
                ANCHOR
              </span>
            </Link>

            {/* Center Floating Glass Pill Nav (Identical across all pages) */}
            <nav
              aria-label="Primary navigation"
              className="hidden lg:flex items-center justify-between gap-1 xl:gap-1.5 h-[55px] px-2 rounded-full w-auto shrink-0"
              style={
                isLight
                  ? {
                      background:
                        'linear-gradient(110deg, rgba(225, 246, 255, 0.65), rgba(199, 232, 252, 0.74), rgba(227, 246, 255, 0.67))',
                      border: '1px solid rgba(130, 218, 255, 0.65)',
                      backdropFilter: 'blur(20px) saturate(140%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(140%)',
                      boxShadow:
                        '0 4px 20px rgba(42, 143, 214, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.75)',
                    }
                  : {
                      background:
                        'linear-gradient(110deg, rgba(2, 45, 64, 0.79), rgba(0, 28, 53, 0.86), rgba(2, 39, 69, 0.77))',
                      border: '1px solid rgba(0, 164, 190, 0.22)',
                      backdropFilter: 'blur(18px) saturate(145%)',
                      WebkitBackdropFilter: 'blur(18px) saturate(145%)',
                      boxShadow:
                        '0 0 16px rgba(0, 162, 210, 0.09), inset 0 1px 1px rgba(117, 231, 255, 0.07)',
                    }
              }
            >
              {NAV_ITEMS.map(({ to, label, Icon }) => {
                const active =
                  to === '/'
                    ? location.pathname === '/'
                    : location.pathname === to || location.pathname.startsWith(`${to}/`);
                if (active) {
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`relative inline-flex items-center justify-center gap-2 h-[43px] px-4 xl:px-5 rounded-full text-[13.5px] xl:text-[14px] font-medium whitespace-nowrap shrink-0 transition-all ${
                        isLight ? 'text-[#071D42]' : 'text-white'
                      }`}
                      style={
                        isLight
                          ? {
                              background:
                                'linear-gradient(120deg, rgba(175, 243, 255, 0.90), rgba(179, 255, 239, 0.80))',
                              border: '1px solid rgba(0, 212, 205, 0.34)',
                              boxShadow:
                                '0 0 13px rgba(0, 220, 220, 0.23), inset 0 1px 2px rgba(255, 255, 255, 0.75)',
                            }
                          : {
                              background:
                                'linear-gradient(135deg, rgba(0, 177, 171, 0.26), rgba(0, 94, 110, 0.29))',
                              border: '1px solid rgba(0, 225, 200, 0.28)',
                              boxShadow:
                                '0 0 15px rgba(0, 226, 196, 0.14), inset 0 1px 2px rgba(133, 255, 238, 0.12)',
                            }
                      }
                    >
                      <Icon
                        className={`w-[19px] h-[19px] ${
                          isLight ? 'text-[#071D42]' : 'text-[#E9FFF7]'
                        }`}
                        strokeWidth={2}
                      />
                      <span>{label}</span>
                      <span
                        aria-hidden="true"
                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[56%] h-[2px] rounded-full ${
                          isLight ? 'bg-[#00E5C1]' : 'bg-[#00E9C4]'
                        }`}
                        style={{
                          boxShadow: isLight
                            ? '0 0 8px rgba(0, 226, 190, 0.85)'
                            : '0 0 7px #00E9C4, 0 0 14px rgba(0, 233, 196, 0.78)',
                        }}
                      />
                    </Link>
                  );
                }

                return (
                  <Link
                    key={to}
                    to={to}
                    className={`inline-flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3.5 h-[43px] rounded-full text-[13.5px] xl:text-[14px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isLight
                        ? 'text-[#071D42] hover:bg-white/35'
                        : 'text-[#DCE9F7] hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] ${
                        isLight ? 'text-[#071D42]' : 'text-[#DCE9F7]'
                      }`}
                      strokeWidth={1.9}
                    />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Controls: Theme Switch, Settings, Notifications, Profile Avatar, Mobile Menu */}
            <div className="relative flex items-center gap-2.5 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={(e) => onToggleTheme(e)}
                aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                className={`relative inline-flex items-center justify-center w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-full transition-all duration-500 cursor-pointer overflow-hidden ${
                  isLight
                    ? 'bg-[rgba(216,241,255,0.62)] hover:bg-[rgba(228,246,255,0.86)] text-[#071D42] border border-[rgba(126,214,255,0.62)]'
                    : 'text-[#F1F7FF] hover:bg-[#063B66]/70 border border-[rgba(48,162,235,0.34)] bg-[rgba(3,33,60,0.58)]'
                }`}
                style={{
                  backdropFilter: 'blur(14px)',
                  boxShadow: isLight
                    ? '0 2px 10px rgba(31, 132, 215, 0.10), inset 0 1px 2px rgba(255, 255, 255, 0.75)'
                    : '0 0 12px rgba(0, 128, 220, 0.14), inset 0 1px 1px rgba(170, 225, 255, 0.10)',
                }}
              >
                <Sun
                  className={`w-[20px] h-[20px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isLight ? 'text-[#071D42] rotate-0 scale-100' : 'text-[#F1F7FF] rotate-0 scale-100'
                  }`}
                  strokeWidth={1.9}
                />
                <Moon className="sr-only" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSettingsOpen((v) => !v);
                  setNotifOpen(false);
                  setProfileMenuOpen(false);
                }}
                aria-label="Open display preferences"
                title="Display Preferences"
                className={`inline-flex items-center justify-center w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-full transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-[rgba(216,241,255,0.62)] hover:bg-[rgba(228,246,255,0.86)] text-[#071D42] border border-[rgba(126,214,255,0.62)]'
                    : 'text-[#F1F7FF] hover:bg-[#063B66]/70 border border-[rgba(48,162,235,0.34)] bg-[rgba(3,33,60,0.58)]'
                }`}
                style={{
                  backdropFilter: 'blur(14px)',
                  boxShadow: isLight
                    ? '0 2px 10px rgba(31, 132, 215, 0.10), inset 0 1px 2px rgba(255, 255, 255, 0.75)'
                    : '0 0 12px rgba(0, 128, 220, 0.14), inset 0 1px 1px rgba(170, 225, 255, 0.10)',
                }}
              >
                <Settings className="w-[19px] h-[19px]" strokeWidth={1.9} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setSettingsOpen(false);
                  setProfileMenuOpen(false);
                }}
                aria-label="View farm notifications"
                className={`relative inline-flex items-center justify-center w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-full transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-[rgba(216,241,255,0.62)] hover:bg-[rgba(228,246,255,0.86)] text-[#071D42] border border-[rgba(126,214,255,0.62)]'
                    : 'text-[#F1F7FF] hover:bg-[#063B66]/70 border border-[rgba(48,162,235,0.34)] bg-[rgba(3,33,60,0.58)]'
                }`}
                style={{
                  backdropFilter: 'blur(14px)',
                  boxShadow: isLight
                    ? '0 2px 10px rgba(31, 132, 215, 0.10), inset 0 1px 2px rgba(255, 255, 255, 0.75)'
                    : '0 0 12px rgba(0, 128, 220, 0.14), inset 0 1px 1px rgba(170, 225, 255, 0.10)',
                }}
              >
                <Bell
                  className={`w-[20px] h-[20px] ${isLight ? 'text-[#071D42]' : 'text-[#F1F7FF]'}`}
                  strokeWidth={1.9}
                />
                {activeAlerts.length > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 right-1.5 w-[8px] h-[8px] rounded-full bg-[#00E5C1] border border-[#03442E]"
                    style={{
                      boxShadow: '0 0 8px rgba(0, 229, 193, 0.90)',
                    }}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen((v) => !v);
                  setNotifOpen(false);
                  setSettingsOpen(false);
                }}
                aria-label="Open farm profile menu"
                className="relative w-[44px] h-[44px] sm:w-[46px] sm:h-[46px] rounded-full shrink-0 cursor-pointer transition-transform hover:scale-105 flex items-center justify-center"
                style={
                  isLight
                    ? {
                        background:
                          'linear-gradient(145deg, rgba(208, 236, 255, 0.78), rgba(182, 224, 250, 0.74))',
                        border: '1.5px solid rgba(116, 206, 248, 0.72)',
                        backdropFilter: 'blur(14px)',
                        boxShadow:
                          '0 2px 10px rgba(31, 132, 215, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.78)',
                      }
                    : {
                        background:
                          'linear-gradient(145deg, rgba(16, 62, 108, 0.80), rgba(5, 34, 66, 0.88))',
                        border: '1.5px solid rgba(64, 172, 240, 0.44)',
                        backdropFilter: 'blur(14px)',
                        boxShadow:
                          '0 4px 14px rgba(0, 0, 0, 0.42), 0 0 14px rgba(22, 139, 255, 0.22)',
                      }
                }
              >
                <span
                  className={`text-[16px] font-semibold leading-none ${
                    isLight ? 'text-[#071D42]' : 'text-[#F4F9FF]'
                  }`}
                >
                  B
                </span>
                <span
                  aria-hidden="true"
                  className={`absolute bottom-0.5 right-0.5 w-[9px] h-[9px] rounded-full bg-[#00E5C1] border-[1.5px] ${
                    isLight ? 'border-[#D9F1FF]' : 'border-[#032645]'
                  }`}
                  style={{
                    boxShadow: '0 0 8px rgba(0, 229, 193, 0.85)',
                  }}
                />
              </button>

              <button
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileNavOpen}
                className={`lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-full cursor-pointer ${
                  isLight ? 'text-[#071D42]' : 'text-[#EAF4FF]'
                }`}
                style={{
                  background: isLight ? 'rgba(218, 242, 255, 0.72)' : 'rgba(0, 42, 82, 0.55)',
                  border: isLight
                    ? '1px solid rgba(130, 218, 255, 0.75)'
                    : '1px solid rgba(45, 160, 255, 0.25)',
                  backdropFilter: 'blur(14px)',
                }}
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Notifications Popover */}
              {notifOpen && (
                <div className="fs-glass-card absolute right-0 top-[56px] z-40 w-[320px] rounded-[24px] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[13px] font-semibold ${
                        isLight ? 'text-[#08223E]' : 'text-[#F1F7FF]'
                      }`}
                    >
                      Active Field Alerts ({activeAlerts.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      aria-label="Close notifications"
                      className={`cursor-pointer ${
                        isLight ? 'text-[#395B7F] hover:text-[#08223E]' : 'text-[#9AB4CE] hover:text-white'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {activeAlerts.length === 0 ? (
                    <div
                      className={`p-3 rounded-xl text-[12.5px] space-y-2 ${
                        isLight
                          ? 'bg-white/60 border border-[#B5D7F4] text-[#173A5E]'
                          : 'bg-white/[0.04] border border-white/10 text-[#C8DAEC]'
                      }`}
                    >
                      <p>
                        No active alerts for {currentFarm?.location.farmName || 'this farm'}. All monitored conditions are nominal.
                      </p>
                      {dismissedCount > 0 && currentFarm && (
                        <button
                          type="button"
                          onClick={() => restoreAlerts(currentFarm.id)}
                          className={`text-[11.5px] font-semibold underline cursor-pointer ${
                            isLight ? 'text-[#047C57]' : 'text-[#1FE8CB]'
                          }`}
                        >
                          Restore {dismissedCount} dismissed
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[250px] overflow-y-auto pr-1 space-y-2 fs-thin-scroll">
                        {activeAlerts.map((al) => (
                          <div
                            key={al.id}
                            className={`flex items-start gap-2 p-2.5 rounded-xl transition-colors ${
                              isLight
                                ? 'bg-white/60 hover:bg-white/85 border border-[#B5D7F4]'
                                : 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/10'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAlertModal(al);
                                setNotifOpen(false);
                              }}
                              className="flex-1 min-w-0 text-left cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[11px] font-semibold ${
                                    al.severity === 'critical'
                                      ? isLight
                                        ? 'text-[#C91D2A]'
                                        : 'text-[#FF555F]'
                                      : isLight
                                        ? 'text-[#B56200]'
                                        : 'text-[#FFA52E]'
                                  }`}
                                >
                                  Alert · {al.source}
                                </span>
                              </div>
                              <div
                                className={`text-[12.5px] mt-0.5 leading-snug ${
                                  isLight ? 'text-[#0B2A4A]' : 'text-[#E6F0FB]'
                                }`}
                              >
                                {al.message}
                              </div>
                            </button>
                            {currentFarm && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissAlert(currentFarm.id, al.id);
                                }}
                                aria-label={`Dismiss ${al.source} alert`}
                                title="Dismiss alert"
                                className={`shrink-0 p-1 rounded-full transition-colors cursor-pointer ${
                                  isLight
                                    ? 'text-[#395B7F] hover:text-[#08223E] hover:bg-black/10'
                                    : 'text-[#9AB4CE] hover:text-white hover:bg-white/15'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {dismissedCount > 0 && currentFarm && (
                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => restoreAlerts(currentFarm.id)}
                            className={`text-[11.5px] font-medium hover:underline cursor-pointer ${
                              isLight ? 'text-[#047C57]' : 'text-[#1FE8CB]'
                            }`}
                          >
                            Restore {dismissedCount} dismissed
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Quick Settings Popover */}
              {settingsOpen && (
                <div className="fs-glass-card absolute right-0 top-[56px] z-40 w-[285px] rounded-[24px] p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[13px] font-semibold ${
                        isLight ? 'text-[#08223E]' : 'text-[#F1F7FF]'
                      }`}
                    >
                      Display Preferences
                    </span>
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(false)}
                      className={`cursor-pointer ${
                        isLight ? 'text-[#395B7F] hover:text-[#08223E]' : 'text-[#9AB4CE] hover:text-white'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Theme Selector */}
                  <div
                    className={`flex items-center justify-between text-[12.5px] ${
                      isLight ? 'text-[#183C60]' : 'text-[#D4E2F1]'
                    }`}
                  >
                    <span>Atmosphere</span>
                    <div
                      className={`inline-flex rounded-lg p-0.5 border ${
                        isLight ? 'bg-white/70 border-[#B7D7F2]' : 'bg-[#00152B] border-white/10'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          if (!isLight) onToggleTheme(e);
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all duration-300 ${
                          isLight ? 'bg-[#11C98D] text-white' : 'text-[#B5C7DC] hover:text-white'
                        }`}
                      >
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          if (isLight) onToggleTheme(e);
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all duration-300 ${
                          !isLight ? 'bg-[#19EAB2] text-[#04281D]' : 'text-[#31557B] hover:text-[#08223E]'
                        }`}
                      >
                        Dark
                      </button>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between text-[12.5px] ${
                      isLight ? 'text-[#183C60]' : 'text-[#D4E2F1]'
                    }`}
                  >
                    <span>Temperature</span>
                    <div
                      className={`inline-flex rounded-lg p-0.5 border ${
                        isLight ? 'bg-white/70 border-[#B7D7F2]' : 'bg-[#00152B] border-white/10'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setTempUnit('C')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                          tempUnit === 'C'
                            ? isLight
                              ? 'bg-[#11C98D] text-white'
                              : 'bg-[#19EAB2] text-[#04281D]'
                            : isLight
                              ? 'text-[#31557B]'
                              : 'text-[#B5C7DC]'
                        }`}
                      >
                        °C
                      </button>
                      <button
                        type="button"
                        onClick={() => setTempUnit('F')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                          tempUnit === 'F'
                            ? isLight
                              ? 'bg-[#11C98D] text-white'
                              : 'bg-[#19EAB2] text-[#04281D]'
                            : isLight
                              ? 'text-[#31557B]'
                              : 'text-[#B5C7DC]'
                        }`}
                      >
                        °F
                      </button>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between text-[12.5px] ${
                      isLight ? 'text-[#183C60]' : 'text-[#D4E2F1]'
                    }`}
                  >
                    <span>Wind Speed</span>
                    <div
                      className={`inline-flex rounded-lg p-0.5 border ${
                        isLight ? 'bg-white/70 border-[#B7D7F2]' : 'bg-[#00152B] border-white/10'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setWindUnit('km/h')}
                        className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer ${
                          windUnit === 'km/h'
                            ? isLight
                              ? 'bg-[#11C98D] text-white'
                              : 'bg-[#19EAB2] text-[#04281D]'
                            : isLight
                              ? 'text-[#31557B]'
                              : 'text-[#B5C7DC]'
                        }`}
                      >
                        km/h
                      </button>
                      <button
                        type="button"
                        onClick={() => setWindUnit('mph')}
                        className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer ${
                          windUnit === 'mph'
                            ? isLight
                              ? 'bg-[#11C98D] text-white'
                              : 'bg-[#19EAB2] text-[#04281D]'
                            : isLight
                              ? 'text-[#31557B]'
                              : 'text-[#B5C7DC]'
                        }`}
                      >
                        mph
                      </button>
                    </div>
                  </div>

                  <div
                    className={`pt-2 border-t flex items-center justify-between text-xs ${
                      isLight ? 'border-[#C5E0F6]' : 'border-white/10'
                    }`}
                  >
                    <Link
                      to="/data"
                      className={`hover:underline ${
                        isLight ? 'text-[#048C61] font-medium' : 'text-[#45F4A5]'
                      }`}
                      onClick={() => setSettingsOpen(false)}
                    >
                      NASA Data Sources
                    </Link>
                    <Link
                      to="/about"
                      className={
                        isLight
                          ? 'text-[#2D557C] hover:text-[#08223E]'
                          : 'text-[#B5C7DC] hover:text-white'
                      }
                      onClick={() => setSettingsOpen(false)}
                    >
                      About &amp; AI
                    </Link>
                  </div>
                </div>
              )}

              {/* Profile Popover */}
              {profileMenuOpen && (
                <div className="fs-glass-card absolute right-0 top-[56px] z-40 w-[250px] rounded-[24px] p-4 space-y-2.5">
                  <div
                    className={`text-[13px] font-semibold ${
                      isLight ? 'text-[#08223E]' : 'text-[#F1F7FF]'
                    }`}
                  >
                    {currentFarm?.location.farmName || 'Active Farm'}
                  </div>
                  <div className={`text-[12px] ${isLight ? 'text-[#2C5278]' : 'text-[#B5C7DC]'}`}>
                    {farmLocationText}
                    {farmHealthOverridePct !== null ? ` · ${farmHealthOverridePct}% Health` : ''}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenWorkspace('/analyze?mode=farm')}
                    className="w-full mt-1 py-2 px-3 rounded-xl text-xs font-semibold text-[#05281A] bg-[#20EDA0] hover:brightness-105 transition cursor-pointer"
                  >
                    Open Smart Farm Workspace
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Mobile Glass Navigation Drawer */}
          {mobileNavOpen && (
            <nav
              aria-label="Mobile navigation"
              className="lg:hidden relative z-30 pointer-events-auto mt-3 fs-glass-card rounded-[24px] p-3 grid grid-cols-2 sm:grid-cols-3 gap-2"
            >
              {NAV_ITEMS.map(({ to, label, Icon }) => {
                const active =
                  to === '/'
                    ? location.pathname === '/'
                    : location.pathname === to || location.pathname.startsWith(`${to}/`);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-medium ${
                      active
                        ? isLight
                          ? 'bg-[#0CB97E]/20 text-[#053524]'
                          : 'bg-[#00EE99]/20 text-white'
                        : isLight
                          ? 'text-[#0E2E52] hover:bg-white/60'
                          : 'text-[#D4E1F0] hover:bg-white/10'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        active ? (isLight ? 'text-[#078C5E]' : 'text-[#23EBA0]') : ''
                      }`}
                    />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      {/* Alert Detail Modal (Accessible from Bell icon on any page) */}
      {selectedAlertModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
            isLight ? 'bg-[#092340]/45' : 'bg-[#000817]/75'
          }`}
          onClick={() => setSelectedAlertModal(null)}
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
                      ? selectedAlertModal.severity === 'critical'
                        ? '#C81E2B'
                        : '#B85D00'
                      : selectedAlertModal.severity === 'critical'
                        ? '#FF555F'
                        : '#FFA52E',
                  }}
                />
                <span
                  className="text-sm font-bold"
                  style={{
                    color: isLight
                      ? selectedAlertModal.severity === 'critical'
                        ? '#C81E2B'
                        : '#B85D00'
                      : selectedAlertModal.severity === 'critical'
                        ? '#FF555F'
                        : '#FFA52E',
                  }}
                >
                  {selectedAlertModal.source} Alert
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlertModal(null)}
                className={`cursor-pointer ${
                  isLight ? 'text-[#3B628A] hover:text-[#08223E]' : 'text-[#9AB4CE] hover:text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h4 className={`text-lg font-semibold ${isLight ? 'text-[#08223E]' : 'text-[#F1F7FF]'}`}>
              {selectedAlertModal.message}
            </h4>
            <p className={`text-sm leading-relaxed ${isLight ? 'text-[#1F446A]' : 'text-[#D4E2F1]'}`}>
              {selectedAlertModal.recommendation}
            </p>
            <div
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-mono ${
                isLight
                  ? 'bg-white/70 border-[#BEDDF5] text-[#05734E]'
                  : 'bg-white/[0.05] border-white/10 text-[#8CFFD2]'
              }`}
            >
              {selectedAlertModal.metric}
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAlertModal(null)}
                className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer ${
                  isLight ? 'text-[#1D4268] hover:bg-white/70' : 'text-[#D4E2F1] hover:bg-white/10'
                }`}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleOpenWorkspace('/analyze?mode=farm')}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#04281B] bg-[#20EDA0] hover:brightness-110 cursor-pointer"
              >
                Run Full Farm Analysis →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
