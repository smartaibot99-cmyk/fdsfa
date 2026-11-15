import React, { useEffect, useRef, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Copy,
  Download,
  Edit3,
  Layers,
  Map as MapIcon,
  MoreHorizontal,
  Play,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import {
  MyFarmRecord,
  PortfolioFieldRecord,
  PortfolioFilterState,
} from '../../types/myFarms';
import { formatArea, formatRelativeDate } from '../../lib/myFarmsEngine';
import { FarmFootprintThumb, StatusLabel } from './StatusIndicators';

interface PortfolioTableProps {
  farms: MyFarmRecord[];
  fields: PortfolioFieldRecord[];
  filter: PortfolioFilterState;
  selectedFarmId: string | null;
  onChangeSort: (sortBy: PortfolioFilterState['sortBy']) => void;
  onOpenDetails: (farmId: string, subTab?: 'overview' | 'fields' | 'settings') => void;
  onRenameFarm: (farm: MyFarmRecord) => void;
  onDuplicateFarm: (farm: MyFarmRecord) => void;
  onExportFarm: (farm: MyFarmRecord) => void;
  onArchiveToggle: (farm: MyFarmRecord) => void;
  onDeleteFarm: (farm: MyFarmRecord) => void;
  onOpenInMaps: (farm: MyFarmRecord) => void;
  onRunDeepAnalysis: (farm: MyFarmRecord) => void;
}

export const PortfolioTable: React.FC<PortfolioTableProps> = ({
  farms,
  fields,
  filter,
  selectedFarmId,
  onChangeSort,
  onOpenDetails,
  onRenameFarm,
  onDuplicateFarm,
  onExportFarm,
  onArchiveToggle,
  onDeleteFarm,
  onOpenInMaps,
  onRunDeepAnalysis,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuId(null);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const renderSortIcon = (col: PortfolioFilterState['sortBy']) => {
    if (filter.sortBy !== col) return null;
    return filter.sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 inline ml-1" />
    );
  };

  const getAriaSort = (col: PortfolioFilterState['sortBy']) => {
    if (filter.sortBy !== col) return 'none';
    return filter.sortDir === 'asc' ? 'ascending' : 'descending';
  };

  const renderOverflowMenu = (farm: MyFarmRecord) => (
    <div
      ref={openMenuId === farm.id ? menuRef : null}
      className="relative inline-block text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setOpenMenuId((cur) => (cur === farm.id ? null : farm.id))}
        aria-haspopup="menu"
        aria-expanded={openMenuId === farm.id}
        aria-label={`More actions for ${farm.name}`}
        className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {openMenuId === farm.id && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-56 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xl z-40 py-1.5 text-xs"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpenMenuId(null);
              onRenameFarm(farm);
            }}
            className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            Rename farm
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpenMenuId(null);
              onOpenDetails(farm.id, 'fields');
            }}
            className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            Manage fields
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpenMenuId(null);
              onOpenDetails(farm.id, 'settings');
            }}
            className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            Edit profile &amp; settings
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpenMenuId(null);
              onDuplicateFarm(farm);
            }}
            className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            Duplicate configuration
          </button>

          <div className="my-1 border-t border-[var(--border)]" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpenMenuId(null);
              onOpenInMaps(farm);
            }}
            className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <MapIcon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            Open in Maps
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpenMenuId(null);
              onRunDeepAnalysis(farm);
            }}
            className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            Run Deep Analysis
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpenMenuId(null);
              onExportFarm(farm);
            }}
            className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            Export JSON / GeoJSON
          </button>

          <div className="my-1 border-t border-[var(--border)]" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpenMenuId(null);
              onArchiveToggle(farm);
            }}
            className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            {farm.archivedAt ? (
              <>
                <ArchiveRestore className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                Unarchive farm
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                Archive farm
              </>
            )}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpenMenuId(null);
              onDeleteFarm(farm);
            }}
            className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete farm…
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-visible">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/45 text-[11.5px] uppercase tracking-wider text-[var(--text-secondary)]">
              <th className="py-3 pl-4 pr-3 font-semibold" aria-sort={getAriaSort('name')}>
                <button
                  type="button"
                  onClick={() => onChangeSort('name')}
                  className="inline-flex items-center hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Farm / Location
                  {renderSortIcon('name')}
                </button>
              </th>
              <th className="py-3 px-3 font-semibold" aria-sort={getAriaSort('area')}>
                <button
                  type="button"
                  onClick={() => onChangeSort('area')}
                  className="inline-flex items-center hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Mapped area
                  {renderSortIcon('area')}
                </button>
              </th>
              <th className="py-3 px-3 font-semibold">Fields</th>
              <th className="py-3 px-3 font-semibold hidden lg:table-cell">Current plan</th>
              <th className="py-3 px-3 font-semibold" aria-sort={getAriaSort('status')}>
                <button
                  type="button"
                  onClick={() => onChangeSort('status')}
                  className="inline-flex items-center hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Status
                  {renderSortIcon('status')}
                </button>
              </th>
              <th className="py-3 px-3 font-semibold" aria-sort={getAriaSort('assessedAt')}>
                <button
                  type="button"
                  onClick={() => onChangeSort('assessedAt')}
                  className="inline-flex items-center hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Last assessment
                  {renderSortIcon('assessedAt')}
                </button>
              </th>
              <th className="py-3 pl-3 pr-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-sm">
            {farms.map((farm) => {
              const fieldCount = fields.filter((fl) => fl.farmId === farm.id).length;
              const isSelected = selectedFarmId === farm.id;
              return (
                <tr
                  key={farm.id}
                  onClick={() => onOpenDetails(farm.id, 'overview')}
                  style={isSelected ? { backgroundColor: 'rgba(39, 199, 178, 0.08)' } : undefined}
                  className="h-[68px] hover:bg-[var(--bg-elevated)]/40 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 pl-4 pr-3">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <FarmFootprintThumb geometry={farm.geometry} status={farm.assessment.status} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--text-primary)] truncate">
                            {farm.name}
                          </span>
                          {farm.isDraft && (
                            <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                              · Draft
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                          {farm.locationLabel}
                          {farm.primaryCrop ? ` · ${farm.primaryCrop}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="font-medium text-[var(--text-primary)] tabular-nums">
                      {farm.mappedAreaHa > 0
                        ? formatArea(farm.mappedAreaHa, farm.areaUnit)
                        : farm.declaredAreaHa
                          ? `${formatArea(farm.declaredAreaHa, farm.areaUnit)} (declared)`
                          : 'Unmapped'}
                    </div>
                    {farm.hasFieldOverlapWarning ? (
                      <div className="text-[11px] text-amber-700 dark:text-amber-300">
                        Overlap warning
                      </div>
                    ) : farm.areaGapNote ? (
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {farm.declaredAreaHa ? `Declared ${formatArea(farm.declaredAreaHa, farm.areaUnit)}` : 'Check area'}
                      </div>
                    ) : null}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap tabular-nums text-[var(--text-primary)] font-medium">
                    {fieldCount > 0 ? fieldCount : farm.hasBoundary ? '1 parcel' : '0'}
                  </td>

                  <td className="py-2.5 px-3 hidden lg:table-cell max-w-[230px]">
                    {farm.activePlan ? (
                      <div>
                        <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                          {farm.activePlan.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          Active v{farm.activePlan.version}
                          {farm.recommendedPlanTitle && !farm.activePlan.isRecommendedPlan
                            ? ' · Custom choice'
                            : ''}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--text-secondary)]">
                        No active plan
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <StatusLabel status={farm.assessment.status} />
                    {farm.assessment.score !== null && (
                      <div className="text-[11px] text-[var(--text-secondary)] tabular-nums mt-0.5">
                        Score {farm.assessment.score}/100 · {farm.assessment.completenessPct}% data
                      </div>
                    )}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="text-xs text-[var(--text-primary)] tabular-nums">
                      {formatRelativeDate(farm.assessment.assessedAt)}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] tabular-nums mt-0.5">
                      {farm.assessment.activeAlertsCount > 0
                        ? `${farm.assessment.activeAlertsCount} active alert${farm.assessment.activeAlertsCount > 1 ? 's' : ''}`
                        : farm.assessment.freshnessState === 'stale'
                          ? 'Refresh recommended'
                          : 'No open alerts'}
                    </div>
                  </td>

                  <td
                    className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenDetails(farm.id, 'overview')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
                      >
                        Open
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                      {renderOverflowMenu(farm)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Compact Stacked Cards */}
      <div className="md:hidden divide-y divide-[var(--border)]">
        {farms.map((farm) => {
          const fieldCount = fields.filter((fl) => fl.farmId === farm.id).length;
          return (
            <div
              key={farm.id}
              onClick={() => onOpenDetails(farm.id, 'overview')}
              className="p-3.5 space-y-2.5 hover:bg-[var(--bg-elevated)]/40 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FarmFootprintThumb geometry={farm.geometry} status={farm.assessment.status} />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[var(--text-primary)] truncate">
                      {farm.name}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] truncate">
                      {farm.locationLabel}
                      {farm.primaryCrop ? ` · ${farm.primaryCrop}` : ''}
                    </div>
                  </div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>{renderOverflowMenu(farm)}</div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <StatusLabel status={farm.assessment.status} />
                <div className="text-[var(--text-secondary)] tabular-nums">
                  {farm.mappedAreaHa > 0 ? formatArea(farm.mappedAreaHa, farm.areaUnit) : 'Unmapped'} ·{' '}
                  {fieldCount > 0 ? `${fieldCount} fields` : '1 parcel'}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-1 border-t border-[var(--border)]/60">
                <span className="truncate max-w-[60%]">
                  {farm.activePlan ? farm.activePlan.title : 'No active plan'}
                </span>
                <span className="tabular-nums">
                  {formatRelativeDate(farm.assessment.assessedAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
