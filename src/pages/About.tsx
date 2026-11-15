import React from 'react';
import { Leaf } from 'lucide-react';
import { useMode } from '../context/ModeContext';
import { AIBadge } from '../components/AIBadge';
import { DataBadge } from '../components/DataBadge';

export const About: React.FC = () => {
  const { isPlantMode } = useMode();
  return (
    <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-10">
      <section className="space-y-3">
        <p className="text-xs font-mono text-[var(--teal)]">
          NASA Space Apps Challenge · Create Your Own Challenge
        </p>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-[var(--text-primary)] text-balance">
          Anchor: Ground Your Plans in NASA Earth Data
        </h1>
        <p className="text-base text-[var(--text-secondary)] leading-relaxed">
          People plan outdoor events, planting, travel, school sports, and construction using short-range weather forecasts that only look a few days ahead and ignore active regional hazards. Anchor transforms 20+ years of free NASA Earth-observation data into one transparent, explainable decision score for any place and date worldwide.
        </p>
      </section>

      {/* Problem & Solution */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="anchor-card p-6 space-y-2.5">
          <h2 className="text-lg font-display font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
            {isPlantMode && <Leaf className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />}
            <span>The Problem</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Standard weather apps go dark beyond 7–10 days. Meanwhile, NASA’s POWER, EONET, and GIBS archives hold decades of global satellite-derived climatology and hazard tracking—but raw APIs and netCDF tables are inaccessible to event organizers, smallholder farmers, teachers, and local planners.
          </p>
        </div>

        <div className="anchor-card p-6 space-y-2.5">
          <h2 className="text-lg font-display font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
            {isPlantMode && <Leaf className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />}
            <span>How Anchor Solves It</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Pick any place, date, and activity. Anchor queries 20+ years of NASA POWER daily observations for that exact calendar window (±3 days) plus active EONET v3 natural hazards within 300 km, computes deterministic risk sub-scores in code, and uses Gemini AI solely to synthesize context and explainability.
          </p>
        </div>
      </section>

      {/* Scoring Formula Table */}
      <section className="anchor-card p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-display font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
            {isPlantMode && <Leaf className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />}
            <span>
              {isPlantMode
                ? 'Stage 1 Deterministic Grow Score Formulas'
                : 'Stage 1 Deterministic Anchor Score Formulas'}
            </span>
          </h2>
          <DataBadge dataset="NASA POWER + EONET v3" />
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          Suitability = 100 − Risk. Factor weights sum to 100% (normalized over available factors). Data Score = Σ(Suitability × Weight).
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="py-2.5 pr-4 font-semibold">Factor</th>
                <th className="py-2.5 pr-4 font-semibold">NASA Source & Parameter</th>
                <th className="py-2.5 font-semibold">Formula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
              <tr>
                <td className="py-3 pr-4 font-medium">Rain Risk</td>
                <td className="py-3 pr-4 font-mono text-[11px] text-[var(--teal)]">POWER PRECTOTCORR</td>
                <td className="py-3 text-[var(--text-secondary)]">
                  % of historical days in target ±3d window with precipitation &gt; activity threshold (default 5 mm/day).
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">Heat Risk</td>
                <td className="py-3 pr-4 font-mono text-[11px] text-[var(--teal)]">POWER T2M_MAX</td>
                <td className="py-3 text-[var(--text-secondary)]">
                  % of historical days with max 2m air temperature &gt; activity limit (30–34 °C).
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">Cold Risk</td>
                <td className="py-3 pr-4 font-mono text-[11px] text-[var(--teal)]">POWER T2M_MIN</td>
                <td className="py-3 text-[var(--text-secondary)]">
                  % of historical days with min 2m air temperature &lt; activity limit (2–5 °C).
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">Wind Risk</td>
                <td className="py-3 pr-4 font-mono text-[11px] text-[var(--teal)]">POWER WS10M</td>
                <td className="py-3 text-[var(--text-secondary)]">
                  % of historical days with 10m wind speed &gt; activity limit (9–11 m/s).
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">Hazard Proximity</td>
                <td className="py-3 pr-4 font-mono text-[11px] text-[var(--teal)]">EONET v3 Open Events</td>
                <td className="py-3 text-[var(--text-secondary)]">
                  Distance-weighted penalty for active wildfires, storms, floods, or volcanoes within 300 km (last 30 days).
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">Variability</td>
                <td className="py-3 pr-4 font-mono text-[11px] text-[var(--teal)]">POWER 20+ yr Series</td>
                <td className="py-3 text-[var(--text-secondary)]">
                  Inter-annual standard deviation (σ) of temperature and precipitation across years.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Disclosure */}
      <section className="anchor-card p-6 space-y-4 border-[#7B5CFF]/35">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-display font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
            {isPlantMode && <Leaf className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />}
            <span>AI Transparency & Disclosure</span>
          </h2>
          <AIBadge label="Gemini AI Disclosure" />
        </div>

        <ul className="space-y-2.5 text-sm text-[var(--text-secondary)] list-disc pl-5 leading-relaxed">
          <li>
            <strong className="text-[var(--text-primary)]">Where Gemini is used:</strong> Anchor calls Gemini Flash on the server only for Stage 2 reasoning (explaining compound interactions, generating practical recommendations, summarizing thinking steps, and answering follow-up questions in Ask Anchor / Plant Chat).
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Numeric integrity:</strong> 100% of numeric climate metrics, historical percentages, coordinates, and active hazard distances come directly from NASA APIs and TypeScript calculations—never from the AI model.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Bounded adjustments:</strong> Gemini may adjust the deterministic Stage 1 Data Score by at most <strong>±10 points</strong>, clamped in server code, and must explain each adjustment. Both the Data Score and AI-Adjusted Score are always displayed side by side.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">What the model can get wrong:</strong> Language models can misinterpret local venue microclimates, infrastructure readiness, or rare extreme weather interactions not captured in 0.5° gridded satellite climatology. Always check local short-range forecasts within 5 days of your event.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Graceful fallback:</strong> If the Gemini API key is absent or unavailable, Anchor runs cleanly in deterministic NASA data-only mode.
          </li>
        </ul>
      </section>

      <section className="anchor-card p-6 space-y-2 text-xs text-[var(--text-secondary)]">
        <h2 className="text-sm font-display font-semibold text-[var(--text-primary)]">
          Open Source & Disclaimer
        </h2>
        <p>
          Built for the NASA Space Apps Challenge. Not endorsed by NASA. Released under the MIT License using open public-domain NASA APIs and OpenStreetMap Nominatim.
        </p>
      </section>
    </div>
  );
};
