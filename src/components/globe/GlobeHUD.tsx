import React, { useEffect, useState } from 'react';

interface GlobeHUDProps {
  satCount: number;
  eventCount: number;
  isFallbackTle: boolean;
  timeScale: number;
  onChangeTimeScale: (scale: number) => void;
  showIssGroundTrack: boolean;
  onToggleIssTrack: () => void;
}

export const GlobeHUD: React.FC<GlobeHUDProps> = ({
  satCount,
  eventCount,
  isFallbackTle,
  timeScale,
  onChangeTimeScale,
  showIssGroundTrack,
  onToggleIssTrack,
}) => {
  const [utcTime, setUtcTime] = useState(() => new Date().toISOString().slice(11, 19));

  useEffect(() => {
    const id = window.setInterval(() => {
      setUtcTime(new Date().toISOString().slice(11, 19));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-auto rounded-xl border border-[#26304A] bg-[#0B0F1A]/85 px-3.5 py-2.5 text-[11px] font-mono text-[#E8ECF5] space-y-2 shadow-lg max-w-xs">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 tabular-nums">
        <span className="text-[#22C7B8]">UTC {utcTime}</span>
        <span aria-hidden="true" className="text-[#9AA6C1]">·</span>
        <span>{satCount} satellites</span>
        <span aria-hidden="true" className="text-[#9AA6C1]">·</span>
        <span>{eventCount} events</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[#9AA6C1]">Orbit speed:</span>
        {[1, 60, 600].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChangeTimeScale(s)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              timeScale === s
                ? 'bg-[#4C8DFF] text-white'
                : 'bg-[#1A2238] text-[#9AA6C1] hover:text-white'
            }`}
          >
            {s}×
          </button>
        ))}

        <button
          type="button"
          onClick={onToggleIssTrack}
          className={`px-2 py-0.5 rounded text-[11px] font-sans transition-colors cursor-pointer ${
            showIssGroundTrack
              ? 'bg-[#F5B83D] text-[#0B0F1A] font-semibold'
              : 'bg-[#1A2238] text-[#9AA6C1] hover:text-white'
          }`}
        >
          ISS track
        </button>
      </div>

      {isFallbackTle && (
        <div className="text-[10px] text-[#F5B83D]">
          Positions approximate (offline TLE catalog)
        </div>
      )}
    </div>
  );
};
