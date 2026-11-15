import { SavedAnalysisSummary } from '../types';

const RECENT_KEY = 'anchor_recent_analyses_v1';
const THEME_KEY = 'anchor_theme_v1';
const TOUR_KEY = 'anchor_onboarding_dismissed_v1';

export function loadRecentAnalyses(): SavedAnalysisSummary[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecentAnalysis(summary: SavedAnalysisSummary): SavedAnalysisSummary[] {
  const existing = loadRecentAnalyses().filter(
    (item) =>
      !(
        Math.abs(item.place.lat - summary.place.lat) < 0.01 &&
        Math.abs(item.place.lon - summary.place.lon) < 0.01 &&
        item.targetDate === summary.targetDate &&
        item.activityId === summary.activityId
      )
  );
  const next = [summary, ...existing].slice(0, 8);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota / private mode errors
  }
  return next;
}

export function clearRecentAnalyses(): void {
  try {
    window.localStorage.removeItem(RECENT_KEY);
  } catch {
    // Ignore
  }
}

export function loadSavedTheme(): 'dark' | 'light' {
  try {
    const val = window.localStorage.getItem(THEME_KEY);
    if (val === 'light' || val === 'dark') return val;
  } catch {
    // Ignore
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return 'dark';
}

export function saveTheme(theme: 'dark' | 'light'): void {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore
  }
}

export function isTourDismissed(): boolean {
  try {
    return window.localStorage.getItem(TOUR_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissTour(): void {
  try {
    window.localStorage.setItem(TOUR_KEY, '1');
  } catch {
    // Ignore
  }
}
