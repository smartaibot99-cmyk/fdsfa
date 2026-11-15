import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  GitCompare,
  History,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  MyFarmRecord,
  PlanDecisionAction,
  PlanDecisionEvent,
  PlanDecisionReasonCode,
  PortfolioFieldRecord,
  RotationCandidateOption,
} from '../../types/myFarms';
import {
  generateRotationCandidatesForFarm,
  resolveCropThumbnail,
} from '../../lib/myFarmsEngine';

const REASON_LABELS: Record<PlanDecisionReasonCode, string> = {
  water: 'Water supply / conservation',
  cost: 'Input & seed cost',
  equipment: 'Equipment / machinery readiness',
  market: 'Contract / market price',
  management_preference: 'Farm management preference',
  unavailable_crop: 'Crop or seed unavailable',
  agronomic_fit: 'Agronomic / soil fit',
  other: 'Other operational reason',
};

interface PlanDecisionJournalProps {
  farm: MyFarmRecord;
  fields: PortfolioFieldRecord[];
  decisions: PlanDecisionEvent[];
  onRecordDecision: (payload: {
    fieldId: string | null;
    fieldName: string;
    action: PlanDecisionAction;
    candidate: RotationCandidateOption;
    isRecommendedPlan: boolean;
    reasonCode: PlanDecisionReasonCode;
    reasonNote: string;
  }) => Promise<void>;
}

export const PlanDecisionJournal: React.FC<PlanDecisionJournalProps> = ({
  farm,
  fields,
  decisions,
  onRecordDecision,
}) => {
  const [subTab, setSubTab] = useState<'candidates' | 'history'>('candidates');
  const [targetFieldId, setTargetFieldId] = useState<string>('');
  const [modalCandidate, setModalCandidate] = useState<{
    candidate: RotationCandidateOption;
    action: PlanDecisionAction;
    isRecommended: boolean;
  } | null>(null);
  const [reasonCode, setReasonCode] = useState<PlanDecisionReasonCode>('agronomic_fit');
  const [reasonNote, setReasonNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedDiffEvent, setSelectedDiffEvent] = useState<PlanDecisionEvent | null>(null);

  const candidates = useMemo(() => generateRotationCandidatesForFarm(farm), [farm]);
  const topCandidateId = candidates[0]?.id ?? null;

  const farmDecisions = useMemo(
    () =>
      decisions
        .filter((d) => d.farmId === farm.id)
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)),
    [decisions, farm.id]
  );

  const handleConfirmDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCandidate) return;
    setSaving(true);
    try {
      const targetField = fields.find((f) => f.id === targetFieldId) ?? null;
      await onRecordDecision({
        fieldId: targetField ? targetField.id : null,
        fieldName: targetField ? targetField.name : 'Whole Farm',
        action: modalCandidate.action,
        candidate: modalCandidate.candidate,
        isRecommendedPlan: modalCandidate.isRecommended,
        reasonCode,
        reasonNote,
      });
      setModalCandidate(null);
      setReasonNote('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Active Plan vs Top Recommendation Clarity Banner */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
            Active Selected Plan (Farmer Commitment)
          </div>
          {farm.activePlan ? (
            <>
              <div className="text-base font-bold text-[var(--text-primary)] flex flex-wrap items-center gap-2">
                <span>{farm.activePlan.title}</span>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 tabular-nums">
                  · Active v{farm.activePlan.version}
                </span>
                {farm.recommendedPlanTitle && !farm.activePlan.isRecommendedPlan && (
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    · Custom farmer choice (differs from top recommendation)
                  </span>
                )}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                Selected {new Date(farm.activePlan.selectedAt).toLocaleDateString()} by {farm.activePlan.selectedBy} ·{' '}
                {farm.activePlan.cropSequence.map((c) => c.cropName).join(' → ')}
              </div>
            </>
          ) : (
            <div className="text-sm text-[var(--text-secondary)]">
              No active rotation plan selected yet. System recommendations never replace your active choice automatically.
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('candidates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              subTab === 'candidates'
                ? 'bg-[var(--accent)] text-white'
                : 'border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Rotation Candidates ({candidates.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('history')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              subTab === 'history'
                ? 'bg-[var(--accent)] text-white'
                : 'border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Plan History ({farmDecisions.length})
          </button>
        </div>
      </div>

      {/* Compact Recent Change Strip */}
      {farmDecisions[0] && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/40 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <GitCompare className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span>
              Latest journal event:{' '}
              <strong className="text-[var(--text-primary)] uppercase">{farmDecisions[0].action}</strong>{' '}
              “{farmDecisions[0].candidateTitle}” ({REASON_LABELS[farmDecisions[0].reasonCode]})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDiffEvent(farmDecisions[0])}
            className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
          >
            Inspect diff →
          </button>
        </div>
      )}

      {subTab === 'candidates' && (
        <div className="space-y-3">
          {fields.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label htmlFor="rot-field-scope" className="text-[var(--text-secondary)] font-medium">
                Log decision scope:
              </label>
              <select
                id="rot-field-scope"
                value={targetFieldId}
                onChange={(e) => setTargetFieldId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
              >
                <option value="">Whole Farm ({farm.name})</option>
                {fields.map((fl) => (
                  <option key={fl.id} value={fl.id}>{fl.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {candidates.map((cand) => {
              const isActive = farm.activePlan?.planId === cand.id;
              const isTopRanked = cand.id === topCandidateId;
              return (
                <div
                  key={cand.id}
                  className={`rounded-xl border p-4 space-y-3 bg-[var(--bg-surface)] ${
                    isActive ? 'border-emerald-500/60' : 'border-[var(--border)]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">{cand.title}</h4>
                        {isActive && (
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                            · Currently Active Plan
                          </span>
                        )}
                        {isTopRanked && (
                          <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                            · Top Agronomic Fit
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {cand.primaryBenefit} · {cand.soilImpactLabel} · Water impact: {cand.waterDemandImpact}
                      </p>
                    </div>

                    <div className="text-right tabular-nums">
                      <div className="text-sm font-bold text-[var(--text-primary)]">
                        Suitability {cand.suitabilityScore}/100
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        Data confidence {cand.confidencePct}%
                      </div>
                    </div>
                  </div>

                  {cand.warningNote && (
                    <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-200">
                      {cand.warningNote}
                    </div>
                  )}

                  {/* Sequence Strip with authentic crop thumbnails */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {cand.steps.map((st, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-2.5 flex items-start gap-2.5"
                      >
                        <img
                          src={resolveCropThumbnail(st.cropId || st.cropName)}
                          alt={st.cropName}
                          className="w-10 h-10 rounded-md object-cover shrink-0 border border-[var(--border)]"
                        />
                        <div className="min-w-0 text-xs">
                          <div className="text-[10.5px] uppercase tracking-wide text-[var(--text-secondary)]">
                            {st.cycleLabel}
                          </div>
                          <div className="font-semibold text-[var(--text-primary)] truncate">
                            {st.cropName}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                            {st.nitrogenRole.replace('_', ' ')} · {st.waterNeedBand} water
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Decision Action Controls */}
                  <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center justify-end gap-2 text-xs">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => {
                          setReasonCode('agronomic_fit');
                          setModalCandidate({
                            candidate: cand,
                            action: farm.activePlan ? 'replaced' : 'selected',
                            isRecommended: isTopRanked,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 cursor-pointer"
                      >
                        {farm.activePlan ? <RefreshCw className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        {farm.activePlan ? 'Replace Active Plan' : 'Select as Active Plan'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setReasonCode('equipment');
                        setModalCandidate({
                          candidate: cand,
                          action: 'deferred',
                          isRecommended: isTopRanked,
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] font-medium cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Defer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReasonCode('water');
                        setModalCandidate({
                          candidate: cand,
                          action: 'rejected',
                          isRecommended: isTopRanked,
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 font-medium cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'history' && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
          {farmDecisions.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
              No rotation decisions recorded yet. Selecting, deferring, or replacing a plan appends an immutable record here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/45 text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
                    <th className="py-2.5 pl-4 pr-3">Date &amp; Scope</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Prior Plan</th>
                    <th className="py-2.5 px-3">Evaluated / New Plan</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 pl-3 pr-4 text-right">Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                  {farmDecisions.map((ev) => (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedDiffEvent(ev)}
                      className="h-[64px] hover:bg-[var(--bg-elevated)]/40 cursor-pointer"
                    >
                      <td className="py-2.5 pl-4 pr-3 whitespace-nowrap">
                        <div className="font-medium text-[var(--text-primary)] tabular-nums">
                          {new Date(ev.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          {ev.fieldName || 'Whole Farm'} · {ev.actor}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-semibold uppercase text-[var(--text-primary)]">
                        {ev.action}
                      </td>
                      <td className="py-2.5 px-3 max-w-[180px] truncate text-[var(--text-secondary)]">
                        {ev.priorPlan ? `${ev.priorPlan.title} (v${ev.priorPlan.version})` : 'None'}
                      </td>
                      <td className="py-2.5 px-3 max-w-[200px] truncate font-medium text-[var(--text-primary)]">
                        {ev.newPlan ? `${ev.newPlan.title} (v${ev.newPlan.version})` : ev.candidateTitle}
                      </td>
                      <td className="py-2.5 px-3 max-w-[220px]">
                        <div className="font-medium text-[var(--text-primary)] truncate">
                          {REASON_LABELS[ev.reasonCode]}
                        </div>
                        {ev.reasonNote && (
                          <div className="text-[11px] text-[var(--text-secondary)] truncate">
                            {ev.reasonNote}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pl-3 pr-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDiffEvent(ev);
                          }}
                          className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                        >
                          View diff
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Decision Reason Capture Modal */}
      {modalCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
          onClick={() => setModalCandidate(null)}
        >
          <form
            onSubmit={handleConfirmDecision}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[var(--text-primary)] capitalize">
                Record Plan Decision: {modalCandidate.action}
              </h4>
              <button type="button" onClick={() => setModalCandidate(null)} className="p-1 cursor-pointer text-[var(--text-secondary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-3 text-xs">
              <div className="font-semibold text-[var(--text-primary)]">{modalCandidate.candidate.title}</div>
              <div className="text-[var(--text-secondary)] mt-0.5">
                {modalCandidate.action === 'selected' || modalCandidate.action === 'replaced'
                  ? 'Appends a permanent decision entry and updates your Active Selected Plan.'
                  : 'Appends a permanent decision entry while leaving your current Active Selected Plan unchanged.'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Primary decision factor
              </label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value as PlanDecisionReasonCode)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-xs text-[var(--text-primary)]"
              >
                {(Object.keys(REASON_LABELS) as PlanDecisionReasonCode[]).map((k) => (
                  <option key={k} value={k}>{REASON_LABELS[k]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Management note (optional)
              </label>
              <textarea
                rows={3}
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                placeholder="Document reasoning (e.g., irrigation constraint, contract price, seed availability)…"
                className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] text-xs text-[var(--text-primary)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalCandidate(null)}
                className="px-3.5 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Logging…' : 'Confirm & Log Decision'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Diff Detail Drawer */}
      {selectedDiffEvent && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px]"
          onClick={() => setSelectedDiffEvent(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg h-full bg-[var(--bg-surface)] border-l border-[var(--border)] p-5 overflow-y-auto fs-thin-scroll space-y-5"
            role="dialog"
            aria-label="Rotation Plan Diff Detail"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
                  Decision Diff Record · {selectedDiffEvent.action}
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                  {selectedDiffEvent.candidateTitle}
                </h3>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums">
                  {new Date(selectedDiffEvent.timestamp).toLocaleString()} · {selectedDiffEvent.actor}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDiffEvent(null)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-3.5 text-xs space-y-1">
              <div className="font-semibold text-[var(--text-primary)]">
                Factor: {REASON_LABELS[selectedDiffEvent.reasonCode]}
              </div>
              <p className="text-[var(--text-secondary)]">
                {selectedDiffEvent.reasonNote || 'No additional written note attached.'}
              </p>
              {selectedDiffEvent.candidateScoreSnapshot !== null && (
                <div className="text-[11px] text-[var(--text-secondary)] tabular-nums pt-1">
                  Model score at decision time: {selectedDiffEvent.candidateScoreSnapshot}/100
                </div>
              )}
            </div>

            {/* Side-by-side Removed (-) vs Added (+) Comparison (non-color text cues) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/30 p-3 space-y-2.5">
                <div className="font-bold text-[var(--text-secondary)] uppercase tracking-wide text-[11px]">
                  − Prior Plan {selectedDiffEvent.priorPlan ? `(v${selectedDiffEvent.priorPlan.version})` : ''}
                </div>
                {selectedDiffEvent.priorPlan ? (
                  <>
                    <div className="font-semibold text-[var(--text-primary)] line-through opacity-75">
                      {selectedDiffEvent.priorPlan.title}
                    </div>
                    <div className="space-y-2">
                      {selectedDiffEvent.priorPlan.crops.map((c, idx) => (
                        <div key={idx} className="flex items-center gap-2 opacity-75">
                          <img
                            src={resolveCropThumbnail(c.cropId || c.cropName)}
                            alt={c.cropName}
                            className="w-8 h-8 rounded object-cover border border-[var(--border)]"
                          />
                          <div>
                            <div className="text-[10.5px] text-[var(--text-secondary)]">− {c.cycleLabel}</div>
                            <div className="font-medium line-through text-[var(--text-primary)]">{c.cropName}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-[var(--text-secondary)]">No prior active plan.</div>
                )}
              </div>

              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3 space-y-2.5">
                <div className="font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide text-[11px]">
                  + {selectedDiffEvent.newPlan ? `New Active Plan (v${selectedDiffEvent.newPlan.version})` : 'Evaluated Candidate'}
                </div>
                <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{selectedDiffEvent.newPlan?.title || selectedDiffEvent.candidateTitle}</span>
                </div>
                {selectedDiffEvent.newPlan ? (
                  <div className="space-y-2">
                    {selectedDiffEvent.newPlan.crops.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <img
                          src={resolveCropThumbnail(c.cropId || c.cropName)}
                          alt={c.cropName}
                          className="w-8 h-8 rounded object-cover border border-[var(--border)]"
                        />
                        <div>
                          <div className="text-[10.5px] text-emerald-700 dark:text-emerald-300">+ {c.cycleLabel}</div>
                          <div className="font-semibold text-[var(--text-primary)]">{c.cropName}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[var(--text-secondary)]">
                    Candidate was {selectedDiffEvent.action}; active rotation remains unchanged.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
