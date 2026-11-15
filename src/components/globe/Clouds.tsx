import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

interface CloudsProps {
  reducedMotion: boolean;
}

export const Clouds: React.FC<CloudsProps> = ({ reducedMotion }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudTex = useLoader(THREE.TextureLoader, '/textures/earth_clouds_1k.png');

  useFrame((_, delta) => {
    if (reducedMotion || !meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.012;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2.026, 64, 64]} />
      <meshStandardMaterial
        map={cloudTex}
        transparent
        opacity={0.42}
        depthWrite={false}
        roughness={0.9}
      />
    </mesh>
  );
};
