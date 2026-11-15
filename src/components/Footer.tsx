import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="no-print border-t border-[var(--border)] bg-[var(--bg-deep)] py-8 px-4 sm:px-6 mt-auto">
      <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
        <div className="space-y-1">
          <p className="font-medium text-[var(--text-primary)]">
            Built for the NASA Space Apps Challenge. Not endorsed by NASA.
          </p>
          <p>
            Open-source decision support grounded in NASA POWER, EONET v3, GIBS, APOD, NeoWs, DONKI, and Earthdata CMR.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <Link to="/data" className="hover:text-[var(--text-primary)] transition-colors">
            Data Sources
          </Link>
          <Link to="/about" className="hover:text-[var(--text-primary)] transition-colors">
            AI Disclosure
          </Link>
          <Link to="/compare" className="hover:text-[var(--text-primary)] transition-colors">
            Compare Locations
          </Link>
        </div>
      </div>
    </footer>
  );
};
