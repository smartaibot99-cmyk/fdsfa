import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { CropEntry, EonetEvent, SatelliteLiveState } from '../../types';
import { CompiledSatellite, GLOBE_RADIUS, latLonToVec3 } from '../../services/tle';
import { Earth } from './Earth';
import { Clouds } from './Clouds';
import { Atmosphere } from './Atmosphere';
import { Starfield } from './Starfield';
import { Satellites } from './Satellites';
import { EventMarkers } from './EventMarkers';
import { FarmMarkers } from './FarmMarkers';

export interface CameraTargetRequest {
  lat: number;
  lon: number;
  distance: number;
  nonce: number;
}

interface EarthSceneProps {
  crops: CropEntry[];
  events: EonetEvent[];
  compiledSats: CompiledSatellite[];
  timeScale: number;
  showIssGroundTrack: boolean;
  selectedPin: { lat: number; lon: number } | null;
  selectedEventId: string | null;
  selectedSatId: number | null;
  followSatId: number | null;
  flyToRequest: CameraTargetRequest | null;
  onSelectPoint: (lat: number, lon: number) => void;
  onSelectEvent: (ev: EonetEvent) => void;
  onSelectFarm: (crop: CropEntry) => void;
  onSelectSatellite: (sat: SatelliteLiveState) => void;
  onHoverSatellite: (sat: SatelliteLiveState | null) => void;
}

function computeUtcSunDirection(): THREE.Vector3 {
  const now = new Date();
  const utcHours =
    now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  // Subsolar longitude: 12:00 UTC is over 0°, moves west 15°/hr
  const subsolarLonDeg = (12 - utcHours) * 15;
  // Approximate seasonal solar declination (-23.44° to +23.44°)
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const doy = Math.floor((now.getTime() - start) / 86400000);
  const declDeg = -23.44 * Math.cos(((2 * Math.PI) / 365) * (doy + 10));

  const [x, y, z] = latLonToVec3(declDeg, subsolarLonDeg, 10);
  return new THREE.Vector3(x, y, z).normalize();
}

const AXIAL_TILT_RAD = THREE.MathUtils.degToRad(23.4);

const GlobeRig: React.FC<{
  crops: CropEntry[];
  events: EonetEvent[];
  compiledSats: CompiledSatellite[];
  timeScale: number;
  showIssGroundTrack: boolean;
  selectedPin: { lat: number; lon: number } | null;
  selectedEventId: string | null;
  selectedSatId: number | null;
  followSatId: number | null;
  flyToRequest: CameraTargetRequest | null;
  isMobile: boolean;
  reducedMotion: boolean;
  onSelectPoint: (lat: number, lon: number) => void;
  onSelectEvent: (ev: EonetEvent) => void;
  onSelectFarm: (crop: CropEntry) => void;
  onSelectSatellite: (sat: SatelliteLiveState) => void;
  onHoverSatellite: (sat: SatelliteLiveState | null) => void;
  onLoaded: () => void;
}> = ({
  crops,
  events,
  compiledSats,
  timeScale,
  showIssGroundTrack,
  selectedPin,
  selectedEventId,
  selectedSatId,
  followSatId,
  flyToRequest,
  isMobile,
  reducedMotion,
  onSelectPoint,
  onSelectEvent,
  onSelectFarm,
  onSelectSatellite,
  onHoverSatellite,
  onLoaded,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const earthTiltGroupRef = useRef<THREE.Group>(null);
  const simTimeMsRef = useRef<number>(Date.now());
  const latestStatesRef = useRef<SatelliteLiveState[]>([]);
  const sunDir = useMemo(() => computeUtcSunDirection(), []);

  // Track user interaction to pause auto-rotate for 4 seconds
  const lastInteractRef = useRef<number>(0);
  const [autoRotateActive, setAutoRotateActive] = useState(!reducedMotion);

  // Cinematic 2.5s space-to-orbit intro flight
  const introActiveRef = useRef(!reducedMotion);
  const introElapsedRef = useRef(0);

  // Programmatic fly-to animation
  const flyTargetVecRef = useRef<THREE.Vector3 | null>(null);
  const lastNonceRef = useRef<number>(0);

  useEffect(() => {
    onLoaded();
  }, [onLoaded]);

  useEffect(() => {
    if (reducedMotion) {
      camera.position.set(0, 1.2, 5.4);
      setAutoRotateActive(false);
    } else {
      camera.position.set(0, 3.6, 13.5);
    }
  }, [camera, reducedMotion]);

  useEffect(() => {
    if (!flyToRequest || flyToRequest.nonce === lastNonceRef.current) return;
    lastNonceRef.current = flyToRequest.nonce;
    introActiveRef.current = false;

    const localPos = new THREE.Vector3(
      ...latLonToVec3(flyToRequest.lat, flyToRequest.lon, flyToRequest.distance)
    );
    // Apply Earth's 23.4° axial tilt so fly-to aims at the world-space location
    localPos.applyAxisAngle(new THREE.Vector3(0, 0, 1), AXIAL_TILT_RAD);
    flyTargetVecRef.current = localPos;
  }, [flyToRequest]);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      if (Date.now() - lastInteractRef.current > 4000) {
        setAutoRotateActive(true);
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const pinPos = useMemo(() => {
    if (!selectedPin) return null;
    return latLonToVec3(selectedPin.lat, selectedPin.lon, GLOBE_RADIUS + 0.025);
  }, [selectedPin]);

  useFrame((_, delta) => {
    // 1. Intro glide over 2.5s
    if (introActiveRef.current) {
      introElapsedRef.current += delta;
      const t = Math.min(1, introElapsedRef.current / 2.5);
      const eased = 1 - (1 - t) ** 3;
      const start = new THREE.Vector3(0, 3.6, 13.5);
      const end = new THREE.Vector3(0.4, 1.25, 5.4);
      camera.position.lerpVectors(start, end, eased);
      if (t >= 1) {
        introActiveRef.current = false;
      }
    }

    // 2. Follow satellite lock
    if (followSatId !== null) {
      const targetSat = latestStatesRef.current.find((s) => s.meta.noradId === followSatId);
      if (targetSat) {
        const satWorld = new THREE.Vector3(...targetSat.position3D).applyAxisAngle(
          new THREE.Vector3(0, 0, 1),
          AXIAL_TILT_RAD
        );
        const desiredCam = satWorld.clone().normalize().multiplyScalar(4.4);
        camera.position.lerp(desiredCam, 1 - Math.exp(-4 * delta));
        controlsRef.current?.target.set(0, 0, 0);
      }
    } else if (flyTargetVecRef.current) {
      // 3. Smooth fly-to animation
      camera.position.lerp(flyTargetVecRef.current, 1 - Math.exp(-4.5 * delta));
      if (camera.position.distanceTo(flyTargetVecRef.current) < 0.04) {
        flyTargetVecRef.current = null;
      }
    }

    controlsRef.current?.update();
  });

  const handleInteractionStart = () => {
    introActiveRef.current = false;
    flyTargetVecRef.current = null;
    lastInteractRef.current = Date.now();
    setAutoRotateActive(false);
  };

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[sunDir.x * 12, sunDir.y * 12, sunDir.z * 12]} intensity={1.9} />
      <pointLight position={[-10, -4, -10]} intensity={0.25} color="#4C8DFF" />

      <Starfield reducedMotion={reducedMotion} />

      {/* 23.4° axial tilt group containing Earth, Clouds, Satellites, Events & Farms */}
      <group ref={earthTiltGroupRef} rotation={[0, 0, AXIAL_TILT_RAD]}>
        <Earth
          isMobile={isMobile}
          sunDirection={sunDir}
          onSelectPoint={(lat, lon) => onSelectPoint(lat, lon)}
          onDoubleSelectPoint={(lat, lon) => {
            const localPos = new THREE.Vector3(...latLonToVec3(lat, lon, 3.6));
            localPos.applyAxisAngle(new THREE.Vector3(0, 0, 1), AXIAL_TILT_RAD);
            flyTargetVecRef.current = localPos;
            onSelectPoint(lat, lon);
          }}
        />
        <Clouds reducedMotion={reducedMotion} />
        <Atmosphere />

        <Satellites
          compiled={compiledSats}
          simTimeMsRef={simTimeMsRef}
          timeScale={timeScale}
          selectedNoradId={selectedSatId}
          hoveredNoradId={null}
          showIssGroundTrack={showIssGroundTrack}
          reducedMotion={reducedMotion}
          onSelectSatellite={onSelectSatellite}
          onHoverSatellite={onHoverSatellite}
          onStatesUpdate={(st) => {
            latestStatesRef.current = st;
          }}
        />

        <EventMarkers
          events={events}
          selectedEventId={selectedEventId}
          onSelectEvent={onSelectEvent}
        />

        <FarmMarkers
          crops={crops}
          onSelectFarm={onSelectFarm}
          reducedMotion={reducedMotion}
        />

        {/* Dropped glowing pin when user clicks anywhere on Earth */}
        {pinPos && (
          <group position={pinPos}>
            <mesh>
              <sphereGeometry args={[0.042, 16, 16]} />
              <meshBasicMaterial color="#4C8DFF" />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.075, 16, 16]} />
              <meshBasicMaterial color="#4C8DFF" transparent opacity={0.35} />
            </mesh>
          </group>
        )}
      </group>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping={!reducedMotion}
        dampingFactor={0.05}
        minDistance={2.85}
        maxDistance={10.5}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        autoRotate={!reducedMotion && autoRotateActive && followSatId === null && !selectedPin}
        autoRotateSpeed={0.35}
        onStart={handleInteractionStart}
      />
    </>
  );
};

function checkWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

export const EarthScene: React.FC<EarthSceneProps> = (props) => {
  const [webglOk] = useState(() => checkWebGLAvailable());
  const [loaded, setLoaded] = useState(false);

  const isMobile =
    typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!webglOk) {
    return (
      <div className="relative w-full h-full bg-[#0B0F1A] flex items-center justify-center overflow-hidden">
        <img
          src="/textures/earth_day_2k.jpg"
          alt="NASA Blue Marble Earth"
          className="w-[460px] max-w-[90vw] aspect-[2/1] object-cover rounded-full opacity-85 shadow-2xl border border-[#26304A]"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#0B0F1A]">
      {!loaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0B0F1A] text-[#E8ECF5] gap-3 pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-[#26304A] border-t-[#4C8DFF] animate-spin" />
          <p className="text-xs font-mono text-[#9AA6C1]">Loading NASA Earth textures...</p>
        </div>
      )}

      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 44, near: 0.1, far: 200, position: [0, 3.6, 13.5] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <GlobeRig
            {...props}
            isMobile={isMobile}
            reducedMotion={reducedMotion}
            onLoaded={() => setLoaded(true)}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
