import React, { useMemo, useRef } from 'react';
import { ThreeEvent, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLOBE_RADIUS, vec3ToLatLon } from '../../services/tle';

interface EarthProps {
  isMobile: boolean;
  sunDirection: THREE.Vector3;
  onSelectPoint: (lat: number, lon: number, worldPoint: THREE.Vector3) => void;
  onDoubleSelectPoint: (lat: number, lon: number, worldPoint: THREE.Vector3) => void;
}

export const Earth: React.FC<EarthProps> = ({
  isMobile,
  sunDirection,
  onSelectPoint,
  onDoubleSelectPoint,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const [dayTex, nightTex, specTex, bumpTex] = useLoader(THREE.TextureLoader, [
    isMobile ? '/textures/earth_day_2k.jpg' : '/textures/earth_day_4k.jpg',
    isMobile ? '/textures/earth_night_2k.png' : '/textures/earth_night_4k.jpg',
    '/textures/earth_specular_2k.jpg',
    '/textures/earth_bump_2k.png',
  ]);

  useMemo(() => {
    dayTex.colorSpace = THREE.SRGBColorSpace;
    nightTex.colorSpace = THREE.SRGBColorSpace;
  }, [dayTex, nightTex]);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: dayTex },
        nightMap: { value: nightTex },
        specularMap: { value: specTex },
        bumpMap: { value: bumpTex },
        sunDir: { value: sunDirection.clone().normalize() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D dayMap;
        uniform sampler2D nightMap;
        uniform sampler2D specularMap;
        uniform sampler2D bumpMap;
        uniform vec3 sunDir;

        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 N = normalize(vWorldNormal);
          vec3 L = normalize(sunDir);
          vec3 V = normalize(cameraPosition - vWorldPosition);

          // Sample elevation bump gradient for subtle mountain relief shading
          float texel = 1.0 / 2048.0;
          float hL = texture2D(bumpMap, vUv - vec2(texel, 0.0)).r;
          float hR = texture2D(bumpMap, vUv + vec2(texel, 0.0)).r;
          float hD = texture2D(bumpMap, vUv - vec2(0.0, texel)).r;
          float hU = texture2D(bumpMap, vUv + vec2(0.0, texel)).r;
          float relief = clamp(1.0 + ((hL - hR) + (hD - hU)) * 2.2, 0.78, 1.24);

          vec3 dayColor = texture2D(dayMap, vUv).rgb * relief;
          vec3 nightColor = texture2D(nightMap, vUv).rgb;
          float oceanMask = texture2D(specularMap, vUv).r;

          float ndotl = dot(N, L);
          float dayFactor = smoothstep(-0.18, 0.24, ndotl);

          // Diffuse daylight + soft ambient
          float diffuse = max(ndotl, 0.0) * 1.08 + 0.07;
          vec3 litDay = dayColor * diffuse;

          // Ocean specular sunlight glint
          vec3 H = normalize(L + V);
          float spec = pow(max(dot(N, H), 0.0), 42.0) * oceanMask * max(ndotl, 0.0) * 0.62;
          litDay += vec3(0.75, 0.88, 1.0) * spec;

          // Warm golden Black Marble night lights boosted slightly on dark hemisphere
          vec3 nightLights = nightColor * vec3(1.15, 0.96, 0.72) * 1.45;
          vec3 nightAmbient = dayColor * 0.055;

          // Twilight atmospheric scatter along terminator
          float twilight = exp(-pow(ndotl * 6.5, 2.0)) * 0.16;
          vec3 twilightColor = vec3(0.32, 0.52, 0.95) * twilight;

          vec3 finalColor = mix(nightAmbient + nightLights, litDay, dayFactor) + twilightColor;
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });
  }, [dayTex, nightTex, specTex, bumpTex]);

  useFrame(() => {
    shaderMaterial.uniforms.sunDir.value.copy(sunDirection).normalize();
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (pointerDownPos.current) {
      const dist = Math.hypot(
        e.clientX - pointerDownPos.current.x,
        e.clientY - pointerDownPos.current.y
      );
      if (dist > 6) return; // Ignore drag release
    }
    if (!meshRef.current) return;
    const localPt = meshRef.current.worldToLocal(e.point.clone());
    const { lat, lon } = vec3ToLatLon(localPt.x, localPt.y, localPt.z);
    onSelectPoint(lat, lon, e.point.clone());
  };

  const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!meshRef.current) return;
    const localPt = meshRef.current.worldToLocal(e.point.clone());
    const { lat, lon } = vec3ToLatLon(localPt.x, localPt.y, localPt.z);
    onDoubleSelectPoint(lat, lon, e.point.clone());
  };

  return (
    <mesh
      ref={meshRef}
      material={shaderMaterial}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
    </mesh>
  );
};
