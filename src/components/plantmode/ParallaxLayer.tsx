import React, { useEffect, useState } from 'react';

interface ParallaxLayerProps {
  children: React.ReactNode;
  zoomTarget?: { xPct: number; yPct: number } | null;
}

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({ children, zoomTarget }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2; // -1..1
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      setOffset({ x: -nx * 10, y: -ny * 7 });
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      const nx = Math.max(-1, Math.min(1, e.gamma / 30));
      const ny = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      setOffset({ x: -nx * 10, y: -ny * 7 });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [reducedMotion]);

  // Subtle camera pan & zoom toward selected hotspot (500ms)
  let zoomScale = 1.03; // Base slight overscan so parallax never reveals edges
  let zoomX = 0;
  let zoomY = 0;

  if (zoomTarget) {
    zoomScale = 1.32;
    // Clamp translation inside safe overscan bounds so scaled edges never uncover container
    const rawX = (50 - zoomTarget.xPct) * 0.28;
    const rawY = (50 - zoomTarget.yPct) * 0.24;
    zoomX = Math.max(-10.2, Math.min(10.2, rawX));
    zoomY = Math.max(-10.2, Math.min(10.2, rawY));
  }

  const px = reducedMotion ? 0 : offset.x;
  const py = reducedMotion ? 0 : offset.y;

  return (
    <div
      style={{
        transform: `translate3d(calc(${zoomX}% + ${px}px), calc(${zoomY}% + ${py}px), 0) scale(${zoomScale})`,
        transition: reducedMotion
          ? 'none'
          : 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      className="absolute inset-0 will-change-transform"
    >
      {children}
    </div>
  );
};
