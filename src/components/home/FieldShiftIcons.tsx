import React from 'react';

export const FieldShiftLogoLeaf: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 44 42" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="fsLogoLeafGrad" x1="4" y1="38" x2="40" y2="4" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0FD891" />
        <stop offset="55%" stopColor="#26F2A6" />
        <stop offset="100%" stopColor="#6BFFBF" />
      </linearGradient>
    </defs>
    {/* Stylized angular leaf with internal diagonal cutouts matching FIELD SHIFT brand mark */}
    <path
      d="M7 35C7 19.5 16.5 7.5 36.5 5.5C37.5 22 28.5 34.5 13 35.5L8.5 39.5C7.6 40.3 6.2 39.4 6.5 38.2L7 35Z"
      fill="url(#fsLogoLeafGrad)"
    />
    {/* Crisp dark cutouts along the central stem and diagonal veins */}
    <path
      d="M9 34.5L32.5 10.5M18 25.5L17 16.5M23.5 20L30.5 20.5M14.5 29L22.5 29.5"
      stroke="#00162B"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ConditionsLeafIcon: React.FC<{ className?: string; dark?: boolean }> = ({
  className = 'w-10 h-10',
  dark = false,
}) => (
  <svg viewBox="0 0 44 42" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="fsCondLeafGrad" x1="6" y1="36" x2="38" y2="6" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor={dark ? '#04251A' : '#12DB97'} />
        <stop offset="100%" stopColor={dark ? '#073626' : '#5EFFB7'} />
      </linearGradient>
    </defs>
    <path
      d="M8 33.5C8.2 18.8 18 7.5 36.8 6C37.6 21.8 29 33 13.8 34.2L9.2 38.2C8.3 38.9 7 38.1 7.3 37L8 33.5Z"
      fill="url(#fsCondLeafGrad)"
    />
    <path
      d="M10 33L32.5 10.5M19.5 23.5L18.8 15.8M24.2 18.8L30.8 19.3"
      stroke={dark ? '#38F4AA' : '#01243E'}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

export const PartlyCloudy3DIcon: React.FC<{ className?: string }> = ({ className = 'w-[78px] h-[74px]' }) => (
  <svg viewBox="0 0 92 84" fill="none" className={className} aria-hidden="true">
    <defs>
      <radialGradient id="fsSunGlow" cx="42%" cy="38%" r="58%">
        <stop offset="0%" stopColor="#FFF29C" />
        <stop offset="45%" stopColor="#FFD23F" />
        <stop offset="100%" stopColor="#F59E0B" />
      </radialGradient>
      <linearGradient id="fsCloudBody" x1="46" y1="26" x2="46" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="68%" stopColor="#E6F1FD" />
        <stop offset="100%" stopColor="#C1D8F0" />
      </linearGradient>
      <filter id="fsWeatherShadow" x="-15%" y="-15%" width="130%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000E24" floodOpacity="0.45" />
      </filter>
    </defs>

    {/* 8 short golden sun rays */}
    <g stroke="#FFD447" strokeWidth="3.2" strokeLinecap="round">
      <line x1="33" y1="7" x2="33" y2="12" />
      <line x1="33" y1="49" x2="33" y2="54" />
      <line x1="9" y1="30" x2="14" y2="30" />
      <line x1="52" y1="30" x2="57" y2="30" />
      <line x1="16" y1="13" x2="20" y2="17" />
      <line x1="46" y1="43" x2="50" y2="47" />
      <line x1="16" y1="47" x2="20" y2="43" />
      <line x1="46" y1="17" x2="50" y2="13" />
    </g>

    {/* Warm golden sun disc */}
    <circle cx="33" cy="30" r="15.5" fill="url(#fsSunGlow)" />

    {/* 3D layered fluffy cloud */}
    <g filter="url(#fsWeatherShadow)">
      <path
        d="M27 68H68.5C76 68 82 62.2 82 54.8C82 48 76.9 42.4 70.3 41.7C68.6 32.1 60.2 25 50.1 25C39.8 25 31.3 32.4 29.8 42.3C28.8 42 27.9 41.9 26.8 41.9C19.7 41.9 14 47.6 14 54.8C14 62.1 19.8 68 27 68Z"
        fill="url(#fsCloudBody)"
      />
      <ellipse cx="48" cy="41" rx="16" ry="11" fill="#FFFFFF" fillOpacity="0.45" />
    </g>
  </svg>
);

export const DropletGlossIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 32 34" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="fsDropGrad" x1="10" y1="5" x2="24" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#72E5FF" />
        <stop offset="55%" stopColor="#2FC4FF" />
        <stop offset="100%" stopColor="#0E8CE6" />
      </linearGradient>
    </defs>
    <path
      d="M16 3C16 3 6.5 14.3 6.5 21.2C6.5 26.6 10.75 31 16 31C21.25 31 25.5 26.6 25.5 21.2C25.5 14.3 16 3 16 3Z"
      fill="url(#fsDropGrad)"
    />
    <path
      d="M12.2 20.5C12.2 23.2 13.7 25.5 15.8 26.2"
      stroke="#D4F7FF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeOpacity="0.7"
    />
  </svg>
);

export const DecorativeTrackLeaf: React.FC<{ className?: string }> = ({ className = 'w-16 h-14' }) => (
  <svg
    viewBox="0 0 74 64"
    fill="none"
    className={className}
    style={{
      filter:
        'drop-shadow(0 0 8px rgba(90, 255, 174, 0.55)) drop-shadow(0 0 18px rgba(0, 235, 155, 0.30))',
    }}
    aria-hidden="true"
  >
    <path
      d="M12 52C14 31 28.5 12.5 62 10C60.5 34.5 45.5 51 19 52.5L9.5 57.5L12 52Z"
      stroke="#5AFFAE"
      strokeWidth="2.1"
      strokeLinejoin="round"
      fill="rgba(22, 238, 165, 0.08)"
    />
    <path
      d="M14 51.5C28 38.5 43.5 24.5 59.5 11.5"
      stroke="#5AFFAE"
      strokeWidth="2.1"
      strokeLinecap="round"
    />
    <path
      d="M27 40C26.5 32 28.5 26 32.5 21.5M37 31.5C36.5 25 38.5 20.5 42.5 17M46.5 23.5C46 19.5 47.5 16.5 50.5 14M29 38.5C36 39 42.5 37 47.5 33M38 30.5C44 31 49.5 29 53.5 25.5"
      stroke="#5AFFAE"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.88"
    />
  </svg>
);

export const FarmerAvatarSvg: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="fsAvatarBg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2A4D3E" />
        <stop offset="55%" stopColor="#1B362E" />
        <stop offset="100%" stopColor="#0E2028" />
      </linearGradient>
      <linearGradient id="fsHat" x1="14" y1="12" x2="50" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#D7A76E" />
        <stop offset="100%" stopColor="#9C6E3B" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" fill="url(#fsAvatarBg)" />
    {/* Soft warm sunset horizon behind farmer */}
    <ellipse cx="32" cy="40" rx="28" ry="14" fill="#E39D4A" fillOpacity="0.22" />
    {/* Shoulders / flannel shirt */}
    <path d="M12 64C14 50 22 45 32 45C42 45 50 50 52 64H12Z" fill="#7C342B" />
    <path d="M25 45L32 54L39 45" fill="#D5B895" />
    {/* Neck & Face */}
    <rect x="28" y="38" width="8" height="9" rx="3" fill="#DCA782" />
    <ellipse cx="32" cy="31" rx="9.5" ry="11" fill="#E6B38E" />
    {/* Eyes & smile */}
    <circle cx="28.5" cy="30" r="1.15" fill="#2E1D15" />
    <circle cx="35.5" cy="30" r="1.15" fill="#2E1D15" />
    <path d="M28.5 34.8C30.2 36.6 33.8 36.6 35.5 34.8" stroke="#6B3E2B" strokeWidth="1.5" strokeLinecap="round" />
    {/* Straw hat crown & brim */}
    <path d="M21 22C21.5 14 25.5 10.5 32 10.5C38.5 10.5 42.5 14 43 22H21Z" fill="url(#fsHat)" />
    <rect x="21" y="19.5" width="22" height="2.6" fill="#4E311E" />
    <ellipse cx="32" cy="22.5" rx="19.5" ry="4.2" fill="#C79458" stroke="#8C5F30" strokeWidth="1" />
  </svg>
);
