import React, { useMemo, useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { SatelliteLiveState } from '../../types';
import { CompiledSatellite, computeGroundTrack, propagateSatelliteAt } from '../../services/tle';

interface SatellitesProps {
  compiled: CompiledSatellite[];
  simTimeMsRef: React.MutableRefObject<number>;
  timeScale: number;
  selectedNoradId: number | null;
  hoveredNoradId: number | null;
  showIssGroundTrack: boolean;
  reducedMotion: boolean;
  onSelectSatellite: (sat: SatelliteLiveState) => void;
  onHoverSatellite: (sat: SatelliteLiveState | null) => void;
  onStatesUpdate: (states: SatelliteLiveState[]) => void;
}

const SatelliteMesh: React.FC<{
  state: SatelliteLiveState;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (sat: SatelliteLiveState) => void;
  onHover: (sat: SatelliteLiveState | null) => void;
}> = ({ state, isSelected, isHovered, onSelect, onHover }) => {
  const groupRef = useRef<THREE.Group>(null);
  const posVec = useMemo(() => new THREE.Vector3(...state.position3D), [state.position3D]);

  // Orient satellite nadir-pointing toward Earth center
  const quat = useMemo(() => {
    const q = new THREE.Quaternion();
    const nadir = posVec.clone().negate().normalize();
    q.setFromUnitVectors(new THREE.Vector3(0, -1, 0), nadir);
    return q;
  }, [posVec]);

  const highlight = isSelected || isHovered;
  const scale = highlight ? 1.45 : 1.0;

  return (
    <group>
      {/* One-orbit fading trail line */}
      {state.orbitPoints.length > 2 && (
        <Line
          points={state.orbitPoints}
          color={state.meta.color}
          lineWidth={highlight ? 1.8 : 0.8}
          transparent
          opacity={highlight ? 0.65 : 0.16}
        />
      )}

      {/* Composite 3D spacecraft model */}
      <group
        ref={groupRef}
        position={state.position3D}
        quaternion={quat}
        scale={[scale, scale, scale]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(state);
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onHover(state);
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
          onHover(null);
        }}
      >
        {/* Invisible larger hit proxy for easy touch tapping */}
        <mesh>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Bus body */}
        <mesh>
          <boxGeometry args={[0.032, 0.026, 0.032]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.8} roughness={0.25} />
        </mesh>

        {/* Gold foil thermal blanket */}
        <mesh position={[0, -0.008, 0]}>
          <boxGeometry args={[0.034, 0.012, 0.034]} />
          <meshStandardMaterial color="#F5B83D" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Twin solar panel wings */}
        <mesh position={[-0.056, 0, 0]}>
          <boxGeometry args={[0.068, 0.004, 0.026]} />
          <meshStandardMaterial
            color="#2563EB"
            emissive="#1D4ED8"
            emissiveIntensity={0.35}
            metalness={0.6}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[0.056, 0, 0]}>
          <boxGeometry args={[0.068, 0.004, 0.026]} />
          <meshStandardMaterial
            color="#2563EB"
            emissive="#1D4ED8"
            emissiveIntensity={0.35}
            metalness={0.6}
            roughness={0.2}
          />
        </mesh>

        {/* Nadir Earth sensor dish */}
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.014, 0.006, 0.012, 10]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Teal glow halo */}
        <mesh>
          <sphereGeometry args={[highlight ? 0.052 : 0.038, 12, 12]} />
          <meshBasicMaterial
            color={state.meta.color}
            transparent
            opacity={highlight ? 0.42 : 0.22}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
};

export const Satellites: React.FC<SatellitesProps> = ({
  compiled,
  simTimeMsRef,
  timeScale,
  selectedNoradId,
  hoveredNoradId,
  showIssGroundTrack,
  reducedMotion,
  onSelectSatellite,
  onHoverSatellite,
  onStatesUpdate,
}) => {
  const lastPropagateWallRef = useRef<number>(0);
  const [liveStates, setLiveStates] = React.useState<SatelliteLiveState[]>(() => {
    const now = new Date();
    return compiled
      .map((s) => propagateSatelliteAt(s, now, true))
      .filter((x): x is SatelliteLiveState => x !== null);
  });

  const [issTrack, setIssTrack] = React.useState<[number, number, number][]>([]);

  useFrame((_, delta) => {
    if (compiled.length === 0) return;

    if (!reducedMotion) {
      simTimeMsRef.current += delta * 1000 * timeScale;
    }

    const wallNow = performance.now();
    // Propagate at ~4 Hz when time-lapse is active, or 1 Hz at 1x, to keep 60fps smooth
    const intervalMs = timeScale > 1 ? 180 : 1000;
    if (wallNow - lastPropagateWallRef.current >= intervalMs) {
      lastPropagateWallRef.current = wallNow;
      const simDate = new Date(simTimeMsRef.current);
      const nextStates: SatelliteLiveState[] = [];
      for (const sat of compiled) {
        const st = propagateSatelliteAt(sat, simDate, true);
        if (st) nextStates.push(st);
      }
      setLiveStates(nextStates);
      onStatesUpdate(nextStates);

      if (showIssGroundTrack) {
        const iss = compiled.find((c) => c.meta.noradId === 25544);
        if (iss) {
          setIssTrack(computeGroundTrack(iss, simDate, 95));
        }
      } else if (issTrack.length > 0) {
        setIssTrack([]);
      }
    }
  });

  return (
    <group>
      {showIssGroundTrack && issTrack.length > 2 && (
        <Line
          points={issTrack}
          color="#F5B83D"
          lineWidth={1.6}
          dashed
          dashSize={0.08}
          gapSize={0.04}
          transparent
          opacity={0.78}
        />
      )}

      {liveStates.map((st) => (
        <SatelliteMesh
          key={st.meta.noradId}
          state={st}
          isSelected={st.meta.noradId === selectedNoradId}
          isHovered={st.meta.noradId === hoveredNoradId}
          onSelect={onSelectSatellite}
          onHover={onHoverSatellite}
        />
      ))}
    </group>
  );
};
