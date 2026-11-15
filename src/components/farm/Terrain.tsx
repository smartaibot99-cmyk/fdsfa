import React, { useMemo } from 'react';
import * as THREE from 'three';

export function terrainHeightAt(x: number, z: number): number {
  return (
    Math.sin(x * 0.25) * Math.cos(z * 0.25) * 0.35 +
    Math.sin(x * 0.6 + z * 0.4) * 0.1
  );
}

interface TerrainProps {
  soilColor?: string;
}

export const Terrain: React.FC<TerrainProps> = ({ soilColor = '#3E3326' }) => {
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(42, 42, 48, 48);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Flatten central farm plot gently while leaving rolling perimeter hills
      const dist = Math.hypot(x, z);
      const flatten = Math.min(1, Math.max(0.15, (dist - 4) / 8));
      pos.setY(i, terrainHeightAt(x, z) * flatten);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      {/* Rolling agricultural landscape */}
      <mesh geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial color="#27472C" roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Cultivated soil bed patch */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[9.5, 0.08, 8.2]} />
        <meshStandardMaterial color={soilColor} roughness={0.92} />
      </mesh>

      {/* Irrigation water channel running beside the field */}
      <group position={[-5.4, 0.02, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[1.1, 0.06, 18]} />
          <meshStandardMaterial color="#1E3A5F" roughness={0.18} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.035, 0]}>
          <boxGeometry args={[0.85, 0.015, 17.8]} />
          <meshStandardMaterial
            color="#22C7B8"
            transparent
            opacity={0.68}
            roughness={0.1}
            metalness={0.4}
          />
        </mesh>
      </group>

      {/* Composite low-poly Barn (6 parts, grounded at y=0) */}
      <group position={[6.8, 0.15, -5.2]} rotation={[0, -0.45, 0]}>
        {/* Concrete foundation */}
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.16, 3.0]} />
          <meshStandardMaterial color="#64748B" roughness={0.85} />
        </mesh>
        {/* Main barn walls */}
        <mesh position={[0, 0.88, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 1.45, 2.8]} />
          <meshStandardMaterial color="#991B1B" roughness={0.7} />
        </mesh>
        {/* Pitched roof */}
        <mesh position={[0, 1.98, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1.95, 1.05, 4]} />
          <meshStandardMaterial color="#334155" roughness={0.65} metalness={0.15} />
        </mesh>
        {/* White barn door trim */}
        <mesh position={[0, 0.72, 1.42]}>
          <boxGeometry args={[0.9, 1.1, 0.04]} />
          <meshStandardMaterial color="#F1F5F9" roughness={0.6} />
        </mesh>
        {/* Silo tower */}
        <mesh position={[1.55, 1.1, -0.6]} castShadow>
          <cylinderGeometry args={[0.52, 0.52, 2.2, 14]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.45} roughness={0.35} />
        </mesh>
        {/* Silo dome */}
        <mesh position={[1.55, 2.2, -0.6]} castShadow>
          <sphereGeometry args={[0.52, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.55} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
};
