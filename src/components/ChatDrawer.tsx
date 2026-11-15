import React, { useEffect, useRef, useState } from 'react';
import { Leaf, Send, X, Loader2 } from 'lucide-react';
import { AnchorAnalysis, ChatMessage } from '../types';
import { askAnchorChat } from '../services/gemini';
import { useMode } from '../context/ModeContext';
import { AIBadge } from './AIBadge';

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  analysis: AnchorAnalysis | null;
}

const SPACE_SUGGESTED_QUESTIONS = [
  'What is the biggest weather risk here?',
  'Which NASA datasets support this score?',
  'How reliable is the rainfall history for this date?',
  'What backup plans should I prepare?',
];

const PLANT_SUGGESTED_QUESTIONS = [
  'Is this soil & rainfall window safe for planting?',
  'Which frost or heat risks could stress seedlings?',
  'How much irrigation might my field need?',
  'Which NASA datasets support this Grow Score?',
];

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onClose, analysis }) => {
  const { isPlantMode } = useMode();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const suggestedQuestions = isPlantMode ? PLANT_SUGGESTED_QUESTIONS : SPACE_SUGGESTED_QUESTIONS;

  useEffect(() => {
    setMessages([]);
  }, [analysis?.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!open) return null;

  const sendQuestion = async (text: string) => {
    const q = text.trim();
    if (!q || !analysis || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const context = {
        place: analysis.place,
        targetDate: analysis.targetDate,
        endDate: analysis.endDate,
        activity: analysis.activityId,
        finalScore: analysis.finalScore,
        dataScore: analysis.deterministic.dataScore,
        verdict: analysis.finalVerdict,
        subScores: analysis.deterministic.subScores,
        powerMeans: analysis.power
          ? {
              yearsAnalyzed: analysis.power.yearsAnalyzed,
              meanMaxC: analysis.power.meanMaxC,
              meanMinC: analysis.power.meanMinC,
              meanPrecipMm: analysis.power.meanPrecipMm,
              meanWindMs: analysis.power.meanWindMs,
              meanHumidityPct: analysis.power.meanHumidityPct,
            }
          : null,
        nearbyEvents: analysis.eonet?.nearbyEvents ?? [],
        dataGaps: analysis.ai?.dataGaps ?? analysis.deterministic.dataGaps,
      };

      const res = await askAnchorChat({
        message: q,
        history: messages.map((m) => ({ role: m.role, text: m.text })),
        context,
        mode: 'anchor',
      });

      const botMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: res.reply,
        timestamp: new Date().toISOString(),
        isFallback: res.isFallback,
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end no-print" role="dialog" aria-modal="true" aria-label="Ask Anchor chat">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <aside className="relative z-10 w-full max-w-md bg-[var(--bg-surface)] border-l border-[var(--border)] h-full flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isPlantMode && <Leaf className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />}
            <h2 className="text-base font-display font-semibold text-[var(--text-primary)]">
              {isPlantMode ? 'Ask Field Guide' : 'Ask Anchor'}
            </h2>
            <AIBadge />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Ask Anchor drawer"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border)] text-xs text-[var(--text-secondary)]">
          Grounded strictly in NASA POWER & EONET data for{' '}
          <strong className="text-[var(--text-primary)]">{analysis?.place.name}</strong> on{' '}
          <span className="font-mono">{analysis?.targetDate}</span>.
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--text-secondary)]">
                Ask any question about this score or try a suggested prompt:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendQuestion(q)}
                    className="text-left text-xs px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-[var(--text-primary)] transition-colors cursor-pointer"
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
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-2)]" />
              <span>Checking NASA dataset context...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(input);
          }}
          className="p-4 border-t border-[var(--border)] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about rainfall, heat, hazards..."
            className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || !analysis}
            aria-label="Send message"
            className="w-11 h-11 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center disabled:opacity-45 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </aside>
    </div>
  );
};
