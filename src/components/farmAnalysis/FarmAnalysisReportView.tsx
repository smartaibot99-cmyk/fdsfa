import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Edit3,
  Loader2,
  MessageSquare,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { FarmAnalysisReport, FarmGeminiExplanation, FarmProfile } from '../../types';
import { AIBadge } from '../AIBadge';
import { DataBadge } from '../DataBadge';

interface FarmAnalysisReportViewProps {
  profile: FarmProfile;
  report: FarmAnalysisReport;
  aiExplanation: FarmGeminiExplanation | null;
  aiLoading: boolean;
  aiFallbackReason: string | null;
  onEditQuestionnaire: () => void;
  onBackToSummary: () => void;
  onOpenChat: () => void;
  onExportReportJson: () => void;
}

export const FarmAnalysisReportView: React.FC<FarmAnalysisReportViewProps> = ({
  profile,
  report,
  aiExplanation,
  aiLoading,
  aiFallbackReason,
  onEditQuestionnaire,
  onBackToSummary,
  onOpenChat,
  onExportReportJson,
}) => {
  const [expandedProvenance, setExpandedProvenance] = useState<Record<string, boolean>>({});

  const toggleItemProv = (key: string) => {
    setExpandedProvenance((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const highlightBySection = new Map(
    (aiExplanation?.sectionHighlights ?? []).map((h) => [h.sectionKey.toUpperCase(), h.plainLanguageExplanation])
  );

  return (
    <div className="space-y-6">
      {/* Report Top Summary Strip */}
      <div className="anchor-card p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono text-[var(--teal)]">
              Deterministic Farm Analysis · Generated {new Date(report.generatedAt).toLocaleString()}
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[var(--text-primary)]">
              {report.farmName}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Profile input completeness:{' '}
              <span className="font-mono font-semibold tabular-nums text-[var(--text-primary)]">
                {report.completenessPct}%
                {report.completenessAnswered !== undefined && report.completenessTotal !== undefined
                  ? ` (${report.completenessAnswered}/${report.completenessTotal} fields)`
                  : ''}
              </span>{' '}
              · Restricted crops excluded:{' '}
              <span className="font-medium text-[var(--text-primary)]">
                {report.excludedRestrictedCrops.length > 0
                  ? report.excludedRestrictedCrops.join(', ')
                  : 'None'}
              </span>
            </p>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Completeness reflects questionnaire input coverage only — not scientific certainty, data quality, or lab measurement validity.
            </p>
            {report.completenessByCategory && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5 text-[11px] font-mono text-[var(--text-secondary)]">
                <span>Farm {report.completenessByCategory.farm.pct}%</span>
                <span>Soil {report.completenessByCategory.soil.pct}%</span>
                <span>Water {report.completenessByCategory.water.pct}%</span>
                <span>Crops {report.completenessByCategory.crops.pct}%</span>
                <span>Priorities {report.completenessByCategory.priorities.pct}%</span>
                <span>Horizon {report.completenessByCategory.horizon.pct}%</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              type="button"
              onClick={onBackToSummary}
              className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)] cursor-pointer"
            >
              <span>Profile Cards</span>
            </button>
            <button
              type="button"
              onClick={onEditQuestionnaire}
              className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)] cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Edit Answers</span>
            </button>
            <button
              type="button"
              onClick={onExportReportJson}
              className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onOpenChat}
              className="inline-flex items-center gap-1.5 px-4 min-h-[40px] rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-95 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Ask Anchor about my farm</span>
            </button>
          </div>
        </div>

        {/* NASA External Data Grounding Bar */}
        <div className="pt-3 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-[var(--bg-elevated)] p-3.5 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[var(--text-primary)]">Regional Climate Context</span>
              <DataBadge dataset="NASA POWER" />
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {report.externalDataStatus.powerSummary ??
                (report.externalDataStatus.hasCoordinates
                  ? 'NASA POWER regional data could not be reached for these coordinates.'
                  : 'No coordinates provided — regional NASA POWER climate data was not fetched.')}
            </p>
          </div>

          <div className="rounded-xl bg-[var(--bg-elevated)] p-3.5 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[var(--text-primary)]">Nearby Natural Hazards</span>
              <DataBadge dataset="NASA EONET v3" />
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {report.externalDataStatus.eonetSummary ??
                (report.externalDataStatus.hasCoordinates
                  ? 'NASA EONET hazard feed unavailable.'
                  : 'No coordinates provided — 300 km hazard scan was not run.')}
            </p>
          </div>
        </div>

        {(report.missingDataSummary.length > 0 || (report.measurementCaveats && report.measurementCaveats.length > 0)) && (
          <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--score-caution)]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Flagged data &amp; measurement gaps ({report.missingDataSummary.length})</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {report.missingDataSummary.join(' · ')}
            </p>
          </div>
        )}
      </div>

      {/* Gemini Plain-Language Explanation Card (Strictly Separated from Deterministic Math) */}
      <section className="anchor-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-display font-semibold text-[var(--text-primary)]">
              Plain-Language Summary
            </h3>
            <AIBadge label="AI Explanation" />
          </div>
          <span className="text-[11px] font-mono text-[var(--text-secondary)]">
            Explains deterministic findings only · Cannot override rules or invent data
          </span>
        </div>

        {aiLoading ? (
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] py-2">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-2)]" />
            <span>Preparing plain-language summary from your saved profile and deterministic findings...</span>
          </div>
        ) : aiExplanation ? (
          <div className="space-y-4 text-sm">
            <p className="text-[var(--text-primary)] leading-relaxed">
              {aiExplanation.plainLanguageSummary}
            </p>
            <div className="pt-3 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-[var(--text-secondary)]">Profile Recap</div>
                <p className="text-[var(--text-primary)] leading-relaxed">
                  {aiExplanation.questionnaireRecap}
                </p>
              </div>
              {aiExplanation.questionsForLocalAdvisor.length > 0 && (
                <div className="space-y-1">
                  <div className="font-semibold text-[var(--text-secondary)]">
                    Questions for a Local Agronomist / Soil Lab
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[var(--text-primary)]">
                    {aiExplanation.questionsForLocalAdvisor.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--text-secondary)]">
            {aiFallbackReason ||
              'Live AI summary is unavailable. Every deterministic section below remains complete and grounded in your inputs and NASA data.'}
          </p>
        )}
      </section>

      {/* Sections A through H */}
      <div className="space-y-5">
        {report.sections.map((section) => {
          const aiSectionNote = highlightBySection.get(section.key);
          const statusLabel =
            section.status === 'grounded'
              ? 'Evidence-supported'
              : section.status === 'partial'
                ? 'Partial evidence'
                : 'Insufficient data';

          return (
            <section key={section.key} className="anchor-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="text-lg font-display font-bold text-[var(--text-primary)]">
                    {section.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{section.summary}</p>
                </div>
                <span
                  className={`text-xs font-mono font-semibold shrink-0 ${
                    section.status === 'grounded'
                      ? 'text-[var(--score-excellent)]'
                      : section.status === 'partial'
                        ? 'text-[var(--score-caution)]'
                        : 'text-[var(--score-avoid)]'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>

              {section.insufficientNotice && (
                <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3.5 flex items-start gap-2 text-xs text-[var(--score-caution)]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{section.insufficientNotice}</span>
                </div>
              )}

              {aiSectionNote && (
                <div className="rounded-xl bg-[var(--bg-elevated)] p-3.5 text-xs text-[var(--text-primary)] leading-relaxed">
                  <span className="font-semibold text-[var(--accent-2)]">Plain-language note: </span>
                  {aiSectionNote}
                </div>
              )}

              <div className="divide-y divide-[var(--border)]">
                {section.items.map((item, idx) => {
                  const key = `${section.key}-${idx}`;
                  const openProv = Boolean(expandedProvenance[key]);
                  return (
                    <div key={key} className="py-3.5 first:pt-1 last:pb-1 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="font-semibold text-sm text-[var(--text-primary)]">
                          {item.title}
                        </div>
                        <span className="text-[11px] font-mono text-[var(--teal)] shrink-0">
                          Basis: {item.basis}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
                        {item.detail}
                      </p>

                      <button
                        type="button"
                        onClick={() => toggleItemProv(key)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent)] hover:underline cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{openProv ? 'Hide evidence & missing data' : 'Show evidence & missing data'}</span>
                        {openProv ? (
                          <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                      </button>

                      {openProv && (
                        <div className="rounded-xl bg-[var(--bg-elevated)] p-3.5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="font-semibold text-[var(--text-secondary)]">Why generated</div>
                            <div className="text-[var(--text-primary)] mt-0.5">{item.whyGenerated}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--text-secondary)]">Supporting farm info</div>
                            <div className="text-[var(--text-primary)] mt-0.5">
                              {item.supportingFarmInfo.length > 0
                                ? item.supportingFarmInfo.join(' · ')
                                : 'None recorded'}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--text-secondary)]">Supporting NASA / external data</div>
                            <div className="text-[var(--text-primary)] mt-0.5">
                              {item.supportingExternalData.length > 0
                                ? item.supportingExternalData.join(' · ')
                                : 'Not applicable / no coordinates'}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--text-secondary)]">Missing info & testing</div>
                            <div className="text-[var(--text-primary)] mt-0.5">
                              {item.missingInfo.length > 0 ? item.missingInfo.join(' · ') : 'None flagged'}
                              {item.furtherTestingNeeded ? ` — Next step: ${item.furtherTestingNeeded}` : ''}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Provenance Footer Note */}
      <div className="text-xs text-[var(--text-secondary)] text-center pb-2">
        Anchor Smart Farm Analysis distinguishes farmer-reported inputs ({profile.location.farmName || 'this farm'}) from NASA Earth observation climatology and general agronomy knowledge. Unmeasured values are never fabricated.
      </div>
    </div>
  );
};
