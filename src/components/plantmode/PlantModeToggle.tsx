import React, { useRef } from 'react';
import { Leaf, Globe2 } from 'lucide-react';
import { useMode } from '../../context/ModeContext';

interface PlantModeToggleProps {
  variant?: 'header' | 'hero';
  className?: string;
}

export const PlantModeToggle: React.FC<PlantModeToggleProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isPlantMode, toggleMode } = useMode();
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const handleClick = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      toggleMode({
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      });
    } else {
      toggleMode();
    }
  };

  if (variant === 'hero') {
    return (
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        aria-pressed={isPlantMode}
        aria-label={isPlantMode ? 'Switch back to Space Mode' : 'Enter Plant Mode'}
        className={`inline-flex items-center gap-2.5 px-5 min-h-[46px] rounded-full text-sm font-medium shadow-xl border transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
          isPlantMode
            ? 'bg-[#2E9E4F] border-[#CFE3C0] text-white hover:bg-[#268743]'
            : 'bg-[#121829]/90 border-[#2E9E4F]/60 text-[#E8ECF5] hover:border-[#4CC26E] hover:bg-[#1A2622]'
        } ${className}`}
      >
        <Leaf
          className={`w-4 h-4 shrink-0 ${isPlantMode ? 'text-white' : 'text-[#4CC26E]'}`}
          aria-hidden="true"
        />
        <span>{isPlantMode ? '🌱 Plant Mode On · Space View' : '🌱 Plant Mode'}</span>
      </button>
    );
  }

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleClick}
      role="switch"
      aria-checked={isPlantMode}
      aria-label="Toggle Plant Mode"
      className={`inline-flex items-center gap-2 px-3 min-h-[40px] rounded-full text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
        isPlantMode
          ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--text-primary)]'
          : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]'
      } ${className}`}
    >
      {isPlantMode ? (
        <Leaf className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" aria-hidden="true" />
      ) : (
        <Globe2 className="w-3.5 h-3.5 text-[#4CC26E] shrink-0" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">🌱 Plant Mode</span>
      <span className="sm:hidden" aria-hidden="true">🌱</span>
      <span
        aria-hidden="true"
        className={`w-7 h-4 rounded-full p-0.5 transition-colors flex items-center ${
          isPlantMode ? 'bg-[var(--accent)] justify-end' : 'bg-[var(--border)] justify-start'
        }`}
      >
        <span className="w-3 h-3 rounded-full bg-white shadow-sm block" />
      </span>
    </button>
  );
};
