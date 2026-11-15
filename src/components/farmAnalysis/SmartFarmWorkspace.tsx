import React, { useEffect, useRef, useState } from 'react';
import { Download, FolderPlus, LayoutGrid, ListChecks, Trash2, Upload } from 'lucide-react';
import {
  EonetFetchResult,
  FarmAnalysisReport,
  FarmGeminiExplanation,
  FarmProfile,
  PowerClimateResult,
} from '../../types';
import {
  createEmptyFarmProfile,
  deleteFarmProfile,
  exportFarmProfilesJson,
  getActiveFarmId,
  loadFarmProfiles,
  parseImportedFarmProfilesJson,
  setActiveFarmId,
  upsertFarmProfile,
} from '../../lib/farmStorage';
import { generateDeterministicFarmAnalysis } from '../../lib/farmAnalysisEngine';
import { getDefaultTargetDate } from '../../lib/format';
import { fetchNasaPowerClimatology } from '../../services/nasaPower';
import { fetchEonetEvents } from '../../services/eonet';
import { explainFarmAnalysis } from '../../services/gemini';
import { useToast } from '../Toast';
import { FarmQuestionnaire } from './FarmQuestionnaire';
import { FarmProfileDashboard } from './FarmProfileDashboard';
import { FarmAnalysisReportView } from './FarmAnalysisReportView';
import { FarmChatDrawer } from './FarmChatDrawer';

type WorkspaceSubView = 'questionnaire' | 'dashboard' | 'report';

export const SmartFarmWorkspace: React.FC = () => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profiles, setProfiles] = useState<FarmProfile[]>(() => {
    const loaded = loadFarmProfiles();
    if (loaded.length > 0) return loaded;
    const starter = createEmptyFarmProfile();
    upsertFarmProfile(starter);
    return [starter];
  });

  const [activeId, setActiveId] = useState<string>(() => {
    const saved = getActiveFarmId();
    const list = loadFarmProfiles();
    if (saved && list.some((p) => p.id === saved)) return saved;
    return list[0]?.id ?? '';
  });

  const activeProfile = profiles.find((p) => p.id === activeId) ?? profiles[0];

  const [subView, setSubView] = useState<WorkspaceSubView>('questionnaire');
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<FarmAnalysisReport | null>(null);
  const [aiExplanation, setAiExplanation] = useState<FarmGeminiExplanation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFallbackReason, setAiFallbackReason] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Sync activeId if profile list changes
  useEffect(() => {
    if (activeProfile && activeProfile.id !== activeId) {
      setActiveId(activeProfile.id);
      setActiveFarmId(activeProfile.id);
    }
  }, [activeProfile, activeId]);

  const handleProfileChange = (next: FarmProfile) => {
    const updatedList = upsertFarmProfile(next);
    setProfiles(updatedList);
  };

  const handleSelectFarm = (id: string) => {
    setActiveId(id);
    setActiveFarmId(id);
    setReport(null);
    setAiExplanation(null);
    setSubView('questionnaire');
  };

  const handleCreateFarm = () => {
    const next = createEmptyFarmProfile(`Farm ${profiles.length + 1}`);
    const updated = upsertFarmProfile(next);
    setProfiles(updated);
    setActiveId(next.id);
    setReport(null);
    setAiExplanation(null);
    setSubView('questionnaire');
    showToast('Created new farm profile.', 'success');
  };

  const handleDeleteFarm = () => {
    if (profiles.length <= 1) {
      const fresh = createEmptyFarmProfile();
      const updated = [fresh];
      deleteFarmProfile(activeProfile.id);
      upsertFarmProfile(fresh);
      setProfiles(updated);
      setActiveId(fresh.id);
      setReport(null);
      setSubView('questionnaire');
      showToast('Reset farm profile.', 'info');
      return;
    }
    const remaining = deleteFarmProfile(activeProfile.id);
    setProfiles(remaining);
    setActiveId(remaining[0].id);
    setReport(null);
    setSubView('questionnaire');
    showToast('Deleted farm profile.', 'info');
  };

  const handleExportProfiles = () => {
    const json = exportFarmProfilesJson(profiles);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anchor-farm-profiles-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported farm profiles JSON.', 'success');
  };

  const handleImportProfiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = parseImportedFarmProfilesJson(text);
      if (imported.length === 0) {
        showToast('No farm profiles found in that JSON file.', 'error');
        return;
      }
      let nextList = profiles;
      for (const item of imported) {
        nextList = upsertFarmProfile(item);
      }
      setProfiles(nextList);
      setActiveId(imported[0].id);
      setActiveFarmId(imported[0].id);
      setReport(null);
      setSubView('dashboard');
      showToast(`Imported ${imported.length} farm profile(s).`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to import JSON.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleGenerateAnalysis = async () => {
    if (generating) return;
    setGenerating(true);
    setAiExplanation(null);
    setAiFallbackReason(null);

    try {
      let power: PowerClimateResult | null = null;
      let eonet: EonetFetchResult | null = null;

      if (activeProfile.location.lat !== null && activeProfile.location.lon !== null) {
        const lat = activeProfile.location.lat;
        const lon = activeProfile.location.lon;
        const refDate = getDefaultTargetDate();
        const [powerRes, eonetRes] = await Promise.allSettled([
          fetchNasaPowerClimatology(lat, lon, refDate, undefined, 'farming'),
          fetchEonetEvents(lat, lon, 300),
        ]);
        if (powerRes.status === 'fulfilled') power = powerRes.value;
        if (eonetRes.status === 'fulfilled') eonet = eonetRes.value;
      }

      const nextReport = generateDeterministicFarmAnalysis(activeProfile, power, eonet);
      setReport(nextReport);
      handleProfileChange({
        ...activeProfile,
        lastReportGeneratedAt: nextReport.generatedAt,
      });
      setSubView('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Asynchronous bounded Gemini explanation layer
      setAiLoading(true);
      const aiRes = await explainFarmAnalysis({
        profile: {
          farmName: activeProfile.location.farmName,
          location: activeProfile.location.locationLabel || activeProfile.location.regionOrAddress,
          area: activeProfile.areaValue ? `${activeProfile.areaValue} ${activeProfile.areaUnit}` : 'Unspecified',
          soil: activeProfile.soil,
          water: activeProfile.water,
          crops: activeProfile.crops,
          planning: activeProfile.planning,
        },
        report: {
          completenessPct: nextReport.completenessPct,
          missingDataSummary: nextReport.missingDataSummary,
          excludedRestrictedCrops: nextReport.excludedRestrictedCrops,
          externalData: {
            powerSummary: nextReport.externalDataStatus.powerSummary,
            eonetSummary: nextReport.externalDataStatus.eonetSummary,
          },
          sections: nextReport.sections,
        },
      });
      if (aiRes.available && aiRes.explanation) {
        setAiExplanation(aiRes.explanation);
      } else {
        setAiFallbackReason(aiRes.reason ?? null);
      }
    } finally {
      setGenerating(false);
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Farm Profile Bar & Sub-View Navigation */}
      <div className="anchor-card p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-2.5">
          <label htmlFor="active-farm-select" className="text-xs font-medium text-[var(--text-secondary)]">
            Active Farm
          </label>
          <select
            id="active-farm-select"
            value={activeProfile.id}
            onChange={(e) => handleSelectFarm(e.target.value)}
            className="min-h-[40px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.location.farmName.trim() || 'Unnamed Farm'}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleCreateFarm}
            className="inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>New Farm</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteFarm}
            title="Delete or reset active farm"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--score-avoid)] text-[var(--text-secondary)] hover:text-[var(--score-avoid)] cursor-pointer"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-view segmented control */}
          <div className="inline-flex p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setSubView('questionnaire')}
              className={`inline-flex items-center gap-1.5 px-3 min-h-[34px] rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                subView === 'questionnaire'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Questionnaire</span>
            </button>
            <button
              type="button"
              onClick={() => setSubView('dashboard')}
              className={`inline-flex items-center gap-1.5 px-3 min-h-[34px] rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                subView === 'dashboard'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Farm Summary</span>
            </button>
            {report && (
              <button
                type="button"
                onClick={() => setSubView('report')}
                className={`inline-flex items-center gap-1.5 px-3 min-h-[34px] rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  subView === 'report'
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>Analysis Report</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportProfiles}
            className="inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Import</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportProfiles}
            className="hidden"
          />
        </div>
      </div>

      {/* Main Workspace View */}
      {subView === 'questionnaire' && (
        <FarmQuestionnaire
          key={activeProfile.id}
          profile={activeProfile}
          onChange={handleProfileChange}
          onSaveProgress={() => {
            handleProfileChange(activeProfile);
            showToast('Saved farm questionnaire progress locally.', 'success');
          }}
          onFinishToDashboard={() => {
            handleProfileChange(activeProfile);
            setSubView('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {subView === 'dashboard' && (
        <FarmProfileDashboard
          key={activeProfile.id}
          profile={activeProfile}
          generating={generating}
          onEditStage={(st) => {
            handleProfileChange({ ...activeProfile, currentStage: st });
            setSubView('questionnaire');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onGenerateAnalysis={handleGenerateAnalysis}
        />
      )}

      {subView === 'report' && report && (
        <FarmAnalysisReportView
          key={activeProfile.id}
          profile={activeProfile}
          report={report}
          aiExplanation={aiExplanation}
          aiLoading={aiLoading}
          aiFallbackReason={aiFallbackReason}
          onEditQuestionnaire={() => setSubView('questionnaire')}
          onBackToSummary={() => setSubView('dashboard')}
          onOpenChat={() => setChatOpen(true)}
          onExportReportJson={() => {
            const payload = JSON.stringify({ profile: activeProfile, report, aiExplanation }, null, 2);
            const blob = new Blob([payload], { type: 'application/json;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `anchor-farm-analysis-${(activeProfile.location.farmName || 'farm')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Exported full farm analysis JSON.', 'success');
          }}
        />
      )}

      <FarmChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        profile={activeProfile}
        report={report}
      />
    </div>
  );
};
