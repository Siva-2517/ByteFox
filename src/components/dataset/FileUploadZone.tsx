'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface FileUploadZoneProps {
  onUploadSuccess: (dataset: any) => void;
}

export default function FileUploadZone({ onUploadSuccess }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      setError(null);
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\.csv$/i, ''));

      const res = await fetch('/api/datasets', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse and upload CSV.');
      }

      onUploadSuccess(data.dataset);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = async () => {
    try {
      setError(null);
      setUploading(true);
      const res = await fetch('/samples/messy_sales_data.csv');
      if (!res.ok) throw new Error('Could not load sample dataset.');
      const blob = await res.blob();
      const file = new File([blob], 'messy_sales_data.csv', { type: 'text/csv' });
      await handleFile(file);
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all bg-[#0a0d14] ${
          isDragging
            ? 'border-[#e5a93c] bg-[#141923] scale-[1.01]'
            : 'border-[#222a3a] hover:border-[#e5a93c]/50 hover:bg-[#0e121a]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#141b27] text-[#e5a93c] border border-[#273448] shadow-inner">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#e5a93c]" />
            ) : (
              <UploadCloud className="h-6 w-6" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">
              {uploading ? 'Parsing CSV & Profiling Dirty Lines...' : 'Drop your CSV spreadsheet here, or click to browse'}
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Parses on server, infers types, and catches unreadable rows without silent drops. Max 15MB.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-[#200c11] border border-[#401824] p-3 text-xs text-[#f43f5e] font-mono">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Action: Pre-built Messy Sample Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-[#1e2533] bg-[#0c1017] p-3.5">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-[#e5a93c] audit-pulse-dot" />
          <div className="text-xs text-slate-300 font-mono">
            <strong>Evaluator Quickstart:</strong> Ingest the pre-built messy retail sales dataset (1,001 rows with deliberate blanks, bad dates, and jagged lines).
          </div>
        </div>
        <button
          type="button"
          onClick={handleLoadSample}
          disabled={uploading}
          className="btn-secondary flex items-center gap-2 px-3 py-1.5 text-xs font-mono shrink-0 disabled:opacity-50"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-[#e5a93c]" />
          Load Messy Sample CSV
        </button>
      </div>
    </div>
  );
}
