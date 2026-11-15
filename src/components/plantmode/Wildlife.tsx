import React, { useMemo } from 'react';

export interface LocalTimeLighting {
  period: 'sunrise' | 'day' | 'sunset' | 'night';
  tintGradient: string;
  isNight: boolean;
}

export function getLocalTimeLighting(hour: number = new Date().getHours()): LocalTimeLighting {
  if (hour >= 5 && hour < 8) {
    return {
      period: 'sunrise',
      tintGradient:
        'linear-gradient(180deg, rgba(251, 191, 36, 0.22) 0%, rgba(244, 140, 66, 0.14) 55%, rgba(0, 0, 0, 0.08) 100%)',
      isNight: false,
    };
  }
  if (hour >= 17 && hour < 20) {
    return {
      period: 'sunset',
      tintGradient:
        'linear-gradient(180deg, rgba(234, 88, 12, 0.24) 0%, rgba(245, 158, 11, 0.16) 55%, rgba(20, 20, 40, 0.18) 100%)',
      isNight: false,
    };
  }
  if (hour >= 20 || hour < 5) {
    return {
      period: 'night',
      tintGradient:
        'linear-gradient(180deg, rgba(11, 22, 34, 0.62) 0%, rgba(15, 28, 24, 0.52) 60%, rgba(10, 18, 15, 0.65) 100%)',
      isNight: true,
    };
  }
  return {
    period: 'day',
    tintGradient:
      'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(31, 46, 26, 0.06) 100%)',
    isNight: false,
  };
}

export const Wildlife: React.FC<{ isNight?: boolean }> = ({ isNight }) => {
  const lighting = useMemo(() => getLocalTimeLighting(), []);
  const night = isNight ?? lighting.isNight;

  const fireflies = [
    { left: '14%', top: '76%', delay: '0s' },
    { left: '26%', top: '83%', delay: '0.8s' },
    { left: '42%', top: '72%', delay: '1.5s' },
    { left: '58%', top: '79%', delay: '0.4s' },
    { left: '72%', top: '74%', delay: '2.1s' },
    { left: '84%', top: '68%', delay: '1.1s' },
    { left: '34%', top: '88%', delay: '2.6s' },
  ];

  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Local-time sky & sunlight wash */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ background: lighting.tintGradient }}
      />

      {/* Daytime / twilight gliding birds across upper sky */}
      {!night && (
        <>
          <div
            className="animate-bird-fly absolute top-[14%] left-0 flex items-center gap-3"
            style={{ animationDuration: '26s', animationDelay: '-3s' }}
          >
            <svg viewBox="0 0 36 16" className="w-7 h-3.5 text-[#1F2E1A]/75" fill="none">
              <path
                d="M2 10 Q10 2 18 9 Q26 2 34 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <svg viewBox="0 0 36 16" className="w-5 h-2.5 text-[#1F2E1A]/60 mt-3" fill="none">
              <path
                d="M2 10 Q10 2 18 9 Q26 2 34 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div
            className="animate-bird-fly absolute top-[21%] left-0"
            style={{ animationDuration: '34s', animationDelay: '-16s' }}
          >
            <svg viewBox="0 0 36 16" className="w-6 h-3 text-[#1F2E1A]/65" fill="none">
              <path
                d="M2 10 Q10 2 18 9 Q26 2 34 10"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Butterflies fluttering over foreground wildflowers */}
          <div className="animate-butterfly absolute left-[28%] top-[83%]">
            <svg viewBox="0 0 24 20" className="w-5 h-4" fill="none">
              <path d="M12 10 C7 3, 2 5, 4 11 C5 14, 9 13, 12 10 Z" fill="#F4B942" />
              <path d="M12 10 C17 3, 22 5, 20 11 C19 14, 15 13, 12 10 Z" fill="#FBBF24" />
              <line x1="12" y1="6" x2="12" y2="15" stroke="#1F2E1A" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>

          <div
            className="animate-butterfly absolute left-[54%] top-[85%]"
            style={{ animationDelay: '-3.2s', animationDuration: '8.5s' }}
          >
            <svg viewBox="0 0 24 20" className="w-4 h-3.5" fill="none">
              <path d="M12 10 C7 3, 2 5, 4 11 C5 14, 9 13, 12 10 Z" fill="#9ED3F0" />
              <path d="M12 10 C17 3, 22 5, 20 11 C19 14, 15 13, 12 10 Z" fill="#E0F2FE" />
              <line x1="12" y1="6" x2="12" y2="15" stroke="#1F2E1A" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
        </>
      )}

      {/* Fireflies glowing softly at night */}
      {night &&
        fireflies.map((ff, idx) => (
          <span
            key={idx}
            className="animate-firefly absolute w-2.5 h-2.5 rounded-full bg-[#FDE047]"
            style={{
              left: ff.left,
              top: ff.top,
              animationDelay: ff.delay,
              boxShadow: '0 0 12px 4px rgba(253, 224, 71, 0.7)',
            }}
          />
        ))}
    </div>
  );
};
