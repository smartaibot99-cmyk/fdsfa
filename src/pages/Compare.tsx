import React, { useEffect, useState } from 'react';
import { Leaf, Loader2, Plus, Search, Trash2, Trophy } from 'lucide-react';
import {
  ActivityPresetId,
  AnchorAnalysis,
  CompareSlot,
  PlaceSelection,
} from '../types';
import { ACTIVITY_LIST, ACTIVITY_PRESETS } from '../lib/weights';
import { computeDeterministicScore } from '../lib/scoring';
import { getDefaultTargetDate } from '../lib/format';
import { fetchNasaPowerClimatology } from '../services/nasaPower';
import { fetchEonetEvents } from '../services/eonet';
import { streamAnchorGeminiScore } from '../services/gemini';
import { searchPlaces } from '../services/geocode';
import { useMode } from '../context/ModeContext';
import { ScoreGauge } from '../components/ScoreGauge';
import { ErrorCard } from '../components/ErrorCard';
import { ScoreCardSkeleton } from '../components/Skeleton';

const INITIAL_SLOTS: CompareSlot[] = [
  {
    id: 'slot-1',
    place: {
      name: 'Austin, TX',
      displayName: 'Austin, Texas, United States',
      lat: 30.2672,
      lon: -97.7431,
    },
    targetDate: getDefaultTargetDate(),
    activityId: 'outdoor_event',
  },
  {
    id: 'slot-2',
    place: {
      name: 'Lisbon, Portugal',
      displayName: 'Lisbon, Portugal',
      lat: 38.7223,
      lon: -9.1393,
    },
    targetDate: getDefaultTargetDate(),
    activityId: 'outdoor_event',
  },
];

export const Compare: React.FC = () => {
  const { isPlantMode } = useMode();
  const [slots, setSlots] = useState<CompareSlot[]>(INITIAL_SLOTS);
  const [queries, setQueries] = useState<Record<string, string>>({
    'slot-1': 'Austin, TX',
    'slot-2': 'Lisbon, Portugal',
  });
  const [dropdowns, setDropdowns] = useState<Record<string, PlaceSelection[]>>({});

  const evaluateSlot = async (slot: CompareSlot) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === slot.id ? { ...s, loading: true, error: undefined } : s))
    );
    try {
      const [power, eonet] = await Promise.all([
        fetchNasaPowerClimatology(slot.place.lat, slot.place.lon, slot.targetDate, undefined, slot.activityId),
        fetchEonetEvents(slot.place.lat, slot.place.lon, 300),
      ]);
      const weights = { ...ACTIVITY_PRESETS[slot.activityId].defaultWeights };
      const det = computeDeterministicScore(power, eonet, slot.activityId, weights);

      let aiOut = null;
      let aiAvailable = false;
      let aiNotice: string | undefined;

      await streamAnchorGeminiScore(
        {
          place: slot.place,
          targetDate: slot.targetDate,
          activityId: slot.activityId,
          deterministic: det,
          power,
          nearbyEvents: eonet.nearbyEvents,
        },
        {
          onThoughtChunk: () => {},
          onResult: (res) => {
            aiOut = res;
            aiAvailable = true;
          },
          onFallback: (reason) => {
            aiNotice = reason;
          },
        }
      );

      const finalAnalysis: AnchorAnalysis = {
        id: `cmp-${slot.id}-${Date.now()}`,
        place: slot.place,
        targetDate: slot.targetDate,
        activityId: slot.activityId,
        weights,
        power,
        eonet,
        deterministic: det,
        ai: aiOut,
        aiThoughtSummary: '',
        aiAvailable,
        aiFallbackNotice: aiNotice,
        finalScore: aiOut ? (aiOut as any).anchorScore : det.dataScore,
        finalVerdict: aiOut ? (aiOut as any).verdict : det.verdict,
        finalConfidence: aiOut ? (aiOut as any).confidence : det.confidence,
        createdAt: new Date().toISOString(),
      };

      setSlots((prev) =>
        prev.map((s) =>
          s.id === slot.id ? { ...s, loading: false, analysis: finalAnalysis } : s
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to evaluate location';
      setSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, loading: false, error: msg } : s))
      );
    }
  };

  useEffect(() => {
    INITIAL_SLOTS.forEach((s) => evaluateSlot(s));
  }, []);

  const handleAddSlot = () => {
    if (slots.length >= 3) return;
    const id = `slot-${Date.now()}`;
    const newSlot: CompareSlot = {
      id,
      place: {
        name: 'Kyoto, Japan',
        displayName: 'Kyoto, Japan',
        lat: 35.0116,
        lon: 135.7681,
      },
      targetDate: getDefaultTargetDate(),
      activityId: 'outdoor_event',
    };
    setSlots((prev) => [...prev, newSlot]);
    setQueries((prev) => ({ ...prev, [id]: newSlot.place.name }));
    evaluateSlot(newSlot);
  };

  const handleSearchBlurOrEnter = async (slotId: string) => {
    const q = queries[slotId]?.trim();
    if (!q || q.length < 2) return;
    try {
      const res = await searchPlaces(q);
      setDropdowns((prev) => ({ ...prev, [slotId]: res }));
    } catch {
      // Ignore
    }
  };

  const completed = slots.filter((s) => s.analysis);
  const topSlot =
    completed.length > 1
      ? completed.reduce((best, curr) =>
          (curr.analysis?.finalScore ?? 0) > (best.analysis?.finalScore ?? 0) ? curr : best
        )
      : null;

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)] inline-flex items-center gap-2">
            {isPlantMode && <Leaf className="w-6 h-6 text-[var(--accent)]" aria-hidden="true" />}
            <span>{isPlantMode ? 'Compare Fields & Planting Windows' : 'Compare Locations & Dates'}</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Evaluate up to 3 candidate {isPlantMode ? 'fields or planting dates' : 'places or dates'} side by side using 20+ years of NASA POWER climatology and EONET hazards.
          </p>
        </div>

        {slots.length < 3 && (
          <button
            type="button"
            onClick={handleAddSlot}
            className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-[var(--accent)] text-white text-sm font-medium shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isPlantMode ? 'Add 3rd Field' : 'Add 3rd Location'}</span>
          </button>
        )}
      </div>

      {topSlot?.analysis && (
        <div className="anchor-card p-4 border-[#22C55E]/40 bg-[#22C55E]/5 flex items-center gap-3 text-sm">
          <Trophy className="w-5 h-5 text-[#22C55E] shrink-0" aria-hidden="true" />
          <span className="text-[var(--text-primary)]">
            Highest suitability: <strong>{topSlot.place.name}</strong> ({topSlot.targetDate}) with a{' '}
            {isPlantMode ? 'Grow Score' : 'Anchor Score'} of{' '}
            <strong className="font-mono">{topSlot.analysis.finalScore}/100</strong> ({topSlot.analysis.finalVerdict}).
          </span>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-6 ${slots.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {slots.map((slot, index) => (
          <div key={slot.id} className="space-y-4">
            <div className="anchor-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--text-secondary)]">
                  Option 0{index + 1}
                </span>
                {slots.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setSlots((prev) => prev.filter((s) => s.id !== slot.id))}
                    aria-label="Remove location"
                    className="p-1.5 text-[var(--text-secondary)] hover:text-[#EF4444] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="relative flex gap-2">
                <input
                  type="text"
                  value={queries[slot.id] ?? slot.place.name}
                  onChange={(e) => setQueries((prev) => ({ ...prev, [slot.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchBlurOrEnter(slot.id);
                    }
                  }}
                  placeholder="Search place..."
                  aria-label={`Location ${index + 1}`}
                  className="flex-1 min-h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => handleSearchBlurOrEnter(slot.id)}
                  aria-label="Lookup place"
                  className="px-3 min-h-[42px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--accent)] cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>

                {dropdowns[slot.id] && dropdowns[slot.id].length > 0 && (
                  <ul className="absolute left-0 right-0 top-12 z-20 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xl max-h-44 overflow-y-auto divide-y divide-[var(--border)]">
                    {dropdowns[slot.id].map((p, idx) => (
                      <li key={idx}>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...slot, place: p };
                            setSlots((prev) => prev.map((s) => (s.id === slot.id ? updated : s)));
                            setQueries((prev) => ({ ...prev, [slot.id]: p.name }));
                            setDropdowns((prev) => ({ ...prev, [slot.id]: [] }));
                            evaluateSlot(updated);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] cursor-pointer"
                        >
                          <div className="font-medium">{p.name}</div>
                          <div className="text-[11px] text-[var(--text-secondary)] truncate">{p.displayName}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={slot.targetDate}
                  onChange={(e) => {
                    const updated = { ...slot, targetDate: e.target.value };
                    setSlots((prev) => prev.map((s) => (s.id === slot.id ? updated : s)));
                  }}
                  aria-label={`Target date ${index + 1}`}
                  className="min-h-[42px] px-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)]"
                />
                <select
                  value={slot.activityId}
                  onChange={(e) => {
                    const updated = { ...slot, activityId: e.target.value as ActivityPresetId };
                    setSlots((prev) => prev.map((s) => (s.id === slot.id ? updated : s)));
                  }}
                  aria-label={`Activity ${index + 1}`}
                  className="min-h-[42px] px-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)]"
                >
                  {ACTIVITY_LIST.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => evaluateSlot(slot)}
                disabled={slot.loading}
                className="w-full min-h-[42px] rounded-xl bg-[var(--accent)] text-white text-xs font-medium inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {slot.loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{slot.loading ? 'Evaluating...' : 'Compare'}</span>
              </button>
            </div>

            {slot.loading && <ScoreCardSkeleton />}

            {slot.error && (
              <ErrorCard
                title={`Failed to score ${slot.place.name}`}
                message={slot.error}
                onRetry={() => evaluateSlot(slot)}
              />
            )}

            {!slot.loading && slot.analysis && (
              <div className="space-y-4">
                <ScoreGauge
                  label={slot.place.name}
                  score={slot.analysis.finalScore}
                  dataScore={slot.analysis.deterministic.dataScore}
                  verdict={slot.analysis.finalVerdict}
                  confidence={slot.analysis.finalConfidence}
                  aiAvailable={slot.analysis.aiAvailable}
                  aiFallbackNotice={slot.analysis.aiFallbackNotice}
                />

                <div className="anchor-card p-5 space-y-2.5">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    Sub-Score Breakdown
                  </div>
                  {slot.analysis.deterministic.subScores.map((sub) => (
                    <div key={sub.key} className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">{sub.label}</span>
                      <span className="font-mono tabular-nums text-[var(--text-primary)]">
                        {sub.suitabilityScore !== null ? `${sub.suitabilityScore}/100` : 'No data'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
