'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { BarChart3, Plus, ArrowRight, Share2, Trash2, Calendar, FileText } from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete report "${title}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Your Reports</h1>
            <p className="text-xs text-slate-400">
              Interactive reports built from your datasets. Every block shows its exact calculation.
            </p>
          </div>

          <a
            href="/reports/new"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-102"
          >
            <Plus className="h-4 w-4" />
            Create Report
          </a>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-12 text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mx-auto">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">No reports yet</h3>
              <p className="text-xs text-slate-400 mt-1">
                Upload a dataset first, then build your first report.
              </p>
            </div>
            <a
              href="/reports/new"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-all"
            >
              <Plus className="h-4 w-4" />
              Build First Report
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((r) => (
              <div
                key={r.id}
                className="glass-panel glass-panel-hover rounded-2xl p-6 border border-white/10 flex flex-col justify-between space-y-4 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-white truncate">{r.title}</h3>
                    {r.shareCount > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold shrink-0">
                        <Share2 className="h-3 w-3" />
                        Shared
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {r.description || 'No description provided.'}
                  </p>

                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span className="text-indigo-300 font-medium truncate max-w-[140px]">
                      {r.datasetName}
                    </span>
                    <span>•</span>
                    <span>{r.blockCount} blocks</span>
                    <span>•</span>
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-white/5">
                  <button
                    onClick={() => handleDelete(r.id, r.title)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete report"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <a
                    href={`/reports/${r.id}`}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-102"
                  >
                    Open Workspace
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
