'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import FileUploadZone from '@/components/dataset/FileUploadZone';
import DatasetProfileDrawer from '@/components/dataset/DatasetProfileDrawer';
import { Database, Plus, Trash2, ArrowRight, AlertTriangle, FileSpreadsheet } from 'lucide-react';

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<any>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const res = await fetch('/api/datasets');
      if (res.ok) {
        const data = await res.json();
        setDatasets(data.datasets || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = async (id: string) => {
    try {
      const res = await fetch(`/api/datasets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDataset({
          ...data.dataset,
          previewRows: data.previewRows,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete dataset "${name}"? Any linked reports will also be deleted.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDatasets((prev) => prev.filter((d) => d.id !== id));
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Your Datasets</h1>
            <p className="text-xs text-slate-400">
              Upload spreadsheets, inspect inferred column types, and profile unreadable lines honestly.
            </p>
          </div>
        </div>

        {/* Upload Dropzone */}
        <div className="space-y-3">
          <FileUploadZone
            onUploadSuccess={(newDataset) => {
              setDatasets((prev) => [newDataset, ...prev]);
              setSelectedDataset(newDataset);
            }}
          />
        </div>

        {/* Dataset Table */}
        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Uploaded Datasets ({datasets.length})
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : datasets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-12 text-center text-xs text-slate-400">
              No datasets found. Drop a CSV file above or click &quot;Load Messy Sample CSV&quot;.
            </div>
          ) : (
            <div className="space-y-3">
              {datasets.map((d) => (
                <div
                  key={d.id}
                  className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-indigo-400 shrink-0" />
                      <h3 className="text-base font-semibold text-white truncate">{d.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>{d.filename}</span>
                      <span>•</span>
                      <span>{d.rowCount} total rows</span>
                      <span>•</span>
                      <span className={d.unparseableCount > 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                        {d.unparseableCount} unreadable lines
                      </span>
                      <span>•</span>
                      <span>{(d.fileSizeBytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleInspect(d.id)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
                    >
                      Inspect Profile
                    </button>
                    <a
                      href={`/reports/new?datasetId=${d.id}`}
                      className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-102"
                    >
                      Build Report
                      <ArrowRight className="h-3 w-3" />
                    </a>
                    <button
                      onClick={() => handleDelete(d.id, d.name)}
                      className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Delete Dataset"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <DatasetProfileDrawer
        isOpen={selectedDataset !== null}
        onClose={() => setSelectedDataset(null)}
        dataset={selectedDataset}
        previewRows={selectedDataset?.previewRows || []}
      />
    </div>
  );
}
