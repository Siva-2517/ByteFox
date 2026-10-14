'use client';

import { Filter, Calendar, Tag, RotateCcw } from 'lucide-react';
import { ColumnProfile, GlobalFilters } from '@/types';

interface GlobalFilterBarProps {
  columns: ColumnProfile[];
  filters: GlobalFilters;
  onFiltersChange: (updated: GlobalFilters) => void;
  isReadOnly?: boolean;
}

export default function GlobalFilterBar({
  columns,
  filters,
  onFiltersChange,
  isReadOnly = false,
}: GlobalFilterBarProps) {
  const dateColumns = columns.filter((c) => c.type === 'date');
  const categoryColumns = columns.filter((c) => c.type === 'category');

  const selectedDateCol = filters.dateRange?.column || (dateColumns.length > 0 ? dateColumns[0].name : '');
  const startDate = filters.dateRange?.start || '';
  const endDate = filters.dateRange?.end || '';

  const activeCategoryCount = Object.values(filters.categoryFilters || {}).reduce(
    (acc, vals) => acc + (vals?.length || 0),
    0
  );

  const hasActiveFilters =
    Boolean(filters.dateRange?.start || filters.dateRange?.end) || activeCategoryCount > 0;

  const handleDateChange = (start?: string, end?: string, col?: string) => {
    const column = col || selectedDateCol;
    if (!column) return;

    const newStart = start !== undefined ? start : startDate;
    const newEnd = end !== undefined ? end : endDate;

    if (!newStart && !newEnd) {
      const nextFilters = { ...filters };
      delete nextFilters.dateRange;
      onFiltersChange(nextFilters);
    } else {
      onFiltersChange({
        ...filters,
        dateRange: {
          column,
          start: newStart || undefined,
          end: newEnd || undefined,
        },
      });
    }
  };

  const handleCategoryToggle = (columnName: string, value: string) => {
    const current = filters.categoryFilters?.[columnName] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    const nextCatFilters = { ...(filters.categoryFilters || {}) };
    if (updated.length === 0) {
      delete nextCatFilters[columnName];
    } else {
      nextCatFilters[columnName] = updated;
    }

    onFiltersChange({
      ...filters,
      categoryFilters: nextCatFilters,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="rounded-2xl border border-[#1e2533] bg-[#0c1017] p-4 space-y-3 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#141b27] text-[#e5a93c] border border-[#273448]">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Report-Level Global Filters
          </span>
          {hasActiveFilters && (
            <span className="rounded border border-[#1b3d2f] bg-[#0c2419] px-2 py-0.5 text-[9px] font-mono font-semibold text-[#10b981] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] audit-pulse-dot" />
              Cascading to all blocks
            </span>
          )}
        </div>

        {hasActiveFilters && !isReadOnly && (
          <button
            onClick={clearAllFilters}
            className="btn-secondary flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-slate-300 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {/* Date Range Filter */}
        {dateColumns.length > 0 && (
          <div className="rounded-xl border border-[#1b2230] bg-[#080a0f] p-3 space-y-2 font-mono">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                <Calendar className="h-3 w-3 text-[#e5a93c]" />
                Date Range
              </span>
              {dateColumns.length > 1 && !isReadOnly && (
                <select
                  value={selectedDateCol}
                  onChange={(e) => handleDateChange(undefined, undefined, e.target.value)}
                  className="rounded bg-[#121620] px-1.5 py-0.5 text-[10px] text-slate-300 border border-[#232c3d]"
                >
                  {dateColumns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                disabled={isReadOnly}
                onChange={(e) => handleDateChange(e.target.value, undefined)}
                className="w-full rounded-lg border border-[#232c3d] bg-[#10141d] px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-[#e5a93c] focus:outline-none disabled:opacity-60"
              />
              <span className="text-xs text-slate-500 font-mono">to</span>
              <input
                type="date"
                value={endDate}
                disabled={isReadOnly}
                onChange={(e) => handleDateChange(undefined, e.target.value)}
                className="w-full rounded-lg border border-[#232c3d] bg-[#10141d] px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-[#e5a93c] focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>
        )}

        {/* Category Filters */}
        {categoryColumns.slice(0, 2).map((col) => {
          const selectedVals = filters.categoryFilters?.[col.name] || [];
          return (
            <div key={col.name} className="rounded-xl border border-[#1b2230] bg-[#080a0f] p-3 space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1.5 truncate text-[11px] font-semibold">
                  <Tag className="h-3 w-3 text-[#10b981]" />
                  {col.name}
                </span>
                {selectedVals.length > 0 && (
                  <span className="text-[10px] text-[#e5a93c] font-bold">
                    {selectedVals.length} active
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                {col.sampleValues.slice(0, 6).map((val) => {
                  const sVal = String(val);
                  const isSelected = selectedVals.includes(sVal);
                  return (
                    <button
                      key={sVal}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => handleCategoryToggle(col.name, sVal)}
                      className={`rounded px-2 py-0.5 text-[10px] font-mono border transition-all ${
                        isSelected
                          ? 'bg-[#e5a93c]/20 text-[#e5a93c] border-[#e5a93c]/40 shadow-sm'
                          : 'bg-[#121620] text-slate-400 border-[#20293a] hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      {sVal}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
