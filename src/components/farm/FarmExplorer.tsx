import React from 'react';
import { CropEntry } from '../../types';
import { Sprout } from 'lucide-react';

interface FarmExplorerProps {
  crops: CropEntry[];
  onSelectFarm: (crop: CropEntry) => void;
}

export const FarmExplorer: React.FC<FarmExplorerProps> = ({ crops, onSelectFarm }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E8ECF5]">
          <Sprout className="w-3.5 h-3.5 text-[#22C7B8]" aria-hidden="true" />
          <span>Explore 12 Global 3D Farms (NASA POWER + Crop Health)</span>
        </div>
        <span className="hidden sm:inline text-[11px] text-[#9AA6C1]">
          Tap any crop to fly to its 3D field
        </span>
      </div>

      <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1">
        {crops.map((crop) => (
          <button
            key={crop.id}
            type="button"
            onClick={() => onSelectFarm(crop)}
            className="shrink-0 w-44 text-left rounded-xl border border-[#26304A] bg-[#0B0F1A]/85 hover:border-[#22C7B8] px-3 py-2.5 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-base" aria-hidden="true">{crop.icon}</span>
              <span className="font-mono text-[10px] text-[#22C7B8]">
                {crop.idealConditions.tempMinC}–{crop.idealConditions.tempMaxC}°C
              </span>
            </div>
            <div className="mt-1 text-xs font-semibold text-[#E8ECF5] truncate">{crop.name}</div>
            <div className="text-[11px] text-[#9AA6C1] truncate">
              {crop.regionName}, {crop.country}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
