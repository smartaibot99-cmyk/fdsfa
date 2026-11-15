import React, { useMemo, useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GrowthStageKey } from '../../types';

interface PlantModelProps {
  cropId: string;
  accentColor: string;
  stage: GrowthStageKey;
  position: [number, number, number];
  phaseOffset: number;
  selected: boolean;
  reducedMotion: boolean;
  onSelect: () => void;
}

const STAGE_SCALE: Record<GrowthStageKey, number> = {
  seed: 0.28,
  sprout: 0.52,
  vegetative: 0.85,
  flowering: 1.0,
  harvest: 1.08,
};

export const PlantModel: React.FC<PlantModelProps> = ({
  cropId,
  accentColor,
  stage,
  position,
  phaseOffset,
  selected,
  reducedMotion,
  onSelect,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentScaleRef = useRef(STAGE_SCALE[stage]);
  const currentLiftRef = useRef(0);

  const isPalm = cropId === 'date_palm';
  const isGrass = ['rice', 'wheat', 'maize', 'sugarcane'].includes(cropId);
  const isTuber = cropId === 'potato';

  const foliageColor = useMemo(() => {
    if (stage === 'harvest' && (cropId === 'wheat' || cropId === 'rice' || cropId === 'maize')) {
      return '#EAB308';
    }
    if (stage === 'seed') return '#854D0E';
    if (stage === 'sprout') return '#4ADE80';
    return isPalm ? '#15803D' : '#16A34A';
  }, [stage, cropId, isPalm]);

  const showBlossomOrFruit = stage === 'flowering' || stage === 'harvest';

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const targetScale = STAGE_SCALE[stage];
    currentScaleRef.current = THREE.MathUtils.damp(currentScaleRef.current, targetScale, 5.5, delta);
    const s = currentScaleRef.current;
    groupRef.current.scale.set(s, s, s);

    const targetLift = selected ? 0.16 : 0;
    currentLiftRef.current = THREE.MathUtils.damp(currentLiftRef.current, targetLift, 7, delta);
    groupRef.current.position.y = position[1] + currentLiftRef.current;

    if (!reducedMotion) {
      const t = clock.getElapsedTime();
      groupRef.current.rotation.z = Math.sin(t * 1.8 + phaseOffset) * 0.06;
      groupRef.current.rotation.x = Math.cos(t * 1.4 + phaseOffset) * 0.03;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Selection outline glow ring on ground */}
      {selected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.48, 24]} />
          <meshBasicMaterial color="#22C7B8" side={THREE.DoubleSide} />
        </mesh>
      )}

      {stage === 'seed' ? (
        /* Seed mound */
        <group>
          <mesh position={[0, 0.1, 0]} castShadow>
            <sphereGeometry args={[0.24, 10, 8]} />
            <meshStandardMaterial color="#57412B" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={accentColor} emissive={selected ? '#22C7B8' : '#000000'} emissiveIntensity={0.6} />
          </mesh>
        </group>
      ) : isPalm ? (
        /* Composite Date Palm (trunk + crown fronds + fruit cluster) */
        <group>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.16, 1.8, 10]} />
            <meshStandardMaterial color="#78533A" roughness={0.9} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const angle = (idx / 6) * Math.PI * 2;
            return (
              <mesh
                key={idx}
                position={[Math.cos(angle) * 0.42, 1.8, Math.sin(angle) * 0.42]}
                rotation={[0.45, -angle, 0]}
                castShadow
              >
                <boxGeometry args={[0.85, 0.05, 0.22]} />
                <meshStandardMaterial
                  color={foliageColor}
                  emissive={selected ? '#22C7B8' : '#000000'}
                  emissiveIntensity={selected ? 0.3 : 0}
                  roughness={0.7}
                />
              </mesh>
            );
          })}
          {showBlossomOrFruit && (
            <mesh position={[0.16, 1.58, 0.12]}>
              <sphereGeometry args={[0.14, 10, 10]} />
              <meshStandardMaterial color={stage === 'harvest' ? '#EA580C' : '#FDE047'} roughness={0.45} />
            </mesh>
          )}
        </group>
      ) : isGrass ? (
        /* Composite Grass / Cereal cluster (3 stalks + panicle/ear) */
        <group>
          {[-0.1, 0, 0.1].map((ox, idx) => (
            <group key={idx} position={[ox, 0, (idx - 1) * 0.08]} rotation={[0, idx * 0.8, (idx - 1) * 0.08]}>
              <mesh position={[0, 0.55, 0]} castShadow>
                <cylinderGeometry args={[0.025, 0.04, 1.1, 8]} />
                <meshStandardMaterial
                  color={foliageColor}
                  emissive={selected ? '#22C7B8' : '#000000'}
                  emissiveIntensity={selected ? 0.35 : 0}
                  roughness={0.65}
                />
              </mesh>
              <mesh position={[0.12, 0.48, 0]} rotation={[0, 0, -0.55]}>
                <boxGeometry args={[0.28, 0.02, 0.08]} />
                <meshStandardMaterial color={foliageColor} roughness={0.7} />
              </mesh>
              {showBlossomOrFruit && (
                <mesh position={[0, 1.15, 0]}>
                  <capsuleGeometry args={[0.045, 0.16, 6, 8]} />
                  <meshStandardMaterial color={stage === 'harvest' ? '#FACC15' : '#FEF08A'} roughness={0.5} />
                </mesh>
              )}
            </group>
          ))}
        </group>
      ) : isTuber ? (
        /* Potato leafy mound + blossom */
        <group>
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.36, 0.24, 10]} />
            <meshStandardMaterial color="#4B3B2B" roughness={0.95} />
          </mesh>
          {[0, 1, 2, 3].map((idx) => {
            const a = (idx / 4) * Math.PI * 2;
            return (
              <mesh key={idx} position={[Math.cos(a) * 0.14, 0.42, Math.sin(a) * 0.14]} castShadow>
                <dodecahedronGeometry args={[0.2, 0]} />
                <meshStandardMaterial
                  color={foliageColor}
                  emissive={selected ? '#22C7B8' : '#000000'}
                  emissiveIntensity={selected ? 0.35 : 0}
                  roughness={0.75}
                />
              </mesh>
            );
          })}
          {showBlossomOrFruit && (
            <mesh position={[0, 0.65, 0]}>
              <octahedronGeometry args={[0.08, 0]} />
              <meshStandardMaterial color={stage === 'harvest' ? '#D97706' : '#C084FC'} />
            </mesh>
          )}
        </group>
      ) : (
        /* Composite Broadleaf Shrub / Tree (Coffee, Cocoa, Tea, Cotton, Olive, Soybean) */
        <group>
          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.075, 0.7, 8]} />
            <meshStandardMaterial color="#6B4423" roughness={0.88} />
          </mesh>
          <mesh position={[0, 0.75, 0]} castShadow>
            <dodecahedronGeometry args={[0.32, 0]} />
            <meshStandardMaterial
              color={foliageColor}
              emissive={selected ? '#22C7B8' : '#000000'}
              emissiveIntensity={selected ? 0.35 : 0}
              roughness={0.72}
            />
          </mesh>
          <mesh position={[0.16, 0.68, 0.12]} castShadow>
            <dodecahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial color={foliageColor} roughness={0.72} />
          </mesh>
          {showBlossomOrFruit && (
            <>
              <mesh position={[0.22, 0.78, 0.22]}>
                <sphereGeometry args={[0.065, 8, 8]} />
                <meshStandardMaterial
                  color={stage === 'flowering' ? '#F8FAFC' : accentColor}
                  roughness={0.4}
                />
              </mesh>
              <mesh position={[-0.18, 0.72, -0.15]}>
                <sphereGeometry args={[0.065, 8, 8]} />
                <meshStandardMaterial
                  color={stage === 'flowering' ? '#F8FAFC' : accentColor}
                  roughness={0.4}
                />
              </mesh>
            </>
          )}
        </group>
      )}
    </group>
  );
};
