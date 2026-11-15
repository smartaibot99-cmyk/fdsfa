import React from 'react';

export const MistLayer: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      <div
        className="animate-mist-drift absolute left-[-10%] right-[-10%] top-[22%] h-[28%]"
        style={{
          background:
            'radial-gradient(ellipse 48% 55% at 32% 55%, rgba(255,255,255,0.42), transparent 70%), radial-gradient(ellipse 42% 50% at 72% 48%, rgba(235,248,240,0.36), transparent 72%)',
          filter: 'blur(16px)',
        }}
      />
      <div
        className="animate-mist-drift absolute left-[-12%] right-[-12%] top-[30%] h-[20%]"
        style={{
          animationDelay: '-11s',
          background:
            'radial-gradient(ellipse 55% 60% at 54% 60%, rgba(255,255,255,0.28), transparent 75%)',
          filter: 'blur(22px)',
        }}
      />
    </div>
  );
};
