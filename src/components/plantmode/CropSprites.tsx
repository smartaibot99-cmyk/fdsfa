import React from 'react';
import { PlantHotspot, SeasonKey } from '../../types';
import { HERO_IMAGE_HEIGHT, HERO_IMAGE_WIDTH, percentBoxToScreen } from '../../lib/coverMath';

interface CropSpritesProps {
  hotspots: PlantHotspot[];
  containerW: number;
  containerH: number;
  treeSeasons: Record<string, SeasonKey>;
}

const SEASON_FILTER: Record<SeasonKey, string> = {
  spring: 'hue-rotate(-14deg) saturate(1.18) brightness(1.06)',
  summer: 'none',
  autumn: 'hue-rotate(-46deg) saturate(1.45) sepia(0.28) brightness(1.02)',
  winter: 'saturate(0.45) brightness(0.86) contrast(1.08)',
};

function renderSpriteSvg(type: NonNullable<PlantHotspot['spriteType']>) {
  switch (type) {
    case 'corn':
      return (
        <svg viewBox="0 0 160 170" className="w-full h-full drop-shadow-md" fill="none">
          {[18, 52, 86, 122].map((x, idx) => (
            <g key={x} className="animate-sway-gentle" style={{ animationDelay: `${idx * -0.9}s` }}>
              <path d={`M${x} 162 L${x} 36`} stroke="#3B7A2A" strokeWidth="5.5" strokeLinecap="round" />
              <path d={`M${x} 118 Q${x - 24} 102 ${x - 28} 122 Q${x - 10} 128 ${x} 122`} fill="#4D9A36" />
              <path d={`M${x} 96 Q${x + 25} 80 ${x + 30} 98 Q${x + 12} 106 ${x} 102`} fill="#3E882B" />
              <path d={`M${x} 74 Q${x - 22} 58 ${x - 26} 76 Q${x - 10} 82 ${x} 78`} fill="#58A83E" />
              {/* Golden corn cob */}
              <ellipse cx={x + 7} cy="92" rx="6.5" ry="15" transform={`rotate(-18 ${x + 7} 92)`} fill="#F4B942" stroke="#D97706" strokeWidth="1" />
              <path d={`M${x - 2} 36 L${x - 7} 20 M${x} 36 L${x} 16 M${x + 2} 36 L${x + 8} 21`} stroke="#EAB308" strokeWidth="2.2" strokeLinecap="round" />
            </g>
          ))}
        </svg>
      );

    case 'wheat':
      return (
        <svg viewBox="0 0 140 100" className="w-full h-full drop-shadow-sm" fill="none">
          {[18, 34, 50, 68, 86, 102, 118].map((x, idx) => (
            <g key={x} className="animate-sway-gentle" style={{ animationDelay: `${idx * -0.55}s` }}>
              <path d={`M${x} 95 Q${x + 3} 58 ${x + 6} 26`} stroke="#CA8A04" strokeWidth="2.4" strokeLinecap="round" />
              <ellipse cx={x + 6} cy="22" rx="4.5" ry="12" transform={`rotate(8 ${x + 6} 22)`} fill="#F4B942" />
              <ellipse cx={x + 4} cy="30" rx="3.5" ry="8" transform={`rotate(-8 ${x + 4} 30)`} fill="#EAB308" />
            </g>
          ))}
        </svg>
      );

    case 'sunflowers':
      return (
        <svg viewBox="0 0 130 145" className="w-full h-full drop-shadow-md" fill="none">
          {[
            { x: 28, y: 40, r: 16, d: '0s' },
            { x: 66, y: 28, r: 19, d: '-1.1s' },
            { x: 102, y: 46, r: 15, d: '-2.2s' },
          ].map((f, i) => (
            <g key={i} className="animate-sway-gentle" style={{ animationDelay: f.d }}>
              <path d={`M${f.x} 140 L${f.x} ${f.y}`} stroke="#3D7D2C" strokeWidth="4.5" strokeLinecap="round" />
              <path d={`M${f.x} 95 Q${f.x - 18} 82 ${f.x - 20} 98 Q${f.x - 8} 105 ${f.x} 100`} fill="#4D9A36" />
              <path d={`M${f.x} 82 Q${f.x + 18} 70 ${f.x + 20} 86 Q${f.x + 8} 92 ${f.x} 88`} fill="#3F882C" />
              {Array.from({ length: 12 }).map((_, p) => {
                const ang = (p / 12) * Math.PI * 2;
                const px = f.x + Math.cos(ang) * f.r;
                const py = f.y + Math.sin(ang) * f.r;
                return (
                  <ellipse
                    key={p}
                    cx={px}
                    cy={py}
                    rx="5"
                    ry="9.5"
                    transform={`rotate(${(ang * 180) / Math.PI + 90} ${px} ${py})`}
                    fill="#FACC15"
                  />
                );
              })}
              <circle cx={f.x} cy={f.y} r={f.r * 0.58} fill="#5C3A21" />
              <circle cx={f.x - 2} cy={f.y - 2} r={f.r * 0.25} fill="#854D0E" opacity="0.7" />
            </g>
          ))}
        </svg>
      );

    case 'tomatoes':
      return (
        <svg viewBox="0 0 130 130" className="w-full h-full drop-shadow-md" fill="none">
          {[36, 92].map((x, i) => (
            <g key={x} className="animate-sway-gentle" style={{ animationDelay: `${i * -1.4}s` }}>
              {/* Wooden stake */}
              <line x1={x} y1="122" x2={x} y2="20" stroke="#8B5E3C" strokeWidth="4" strokeLinecap="round" />
              {/* Bushy tomato foliage */}
              <circle cx={x - 10} cy="72" r="18" fill="#2E7D32" />
              <circle cx={x + 12} cy="68" r="17" fill="#388E3C" />
              <circle cx={x} cy="48" r="18" fill="#43A047" />
              <circle cx={x - 8} cy="92" r="15" fill="#256D29" />
              <circle cx={x + 10} cy="90" r="15" fill="#2E7D32" />
              {/* Ripe red tomatoes */}
              <circle cx={x - 12} cy="62" r="7" fill="#DC2626" />
              <circle cx={x + 12} cy="78" r="7.5" fill="#EF4444" />
              <circle cx={x - 4} cy="88" r="6.5" fill="#DC2626" />
              <circle cx={x + 6} cy="52" r="6" fill="#F97316" />
              <circle cx={x - 14} cy="60" r="2" fill="#FCA5A5" opacity="0.8" />
            </g>
          ))}
        </svg>
      );

    case 'pumpkins':
      return (
        <svg viewBox="0 0 130 95" className="w-full h-full drop-shadow-md" fill="none">
          <path d="M12 72 Q56 58 118 76" stroke="#3D7A2C" strokeWidth="3.5" fill="none" />
          <ellipse cx="44" cy="54" rx="14" ry="9" fill="#43A047" />
          <ellipse cx="94" cy="56" rx="13" ry="8" fill="#388E3C" />
          {/* Three pumpkins */}
          {[
            { cx: 34, cy: 68, rx: 16, ry: 13 },
            { cx: 68, cy: 65, rx: 19, ry: 15 },
            { cx: 102, cy: 70, rx: 14, ry: 11 },
          ].map((p, idx) => (
            <g key={idx} className="animate-sway-gentle" style={{ animationDelay: `${idx * -1.2}s` }}>
              <path d={`M${p.cx} ${p.cy - p.ry + 2} Q${p.cx + 3} ${p.cy - p.ry - 6} ${p.cx + 6} ${p.cy - p.ry - 5}`} stroke="#3F6212" strokeWidth="3.2" strokeLinecap="round" />
              <ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill="#EA580C" />
              <ellipse cx={p.cx} cy={p.cy} rx={p.rx * 0.56} ry={p.ry} fill="#F97316" />
              <ellipse cx={p.cx} cy={p.cy} rx={p.rx * 0.24} ry={p.ry} fill="#FB923C" />
            </g>
          ))}
        </svg>
      );

    case 'apple-tree':
      return (
        <svg viewBox="0 0 120 150" className="w-full h-full drop-shadow-md" fill="none">
          <path d="M60 144 L60 82 M60 100 L44 82 M60 95 L76 80" stroke="#6D4C3D" strokeWidth="8" strokeLinecap="round" />
          <g className="animate-sway-gentle">
            <circle cx="40" cy="66" r="24" fill="#2E7D32" />
            <circle cx="78" cy="64" r="23" fill="#388E3C" />
            <circle cx="60" cy="42" r="26" fill="#43A047" />
            <circle cx="58" cy="66" r="22" fill="#4CAF50" opacity="0.9" />
            {/* Apples */}
            <circle cx="42" cy="56" r="4.5" fill="#E11D48" />
            <circle cx="66" cy="40" r="4.5" fill="#DC2626" />
            <circle cx="78" cy="62" r="4.5" fill="#E11D48" />
            <circle cx="56" cy="70" r="4.2" fill="#DC2626" />
            <circle cx="38" cy="74" r="4" fill="#EF4444" />
          </g>
        </svg>
      );

    case 'lavender':
      return (
        <svg viewBox="0 0 140 100" className="w-full h-full drop-shadow-sm" fill="none">
          {[22, 38, 54, 70, 86, 102, 118].map((x, idx) => (
            <g key={x} className="animate-sway-gentle" style={{ animationDelay: `${idx * -0.5}s` }}>
              <path d={`M${x} 94 L${x} 36`} stroke="#55704A" strokeWidth="2.2" strokeLinecap="round" />
              <ellipse cx={x} cy="28" rx="4.5" ry="12" fill="#8B5CF6" />
              <ellipse cx={x - 1} cy="23" rx="3.2" ry="7" fill="#A78BFA" />
              <path d={`M${x} 86 Q${x - 10} 74 ${x - 12} 84`} stroke="#84A98C" strokeWidth="3" strokeLinecap="round" />
              <path d={`M${x} 82 Q${x + 10} 70 ${x + 12} 80`} stroke="#84A98C" strokeWidth="3" strokeLinecap="round" />
            </g>
          ))}
        </svg>
      );

    case 'carrots':
      return (
        <svg viewBox="0 0 130 85" className="w-full h-full drop-shadow-sm" fill="none">
          {/* Dark garden soil ridge */}
          <path d="M10 68 Q65 60 120 68 L120 78 L10 78 Z" fill="#6D4C3D" opacity="0.9" />
          {[24, 44, 65, 86, 106].map((x, idx) => (
            <g key={x} className="animate-sway-gentle" style={{ animationDelay: `${idx * -0.6}s` }}>
              {/* Peeking orange carrot crown */}
              <path d={`M${x - 5} 62 L${x + 5} 62 L${x} 74 Z`} fill="#F97316" />
              {/* Feathery green tops */}
              <path
                d={`M${x} 62 Q${x - 10} 42 ${x - 14} 30 M${x} 62 Q${x} 38 ${x} 24 M${x} 62 Q${x + 10} 42 ${x + 14} 32`}
                stroke="#2E9E4F"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          ))}
        </svg>
      );
  }
}

export const CropSprites: React.FC<CropSpritesProps> = ({
  hotspots,
  containerW,
  containerH,
  treeSeasons,
}) => {
  if (containerW <= 0 || containerH <= 0) return null;

  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Seasonal filter overlays for photo trees & orchard tree */}
      {hotspots
        .filter((h) => h.kind === 'tree')
        .map((h) => {
          const season = treeSeasons[h.cropId] ?? 'summer';
          if (season === 'summer') return null;
          const box = percentBoxToScreen(h, containerW, containerH, HERO_IMAGE_WIDTH, HERO_IMAGE_HEIGHT);
          return (
            <div
              key={`season-${h.id}`}
              style={{
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
                backdropFilter: SEASON_FILTER[season],
                WebkitBackdropFilter: SEASON_FILTER[season],
                borderRadius: '44%',
                transition: 'backdrop-filter 400ms ease',
              }}
              className="absolute pointer-events-none"
            />
          );
        })}

      {/* 8 Layered SVG Crop Sprites */}
      {hotspots
        .filter((h): h is PlantHotspot & { spriteType: NonNullable<PlantHotspot['spriteType']> } => Boolean(h.spriteType))
        .map((h) => {
          const box = percentBoxToScreen(h, containerW, containerH, HERO_IMAGE_WIDTH, HERO_IMAGE_HEIGHT);
          const season = h.kind === 'tree' ? (treeSeasons[h.cropId] ?? 'summer') : 'summer';
          return (
            <div
              key={`sprite-${h.id}`}
              style={{
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
                filter: season !== 'summer' ? SEASON_FILTER[season] : undefined,
                transition: 'filter 400ms ease',
              }}
              className="absolute pointer-events-none"
            >
              {renderSpriteSvg(h.spriteType)}
            </div>
          );
        })}
    </div>
  );
};
