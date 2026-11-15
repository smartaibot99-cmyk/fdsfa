import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Starfield: React.FC<{ reducedMotion?: boolean }> = ({ reducedMotion = false }) => {
  const groupRef = useRef<THREE.Group>(null);

  const { starGeo, milkyGeo } = useMemo(() => {
    // Deep background stars
    const starCount = 2600;
    const pos = new Float32Array(starCount * 3);
    const col = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 45 + Math.random() * 45;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const tint = Math.random();
      if (tint > 0.85) {
        col[i * 3] = 0.72;
        col[i * 3 + 1] = 0.85;
        col[i * 3 + 2] = 1.0;
      } else if (tint < 0.12) {
        col[i * 3] = 1.0;
        col[i * 3 + 1] = 0.88;
        col[i * 3 + 2] = 0.72;
      } else {
        const b = 0.75 + Math.random() * 0.25;
        col[i * 3] = b;
        col[i * 3 + 1] = b;
        col[i * 3 + 2] = b;
      }
    }

    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    sGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    // Faint Milky Way galactic band tilted ~60°
    const bandCount = 1600;
    const bPos = new Float32Array(bandCount * 3);
    const bCol = new Float32Array(bandCount * 3);

    for (let i = 0; i < bandCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spread = (Math.random() - 0.5) * 0.26 + (Math.random() - 0.5) * 0.14;
      const r = 55 + Math.random() * 25;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(spread);
      const z = r * Math.sin(angle);

      // Tilt galactic plane
      const tilt = 0.88;
      bPos[i * 3] = x;
      bPos[i * 3 + 1] = y * Math.cos(tilt) - z * Math.sin(tilt);
      bPos[i * 3 + 2] = y * Math.sin(tilt) + z * Math.cos(tilt);

      bCol[i * 3] = 0.42;
      bCol[i * 3 + 1] = 0.56;
      bCol[i * 3 + 2] = 0.88;
    }

    const mGeo = new THREE.BufferGeometry();
    mGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
    mGeo.setAttribute('color', new THREE.BufferAttribute(bCol, 3));

    return { starGeo: sGeo, milkyGeo: mGeo };
  }, []);

  useFrame(({ camera }) => {
    if (reducedMotion || !groupRef.current) return;
    // Subtle parallax with camera orientation
    groupRef.current.position.x = camera.position.x * 0.08;
    groupRef.current.position.y = camera.position.y * 0.08;
  });

  return (
    <group ref={groupRef}>
      <points geometry={starGeo}>
        <pointsMaterial size={0.18} vertexColors transparent opacity={0.85} sizeAttenuation />
      </points>
      <points geometry={milkyGeo}>
        <pointsMaterial size={0.28} vertexColors transparent opacity={0.22} sizeAttenuation />
      </points>
    </group>
  );
};
