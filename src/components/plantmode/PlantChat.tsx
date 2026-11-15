import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Send, X } from 'lucide-react';
import { ChatMessage, CropEntry, CropHealthResult, PlaceSelection, PowerClimateResult } from '../../types';
import { askAnchorChat } from '../../services/gemini';
import { AIBadge } from '../AIBadge';

interface PlantChatProps {
  crop: CropEntry;
  location: PlaceSelection;
  power30d: PowerClimateResult | null;
  growScore: CropHealthResult | null;
  onClose: () => void;
}

export const PlantChat: React.FC<PlantChatProps> = ({
  crop,
  location,
  power30d,
  growScore,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const suggestedQuestions = [
    `Can I grow ${crop.name} in ${location.name.split(',')[0]} right now?`,
    `How much rain & sunlight does ${crop.name} need?`,
    `What NASA climate risks affect ${crop.name} this month?`,
  ];

  useEffect(() => {
    setMessages([]);
  }, [crop.id, location.lat, location.lon]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendQuestion = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: q, timestamp: new Date().toISOString() },
    ]);
    setInput('');
    setLoading(true);

    try {
      const context = {
        plant: {
          name: crop.name,
          scientificName: crop.scientificName,
          family: crop.family,
          kind: crop.kind ?? 'crop',
          idealConditions: crop.idealConditions,
          uses: crop.uses,
          benefits: crop.benefits,
          treeDetails: crop.treeDetails,
          nasaMonitoring: crop.nasaMonitoring,
        },
        checkedLocation: location,
        nasaPower30Day: power30d
          ? {
              daysCount: power30d.windowDays.length,
              meanMaxC: power30d.meanMaxC,
              meanMinC: power30d.meanMinC,
              meanPrecipMmPerDay: power30d.meanPrecipMm,
              meanHumidityPct: power30d.meanHumidityPct,
              meanSolarKwhM2: power30d.meanSolarKwhM2,
            }
          : null,
        growScore: growScore
          ? {
              dataScore: growScore.dataScore,
              verdict: growScore.verdict,
              subScores: growScore.subScores,
              tips: growScore.tips,
            }
          : null,
      };

      const res = await askAnchorChat({
        message: q,
        history: messages.map((m) => ({ role: m.role, text: m.text })),
        context,
        mode: 'plant',
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: res.reply,
          timestamp: new Date().toISOString(),
          isFallback: res.isFallback,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-[var(--border)] flex items-center justify-between gap-2 bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            Ask about {crop.name}
          </span>
          <AIBadge />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close plant chat"
          className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-2.5 max-h-60 overflow-y-auto">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-[11px] text-[var(--text-secondary)]">
              Grounded in curated plant biology and live NASA POWER 30-day data for{' '}
              <strong className="text-[var(--text-primary)]">{location.name}</strong>:
            </p>
            <div className="flex flex-col gap-1.5">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendQuestion(q)}
                  className="text-left text-[11px] px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)] text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-2)]" />
            <span>Checking NASA POWER & plant profile...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendQuestion(input);
        }}
        className="p-2.5 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about planting, frost, water..."
          className="flex-1 min-h-[38px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)]"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          aria-label="Send plant question"
          className="w-9 h-9 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center disabled:opacity-45 cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
