'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ArrowUpRight, BarChart3, LineChart as LineChartIcon, ShieldCheck } from 'lucide-react';
import { ChartConfig } from '@/types';

interface ChartBlockProps {
  id: string;
  title: string | null;
  config: ChartConfig;
  auditResult?: any;
  onInspectAudit: (blockId: string) => void;
  isReadOnly?: boolean;
}

export default function ChartBlock({
  id,
  title,
  config,
  auditResult,
  onInspectAudit,
  isReadOnly = false,
}: ChartBlockProps) {
  const displayTitle =
    title || `${config.chartType.toUpperCase()} Chart: ${config.aggregation} of ${config.yColumn} by ${config.xColumn}`;

  const chartData = Array.isArray(auditResult?.computedValue)
    ? auditResult.computedValue
    : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0];
      return (
        <div className="rounded-xl border border-[#2b3547] bg-[#0c1017] p-3 shadow-2xl text-xs space-y-1 font-mono">
          <div className="font-semibold text-slate-200">{label}</div>
          <div className="text-[#e5a93c] font-bold text-sm">
            {config.aggregation}: {typeof dataPoint.value === 'number' ? dataPoint.value.toLocaleString() : dataPoint.value}
          </div>
          {dataPoint.payload?.count !== undefined && (
            <div className="text-slate-400 text-[10px]">
              {dataPoint.payload.count} rows aggregated
            </div>
          )}
          <div className="pt-1 text-[9px] text-[#10b981] flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-[#10b981]" />
            Click to inspect derivation
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="precision-card p-6 relative overflow-hidden transition-all">
      {/* Top subtle highlight */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#10b981]/50 to-transparent opacity-60" />

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-[#161c28] border border-[#232d3f] px-2 py-0.5 rounded flex items-center gap-1.5">
              {config.chartType === 'line' ? (
                <LineChartIcon className="h-3 w-3 text-[#10b981]" />
              ) : (
                <BarChart3 className="h-3 w-3 text-[#e5a93c]" />
              )}
              {config.chartType}::{config.aggregation}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {chartData.length} categories
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

      {chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[#202838] bg-[#080b10] text-xs font-mono text-slate-400">
          No data records matching active filter conditions.
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {config.chartType === 'line' ? (
              <LineChart data={chartData} onClick={() => onInspectAudit(id)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="x"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  fontFamily="var(--font-mono)"
                  axisLine={{ stroke: '#1e293b' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  fontFamily="var(--font-mono)"
                  axisLine={{ stroke: '#1e293b' }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="y"
                  stroke="#e5a93c"
                  strokeWidth={2.5}
                  dot={{ fill: '#080a0f', stroke: '#e5a93c', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData} onClick={() => onInspectAudit(id)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="x"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  fontFamily="var(--font-mono)"
                  axisLine={{ stroke: '#1e293b' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  fontFamily="var(--font-mono)"
                  axisLine={{ stroke: '#1e293b' }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="y"
                  fill="url(#amberGradient)"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                />
                <defs>
                  <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#b45309" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-[#161d2a] flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer" onClick={() => onInspectAudit(id)}>
          Interactive plot: click any segment to audit server query & exclusions &rarr;
        </span>
        <span className="text-[#10b981] flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Verifiable
        </span>
      </div>
    </div>
  );
}
