import React from 'react';

interface MistyCloudTransitionProps {
  isLight?: boolean;
}

/**
 * Hyper-realistic multi-layered volumetric mist and drifting cloud bank
 * bridging the fixed top horizon section and the scrolling lower farm-valley section.
 */
export const MistyCloudTransition: React.FC<MistyCloudTransitionProps> = ({ isLight = false }) => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative z-20 -mt-[95px] sm:-mt-[120px] -mb-[95px] sm:-mb-[120px] h-[190px] sm:h-[240px] w-full overflow-hidden select-none"
    >
      {/* Hidden SVG turbulence filter for organic, billowing cloud edges */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="fsCloudVolumetric" x="-15%" y="-30%" width="130%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.011 0.022"
              numOctaves="5"
              seed="14"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="38"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="11" />
          </filter>
          <filter id="fsMistWisps" x="-15%" y="-30%" width="130%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018 0.036"
              numOctaves="4"
              seed="29"
              result="noise2"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise2"
              scale="28"
              xChannelSelector="R"
              yChannelSelector="B"
              result="displaced2"
            />
            <feGaussianBlur in="displaced2" stdDeviation="8" />
          </filter>
        </defs>
      </svg>

      {/* Ambient atmospheric band across seam */}
      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? 'linear-gradient(180deg, rgba(196,228,250,0) 0%, rgba(214,236,252,0.48) 42%, rgba(200,228,248,0.45) 58%, rgba(196,228,250,0) 100%)'
            : 'linear-gradient(180deg, rgba(0,10,27,0) 0%, rgba(7,29,63,0.48) 42%, rgba(8,34,72,0.52) 56%, rgba(0,10,27,0) 100%)',
        }}
      />

      {/* Layer 1: Deep slow-drifting cloud billows */}
      <div className="fs-mist-layer-1 absolute inset-y-2 -left-[15%] w-[130%]">
        <div className="w-full h-full" style={{ filter: 'url(#fsCloudVolumetric)' }}>
          <div
            className="w-full h-full opacity-80"
            style={{
              background: isLight
                ? 'radial-gradient(26% 65% at 12% 52%, rgba(235, 246, 255, 0.62), transparent 72%),' +
                  'radial-gradient(30% 70% at 34% 48%, rgba(196, 226, 248, 0.56), transparent 74%),' +
                  'radial-gradient(28% 68% at 58% 55%, rgba(238, 248, 255, 0.64), transparent 72%),' +
                  'radial-gradient(32% 72% at 82% 46%, rgba(192, 224, 248, 0.58), transparent 75%),' +
                  'radial-gradient(24% 62% at 96% 54%, rgba(232, 245, 255, 0.60), transparent 72%)'
                : 'radial-gradient(26% 65% at 12% 52%, rgba(44, 102, 168, 0.54), transparent 72%),' +
                  'radial-gradient(30% 70% at 34% 48%, rgba(62, 128, 198, 0.48), transparent 74%),' +
                  'radial-gradient(28% 68% at 58% 55%, rgba(48, 108, 175, 0.52), transparent 72%),' +
                  'radial-gradient(32% 72% at 82% 46%, rgba(68, 136, 206, 0.50), transparent 75%),' +
                  'radial-gradient(24% 62% at 96% 54%, rgba(39, 96, 162, 0.48), transparent 72%)',
            }}
          />
        </div>
      </div>

      {/* Layer 2: Mid-elevation clouds drifting opposite direction */}
      <div className="fs-mist-layer-2 absolute inset-y-4 -left-[18%] w-[136%]">
        <div className="w-full h-full" style={{ filter: 'url(#fsCloudVolumetric)' }}>
          <div
            className="w-full h-full opacity-85"
            style={{
              background: isLight
                ? 'radial-gradient(20% 48% at 8% 54%, rgba(236, 247, 255, 0.58), transparent 70%),' +
                  'radial-gradient(24% 52% at 27% 46%, rgba(214, 236, 252, 0.54), transparent 72%),' +
                  'radial-gradient(22% 46% at 48% 55%, rgba(238, 248, 255, 0.60), transparent 70%),' +
                  'radial-gradient(25% 54% at 69% 47%, rgba(210, 234, 250, 0.56), transparent 72%),' +
                  'radial-gradient(22% 50% at 89% 53%, rgba(236, 247, 255, 0.58), transparent 70%)'
                : 'radial-gradient(20% 48% at 8% 54%, rgba(154, 206, 250, 0.32), transparent 70%),' +
                  'radial-gradient(24% 52% at 27% 46%, rgba(178, 222, 255, 0.30), transparent 72%),' +
                  'radial-gradient(22% 46% at 48% 55%, rgba(132, 192, 245, 0.28), transparent 70%),' +
                  'radial-gradient(25% 54% at 69% 47%, rgba(182, 224, 255, 0.32), transparent 72%),' +
                  'radial-gradient(22% 50% at 89% 53%, rgba(146, 202, 248, 0.30), transparent 70%)',
            }}
          />
        </div>
      </div>

      {/* Layer 3: Fine drifting surface mist wisps */}
      <div className="fs-mist-layer-3 absolute inset-y-6 -left-[12%] w-[124%]">
        <div className="w-full h-full" style={{ filter: 'url(#fsMistWisps)' }}>
          <div
            className="w-full h-full opacity-80"
            style={{
              background: isLight
                ? 'radial-gradient(18% 36% at 16% 50%, rgba(238, 248, 255, 0.48), transparent 68%),' +
                  'radial-gradient(22% 38% at 42% 54%, rgba(220, 240, 252, 0.44), transparent 68%),' +
                  'radial-gradient(19% 34% at 65% 48%, rgba(238, 248, 255, 0.48), transparent 68%),' +
                  'radial-gradient(21% 36% at 88% 52%, rgba(218, 239, 252, 0.46), transparent 68%)'
                : 'radial-gradient(18% 36% at 16% 50%, rgba(214, 238, 255, 0.24), transparent 68%),' +
                  'radial-gradient(22% 38% at 42% 54%, rgba(190, 232, 255, 0.22), transparent 68%),' +
                  'radial-gradient(19% 34% at 65% 48%, rgba(218, 242, 255, 0.24), transparent 68%),' +
                  'radial-gradient(21% 36% at 88% 52%, rgba(186, 228, 255, 0.22), transparent 68%)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
