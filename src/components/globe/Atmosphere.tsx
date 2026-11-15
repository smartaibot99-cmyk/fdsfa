import React, { useMemo } from 'react';
import * as THREE from 'three';

export const Atmosphere: React.FC<{ radius?: number }> = ({ radius = 2.14 }) => {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color('#4C8DFF') },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float rim = max(0.0, 0.68 - dot(vNormal, -viewDir));
          float intensity = pow(rim, 3.2) * 1.15;
          gl_FragColor = vec4(glowColor, intensity * 0.72);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh material={material}>
      <sphereGeometry args={[radius, 64, 64]} />
    </mesh>
  );
};
