import React, { useMemo } from 'react';
import { CropEntry, GrowthStageKey } from '../../types';
import { PlantModel } from './PlantModel';

interface CropFieldProps {
  crop: CropEntry;
  stage: GrowthStageKey;
  selectedPlantIdx: number | null;
  reducedMotion: boolean;
  onSelectPlant: (idx: number) => void;
}

export const CropField: React.FC<CropFieldProps> = ({
  crop,
  stage,
  selectedPlantIdx,
  reducedMotion,
  onSelectPlant,
}) => {
  const plants = useMemo(() => {
    const list: Array<{ idx: number; pos: [number, number, number]; phase: number }> = [];
    const rows = 4;
    const cols = 5;
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - (cols - 1) / 2) * 1.65;
        const z = (r - (rows - 1) / 2) * 1.75;
        list.push({
          idx,
          pos: [x, 0.08, z],
          phase: r * 0.7 + c * 0.5,
        });
        idx++;
      }
    }
    return list;
  }, []);

  return (
    <group>
      {plants.map((p) => (
        <PlantModel
          key={p.idx}
          cropId={crop.id}
          accentColor={crop.color}
          stage={stage}
          position={p.pos}
          phaseOffset={p.phase}
          selected={selectedPlantIdx === p.idx}
          reducedMotion={reducedMotion}
          onSelect={() => onSelectPlant(p.idx)}
        />
      ))}
    </group>
  );
};
