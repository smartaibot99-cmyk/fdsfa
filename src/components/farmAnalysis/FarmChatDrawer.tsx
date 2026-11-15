import React, { useEffect, useRef, useState } from 'react';
import { Leaf, Loader2, Send, X } from 'lucide-react';
import { ChatMessage, FarmAnalysisReport, FarmProfile } from '../../types';
import { askAnchorChat } from '../../services/gemini';
import { AIBadge } from '../AIBadge';

interface FarmChatDrawerProps {
  open: boolean;
  onClose: () => void;
  profile: FarmProfile;
  report: FarmAnalysisReport | null;
}

const FARM_SUGGESTED_QUESTIONS = [
  'Which information gaps matter most on my farm right now?',
  'How do my soil and watering choices interact?',
  'What rotation options avoid my restricted crops?',
  'What should I test before applying fertiliser or lime?',
];

export const FarmChatDrawer: React.FC<FarmChatDrawerProps> = ({
  open,
  onClose,
  profile,
  report,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([]);
  }, [profile.id, report?.generatedAt]);

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
    if (!q || loading) return;

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
        farmProfile: {
          farmName: profile.location.farmName || 'Unnamed Farm',
          location: profile.location.locationLabel || profile.location.regionOrAddress || 'Unspecified',
          coordinates:
            profile.location.lat !== null && profile.location.lon !== null
              ? { lat: profile.location.lat, lon: profile.location.lon }
              : null,
          area: profile.areaValue ? `${profile.areaValue} ${profile.areaUnit}` : 'Unspecified',
          soil: profile.soil,
          water: profile.water,
          crops: profile.crops,
          planning: profile.planning,
        },
        deterministicAnalysis: report
          ? {
              completenessPct: report.completenessPct,
              missingDataSummary: report.missingDataSummary,
              excludedRestrictedCrops: report.excludedRestrictedCrops,
              externalData: {
                powerSummary: report.externalDataStatus.powerSummary,
                eonetSummary: report.externalDataStatus.eonetSummary,
              },
              sections: report.sections.map((s) => ({
                key: s.key,
                title: s.title,
                status: s.status,
                summary: s.summary,
                insufficientNotice: s.insufficientNotice,
                items: s.items.map((it) => ({
                  title: it.title,
                  detail: it.detail,
                  basis: it.basis,
                  missingInfo: it.missingInfo,
                })),
              })),
            }
          : null,
      };

      const res = await askAnchorChat({
        message: q,
        history: messages.map((m) => ({ role: m.role, text: m.text })),
        context,
        mode: 'farm',
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
    <div
      className="fixed inset-0 z-50 flex justify-end no-print"
      role="dialog"
      aria-modal="true"
      aria-label="Ask Anchor about your farm"
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <aside className="relative z-10 w-full max-w-md bg-[var(--bg-surface)] border-l border-[var(--border)] h-full flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
            <h2 className="text-base font-display font-semibold text-[var(--text-primary)]">
              Ask Anchor · Farm Guide
            </h2>
            <AIBadge />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Farm Guide drawer"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border)] text-xs text-[var(--text-secondary)]">
          Answers are grounded strictly in your saved farm profile, deterministic recommendations, and NASA context for{' '}
          <strong className="text-[var(--text-primary)]">
            {profile.location.farmName || 'this farm'}
          </strong>
          .
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--text-secondary)]">
                Ask for plain-language explanations of any section or test priority:
              </p>
              <div className="flex flex-col gap-2">
                {FARM_SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendQuestion(q)}
                    className="text-left text-xs px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-[var(--text-primary)] transition-colors cursor-pointer"
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
              <span>Reviewing saved farm context...</span>
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
            placeholder="Ask about your soil, water, rotation..."
            className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
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
