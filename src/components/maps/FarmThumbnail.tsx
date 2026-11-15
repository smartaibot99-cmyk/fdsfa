import React, { useMemo, useState } from 'react';
import { FarmGeoJsonGeometry, FarmHealthStatus, LonLat } from '../../types/maps';

interface FarmThumbnailProps {
  geometry: FarmGeoJsonGeometry;
  centroid: { lat: number; lon: number };
  status: FarmHealthStatus;
  selected?: boolean;
}

const STATUS_STYLE: Record<
  FarmHealthStatus,
  { dot: string; stroke: string; fill: string }
> = {
  healthy: {
    dot: '#35E66B',
    stroke: '#4CF282',
    fill: 'rgba(58, 232, 114, 0.28)',
  },
  moderate: {
    dot: '#FFB21A',
    stroke: '#FFC13B',
    fill: 'rgba(255, 178, 26, 0.26)',
  },
  at_risk: {
    dot: '#FF3B4E',
    stroke: '#FF5363',
    fill: 'rgba(255, 59, 78, 0.28)',
  },
  no_data: {
    dot: '#8C96A0',
    stroke: '#9CA6B0',
    fill: 'rgba(140, 150, 160, 0.22)',
  },
};

function projectToWorldPx(lon: number, lat: number, zoom: number): [number, number] {
  const scale = 256 * Math.pow(2, zoom);
  const clampedLat = Math.max(-85.0511, Math.min(85.0511, lat));
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);
  const x = ((lon + 180) / 360) * scale;
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return [x, y];
}

export const FarmThumbnail: React.FC<FarmThumbnailProps> = ({
  geometry,
  centroid,
  status,
  selected = false,
}) => {
  const [tileErrors, setTileErrors] = useState(0);
  const palette = STATUS_STYLE[status] ?? STATUS_STYLE.no_data;

  const projection = useMemo(() => {
    const outerRings: LonLat[][] =
      geometry.type === 'MultiPolygon'
        ? geometry.coordinates.map((p) => p[0] ?? [])
        : [geometry.coordinates[0] ?? []];

    const allPts = outerRings.flat();
    // Choose a zoom level where the polygon roughly fills ~55% of a 140px satellite window
    let chosenZoom = 14;
    for (let z = 16; z >= 10; z--) {
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (const [lon, lat] of allPts) {
        const [wx, wy] = projectToWorldPx(lon, lat, z);
        if (wx < minX) minX = wx;
        if (wx > maxX) maxX = wx;
        if (wy < minY) minY = wy;
        if (wy > maxY) maxY = wy;
      }
      const span = Math.max(maxX - minX, maxY - minY);
      if (span <= 145) {
        chosenZoom = z;
        break;
      }
    }

    const projectedRings = outerRings.map((ring) =>
      ring.map(([lon, lat]) => projectToWorldPx(lon, lat, chosenZoom))
    );

    const flatProj = projectedRings.flat();
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const [wx, wy] of flatProj) {
      if (wx < minX) minX = wx;
      if (wx > maxX) maxX = wx;
      if (wy < minY) minY = wy;
      if (wy > maxY) maxY = wy;
    }

    const centerPx =
      flatProj.length > 0
        ? [(minX + maxX) / 2, (minY + maxY) / 2]
        : projectToWorldPx(centroid.lon, centroid.lat, chosenZoom);

    const tileX = Math.floor(centerPx[0] / 256);
    const tileY = Math.floor(centerPx[1] / 256);
    const startTileX = centerPx[0] - tileX * 256 < 128 ? tileX - 1 : tileX;
    const startTileY = centerPx[1] - tileY * 256 < 128 ? tileY - 1 : tileY;

    // Viewport window in world px around centerPx (show enough surrounding agricultural context)
    const span = Math.max(maxX - minX, maxY - minY, 44);
    const viewSizeWorld = Math.min(240, Math.max(128, span * 1.95));
    const viewLeft = centerPx[0] - viewSizeWorld / 2;
    const viewTop = centerPx[1] - viewSizeWorld / 2;

    const scaleToThumb = 100 / viewSizeWorld; // map into 0..100 SVG viewBox

    const svgPolygons = projectedRings.map((ring) =>
      ring
        .map(([wx, wy]) => {
          const sx = (wx - viewLeft) * scaleToThumb;
          const sy = (wy - viewTop) * scaleToThumb;
          return `${sx.toFixed(1)},${sy.toFixed(1)}`;
        })
        .join(' ')
    );

    const maxTileIdx = Math.pow(2, chosenZoom);
    const tiles: Array<{ key: string; url: string; leftPct: number; topPct: number; sizePct: number }> = [];
    for (let dx = 0; dx < 2; dx++) {
      for (let dy = 0; dy < 2; dy++) {
        const tx = ((startTileX + dx) % maxTileIdx + maxTileIdx) % maxTileIdx;
        const ty = Math.max(0, Math.min(maxTileIdx - 1, startTileY + dy));
        const tileWorldLeft = (startTileX + dx) * 256;
        const tileWorldTop = (startTileY + dy) * 256;
        tiles.push({
          key: `${chosenZoom}-${tx}-${ty}`,
          url: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${chosenZoom}/${ty}/${tx}`,
          leftPct: ((tileWorldLeft - viewLeft) / viewSizeWorld) * 100,
          topPct: ((tileWorldTop - viewTop) / viewSizeWorld) * 100,
          sizePct: (256 / viewSizeWorld) * 100,
        });
      }
    }

    return { svgPolygons, tiles };
  }, [geometry, centroid.lat, centroid.lon]);

  return (
    <div
      className={`relative w-[74px] h-[74px] shrink-0 rounded-lg overflow-hidden bg-[#162820] border ${
        selected ? 'border-[#16E0B8]/50' : 'border-white/10'
      }`}
    >
      {/* Subtle agricultural fallback gradient underneath tiles */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 30% 25%, #2a472d 0%, #1a3022 55%, #122119 100%)',
        }}
      />

      {/* Registered satellite tiles (if network available) */}
      {tileErrors < 4 &&
        projection.tiles.map((t) => (
          <img
            key={t.key}
            src={t.url}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setTileErrors((c) => c + 1)}
            className="absolute max-w-none pointer-events-none select-none object-cover"
            style={{
              left: `${t.leftPct}%`,
              top: `${t.topPct}%`,
              width: `${t.sizePct}%`,
              height: `${t.sizePct}%`,
            }}
          />
        ))}

      {/* Slight vignette for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/20 pointer-events-none" />

      {/* Actual farm polygon boundary overlay */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        {projection.svgPolygons.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill={selected ? palette.fill : 'rgba(255,255,255,0.06)'}
            stroke={selected ? palette.stroke : 'rgba(255,255,255,0.45)'}
            strokeWidth={selected ? 2.6 : 1.5}
            strokeLinejoin="round"
          />
        ))}
      </svg>

      {/* Top-left circular status indicator dot */}
      <span
        aria-hidden="true"
        className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full ring-2 ring-[#0A131E]/85 shadow-sm"
        style={{ backgroundColor: palette.dot }}
      />
    </div>
  );
};
