import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ToastProvider } from './components/Toast';
import { ModeProvider, useMode } from './context/ModeContext';
import { DisplayPrefsProvider } from './context/DisplayPrefsContext';
import { GrowthRevealTransition } from './components/plantmode/GrowthRevealTransition';
import { ThemeMorphOverlay } from './components/home/ThemeMorphOverlay';
import { loadSavedTheme, saveTheme } from './lib/storage';
import { Landing } from './pages/Landing';
import { DataSources } from './pages/DataSources';
import { About } from './pages/About';
import { Maps } from './pages/Maps';
import { MyFarms } from './pages/MyFarms';

const AppShell: React.FC = () => {
  const location = useLocation();
  const { mode } = useMode();
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    mode === 'plant' ? 'light' : loadSavedTheme()
  );
  const prevModeRef = useRef(mode);

  const [themeMorph, setThemeMorph] = useState<{
    active: boolean;
    toLight: boolean;
    origin: { x: number; y: number };
    nonce: number;
  }>({
    active: false,
    toLight: false,
    origin: { x: 0, y: 0 },
    nonce: 0,
  });
  const morphTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (morphTimerRef.current) window.clearTimeout(morphTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (prevModeRef.current !== mode) {
      prevModeRef.current = mode;
      setTheme(mode === 'plant' ? 'light' : 'dark');
    }
  }, [mode]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  const toggleTheme = useCallback(
    (e?: React.MouseEvent<HTMLElement>) => {
      const rect = e?.currentTarget?.getBoundingClientRect();
      const origin = rect
        ? { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) }
        : {
            x: typeof window !== 'undefined' ? Math.round(window.innerWidth * 0.85) : 960,
            y: 44,
          };

      const nextIsLight = theme === 'dark';
      setThemeMorph((prev) => ({
        active: true,
        toLight: nextIsLight,
        origin,
        nonce: prev.nonce + 1,
      }));
      if (morphTimerRef.current) window.clearTimeout(morphTimerRef.current);
      morphTimerRef.current = window.setTimeout(() => {
        setThemeMorph((prev) => ({ ...prev, active: false }));
      }, 860);

      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    },
    [theme]
  );

  const isHome = location.pathname === '/';
  const isMaps = location.pathname === '/maps';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-deep)] text-[var(--text-primary)]">
      <GrowthRevealTransition />
      <ThemeMorphOverlay
        active={themeMorph.active}
        toLight={themeMorph.toLight}
        origin={themeMorph.origin}
        nonce={themeMorph.nonce}
      />

      <Header theme={theme} onToggleTheme={toggleTheme} overlay={isHome} />
      {!isHome && <div aria-hidden="true" className="h-[80px] shrink-0" />}

      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Landing theme={theme} onToggleTheme={toggleTheme} />} />
          <Route path="/my-farms" element={<MyFarms />} />
          <Route path="/my-farms/:farmId" element={<MyFarms />} />
          <Route path="/maps" element={<Maps />} />
          <Route path="/data" element={<DataSources />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isHome && !isMaps && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ModeProvider>
        <DisplayPrefsProvider>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </DisplayPrefsProvider>
      </ModeProvider>
    </BrowserRouter>
  );
}
