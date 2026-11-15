import React, { useMemo, useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CropEntry } from '../../types';
import { GLOBE_RADIUS, latLonToVec3 } from '../../services/tle';

interface FarmMarkersProps {
  crops: CropEntry[];
  onSelectFarm: (crop: CropEntry) => void;
  reducedMotion: boolean;
}

const FarmMarkerPin: React.FC<{
  crop: CropEntry;
  pos: [number, number, number];
  onSelect: (crop: CropEntry) => void;
  reducedMotion: boolean;
  index: number;
}> = ({ crop, pos, onSelect, reducedMotion, index }) => {
  const groupRef = useRef<THREE.Group>(null);
  const normal = useMemo(() => new THREE.Vector3(...pos).normalize(), [pos]);
  const quat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    return q;
  }, [normal]);

  useFrame(({ clock }) => {
    if (reducedMotion || !groupRef.current) return;
    const bob = Math.sin(clock.getElapsedTime() * 2.2 + index * 0.7) * 0.012;
    groupRef.current.position.copy(normal).multiplyScalar(GLOBE_RADIUS + 0.03 + bob);
  });

  return (
    <group
      ref={groupRef}
      position={pos}
      quaternion={quat}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(crop);
      }}
    >
      {/* Tiny 3D field patch */}
      <mesh position={[0, -0.01, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.012, 16]} />
        <meshStandardMaterial color={crop.color} emissive={crop.color} emissiveIntensity={0.45} />
      </mesh>
      {/* Vertical beacon stem */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.06, 8]} />
        <meshBasicMaterial color="#22C7B8" />
      </mesh>
      {/* Glowing crop beacon orb */}
      <mesh position={[0, 0.065, 0]}>
        <octahedronGeometry args={[0.028, 0]} />
        <meshStandardMaterial
          color={crop.color}
          emissive={crop.color}
          emissiveIntensity={1.1}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
};

export const FarmMarkers: React.FC<FarmMarkersProps> = ({
  crops,
  onSelectFarm,
  reducedMotion,
}) => {
  const entries = useMemo(() => {
    return crops.map((crop, index) => ({
      crop,
      index,
      pos: latLonToVec3(crop.lat, crop.lon, GLOBE_RADIUS + 0.03),
    }));
  }, [crops]);

  return (
    <group>
      {entries.map((item) => (
        <FarmMarkerPin
          key={item.crop.id}
          crop={item.crop}
          pos={item.pos}
          index={item.index}
          reducedMotion={reducedMotion}
          onSelect={onSelectFarm}
        />
      ))}
    </group>
  );
};
