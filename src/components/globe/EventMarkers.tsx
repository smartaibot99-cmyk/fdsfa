import React, { useMemo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { EonetEvent } from '../../types';
import { GLOBE_RADIUS, latLonToVec3 } from '../../services/tle';

interface EventMarkersProps {
  events: EonetEvent[];
  selectedEventId: string | null;
  onSelectEvent: (ev: EonetEvent) => void;
}

function eventColor(cat: string): string {
  const lower = cat.toLowerCase();
  if (lower.includes('wildfire') || lower.includes('fire')) return '#EF4444';
  if (lower.includes('storm') || lower.includes('cyclone')) return '#4C8DFF';
  if (lower.includes('volcano')) return '#F97316';
  if (lower.includes('flood')) return '#22C7B8';
  return '#F5B83D';
}

export const EventMarkers: React.FC<EventMarkersProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
}) => {
  const markers = useMemo(() => {
    return events.slice(0, 65).map((ev) => {
      const cat = ev.categories[0]?.title || 'Natural Event';
      return {
        ev,
        pos: latLonToVec3(ev.lat, ev.lon, GLOBE_RADIUS + 0.022),
        color: eventColor(cat),
      };
    });
  }, [events]);

  return (
    <group>
      {markers.map(({ ev, pos, color }) => {
        const isSelected = ev.id === selectedEventId;
        return (
          <group key={ev.id} position={pos}>
            <mesh
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                onSelectEvent(ev);
              }}
            >
              <sphereGeometry args={[isSelected ? 0.036 : 0.024, 12, 12]} />
              <meshBasicMaterial color={color} />
            </mesh>
            <mesh>
              <sphereGeometry args={[isSelected ? 0.055 : 0.04, 12, 12]} />
              <meshBasicMaterial color={color} transparent opacity={0.28} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
