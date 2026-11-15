import React, { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { ChatMessage, CropEntry, CropHealthResult, PowerClimateResult } from '../../types';
import { askAnchorChat } from '../../services/gemini';
import { AIBadge } from '../AIBadge';

interface PlantChatProps {
  crop: CropEntry;
  power30d: PowerClimateResult | null;
  health: CropHealthResult | null;
}

export const PlantChat: React.FC<PlantChatProps> = ({ crop, power30d, health }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestions = [
    `When should I plant ${crop.name}?`,
    'Are current NASA temperatures inside the ideal range?',
    'What NASA satellites monitor this crop?',
  ];

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `pu-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await askAnchorChat({
        message: q,
        history: messages.map((m) => ({ role: m.role, text: m.text })),
        context: {
          cropProfile: crop,
          recent30DayNasaPower: power30d
            ? {
                meanMaxC: power30d.meanMaxC,
                meanMinC: power30d.meanMinC,
                meanPrecipMm: power30d.meanPrecipMm,
                meanHumidityPct: power30d.meanHumidityPct,
                meanSolarKwhM2: power30d.meanSolarKwhM2,
              }
            : null,
          cropHealthScore: health,
        },
        mode: 'plant',
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `pa-${Date.now()}`,
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--text-primary)]">
          Ask about {crop.name}
        </span>
        <AIBadge />
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="text-left text-[11px] px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent-2)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
              m.role === 'user'
                ? 'bg-[var(--accent)] text-white ml-6'
                : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] mr-4'
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-2)]" />
            <span>Reading NASA & crop profile...</span>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${crop.name}...`}
          className="flex-1 min-h-[40px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          aria-label="Ask about plant"
          className="w-10 h-10 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center disabled:opacity-45 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
