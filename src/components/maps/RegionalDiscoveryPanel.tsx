import React, { useState } from 'react';
import {
  Ban,
  CheckCircle2,
  EyeOff,
  Lock,
  MessageSquare,
  Send,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { FarmProfile } from '../../types';
import {
  DiscoveryConsentSettings,
  DiscoveryMessageItem,
  PublicDiscoveryProfile,
  RegionalCityAggregate,
} from '../../types/maps';

interface RegionalDiscoveryPanelProps {
  currentFarm: FarmProfile | undefined;
  regions: RegionalCityAggregate[];
  profiles: PublicDiscoveryProfile[];
  myConsent: DiscoveryConsentSettings | null;
  messages: DiscoveryMessageItem[];
  selectedCityKey: string | null;
  loading: boolean;
  onSelectCity: (cityKey: string) => void;
  onSaveOptIn: (payload: {
    optedIn: boolean;
    displayAlias: string;
    cityName: string;
    shareCrops: boolean;
    shareSoilTexture: boolean;
    shareWaterMethod: boolean;
    acceptsMessages: boolean;
  }) => Promise<void>;
  onRevokeOptIn: () => Promise<void>;
  onSendMessage: (toPublicId: string, text: string) => Promise<void>;
  onBlockProfile: (publicId: string) => Promise<void>;
}

export const RegionalDiscoveryPanel: React.FC<RegionalDiscoveryPanelProps> = ({
  currentFarm,
  regions,
  profiles,
  myConsent,
  messages,
  selectedCityKey,
  loading,
  onSelectCity,
  onSaveOptIn,
  onRevokeOptIn,
  onSendMessage,
  onBlockProfile,
}) => {
  const [alias, setAlias] = useState(
    myConsent?.displayAlias || (currentFarm?.location.farmName ? `${currentFarm.location.farmName} (City Alias)` : 'Valley Grower')
  );
  const [cityName, setCityName] = useState(
    myConsent?.cityName || currentFarm?.location.locationLabel.split(',').slice(0, 2).join(',').trim() || 'Ames, IA'
  );
  const [shareCrops, setShareCrops] = useState(myConsent?.shareCrops ?? true);
  const [shareSoil, setShareSoil] = useState(myConsent?.shareSoilTexture ?? true);
  const [shareWater, setShareWater] = useState(myConsent?.shareWaterMethod ?? false);
  const [acceptsMsg, setAcceptsMsg] = useState(myConsent?.acceptsMessages ?? true);
  const [savingOptIn, setSavingOptIn] = useState(false);

  const [msgTarget, setMsgTarget] = useState<PublicDiscoveryProfile | null>(null);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [reportedIds, setReportedIds] = useState<string[]>([]);

  const activeRegion =
    regions.find((r) => r.cityKey === selectedCityKey) ?? regions[0] ?? null;

  const cityProfiles = activeRegion
    ? profiles.filter((p) => p.cityKey === activeRegion.cityKey)
    : profiles;

  return (
    <div className="space-y-3.5 text-xs text-slate-200">
      {/* Mandatory Privacy Disclosure Banner */}
      <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-400/30 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-teal-300">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>Privacy-Filtered City Cohort Network</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Public discovery exposes city-level aggregates only. Exact farm coordinates, field polygons, and private contact details are stripped server-side and never published.
        </p>
      </div>

      {/* City Selector */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Participating Cities ({regions.length})
        </div>
        {loading ? (
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400">
            Loading regional cohorts...
          </div>
        ) : regions.length === 0 ? (
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400">
            No cities have participating public farms yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1.5">
            {regions.map((reg) => {
              const isSel = activeRegion?.cityKey === reg.cityKey;
              return (
                <button
                  key={reg.cityKey}
                  type="button"
                  onClick={() => onSelectCity(reg.cityKey)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-colors cursor-pointer ${
                    isSel
                      ? 'bg-teal-500/15 border-teal-400/50 text-white'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs">{reg.cityName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        reg.meetsThreshold
                          ? 'bg-teal-500/20 text-teal-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {reg.cohortCount} farms
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-400 mt-0.5">{reg.regionLabel}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Compare My Farm with Region — Strict Cohort Threshold Enforcement */}
      {activeRegion && (
        <div className="p-3 rounded-xl bg-[#0D192E] border border-[#243656] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">
              {activeRegion.cityName} · Regional Comparison
            </span>
            <span className="text-[10px] text-slate-400">
              Min cohort: ≥ {activeRegion.minCohortThreshold}
            </span>
          </div>

          {!activeRegion.meetsThreshold ? (
            <div className="p-2.5 rounded-lg bg-amber-950/45 border border-amber-400/35 text-amber-200 flex items-start gap-2">
              <EyeOff className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>Not enough shared data to provide a reliable regional comparison.</strong>{' '}
                Only {activeRegion.cohortCount} farm(s) opted in; at least {activeRegion.minCohortThreshold} are required so individual farm metrics cannot be inferred.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-white/[0.04] border border-white/10">
                  <div className="text-[10px] text-slate-400">Sample Size Band</div>
                  <div className="font-semibold text-teal-300 mt-0.5">
                    {activeRegion.cohortCount} participating farms
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.04] border border-white/10">
                  <div className="text-[10px] text-slate-400">Mean Climate Score</div>
                  <div className="font-semibold text-white mt-0.5">
                    {activeRegion.meanClimateScore !== null
                      ? `${activeRegion.meanClimateScore}/100`
                      : 'N/A'}
                  </div>
                </div>
              </div>
              {activeRegion.commonCrops.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-400 mb-1">Common Shared Crops</div>
                  <div className="flex flex-wrap gap-1">
                    {activeRegion.commonCrops.map((crop) => (
                      <span
                        key={crop}
                        className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-[10.5px] text-emerald-200"
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-[10px] text-slate-400 border-t border-white/10 pt-1.5">
                {activeRegion.observationWindow} · {activeRegion.methodologyNote}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Opted-In Farmer Profiles (Explicitly Shared Fields Only) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Opted-In Profiles ({cityProfiles.length})
          </span>
        </div>
        {cityProfiles.length === 0 ? (
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] text-slate-400">
            No visible opted-in profiles for this city.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 fs-thin-scroll">
            {cityProfiles.map((prof) => (
              <div
                key={prof.publicId}
                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{prof.displayAlias}</div>
                    <div className="text-[10.5px] text-slate-400">
                      {prof.cityName} · {prof.farmScaleBand}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {prof.acceptsMessages && (
                      <button
                        type="button"
                        onClick={() => setMsgTarget(prof)}
                        title="Send permission-aware inquiry"
                        className="p-1.5 rounded-lg bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onBlockProfile(prof.publicId)}
                      title="Block profile"
                      className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-rose-300 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportedIds((p) => [...p, prof.publicId])}
                      title="Report inappropriate profile"
                      className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-amber-300 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {reportedIds.includes(prof.publicId) && (
                  <div className="text-[10px] text-amber-300">
                    Reported for moderation review. You can also block this profile.
                  </div>
                )}
                {prof.sharedCrops.length > 0 && (
                  <div className="text-[10.5px] text-slate-300">
                    <span className="text-slate-400">Crops:</span> {prof.sharedCrops.join(', ')}
                  </div>
                )}
                {(prof.soilTextureShared || prof.irrigationTypeShared) && (
                  <div className="text-[10.5px] text-slate-400">
                    {[prof.soilTextureShared, prof.irrigationTypeShared].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inline Permission-Aware Message Composer */}
      {msgTarget && (
        <div className="p-2.5 rounded-xl bg-[#0D1A30] border border-teal-400/40 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-teal-200">
            <span>Message {msgTarget.displayAlias}</span>
            <button
              type="button"
              onClick={() => setMsgTarget(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              ×
            </button>
          </div>
          <textarea
            rows={2}
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            placeholder="Share a rotation question (no private contact info exposed)..."
            className="w-full p-2 rounded-lg bg-[#060D1A] border border-white/15 text-xs text-white focus:border-teal-400 focus:outline-none"
          />
          <button
            type="button"
            disabled={sendingMsg || msgText.trim().length < 2}
            onClick={async () => {
              setSendingMsg(true);
              try {
                await onSendMessage(msgTarget.publicId, msgText.trim());
                setMsgText('');
                setMsgTarget(null);
              } finally {
                setSendingMsg(false);
              }
            }}
            className="w-full py-1.5 rounded-lg bg-teal-500 text-slate-950 font-semibold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendingMsg ? 'Sending...' : 'Send Permissioned Message'}</span>
          </button>
        </div>
      )}

      {messages.length > 0 && (
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
          <div className="text-[10.5px] font-semibold text-slate-300">
            Recent Regional Inquiries ({messages.length})
          </div>
          {messages.slice(-3).map((m) => (
            <div key={m.id} className="text-[10.5px] text-slate-400 border-t border-white/5 pt-1">
              <span className="text-teal-300 font-medium">{m.fromAlias}</span>: {m.text}
            </div>
          ))}
        </div>
      )}

      {/* My Farm Participation / Revoke Controls */}
      <div className="p-3 rounded-xl bg-[#0B1527] border border-[#243656] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-teal-400" />
            My Discovery Sharing
          </span>
          {myConsent?.optedIn && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
              <CheckCircle2 className="w-3 h-3" /> Published (City-only)
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <label className="block text-[10.5px] text-slate-400 mb-0.5">Public Display Alias</label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#060D1A] border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[10.5px] text-slate-400 mb-0.5">City / Municipality Disclosure</label>
            <input
              type="text"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#060D1A] border border-white/15 text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300 pt-0.5">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={shareCrops} onChange={(e) => setShareCrops(e.target.checked)} />
              Share crops
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={shareSoil} onChange={(e) => setShareSoil(e.target.checked)} />
              Share soil texture
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={shareWater} onChange={(e) => setShareWater(e.target.checked)} />
              Share irrigation
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={acceptsMsg} onChange={(e) => setAcceptsMsg(e.target.checked)} />
              Allow messages
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={savingOptIn || !currentFarm}
            onClick={async () => {
              setSavingOptIn(true);
              try {
                await onSaveOptIn({
                  optedIn: true,
                  displayAlias: alias,
                  cityName,
                  shareCrops,
                  shareSoilTexture: shareSoil,
                  shareWaterMethod: shareWater,
                  acceptsMessages: acceptsMsg,
                });
              } finally {
                setSavingOptIn(false);
              }
            }}
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs cursor-pointer disabled:opacity-50"
          >
            {savingOptIn ? 'Saving...' : myConsent?.optedIn ? 'Update Shared Profile' : 'Opt In (City-Level)'}
          </button>
          {myConsent?.optedIn && (
            <button
              type="button"
              onClick={onRevokeOptIn}
              className="py-1.5 px-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/35 text-rose-200 text-xs font-medium cursor-pointer"
            >
              Revoke
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
