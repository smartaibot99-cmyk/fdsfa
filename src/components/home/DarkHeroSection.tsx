import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Globe,
  Play,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ConditionsLeafIcon } from './FieldShiftIcons';

interface HeroShowcaseProps {
  isLight: boolean;
  onExplorePlatform: () => void;
  onScrollToDashboard: () => void;
}

const TopographicContourOverlay: React.FC<{ strokeColor?: string; isLight?: boolean }> = ({
  strokeColor = '#19C6DD',
  isLight = false,
}) => (
  <svg
    viewBox="0 0 300 180"
    fill="none"
    aria-hidden="true"
    className={`pointer-events-none absolute -right-2 w-[235px] h-[155px] ${
      isLight ? 'bottom-0 opacity-95' : '-top-2 opacity-85'
    }`}
    style={{
      maskImage: isLight
        ? 'radial-gradient(ellipse at 72% 72%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.48) 58%, rgba(0,0,0,0) 90%)'
        : 'radial-gradient(ellipse at 78% 24%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 88%)',
      WebkitMaskImage: isLight
        ? 'radial-gradient(ellipse at 72% 72%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.48) 58%, rgba(0,0,0,0) 90%)'
        : 'radial-gradient(ellipse at 78% 24%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 88%)',
    }}
  >
    <g stroke={strokeColor} strokeWidth={isLight ? '0.95' : '0.9'} opacity={isLight ? '0.20' : '0.16'}>
      <path d="M130 5 C180 25 165 65 220 73 C270 80 285 120 260 170" />
      <path d="M150 -5 C200 15 190 52 239 60 C295 69 310 112 285 180" />
      <path d="M170 -10 C220 8 210 42 260 49 C320 60 330 110 310 180" />
      <path d="M110 0 C150 35 145 80 190 92 C225 102 240 140 220 180" />
      <path d="M90 0 C130 42 125 94 170 110 C205 123 215 155 200 185" />
      <path d="M192 -8 C236 14 228 34 275 40 C316 46 330 85 314 138" />
    </g>
  </svg>
);

export const DarkMoonAndOrbitsOverlay: React.FC = () => (
  <svg
    viewBox="0 0 1671 941"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 w-full h-full z-[1]"
  >
    <defs>
      <radialGradient id="fsMoonOuterBloomGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(120, 212, 255, 0.42)" />
        <stop offset="28%" stopColor="rgba(64, 174, 255, 0.26)" />
        <stop offset="58%" stopColor="rgba(26, 128, 245, 0.10)" />
        <stop offset="100%" stopColor="rgba(10, 48, 110, 0)" />
      </radialGradient>

      <radialGradient id="fsMoonHaloGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(235, 250, 255, 0.65)" />
        <stop offset="22%" stopColor="rgba(155, 226, 255, 0.48)" />
        <stop offset="48%" stopColor="rgba(78, 190, 255, 0.22)" />
        <stop offset="100%" stopColor="rgba(20, 108, 220, 0)" />
      </radialGradient>

      <radialGradient id="fsMoonCoreBoostGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.72)" />
        <stop offset="52%" stopColor="rgba(218, 244, 255, 0.46)" />
        <stop offset="78%" stopColor="rgba(128, 218, 255, 0.18)" />
        <stop offset="100%" stopColor="rgba(72, 186, 255, 0)" />
      </radialGradient>

      <filter id="fsMoonBlurFilter" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="14" />
      </filter>

      <linearGradient id="fsOrbitPrimaryGrad" x1="940" y1="560" x2="1671" y2="108" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgba(0, 180, 255, 0)" />
        <stop offset="22%" stopColor="rgba(0, 184, 255, 0.42)" />
        <stop offset="68%" stopColor="rgba(46, 206, 255, 0.72)" />
        <stop offset="100%" stopColor="rgba(125, 232, 255, 0.85)" />
      </linearGradient>

      <linearGradient id="fsOrbitSecondaryGrad" x1="1300" y1="185" x2="1671" y2="95" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgba(0, 180, 255, 0)" />
        <stop offset="45%" stopColor="rgba(0, 192, 255, 0.34)" />
        <stop offset="100%" stopColor="rgba(95, 224, 255, 0.56)" />
      </linearGradient>

      <filter id="fsOrbitGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Multi-layered screen-blended lunar bloom & brilliance aligned to the moon in image_baca392f */}
    <g style={{ mixBlendMode: 'screen' }}>
      <circle
        cx="897"
        cy="335"
        r="310"
        fill="url(#fsMoonOuterBloomGrad)"
        filter="url(#fsMoonBlurFilter)"
        className="fs-moon-breath"
      />
      <circle
        cx="897"
        cy="335"
        r="148"
        fill="url(#fsMoonHaloGrad)"
        className="fs-moon-breath"
      />
      <circle
        cx="897"
        cy="335"
        r="52"
        fill="url(#fsMoonCoreBoostGrad)"
      />
    </g>

    {/* Sweeping geospatial orbital trajectories */}
    <g filter="url(#fsOrbitGlow)">
      <path
        d="M 945 550 C 1035 370, 1265 256, 1671 106"
        fill="none"
        stroke="url(#fsOrbitPrimaryGrad)"
        strokeWidth="1.25"
      />
      <path
        d="M 1298 188 C 1425 156, 1550 128, 1671 96"
        fill="none"
        stroke="url(#fsOrbitSecondaryGrad)"
        strokeWidth="0.95"
      />
      <path
        d="M 1572 562 C 1612 534, 1644 500, 1671 464"
        fill="none"
        stroke="rgba(0, 196, 255, 0.36)"
        strokeWidth="1"
      />

      {/* Traveling subtle luminous telemetry pulse along primary arc */}
      <path
        d="M 945 550 C 1035 370, 1265 256, 1671 106"
        fill="none"
        stroke="rgba(162, 242, 255, 0.65)"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="fs-orbit-travel"
      />

      {/* Crisp orbital nodes */}
      <circle cx="1548" cy="151" r="2.6" fill="#B5F4FF" />
      <circle cx="1548" cy="151" r="7" fill="rgba(56, 212, 255, 0.25)" />
      <circle cx="1114" cy="370" r="1.8" fill="rgba(130, 232, 255, 0.72)" />
    </g>
  </svg>
);

export const LightSunHaloOverlay: React.FC = () => (
  <svg
    viewBox="0 0 1671 941"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 w-full h-full z-[1]"
  >
    <defs>
      <radialGradient id="fsDaySunHaloGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.50)" />
        <stop offset="18%" stopColor="rgba(255, 252, 235, 0.26)" />
        <stop offset="42%" stopColor="rgba(255, 248, 220, 0.12)" />
        <stop offset="72%" stopColor="rgba(255, 255, 255, 0.04)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
      </radialGradient>
      <filter id="fsDaySunBlur" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="16" />
      </filter>
    </defs>

    {/* Soft solar atmospheric bloom aligned gently to the sun in image_1c65eb53 */}
    <circle
      cx="885"
      cy="318"
      r="210"
      fill="url(#fsDaySunHaloGrad)"
      filter="url(#fsDaySunBlur)"
      className="fs-sun-breath"
      style={{ mixBlendMode: 'screen' }}
    />
  </svg>
);

export const DarkHeroSection: React.FC<HeroShowcaseProps> = ({
  isLight,
  onExplorePlatform,
  onScrollToDashboard,
}) => {
  const navigate = useNavigate();

  const featureCards = isLight
    ? [
        {
          id: 'explore-sources',
          variantClass: 'fs-feature-card-light fs-feature-card-light--1',
          title: 'Explore Sources',
          description: 'Access trusted geospatial data across the web.',
          contourColor: '#0284C7',
          icon: Globe,
          iconColor: '#075985',
          iconBg: '#E0F2FE',
          iconBorder: 'rgba(7, 89, 133, 0.30)',
          iconGlow:
            '0 2px 10px rgba(7, 89, 133, 0.14), inset 0 1px 2px rgba(255, 255, 255, 0.85)',
          onClick: () => navigate('/data'),
        },
        {
          id: 'check-claims',
          variantClass: 'fs-feature-card-light fs-feature-card-light--2',
          title: 'Check Claims',
          description: 'Verify information with AI precision.',
          contourColor: '#047857',
          icon: ShieldCheck,
          iconColor: '#065F46',
          iconBg: '#D1FAE5',
          iconBorder: 'rgba(4, 120, 87, 0.30)',
          iconGlow:
            '0 2px 10px rgba(4, 120, 87, 0.14), inset 0 1px 2px rgba(255, 255, 255, 0.85)',
          onClick: () => navigate('/my-farms'),
        },
        {
          id: 'see-evidence',
          variantClass: 'fs-feature-card-light fs-feature-card-light--3',
          title: 'See Evidence',
          description: 'Get clear, visual proof and insights.',
          contourColor: '#0369A1',
          icon: BarChart3,
          iconColor: '#075985',
          iconBg: '#DBEAFE',
          iconBorder: 'rgba(7, 89, 133, 0.28)',
          iconGlow:
            '0 2px 10px rgba(7, 89, 133, 0.14), inset 0 1px 2px rgba(255, 255, 255, 0.85)',
          onClick: () => navigate('/maps'),
        },
        {
          id: 'stay-informed',
          variantClass: 'fs-feature-card-light fs-feature-card-light--4',
          title: 'Stay Informed',
          description: 'Make confident decisions.',
          contourColor: '#047857',
          icon: Zap,
          iconColor: '#92400E',
          iconBg: '#FEF3C7',
          iconBorder: 'rgba(180, 83, 9, 0.30)',
          iconGlow:
            '0 2px 10px rgba(180, 83, 9, 0.14), inset 0 1px 2px rgba(255, 255, 255, 0.85)',
          onClick: onScrollToDashboard,
        },
      ]
    : [
        {
          id: 'explore-sources',
          variantClass: 'fs-feature-card fs-feature-card--1',
          title: 'Explore Sources',
          description: 'Access trusted geospatial data across the web.',
          contourColor: '#23C8F5',
          icon: Globe,
          iconColor: '#29C7FF',
          iconBg: 'rgba(6, 56, 102, 0.56)',
          iconBorder: 'rgba(38, 174, 255, 0.58)',
          iconGlow:
            '0 0 18px rgba(24, 158, 255, 0.34), inset 0 1px 2px rgba(130, 218, 255, 0.24)',
          onClick: () => navigate('/data'),
        },
        {
          id: 'check-claims',
          variantClass: 'fs-feature-card fs-feature-card--2',
          title: 'Check Claims',
          description: 'Verify information with AI precision.',
          contourColor: '#00E2BD',
          icon: ShieldCheck,
          iconColor: '#00E5B6',
          iconBg: 'rgba(4, 62, 68, 0.56)',
          iconBorder: 'rgba(0, 224, 186, 0.54)',
          iconGlow:
            '0 0 18px rgba(0, 224, 186, 0.30), inset 0 1px 2px rgba(132, 255, 234, 0.24)',
          onClick: () => navigate('/my-farms'),
        },
        {
          id: 'see-evidence',
          variantClass: 'fs-feature-card fs-feature-card--3',
          title: 'See Evidence',
          description: 'Get clear, visual proof and insights.',
          contourColor: '#19C6DD',
          icon: BarChart3,
          iconColor: '#1AB8FF',
          iconBg: 'rgba(6, 52, 86, 0.58)',
          iconBorder: 'rgba(28, 174, 245, 0.54)',
          iconGlow:
            '0 0 18px rgba(22, 166, 245, 0.30), inset 0 1px 2px rgba(128, 220, 255, 0.22)',
          onClick: () => navigate('/maps'),
        },
        {
          id: 'stay-informed',
          variantClass: 'fs-feature-card fs-feature-card--4',
          title: 'Stay Informed',
          description: 'Make confident decisions.',
          contourColor: '#6EEB62',
          icon: Zap,
          iconColor: '#98EC2E',
          iconBg: 'rgba(24, 62, 34, 0.54)',
          iconBorder: 'rgba(136, 226, 54, 0.52)',
          iconGlow:
            '0 0 18px rgba(128, 228, 48, 0.28), inset 0 1px 2px rgba(196, 255, 134, 0.20)',
          onClick: onScrollToDashboard,
        },
      ];

  return (
    <div className="relative z-20 pointer-events-none max-w-[1520px] w-full mx-auto px-5 sm:px-8 lg:px-14 xl:px-[74px] pt-[96px] sm:pt-[108px] pb-7 sm:pb-9 min-h-screen flex flex-col justify-between">
      {/* HERO MESSAGING (Left-aligned) */}
      <section className="relative z-20 pointer-events-auto my-auto py-4 sm:py-6 max-w-[740px]">
        {/* Eyebrow Badge */}
        <div
          className="inline-flex items-center gap-2.5 h-[38px] sm:h-[41px] px-4 rounded-full mb-5"
          style={
            isLight
              ? {
                  background:
                    'linear-gradient(100deg, rgba(255, 255, 255, 0.86), rgba(224, 245, 254, 0.82))',
                  border: '1px solid rgba(7, 89, 133, 0.26)',
                  boxShadow:
                    '0 2px 12px rgba(7, 89, 133, 0.10), inset 0 1px 2px rgba(255, 255, 255, 0.90)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }
              : {
                  background:
                    'linear-gradient(110deg, rgba(0, 65, 69, 0.55), rgba(0, 31, 48, 0.66))',
                  border: '1px solid rgba(0, 218, 184, 0.62)',
                  boxShadow:
                    '0 0 10px rgba(0, 223, 188, 0.10), inset 0 1px 1px rgba(128, 255, 237, 0.08)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }
          }
        >
          <ConditionsLeafIcon className="w-[17px] h-[17px] shrink-0" dark={isLight} />
          <span
            className={`text-[12px] sm:text-[13px] font-medium tracking-[0.01em] whitespace-nowrap ${
              isLight ? 'text-[#102A43]' : 'text-[#E5F4FF]'
            }`}
          >
            Geospatial Intelligence for a Sustainable Tomorrow.
          </span>
        </div>

        {/* Main Hero Heading */}
        <h1 className="text-[44px] sm:text-[58px] lg:text-[70px] xl:text-[78px] font-extrabold leading-[0.99] tracking-[-0.042em] m-0">
          <span className={`block ${isLight ? 'text-[#102A43]' : 'text-[#F3F6FF]'}`}>
            Smarter decisions.
          </span>
          <span
            className="block bg-clip-text text-transparent pb-1"
            style={{
              backgroundImage: isLight
                ? 'linear-gradient(95deg, #075985 0%, #047857 100%)'
                : 'linear-gradient(95deg, #168BFF 0%, #00B6F0 35%, #00D6B7 67%, #00E9A7 100%)',
            }}
          >
            Healthier fields.
          </span>
        </h1>

        {/* Supporting Description */}
        <p
          className={`mt-4 max-w-[540px] text-[16px] sm:text-[18px] xl:text-[19px] font-normal leading-[1.55] ${
            isLight ? 'text-[#334155]' : 'text-[rgba(218,231,249,0.91)]'
          }`}
        >
          Harness the power of geospatial intelligence to
          <br className="hidden sm:inline" /> monitor, analyze and improve agricultural productivity.
        </p>

        {/* Call-to-action Buttons */}
        <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-6 sm:gap-8">
          <button
            type="button"
            onClick={onExplorePlatform}
            className="inline-flex items-center justify-between gap-3.5 min-w-[262px] sm:min-w-[282px] h-[56px] sm:h-[61px] px-7 rounded-full font-semibold text-[15px] sm:text-[16px] transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 cursor-pointer"
            style={
              isLight
                ? {
                    background:
                      'linear-gradient(105deg, #075985 0%, #0E7490 52%, #047857 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.36)',
                    color: '#FFFFFF',
                    boxShadow:
                      '0 8px 20px rgba(7, 89, 133, 0.28), 0 2px 6px rgba(4, 120, 87, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.30)',
                  }
                : {
                    background:
                      'linear-gradient(100deg, #12BEFF 0%, #00D9DC 45%, #00E8A4 100%)',
                    color: '#031F2C',
                    boxShadow:
                      '0 0 10px rgba(0, 222, 255, 0.52), 0 0 25px rgba(0, 211, 220, 0.29), 0 0 42px rgba(0, 222, 177, 0.16), inset 0 1px 2px rgba(255, 255, 255, 0.34)',
                  }
            }
          >
            <span className="inline-flex items-center gap-2.5">
              <ConditionsLeafIcon className="w-[22px] h-[22px] shrink-0" dark={!isLight} />
              <span>Explore the Platform</span>
            </span>
            <ArrowRight
              className={`w-[18px] h-[18px] ${isLight ? 'text-white' : 'text-[#031F2C]'}`}
              strokeWidth={2.2}
            />
          </button>

          <button
            type="button"
            onClick={onScrollToDashboard}
            className={`group inline-flex items-center gap-3.5 text-[15px] font-medium transition-colors cursor-pointer ${
              isLight
                ? 'text-[#102A43] hover:text-[#075985]'
                : 'text-[#ECF4FF] hover:text-white'
            }`}
          >
            <span
              className="inline-flex items-center justify-center w-[54px] h-[54px] sm:w-[61px] sm:h-[61px] rounded-full transition-all duration-200 group-hover:scale-105"
              style={
                isLight
                  ? {
                      background: 'rgba(255, 255, 255, 0.86)',
                      border: '1px solid rgba(7, 89, 133, 0.32)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      boxShadow:
                        'inset 0 1px 2px rgba(255, 255, 255, 0.90), 0 4px 12px rgba(7, 89, 133, 0.14)',
                    }
                  : {
                      background: 'rgba(3, 37, 65, 0.68)',
                      border: '1px solid rgba(0, 138, 225, 0.68)',
                      boxShadow:
                        '0 0 16px rgba(0, 138, 225, 0.22), inset 0 1px 1px rgba(170, 225, 255, 0.14)',
                      backdropFilter: 'blur(10px)',
                    }
              }
            >
              <Play
                className={`w-[18px] h-[18px] fill-current ml-0.5 ${
                  isLight ? 'text-[#075985]' : 'text-white'
                }`}
              />
            </span>
            <span>Watch Demo</span>
          </button>
        </div>
      </section>

      {/* BOTTOM ZONE: FOUR FLOATING GLASS FEATURE CARDS + SCROLL INDICATOR */}
      <div className="relative z-20 pointer-events-auto mt-6 sm:mt-8 space-y-6 sm:space-y-8">
        <div
          aria-label="Platform capabilities"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 xl:gap-[26px]"
        >
          {featureCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={card.onClick}
                className={`${card.variantClass} group text-left rounded-[24px] min-h-[150px] xl:min-h-[160px] cursor-pointer focus:outline-none`}
              >
                <TopographicContourOverlay strokeColor={card.contourColor} isLight={isLight} />

                <div className="relative z-[2] flex items-center justify-between gap-4 h-full px-5 py-5 xl:px-[23px] xl:py-[20px]">
                  {/* Circular Icon Container */}
                  <div
                    className="w-[62px] h-[62px] xl:w-[68px] xl:h-[68px] rounded-full flex items-center justify-center shrink-0 transition-all duration-200 group-hover:brightness-105 group-hover:scale-[1.03]"
                    style={{
                      background: card.iconBg,
                      border: `1px solid ${card.iconBorder}`,
                      boxShadow: card.iconGlow,
                    }}
                  >
                    <IconComponent
                      className="w-[26px] h-[26px] xl:w-[29px] xl:h-[29px]"
                      style={{ color: card.iconColor }}
                      strokeWidth={1.85}
                    />
                  </div>

                  {/* Text Block */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[16px] xl:text-[16.5px] font-semibold leading-[1.3] ${
                        isLight ? 'text-[#102A43]' : 'text-[#F4F8FF]'
                      }`}
                    >
                      {card.title}
                    </div>
                    <p
                      className={`mt-1.5 text-[12.5px] xl:text-[13px] font-normal leading-[1.48] max-w-[172px] ${
                        isLight ? 'text-[#334155]' : 'text-[#B8CDE2]'
                      }`}
                    >
                      {card.description}
                    </p>
                  </div>

                  {/* Circular Outlined Arrow Button */}
                  <span
                    aria-hidden="true"
                    className="w-[38px] h-[38px] xl:w-[40px] xl:h-[40px] rounded-full grid place-items-center shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                    style={
                      isLight
                        ? {
                            background: 'rgba(255, 255, 255, 0.78)',
                            border: '1px solid rgba(7, 89, 133, 0.26)',
                            color: '#102A43',
                            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.90)',
                          }
                        : {
                            background: 'rgba(3, 44, 73, 0.58)',
                            border: '1px solid rgba(65, 163, 214, 0.38)',
                            color: '#EDF8FF',
                            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.06)',
                          }
                    }
                  >
                    <ArrowRight className="w-[16px] h-[16px]" strokeWidth={2} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Center Scroll Indicator (White on both Light green foliage & Dark night foliage) */}
        <div className="flex items-center justify-center gap-5 sm:gap-6 max-w-[770px] mx-auto">
          <span
            aria-hidden="true"
            className="flex-1 h-px"
            style={{
              background: isLight
                ? 'linear-gradient(90deg, transparent, rgba(224, 247, 255, 0.82))'
                : 'linear-gradient(90deg, transparent, rgba(81, 159, 194, 0.55))',
            }}
          />

          <button
            type="button"
            onClick={onScrollToDashboard}
            className={`group inline-flex items-center gap-3 text-[12px] transition-colors whitespace-nowrap cursor-pointer ${
              isLight
                ? 'text-white/95 hover:text-white drop-shadow-[0_1px_4px_rgba(0,25,15,0.45)]'
                : 'text-[rgba(226,239,250,0.88)] hover:text-white'
            }`}
          >
            <span
              className={`w-[22px] h-[34px] rounded-[12px] grid place-items-center ${
                isLight
                  ? 'border-[1.5px] border-white/92 text-white'
                  : 'border-[1.5px] border-[rgba(213,238,255,0.9)] text-[#E6F4FF]'
              }`}
              aria-hidden="true"
            >
              <ArrowDown className="w-[11px] h-[13px] fs-scroll-arrow" strokeWidth={2.2} />
            </span>
            <span>Scroll to explore</span>
          </button>

          <span
            aria-hidden="true"
            className="flex-1 h-px"
            style={{
              background: isLight
                ? 'linear-gradient(270deg, transparent, rgba(224, 247, 255, 0.82))'
                : 'linear-gradient(270deg, transparent, rgba(81, 159, 194, 0.55))',
            }}
          />
        </div>
      </div>
    </div>
  );
};
