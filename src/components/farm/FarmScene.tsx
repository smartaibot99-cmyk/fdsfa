import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ArrowLeft } from 'lucide-react';
import { CropEntry, GrowthStageKey } from '../../types';
import { Terrain } from './Terrain';
import { CropField } from './CropField';

interface FarmSceneProps {
  crop: CropEntry;
  stage: GrowthStageKey;
  selectedPlantIdx: number | null;
  onSelectPlant: (idx: number) => void;
  onBackToEarth: () => void;
}

function getLocalSolarLighting(lon: number): {
  localHour: number;
  skyHex: string;
  sunIntensity: number;
  sunPos: [number, number, number];
  ambientHex: string;
  timeLabel: string;
} {
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  let localHour = (utcHours + lon / 15) % 24;
  if (localHour < 0) localHour += 24;

  const hh = String(Math.floor(localHour)).padStart(2, '0');
  const mm = String(Math.floor((localHour % 1) * 60)).padStart(2, '0');
  const timeLabel = `${hh}:${mm} local solar`;

  // Night vs Dawn/Dusk vs Day
  if (localHour < 5.5 || localHour > 19.5) {
    return {
      localHour,
      skyHex: '#0B1224',
      sunIntensity: 0.45,
      sunPos: [-6, 8, -4],
      ambientHex: '#334155',
      timeLabel,
    };
  }
  if (localHour < 8 || localHour > 17) {
    return {
      localHour,
      skyHex: '#3D2E4F',
      sunIntensity: 1.25,
      sunPos: [localHour < 12 ? 12 : -12, 4.5, 6],
      ambientHex: '#FDBA74',
      timeLabel,
    };
  }
  return {
    localHour,
    skyHex: '#1B3A5C',
    sunIntensity: 2.0,
    sunPos: [(localHour - 12) * 1.4, 11, 6],
    ambientHex: '#BAE6FD',
    timeLabel,
  };
}

export const FarmScene: React.FC<FarmSceneProps> = ({
  crop,
  stage,
  selectedPlantIdx,
  onSelectPlant,
  onBackToEarth,
}) => {
  const lighting = useMemo(() => getLocalSolarLighting(crop.lon), [crop.lon]);
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="relative w-full h-full" style={{ backgroundColor: lighting.skyHex }}>
      {/* Top-left Back to Earth button + Farm Location Tag */}
      <div className="absolute top-20 left-4 sm:left-6 z-20 flex flex-wrap items-center gap-3 pointer-events-auto">
        <button
          type="button"
          onClick={onBackToEarth}
          className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-[#0B0F1A]/85 border border-[#26304A] text-sm font-medium text-[#E8ECF5] hover:border-[#4C8DFF] transition-colors shadow-lg cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Earth</span>
        </button>

        <div className="rounded-xl bg-[#0B0F1A]/85 border border-[#26304A] px-3.5 py-2 text-xs text-[#E8ECF5] shadow-lg">
          <span className="font-display font-semibold">{crop.icon} {crop.name}</span>
          <span className="text-[#9AA6C1] ml-2">
            · {crop.regionName}, {crop.country} · <span className="font-mono">{lighting.timeLabel}</span>
          </span>
        </div>
      </div>

      {/* Tap hint */}
      <div className="hidden sm:block absolute bottom-6 left-6 z-20 rounded-xl bg-[#0B0F1A]/80 border border-[#26304A] px-3.5 py-2 text-xs text-[#9AA6C1] pointer-events-none">
        Drag to orbit · Scroll or pinch to zoom · Tap any plant to inspect
      </div>

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 46, position: [6.8, 5.2, 8.6] }}
      >
        <color attach="background" args={[lighting.skyHex]} />
        <fog attach="fog" args={[lighting.skyHex, 14, 34]} />

        <ambientLight intensity={0.48} color={lighting.ambientHex} />
        <hemisphereLight args={[lighting.ambientHex, '#1F2937', 0.6]} />
        <directionalLight
          position={lighting.sunPos}
          intensity={lighting.sunIntensity}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />

        <Terrain />
        <CropField
          crop={crop}
          stage={stage}
          selectedPlantIdx={selectedPlantIdx}
          reducedMotion={reducedMotion}
          onSelectPlant={onSelectPlant}
        />

        <OrbitControls
          enableDamping={!reducedMotion}
          dampingFactor={0.06}
          minDistance={3.2}
          maxDistance={15}
          maxPolarAngle={Math.PI / 2 - 0.08}
          target={[0, 0.5, 0]}
        />
      </Canvas>
    </div>
  );
};
