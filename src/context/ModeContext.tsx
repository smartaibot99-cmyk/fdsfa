import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppMode } from '../types';

const MODE_STORAGE_KEY = 'anchor_mode_v1';

interface TransitionState {
  active: boolean;
  direction: 'to-plant' | 'to-space';
  origin: { x: number; y: number };
  nonce: number;
}

interface ModeContextValue {
  mode: AppMode;
  isPlantMode: boolean;
  setMode: (next: AppMode, origin?: { x: number; y: number }) => void;
  toggleMode: (origin?: { x: number; y: number }) => void;
  transition: TransitionState;
}

const ModeContext = createContext<ModeContextValue>({
  mode: 'space',
  isPlantMode: false,
  setMode: () => {},
  toggleMode: () => {},
  transition: { active: false, direction: 'to-plant', origin: { x: 0, y: 0 }, nonce: 0 },
});

function readInitialMode(): AppMode {
  if (typeof window !== 'undefined') {
    const sp = new URLSearchParams(window.location.search);
    const urlMode = sp.get('mode');
    if (urlMode === 'plant') return 'plant';
    if (urlMode === 'space') return 'space';
    try {
      const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
      if (saved === 'plant' || saved === 'space') return saved;
    } catch {
      // Ignore storage failures
    }
  }
  return 'space';
}

function syncUrlMode(nextMode: AppMode) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (nextMode === 'plant') {
      url.searchParams.set('mode', 'plant');
    } else {
      url.searchParams.delete('mode');
    }
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // Ignore history API errors
  }
}

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AppMode>(() => readInitialMode());
  const [transition, setTransition] = useState<TransitionState>({
    active: false,
    direction: 'to-plant',
    origin: { x: 0, y: 0 },
    nonce: 0,
  });
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // Ignore storage errors
    }
  }, [mode]);

  // Sync URL on mount if restored from localStorage
  useEffect(() => {
    syncUrlMode(mode);
  }, []);

  const applyModeChange = useCallback(
    (next: AppMode, origin?: { x: number; y: number }) => {
      if (next === mode) return;

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const fallbackOrigin =
        typeof window !== 'undefined'
          ? { x: Math.round(window.innerWidth * 0.5), y: 40 }
          : { x: 400, y: 40 };

      const pt = origin ?? fallbackOrigin;

      setModeState(next);
      syncUrlMode(next);

      if (prefersReduced) {
        setTransition((prev) => ({ ...prev, active: false }));
        return;
      }

      if (timerRef.current) window.clearTimeout(timerRef.current);
      setTransition({
        active: true,
        direction: next === 'plant' ? 'to-plant' : 'to-space',
        origin: pt,
        nonce: Date.now(),
      });

      timerRef.current = window.setTimeout(() => {
        setTransition((prev) => ({ ...prev, active: false }));
      }, 900);
    },
    [mode]
  );

  const toggleMode = useCallback(
    (origin?: { x: number; y: number }) => {
      applyModeChange(mode === 'plant' ? 'space' : 'plant', origin);
    },
    [mode, applyModeChange]
  );

  return (
    <ModeContext.Provider
      value={{
        mode,
        isPlantMode: mode === 'plant',
        setMode: applyModeChange,
        toggleMode,
        transition,
      }}
    >
      {children}
    </ModeContext.Provider>
  );
};

export function useMode(): ModeContextValue {
  return useContext(ModeContext);
}
