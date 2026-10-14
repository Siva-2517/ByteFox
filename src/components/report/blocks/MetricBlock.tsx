'use client';

import { ArrowUpRight, Search, Layers, ShieldCheck } from 'lucide-react';
import { MetricConfig } from '@/types';

interface MetricBlockProps {
  id: string;
  title: string | null;
  config: MetricConfig;
  auditResult?: any;
  onInspectAudit: (blockId: string) => void;
  isReadOnly?: boolean;
}

export default function MetricBlock({
  id,
  title,
  config,
  auditResult,
  onInspectAudit,
  isReadOnly = false,
}: MetricBlockProps) {
  const displayTitle = title || `${config.aggregation} of ${config.column}`;
  const totalValue =
    typeof auditResult?.computedValue === 'number'
      ? auditResult.computedValue.toLocaleString()
      : typeof auditResult?.computedValue === 'object' && auditResult.computedValue?.total !== undefined
      ? auditResult.computedValue.total.toLocaleString()
      : '—';

  const breakdown =
    typeof auditResult?.computedValue === 'object' && Array.isArray(auditResult.computedValue?.breakdown)
      ? auditResult.computedValue.breakdown
      : null;

  return (
    <div
      onClick={() => onInspectAudit(id)}
      className="precision-card p-6 relative group cursor-pointer overflow-hidden"
    >
      {/* Top subtle highlight border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#e5a93c]/60 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-[#161c28] border border-[#232d3f] px-2 py-0.5 rounded">
              {config.aggregation}::{config.column}
            </span>
            {auditResult?.rowsIncluded !== undefined && (
              <span className="text-[10px] font-mono text-[#10b981] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                {auditResult.rowsIncluded} rows computed
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-200">{displayTitle}</h3>
        </div>

        {/* Tactile Audit Chip Trigger */}
        <div className="flex items-center gap-1.5 rounded-full bg-[#141b27] border border-[#253248] px-3 py-1 text-xs font-semibold text-[#e5a93c] group-hover:border-[#e5a93c]/50 group-hover:bg-[#1a2333] transition-all shadow-sm shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-[#e5a93c] audit-pulse-dot" />
          <span>Show Work</span>
          <ArrowUpRight className="h-3 w-3 text-[#e5a93c]/70 group-hover:text-[#e5a93c] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>

      {/* Main Metric Figure */}
      <div className="mt-4 flex items-baseline gap-2">
        <div className="text-3xl sm:text-5xl font-mono font-extrabold tracking-tight text-white tabular-nums">
          {totalValue}
        </div>
      </div>

      {/* Category Breakdown Tiles if split */}
      {breakdown && breakdown.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[#1a212f] space-y-2.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="h-3 w-3 text-[#e5a93c]" />
              Breakdown by {config.splitByCategory}
            </span>
            <span className="text-[10px] text-slate-400">{breakdown.length} partitions</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {breakdown.map((item: any, idx: number) => (
              <div
                key={idx}
                className="rounded-lg bg-[#0c1017] border border-[#1b2332] p-2.5 hover:border-[#2f3d57] transition-colors"
              >
                <div className="text-[10px] text-slate-400 font-mono truncate">{item.category}</div>
                <div className="text-sm font-mono font-bold text-slate-200 mt-0.5 tabular-nums">
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                  {item.count} records
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Footer Indicator */}
      <div className="mt-4 pt-3 border-t border-[#161d2a] flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span className="text-slate-400 group-hover:text-slate-200 transition-colors">
          Click number to inspect derivation & exclusion proofs &rarr;
        </span>
        <span className="text-[#10b981] flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Verifiable
        </span>
      </div>
    </div>
  );
}
