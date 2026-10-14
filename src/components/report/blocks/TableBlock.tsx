'use client';

import { Table as TableIcon, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { TableConfig } from '@/types';

interface TableBlockProps {
  id: string;
  title: string | null;
  config: TableConfig;
  auditResult?: any;
  onInspectAudit: (blockId: string) => void;
  isReadOnly?: boolean;
}

export default function TableBlock({
  id,
  title,
  config,
  auditResult,
  onInspectAudit,
  isReadOnly = false,
}: TableBlockProps) {
  const displayTitle = title || `Top Records (Limit ${config.limit})`;
  const rows: Record<string, any>[] = Array.isArray(auditResult?.computedValue) ? auditResult.computedValue : [];
  const columns = config.columns && config.columns.length > 0
    ? config.columns
    : rows.length > 0
    ? Object.keys(rows[0]).filter((k) => k !== '_rowNumber')
    : [];

  return (
    <div className="precision-card p-6 relative overflow-hidden transition-all">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-[#161c28] border border-[#232d3f] px-2 py-0.5 rounded flex items-center gap-1.5">
              <TableIcon className="h-3 w-3 text-cyan-400" />
              TABLE::TOP_{config.limit}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {rows.length} rows rendered
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-200">{displayTitle}</h3>
        </div>

        <button
          onClick={() => onInspectAudit(id)}
          className="flex items-center gap-1.5 rounded-full bg-[#141b27] border border-[#253248] px-3 py-1 text-xs font-semibold text-[#e5a93c] hover:border-[#e5a93c]/50 hover:bg-[#1a2333] transition-all shadow-sm shrink-0"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#e5a93c] audit-pulse-dot" />
          <span>Show Work</span>
          <ArrowUpRight className="h-3 w-3 text-[#e5a93c]/70" />
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[#202838] bg-[#080b10] text-xs font-mono text-slate-400">
          No records matching active filter conditions.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1e2533] bg-[#080a0f]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0f131a] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#1e2533]">
              <tr>
                <th className="p-3 w-10 text-slate-500 font-mono text-center">#</th>
                {columns.map((col) => (
                  <th key={col} className="p-3 font-semibold text-slate-300">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171d28] font-mono">
              {rows.map((row: Record<string, any>, idx: number) => (
                <tr key={idx} className="hover:bg-[#121620] transition-colors">
                  <td className="p-3 text-slate-500 text-center text-[11px]">{row._rowNumber || idx + 1}</td>
                  {columns.map((col) => (
                    <td key={col} className="p-3 text-slate-200 truncate max-w-[200px] text-[11px]">
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-[#161d2a] flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer" onClick={() => onInspectAudit(id)}>
          Click to inspect SQL query, sort order, and exclusion proofs &rarr;
        </span>
        <span className="text-[#10b981] flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Verifiable
        </span>
      </div>
    </div>
  );
}
