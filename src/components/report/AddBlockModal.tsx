'use client';

import { useState } from 'react';
import { X, Plus, Calculator, BarChart3, Table as TableIcon, FileText } from 'lucide-react';
import { ColumnProfile, BlockType, AggregationType } from '@/types';

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  columns: ColumnProfile[];
  onBlockAdded: () => void;
}

export default function AddBlockModal({
  isOpen,
  onClose,
  reportId,
  columns,
  onBlockAdded,
}: AddBlockModalProps) {
  const [selectedType, setSelectedType] = useState<BlockType>('METRIC');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  // Metric State
  const numericColumns = columns.filter((c) => c.type === 'number');
  const categoryColumns = columns.filter((c) => c.type === 'category');
  const allColNames = columns.map((c) => c.name);

  const [metricCol, setMetricCol] = useState(numericColumns[0]?.name || allColNames[0] || '');
  const [metricAgg, setMetricAgg] = useState<AggregationType>('SUM');
  const [metricSplit, setMetricSplit] = useState<string>('');

  // Chart State
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [chartXCol, setChartXCol] = useState(
    columns.find((c) => c.type === 'date' || c.type === 'category')?.name || allColNames[0] || ''
  );
  const [chartYCol, setChartYCol] = useState(numericColumns[0]?.name || allColNames[0] || '');
  const [chartAgg, setChartAgg] = useState<AggregationType>('SUM');

  // Table State
  const [tableCols, setTableCols] = useState<string[]>(allColNames.slice(0, 5));
  const [tableSortCol, setTableSortCol] = useState(numericColumns[0]?.name || allColNames[0] || '');
  const [tableSortDir, setTableSortDir] = useState<'asc' | 'desc'>('desc');
  const [tableLimit, setTableLimit] = useState<number>(10);

  // Text Note State
  const [noteContent, setNoteContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      let config: any = {};
      if (selectedType === 'METRIC') {
        config = {
          column: metricCol,
          aggregation: metricAgg,
          ...(metricSplit ? { splitByCategory: metricSplit } : {}),
        };
      } else if (selectedType === 'CHART') {
        config = {
          chartType,
          xColumn: chartXCol,
          yColumn: chartYCol,
          aggregation: chartAgg,
        };
      } else if (selectedType === 'TABLE') {
        config = {
          columns: tableCols,
          sortColumn: tableSortCol,
          sortDirection: tableSortDir,
          limit: Number(tableLimit) || 10,
        };
      } else if (selectedType === 'TEXT_NOTE') {
        config = {
          content: noteContent,
        };
      }

      const res = await fetch(`/api/reports/${reportId}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockType: selectedType,
          title: title.trim() || null,
          config,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add block');
      }

      onBlockAdded();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTableCol = (colName: string) => {
    setTableCols((prev) =>
      prev.includes(colName) ? prev.filter((c) => c !== colName) : [...prev, colName]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Add Report Block</h3>
              <p className="text-xs text-slate-400">Choose block type and configure calculation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Block Type Selector Tabs */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { type: 'METRIC', label: 'Metric', icon: Calculator },
            { type: 'CHART', label: 'Chart', icon: BarChart3 },
            { type: 'TABLE', label: 'Table', icon: TableIcon },
            { type: 'TEXT_NOTE', label: 'Text Note', icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = selectedType === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => setSelectedType(item.type as BlockType)}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-sm'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Block Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q1 Total Revenue"
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Configuration Form for METRIC */}
          {selectedType === 'METRIC' && (
            <div className="space-y-3 rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Target Column
                  </label>
                  <select
                    value={metricCol}
                    onChange={(e) => setMetricCol(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {columns.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Aggregation
                  </label>
                  <select
                    value={metricAgg}
                    onChange={(e) => setMetricAgg(e.target.value as AggregationType)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="SUM">SUM (Total)</option>
                    <option value="AVG">AVG (Average)</option>
                    <option value="COUNT">COUNT (Rows)</option>
                    <option value="MIN">MIN (Minimum)</option>
                    <option value="MAX">MAX (Maximum)</option>
                    <option value="MEDIAN">MEDIAN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Optional: Split by Category
                </label>
                <select
                  value={metricSplit}
                  onChange={(e) => setMetricSplit(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">None (Single Overall Metric)</option>
                  {categoryColumns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Configuration Form for CHART */}
          {selectedType === 'CHART' && (
            <div className="space-y-3 rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Chart Type
                  </label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as 'bar' | 'line')}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Aggregation
                  </label>
                  <select
                    value={chartAgg}
                    onChange={(e) => setChartAgg(e.target.value as AggregationType)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="SUM">SUM</option>
                    <option value="AVG">AVG</option>
                    <option value="COUNT">COUNT</option>
                    <option value="MIN">MIN</option>
                    <option value="MAX">MAX</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    X-Axis (Group By)
                  </label>
                  <select
                    value={chartXCol}
                    onChange={(e) => setChartXCol(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {columns.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Y-Axis (Metric)
                  </label>
                  <select
                    value={chartYCol}
                    onChange={(e) => setChartYCol(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {columns.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Form for TABLE */}
          {selectedType === 'TABLE' && (
            <div className="space-y-3 rounded-xl border border-white/5 bg-black/20 p-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Select Columns to Display
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {columns.map((col) => {
                    const isSelected = tableCols.includes(col.name);
                    return (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => handleToggleTableCol(col.name)}
                        className={`rounded px-2 py-1 text-[11px] border transition-colors ${
                          isSelected
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {col.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Sort Column
                  </label>
                  <select
                    value={tableSortCol}
                    onChange={(e) => setTableSortCol(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {columns.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Direction
                  </label>
                  <select
                    value={tableSortDir}
                    onChange={(e) => setTableSortDir(e.target.value as 'asc' | 'desc')}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="desc">Descending (High to Low)</option>
                    <option value="asc">Ascending (Low to High)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Row Limit
                  </label>
                  <select
                    value={tableLimit}
                    onChange={(e) => setTableLimit(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value={5}>Top 5</option>
                    <option value={10}>Top 10</option>
                    <option value={25}>Top 25</option>
                    <option value={50}>Top 50</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Form for TEXT_NOTE */}
          {selectedType === 'TEXT_NOTE' && (
            <div className="space-y-3 rounded-xl border border-white/5 bg-black/20 p-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Note Content
                </label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Explain findings, highlight anomalies, or outline takeaways..."
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Adding Block...' : 'Add Block to Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
