'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Layers,
  Database,
  ShieldCheck,
  FileCode,
} from 'lucide-react';
import { AuditResult } from '@/types';

interface HowWasThisCalculatedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  audit: AuditResult | null;
  loading?: boolean;
}

export default function HowWasThisCalculatedDrawer({
  isOpen,
  onClose,
  audit,
  loading = false,
}: HowWasThisCalculatedDrawerProps) {
  const [activeTab, setActiveTab] = useState<'included' | 'excluded'>('included');
  const [copiedQuery, setCopiedQuery] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyQuery = () => {
    if (audit?.exactQuery) {
      navigator.clipboard.writeText(audit.exactQuery);
      setCopiedQuery(true);
      setTimeout(() => setCopiedQuery(false), 2000);
    }
  };

  const includedPct =
    audit && audit.totalDatasetRows > 0
      ? Math.round((audit.rowsIncluded / audit.totalDatasetRows) * 100)
      : 0;

  const excludedPct =
    audit && audit.totalDatasetRows > 0
      ? Math.round((audit.rowsExcluded / audit.totalDatasetRows) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-12">
        <div className="w-screen max-w-2xl bg-[#0a0d14] border-l border-[#1f2838] shadow-2xl flex flex-col animate-drawer">
          {/* Forensic Header */}
          <div className="flex items-center justify-between border-b border-[#1b2332] px-6 py-4 bg-[#0d111a]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#141b27] text-[#e5a93c] border border-[#273448]">
                <Terminal className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white tracking-tight">Calculation Provenance Proof</h2>
                  <span className="rounded border border-[#1b3d2f] bg-[#0c2419] px-2 py-0.5 text-[9px] font-mono font-semibold text-[#10b981] flex items-center gap-1">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    VERIFIED
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400">
                  {audit?.title || 'Forensic derivation breakdown'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e5a93c] border-t-transparent" />
                <p className="text-xs font-mono text-slate-400">Auditing server calculation pipeline...</p>
              </div>
            ) : !audit ? (
              <p className="text-xs font-mono text-slate-400">No audit record available for this calculation.</p>
            ) : (
              <>
                {/* Result Highlight Tile */}
                <div className="rounded-xl border border-[#263246] bg-gradient-to-b from-[#121722] to-[#0c1017] p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#e5a93c]/60 to-transparent" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                      OUTPUT COMPUTED BY ENGINE
                    </span>
                    <span className="rounded bg-[#1a2231] border border-[#2b394f] px-2 py-0.5 text-[10px] font-mono text-[#e5a93c]">
                      FORMULA: {audit.formula}
                    </span>
                  </div>
                  <div className="mt-2 text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-white tabular-nums">
                    {typeof audit.computedValue === 'number'
                      ? audit.computedValue.toLocaleString()
                      : typeof audit.computedValue === 'object' && audit.computedValue?.total !== undefined
                      ? audit.computedValue.total.toLocaleString()
                      : typeof audit.computedValue === 'string'
                      ? audit.computedValue
                      : 'Structured Matrix'}
                  </div>
                </div>

                {/* Plain-English Audit Narrative */}
                <div className="rounded-xl border border-[#1d2636] bg-[#0d121b] p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-[#e5a93c]" />
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Plain-English Explanation
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-200 pl-5 font-sans">
                    {audit.plainEnglishExplanation}
                  </p>
                </div>

                {/* Exact Server SQL Query */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      <FileCode className="h-3.5 w-3.5 text-[#e5a93c]" />
                      Server Aggregation Query Executed
                    </div>
                    <button
                      onClick={copyQuery}
                      className="flex items-center gap-1 text-[11px] font-mono text-[#e5a93c] hover:text-[#fbbf24] transition-colors"
                    >
                      {copiedQuery ? (
                        <>
                          <Check className="h-3 w-3 text-[#10b981]" />
                          <span className="text-[#10b981]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="sql-terminal p-4 text-xs leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
                    {audit.exactQuery}
                  </div>
                </div>

                {/* Row Inclusion vs Exclusion Provenance Meter */}
                <div className="rounded-xl border border-[#1e2738] bg-[#0c1017] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-[#10b981]" />
                      Row Inclusion & Exclusion Audit Tally
                    </h3>
                    <span className="text-xs font-mono text-slate-400">
                      Total Dataset Rows: <strong className="text-white">{audit.totalDatasetRows}</strong>
                    </span>
                  </div>

                  {/* Multi-segment Meter */}
                  <div className="space-y-1.5">
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#161c28]">
                      <div
                        style={{ width: `${includedPct}%` }}
                        className="bg-[#10b981] transition-all duration-500"
                        title={`Included: ${audit.rowsIncluded} (${includedPct}%)`}
                      />
                      <div
                        style={{ width: `${excludedPct}%` }}
                        className="bg-[#f43f5e] transition-all duration-500"
                        title={`Excluded: ${audit.rowsExcluded} (${excludedPct}%)`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#10b981] flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {audit.rowsIncluded.toLocaleString()} Included ({includedPct}%)
                      </span>
                      <span className="text-[#f43f5e] flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {audit.rowsExcluded.toLocaleString()} Excluded ({excludedPct}%)
                      </span>
                    </div>
                  </div>

                  {/* Exclusion Breakdown Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#18202d] font-mono">
                    <div className="rounded-lg bg-[#07090e] border border-[#192231] p-2.5">
                      <div className="text-[10px] text-slate-500">Filtered by Date Range</div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">
                        {audit.exclusionBreakdown.filteredByDateRange.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-lg bg-[#07090e] border border-[#192231] p-2.5">
                      <div className="text-[10px] text-slate-500">Filtered by Category</div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">
                        {audit.exclusionBreakdown.filteredByCategory.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-lg bg-[#07090e] border border-[#192231] p-2.5">
                      <div className="text-[10px] text-slate-500">Blank / Non-Numeric Cell</div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">
                        {audit.exclusionBreakdown.missingOrNullTargetValue.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-lg bg-[#07090e] border border-[#192231] p-2.5">
                      <div className="text-[10px] text-slate-500">Unreadable Source Lines</div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">
                        {audit.exclusionBreakdown.unparseableSourceRows.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inspectable Sample Rows Tabs */}
                <div className="space-y-3 font-mono">
                  <div className="flex items-center gap-2 border-b border-[#1b2332] pb-2">
                    <button
                      onClick={() => setActiveTab('included')}
                      className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        activeTab === 'included'
                          ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sample Included Rows ({audit.sampleIncludedRows.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('excluded')}
                      className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        activeTab === 'excluded'
                          ? 'bg-[#f43f5e]/15 text-[#f43f5e] border border-[#f43f5e]/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sample Excluded Rows ({audit.sampleExcludedRows.length})
                    </button>
                  </div>

                  {activeTab === 'included' ? (
                    audit.sampleIncludedRows.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No sample included rows to display.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-[#1c2433]">
                        <table className="w-full text-left text-[11px] text-slate-300">
                          <thead className="bg-[#0f141d] text-slate-400 border-b border-[#1c2433]">
                            <tr>
                              {Object.keys(audit.sampleIncludedRows[0] || {}).slice(0, 5).map((k) => (
                                <th key={k} className="p-2.5 font-medium">
                                  {k}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#171e2b] bg-[#07090e]">
                            {audit.sampleIncludedRows.slice(0, 5).map((row, idx) => (
                              <tr key={idx} className="hover:bg-white/5">
                                {Object.values(row).slice(0, 5).map((val: any, vIdx) => (
                                  <td key={vIdx} className="p-2.5 truncate max-w-[120px]">
                                    {String(val ?? '')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : audit.sampleExcludedRows.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No rows were excluded from this calculation.</p>
                  ) : (
                    <div className="space-y-2">
                      {audit.sampleExcludedRows.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-[#3d1a24] bg-[#160c11] p-3 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[#f43f5e] font-semibold text-[11px]">
                            <span>Line #{item.rowNumber} in Source</span>
                            <span className="font-normal text-slate-300 bg-[#251016] px-2 py-0.5 rounded border border-[#3d1a24]">
                              {item.reason}
                            </span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 truncate bg-black/40 p-2 rounded">
                            {JSON.stringify(item.data)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#1b2332] px-6 py-3 bg-[#0d111a] flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border border-[#273448] bg-[#141b27] px-4 py-1.5 text-xs font-mono font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Close Proof Drawer (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
