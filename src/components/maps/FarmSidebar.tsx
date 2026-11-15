import React from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ChevronRight,
  ChevronsRight,
  HelpCircle,
  Minimize2,
  Plus,
  Search,
  Sprout,
  X,
} from 'lucide-react';
import { FarmHealthStatus, FarmMapRecord } from '../../types/maps';
import { FarmThumbnail } from './FarmThumbnail';

interface FarmSidebarProps {
  farms: FarmMapRecord[];
  selectedFarmId: string | null;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSelectFarm: (farmId: string) => void;
  onOpenAddFarm: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  loading?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const STATUS_BADGE_MAP: Record<
  FarmHealthStatus,
  {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    dotColor: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  healthy: {
    label: 'Healthy',
    bgClass: 'bg-[#103828]',
    textClass: 'text-[#4CEB87]',
    borderClass: 'border-[#1E6342]',
    dotColor: '#35E66B',
    Icon: Activity,
  },
  moderate: {
    label: 'Moderate',
    bgClass: 'bg-[#3A2B11]',
    textClass: 'text-[#F9B938]',
    borderClass: 'border-[#74511B]',
    dotColor: '#FFB21A',
    Icon: AlertTriangle,
  },
  at_risk: {
    label: 'At Risk',
    bgClass: 'bg-[#3F141A]',
    textClass: 'text-[#FB5A67]',
    borderClass: 'border-[#7A242D]',
    dotColor: '#FF3B4E',
    Icon: AlertOctagon,
  },
  no_data: {
    label: 'No Data',
    bgClass: 'bg-[#222C36]',
    textClass: 'text-[#B4BFC9]',
    borderClass: 'border-[#3E4B59]',
    dotColor: '#8C96A0',
    Icon: HelpCircle,
  },
};

export const FarmSidebar: React.FC<FarmSidebarProps> = ({
  farms,
  selectedFarmId,
  searchQuery,
  onSearchQueryChange,
  onSelectFarm,
  onOpenAddFarm,
  collapsed,
  onToggleCollapse,
  loading = false,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredFarms = normalizedQuery
    ? farms.filter((f) => {
        const nameMatch = f.name.toLowerCase().includes(normalizedQuery);
        const cropMatch = (f.crop ?? '').toLowerCase().includes(normalizedQuery);
        const locMatch = f.locationLabel.toLowerCase().includes(normalizedQuery);
        return nameMatch || cropMatch || locMatch;
      })
    : farms;

  // Desktop collapsed icon rail
  if (collapsed && !mobileOpen) {
    return (
      <aside
        aria-label="My Farms sidebar (collapsed)"
        className="hidden md:flex w-[68px] shrink-0 h-full flex-col items-center justify-between py-3.5 bg-gradient-to-b from-[#0C1724] to-[#081019] border-r border-white/[0.08] select-none z-20"
      >
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand My Farms panel"
            aria-label="Expand My Farms panel"
            className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-[#22E0B6] flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>

          <div className="w-8 h-px bg-white/[0.08]" />

          <div className="flex flex-col items-center gap-2 w-full px-2 overflow-y-auto fs-thin-scroll max-h-[calc(100dvh-210px)]">
            {farms.map((farm) => {
              const isSelected = farm.id === selectedFarmId;
              const badge = STATUS_BADGE_MAP[farm.healthStatus] ?? STATUS_BADGE_MAP.no_data;
              return (
                <button
                  key={farm.id}
                  type="button"
                  onClick={() => onSelectFarm(farm.id)}
                  title={`${farm.name} (${farm.areaHa.toFixed(1)} ha)`}
                  aria-label={`Select ${farm.name}`}
                  className={`relative w-11 h-11 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#16E0B8] bg-[#0F2C36] shadow-[0_0_12px_rgba(22,224,184,0.28)]'
                      : 'border-white/10 bg-[#0F1D2A] hover:border-white/25'
                  }`}
                >
                  <Sprout className="w-4 h-4 text-slate-200" />
                  <span
                    className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full"
                    style={{ backgroundColor: badge.dotColor }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddFarm}
          title="Add Farm"
          aria-label="Add Farm"
          className="w-11 h-11 rounded-xl border border-[#1CE2BD]/75 bg-gradient-to-b from-[#124B4A] to-[#0D3639] text-white flex items-center justify-center shadow-[0_0_14px_rgba(20,224,184,0.25)] hover:brightness-110 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>
      </aside>
    );
  }

  const sidebarContent = (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#0C1723] via-[#09131E] to-[#071018] text-slate-100 select-none">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center">
            <Sprout className="w-5 h-5 text-[#49EA80]" strokeWidth={2.2} />
          </div>
          <h1 className="text-[20px] font-semibold tracking-tight text-white leading-none">
            My Farms
          </h1>
        </div>

        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close farms drawer"
            className="w-8 h-8 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            aria-label="Collapse My Farms sidebar"
            className="w-7 h-7 rounded-md hover:bg-white/[0.07] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Local Farms Search Input */}
      <div className="px-4 pb-3">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search farms..."
            aria-label="Search saved farms"
            className="w-full h-10 pl-10 pr-9 rounded-lg bg-[#101D2A] border border-white/[0.09] text-[13.5px] text-slate-100 placeholder:text-slate-400/90 focus:outline-none focus:border-[#16E0B8]/70 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              aria-label="Clear farm search"
              className="absolute right-2.5 text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Independent Scrollable Farm Card List */}
      <div className="flex-1 min-h-0 overflow-y-auto fs-thin-scroll px-4 pb-3 space-y-2.5">
        {loading && farms.length === 0 ? (
          <div className="space-y-2.5 pt-1">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-[94px] rounded-xl bg-[#0E1B28] border border-white/[0.06] p-2.5 flex items-center gap-3 animate-pulse"
              >
                <div className="w-[74px] h-[74px] rounded-lg bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 rounded bg-white/[0.08]" />
                  <div className="h-3 w-24 rounded bg-white/[0.06]" />
                  <div className="h-5 w-20 rounded-full bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredFarms.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-xl border border-dashed border-white/10 bg-[#0C1723]">
            <p className="text-sm font-medium text-slate-200">
              {farms.length === 0 ? 'No farms saved yet' : 'No farms found'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {farms.length === 0
                ? 'Click + Add Farm below to draw or import a boundary.'
                : 'Try another farm name.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-[#22E0B6] cursor-pointer"
              >
                Reset search
              </button>
            )}
          </div>
        ) : (
          filteredFarms.map((farm) => {
            const isSelected = farm.id === selectedFarmId;
            const badge = STATUS_BADGE_MAP[farm.healthStatus] ?? STATUS_BADGE_MAP.no_data;
            const StatusIcon = badge.Icon;

            return (
              <button
                key={farm.id}
                type="button"
                onClick={() => {
                  onSelectFarm(farm.id);
                  onCloseMobile?.();
                }}
                aria-pressed={isSelected}
                className={`w-full text-left rounded-xl p-2.5 flex items-center gap-3 transition-all cursor-pointer group ${
                  isSelected
                    ? 'border-[1.5px] border-[#16E0B8] bg-gradient-to-r from-[#0F2A35] via-[#0D212D] to-[#0C1925] shadow-[0_0_20px_rgba(20,224,184,0.16)]'
                    : 'border border-white/[0.07] bg-[#0D1A26]/95 hover:border-white/[0.16] hover:bg-[#10202F]'
                }`}
              >
                <FarmThumbnail
                  geometry={farm.geometry}
                  centroid={farm.centroid}
                  status={farm.healthStatus}
                  selected={isSelected}
                />

                <div className="flex-1 min-w-0 py-0.5">
                  <div className="text-[15px] font-semibold text-white truncate leading-tight">
                    {farm.name}
                  </div>
                  <div className="text-[13px] text-[#9AA9BC] mt-0.5 truncate tabular-nums">
                    {farm.areaHa.toFixed(1)} ha • {farm.crop || 'Crop not recorded'}
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}
                    >
                      <StatusIcon className="w-3 h-3 shrink-0" />
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 shrink-0 mr-1 transition-transform ${
                    isSelected
                      ? 'text-white translate-x-0.5'
                      : 'text-slate-400 group-hover:text-slate-200 group-hover:translate-x-0.5'
                  }`}
                />
              </button>
            );
          })
        )}
      </div>

      {/* Fixed Bottom Footer CTA */}
      <div className="shrink-0 px-4 py-3.5 border-t border-white/[0.06] bg-[#081018]">
        <button
          type="button"
          onClick={() => {
            onOpenAddFarm();
            onCloseMobile?.();
          }}
          className="w-full h-11 rounded-xl border border-[#1CE2BD]/75 bg-gradient-to-r from-[#0F3F42] via-[#134D4C] to-[#0E393C] text-white font-semibold text-[15px] inline-flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(20,224,184,0.20),inset_0_1px_0_rgba(120,255,232,0.22)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>Add Farm</span>
        </button>
      </div>
    </div>
  );

  if (mobileOpen) {
    return (
      <div className="fixed inset-0 z-[700] md:hidden flex">
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-xs"
          onClick={onCloseMobile}
        />
        <aside
          aria-label="My Farms drawer"
          className="relative w-[min(90vw,380px)] h-full border-r border-white/[0.08] shadow-2xl z-10"
        >
          {sidebarContent}
        </aside>
      </div>
    );
  }

  return (
    <aside
      aria-label="My Farms sidebar"
      className="hidden md:flex w-[360px] lg:w-[388px] shrink-0 h-full border-r border-white/[0.08] z-20"
    >
      {sidebarContent}
    </aside>
  );
};
