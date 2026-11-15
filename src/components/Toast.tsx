import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastContextValue {
  showToast: (text: string, type?: ToastMessage['type']) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none no-print"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xl text-sm text-[var(--text-primary)]"
          >
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-[var(--accent)] shrink-0" />}
            <span className="flex-1 text-xs sm:text-sm leading-snug">{t.text}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
