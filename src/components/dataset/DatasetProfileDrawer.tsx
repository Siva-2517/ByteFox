'use client';

import { useState } from 'react';
import {
  X,
  Database,
  Calendar,
  Hash,
  Tag,
  AlignLeft,
  AlertTriangle,
  CheckCircle2,
  Table as TableIcon,
  Info,
} from 'lucide-react';
import { ColumnProfile, ColumnType, UnparseableRow } from '@/types';

interface DatasetProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: {
    id: string;
    name: string;
    filename: string;
    fileSizeBytes: number;
    rowCount: number;
    unparseableCount: number;
    columns: ColumnProfile[];
    unparseableRows: UnparseableRow[];
  } | null;
  previewRows?: { rowNumber: number; data: Record<string, any> }[];
}

export default function DatasetProfileDrawer({
  isOpen,
  onClose,
  dataset,
  previewRows = [],
}: DatasetProfileDrawerProps) {
  const [activeTab, setActiveTab] = useState<'columns' | 'unparseable' | 'preview'>('columns');

  if (!isOpen || !dataset) return null;

  const typeIcon = (type: ColumnType) => {
    switch (type) {
      case 'number':
        return <Hash className="h-3.5 w-3.5 text-emerald-400" />;
      case 'date':
        return <Calendar className="h-3.5 w-3.5 text-indigo-400" />;
      case 'category':
        return <Tag className="h-3.5 w-3.5 text-cyan-400" />;
      default:
        return <AlignLeft className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const validRowCount = dataset.rowCount - dataset.unparseableCount;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-3xl bg-[#090d16] border-l border-white/10 shadow-2xl flex flex-col animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">{dataset.name}</h2>
                <p className="text-xs text-slate-400">
                  {dataset.filename} • {(dataset.fileSizeBytes / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 border-b border-white/10 bg-black/20 p-4 text-center">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Total Rows</div>
              <div className="mt-0.5 text-lg font-bold text-white">{dataset.rowCount}</div>
            </div>
            <div className="border-x border-white/10">
              <div className="text-[11px] uppercase tracking-wider text-emerald-400">Valid Rows</div>
              <div className="mt-0.5 text-lg font-bold text-emerald-400">{validRowCount}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-rose-400">Unreadable Rows</div>
              <div className="mt-0.5 text-lg font-bold text-rose-400">{dataset.unparseableCount}</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 px-6 pt-3">
            <button
              onClick={() => setActiveTab('columns')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'columns'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Column Profiles ({dataset.columns.length})
            </button>
            <button
              onClick={() => setActiveTab('unparseable')}
              className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'unparseable'
                  ? 'border-rose-500 text-rose-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Unreadable Rows ({dataset.unparseableCount})
            </button>
            {previewRows.length > 0 && (
              <button
                onClick={() => setActiveTab('preview')}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'preview'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Sample Data ({previewRows.length})
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeTab === 'columns' && (
              <div className="space-y-3">
                {dataset.columns.map((col) => {
                  const nullPct =
                    col.totalCount > 0 ? Math.round((col.nullCount / col.totalCount) * 100) : 0;
                  return (
                    <div
                      key={col.name}
                      className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-2 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{col.name}</span>
                          <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300 border border-white/10">
                            {typeIcon(col.type)}
                            {col.type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Missing: <strong className="text-white">{col.nullCount}</strong> ({nullPct}%)
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-xs">
                        <div>
                          <span className="text-slate-400">Distinct: </span>
                          <span className="font-medium text-slate-200">{col.distinctCount}</span>
                        </div>
                        {col.min !== undefined && (
                          <div>
                            <span className="text-slate-400">Min: </span>
                            <span className="font-medium text-slate-200">{String(col.min)}</span>
                          </div>
                        )}
                        {col.max !== undefined && (
                          <div>
                            <span className="text-slate-400">Max: </span>
                            <span className="font-medium text-slate-200">{String(col.max)}</span>
                          </div>
                        )}
                        {col.mean !== undefined && (
                          <div>
                            <span className="text-slate-400">Mean: </span>
                            <span className="font-medium text-slate-200">{col.mean}</span>
                          </div>
                        )}
                      </div>

                      {col.sampleValues.length > 0 && (
                        <div className="pt-1 flex items-center gap-1 text-[11px] text-slate-400">
                          <span className="shrink-0 text-slate-500">Samples:</span>
                          <span className="truncate font-mono text-slate-300">
                            {col.sampleValues.slice(0, 4).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'unparseable' && (
              <div className="space-y-3">
                {dataset.unparseableRows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                    <p className="text-sm font-semibold text-white">Clean Dataset</p>
                    <p className="text-xs">No unreadable or malformed lines found in this CSV.</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3.5 flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                      <div className="text-xs text-rose-200 leading-relaxed">
                        <strong>Honest Data Pipeline:</strong> These rows failed syntax validation or had mismatched column counts. Instead of silently dropping them, they are captured here with exact line numbers and failure reasons.
                      </div>
                    </div>

                    <div className="space-y-2">
                      {dataset.unparseableRows.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-rose-500/20 bg-rose-950/10 p-3 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-rose-300 font-semibold">
                            <span>Line #{item.line} in CSV</span>
                            <span className="text-[11px] font-normal text-rose-400">
                              {item.reason}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-400 bg-black/40 p-2 rounded truncate">
                            {item.raw}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/5">
                    <tr>
                      <th className="p-3 w-12 text-slate-500 font-mono">#</th>
                      {dataset.columns.slice(0, 6).map((c) => (
                        <th key={c.name} className="p-3 font-semibold text-slate-300">
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-950/40 font-mono">
                    {previewRows.map((row) => (
                      <tr key={row.rowNumber} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 text-slate-500">{row.rowNumber}</td>
                        {dataset.columns.slice(0, 6).map((c) => (
                          <td key={c.name} className="p-3 text-slate-300 truncate max-w-[150px]">
                            {String(row.data[c.name] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 px-6 py-3 bg-slate-900/40 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Close Drawer (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
