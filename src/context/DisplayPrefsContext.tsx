import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  buildRealFarmFields,
  ensureSyncedFarmProfiles,
  evaluateRealFarmAlerts,
  HomeFarmAlert,
  loadDismissedAlertIds,
  saveDismissedAlertIds,
} from '../lib/homeFarmEvaluator';
import { getActiveFarmId } from '../lib/farmStorage';

const DISPLAY_PREFS_KEY = 'anchor_display_prefs_v1';

interface DisplayPrefsContextValue {
  tempUnit: 'C' | 'F';
  setTempUnit: (u: 'C' | 'F') => void;
  windUnit: 'km/h' | 'mph';
  setWindUnit: (u: 'km/h' | 'mph') => void;
  allAlerts: HomeFarmAlert[];
  activeAlerts: HomeFarmAlert[];
  dismissedCount: number;
  setLiveAlerts: (farmId: string, alerts: HomeFarmAlert[]) => void;
  dismissAlert: (farmId: string, alertId: string) => void;
  restoreAlerts: (farmId: string) => void;
  dismissedAlertIds: string[];
  refreshDismissedForFarm: (farmId: string) => void;
  farmHealthOverridePct: number | null;
  setFarmHealthOverridePct: (pct: number | null) => void;
}

const DisplayPrefsContext = createContext<DisplayPrefsContextValue | null>(null);

export const DisplayPrefsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tempUnit, setTempUnitState] = useState<'C' | 'F'>(() => {
    try {
      const raw = window.localStorage.getItem(DISPLAY_PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { tempUnit?: string };
        if (parsed.tempUnit === 'F') return 'F';
      }
    } catch {
      // ignore
    }
    return 'C';
  });

  const [windUnit, setWindUnitState] = useState<'km/h' | 'mph'>(() => {
    try {
      const raw = window.localStorage.getItem(DISPLAY_PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { windUnit?: string };
        if (parsed.windUnit === 'mph') return 'mph';
      }
    } catch {
      // ignore
    }
    return 'km/h';
  });

  const [farmHealthOverridePct, setFarmHealthOverridePct] = useState<number | null>(null);

  // Initialize deterministic baseline alerts from active synced farm so header bell works on any page
  const [alertsByFarm, setAlertsByFarm] = useState<Record<string, HomeFarmAlert[]>>(() => {
    const farms = ensureSyncedFarmProfiles();
    const activeId = getActiveFarmId();
    const farm = farms.find((f) => f.id === activeId) ?? farms[0];
    if (!farm) return {};
    const fields = buildRealFarmFields(farm, null, null, null);
    return { [farm.id]: evaluateRealFarmAlerts(farm, fields, null, null, null) };
  });

  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>(() => {
    const farms = ensureSyncedFarmProfiles();
    const activeId = getActiveFarmId();
    const farm = farms.find((f) => f.id === activeId) ?? farms[0];
    return farm ? loadDismissedAlertIds(farm.id) : [];
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(DISPLAY_PREFS_KEY, JSON.stringify({ tempUnit, windUnit }));
    } catch {
      // ignore
    }
  }, [tempUnit, windUnit]);

  const setTempUnit = useCallback((u: 'C' | 'F') => setTempUnitState(u), []);
  const setWindUnit = useCallback((u: 'km/h' | 'mph') => setWindUnitState(u), []);

  const setLiveAlerts = useCallback((farmId: string, alerts: HomeFarmAlert[]) => {
    setAlertsByFarm((prev) => ({ ...prev, [farmId]: alerts }));
  }, []);

  const refreshDismissedForFarm = useCallback((farmId: string) => {
    setDismissedAlertIds(loadDismissedAlertIds(farmId));
  }, []);

  const dismissAlert = useCallback((farmId: string, alertId: string) => {
    setDismissedAlertIds((prev) => {
      if (prev.includes(alertId)) return prev;
      const next = [...prev, alertId];
      saveDismissedAlertIds(farmId, next);
      return next;
    });
  }, []);

  const restoreAlerts = useCallback((farmId: string) => {
    setDismissedAlertIds([]);
    saveDismissedAlertIds(farmId, []);
  }, []);

  const activeFarmId = useMemo(() => {
    const farms = ensureSyncedFarmProfiles();
    const saved = getActiveFarmId();
    return (farms.find((f) => f.id === saved) ?? farms[0])?.id ?? '';
  }, [alertsByFarm]);

  const allAlerts = alertsByFarm[activeFarmId] ?? [];
  const activeAlerts = useMemo(
    () => allAlerts.filter((a) => !dismissedAlertIds.includes(a.id)),
    [allAlerts, dismissedAlertIds]
  );
  const dismissedCount = Math.max(0, allAlerts.length - activeAlerts.length);

  return (
    <DisplayPrefsContext.Provider
      value={{
        tempUnit,
        setTempUnit,
        windUnit,
        setWindUnit,
        allAlerts,
        activeAlerts,
        dismissedCount,
        setLiveAlerts,
        dismissAlert,
        restoreAlerts,
        dismissedAlertIds,
        refreshDismissedForFarm,
        farmHealthOverridePct,
        setFarmHealthOverridePct,
      }}
    >
      {children}
    </DisplayPrefsContext.Provider>
  );
};

export function useDisplayPrefs() {
  const ctx = useContext(DisplayPrefsContext);
  if (!ctx) {
    throw new Error('useDisplayPrefs must be used inside DisplayPrefsProvider');
  }
  return ctx;
}
