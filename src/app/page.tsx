'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import FileUploadZone from '@/components/dataset/FileUploadZone';
import DatasetProfileDrawer from '@/components/dataset/DatasetProfileDrawer';
import {
  Database,
  Plus,
  ArrowRight,
  ShieldCheck,
  Calculator,
  Share2,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  Sparkles,
  Terminal,
  Layers,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedDatasetForProfile, setSelectedDatasetForProfile] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          loadDashboardData();
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dsRes, repRes] = await Promise.all([
        fetch('/api/datasets'),
        fetch('/api/reports'),
      ]);

      if (dsRes.ok) {
        const dsData = await dsRes.json();
        setDatasets(dsData.datasets || []);
      }
      if (repRes.ok) {
        const repData = await repRes.json();
        setReports(repData.reports || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (dataset: any) => {
    setDatasets((prev) => [dataset, ...prev]);
    setSelectedDatasetForProfile(dataset);
  };

  const inspectDataset = async (datasetId: string) => {
    try {
      const res = await fetch(`/api/datasets/${datasetId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDatasetForProfile({
          ...data.dataset,
          previewRows: data.previewRows,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {!user && !loading ? (
          /* Landing Experience for Evaluators / Visitors */
          <div className="py-10 space-y-12">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2e3b50] bg-[#111722] px-3.5 py-1 text-xs font-mono font-medium text-[#e5a93c]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] audit-pulse-dot" />
                BYTEVOX // SHOW-YOUR-WORK REPORT BUILDER
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Reports that prove <br />
                <span className="text-[#e5a93c]">every number</span> they show.
              </h1>

              <p className="text-base text-slate-300 leading-relaxed max-w-2xl font-sans">
                Spreadsheets arrive messy with blanks, bad dates, and odd values. ByteVox parses and profiles them honestly without silent data loss, builds modular reports, and lets anyone click a number to inspect the plain-English explanation, SQL query, and exact row exclusion proofs.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="/login"
                  className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-semibold"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Try Live with Demo Account
                </a>
                <a
                  href="/register"
                  className="btn-secondary px-5 py-2.5 text-xs font-semibold"
                >
                  Create Account
                </a>
              </div>
            </div>

            {/* Architecture Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
              <div className="precision-card p-6 space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#141b27] text-[#e5a93c] border border-[#243144]">
                  <Database className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Honest CSV Ingestion</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Infers types (number, date, category, text) and profiles missing values and unparseable lines with exact line numbers and failure reasons.
                </p>
              </div>

              <div className="precision-card p-6 space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#141b27] text-[#10b981] border border-[#243144]">
                  <Calculator className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">The &quot;Show-Your-Work&quot; Twist</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click any metric, chart, or table. Inspect the formula, server-executed query, and an exact tally of rows included vs. excluded with reasons.
                </p>
              </div>

              <div className="precision-card p-6 space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#141b27] text-cyan-400 border border-[#243144]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Zero-Leak Share Links</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generate tokenized links with expiration and instant revocation. Viewers cannot reach the raw CSV file or other users&apos; reports.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1c2331] pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Workspace // {user?.name}
                  </h1>
                  <span className="font-mono text-[10px] text-[#10b981] bg-[#0c2419] border border-[#1b3d2f] px-2 py-0.5 rounded">
                    AUTHENTICATED
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Multi-tenant isolation active • SQLite WAL Engine
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="/reports/new"
                  className="btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Report
                </a>
              </div>
            </div>

            {/* Upload Zone */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Ingest & Profile Spreadsheet
                </h2>
              </div>
              <FileUploadZone onUploadSuccess={handleUploadSuccess} />
            </div>

            {/* Datasets & Reports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              {/* Datasets Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-[#e5a93c]" />
                    <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      Your Datasets ({datasets.length})
                    </h2>
                  </div>
                  <a href="/datasets" className="text-xs font-mono text-[#e5a93c] hover:text-[#fbbf24]">
                    View all &rarr;
                  </a>
                </div>

                {datasets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#202838] bg-[#0c1017] p-8 text-center text-xs font-mono text-slate-400">
                    No datasets uploaded yet. Drop a CSV above or click &quot;Load Messy Sample CSV&quot;.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {datasets.slice(0, 4).map((d) => (
                      <div
                        key={d.id}
                        className="precision-card p-4 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="text-sm font-semibold text-white truncate">{d.name}</h3>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                            <span>{d.rowCount} total rows</span>
                            <span>•</span>
                            <span className={d.unparseableCount > 0 ? 'text-[#f43f5e] font-bold' : 'text-slate-400'}>
                              {d.unparseableCount} unreadable
                            </span>
                            <span>•</span>
                            <span>{d.columns?.length || 0} cols</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => inspectDataset(d.id)}
                            className="btn-secondary px-2.5 py-1 text-xs font-mono"
                          >
                            Profile
                          </button>
                          <a
                            href={`/reports/new?datasetId=${d.id}`}
                            className="rounded-lg bg-[#182333] text-[#e5a93c] border border-[#2b3a50] px-2.5 py-1 text-xs font-mono font-semibold hover:bg-[#202d42] transition-colors"
                          >
                            Build
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reports Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#10b981]" />
                    <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      Your Reports ({reports.length})
                    </h2>
                  </div>
                  <a href="/reports" className="text-xs font-mono text-[#e5a93c] hover:text-[#fbbf24]">
                    View all &rarr;
                  </a>
                </div>

                {reports.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#202838] bg-[#0c1017] p-8 text-center text-xs font-mono text-slate-400">
                    No reports created yet. Upload a dataset to build your first report.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.slice(0, 4).map((r) => (
                      <div
                        key={r.id}
                        className="precision-card p-4 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="text-sm font-semibold text-white truncate">{r.title}</h3>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                            <span className="text-[#e5a93c]">{r.datasetName}</span>
                            <span>•</span>
                            <span>{r.blockCount} blocks</span>
                            {r.shareCount > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-[#10b981] flex items-center gap-1">
                                  <Share2 className="h-3 w-3" /> Shared
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <a
                          href={`/reports/${r.id}`}
                          className="btn-primary flex items-center gap-1 px-3 py-1 text-xs font-semibold"
                        >
                          Open
                          <ArrowRight className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Dataset Profile Slide-over Drawer */}
      <DatasetProfileDrawer
        isOpen={selectedDatasetForProfile !== null}
        onClose={() => setSelectedDatasetForProfile(null)}
        dataset={selectedDatasetForProfile}
        previewRows={selectedDatasetForProfile?.previewRows || []}
      />
    </div>
  );
}
