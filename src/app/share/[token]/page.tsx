'use client';

import { useState, useEffect, use, Suspense } from 'react';
import MetricBlock from '@/components/report/blocks/MetricBlock';
import ChartBlock from '@/components/report/blocks/ChartBlock';
import TableBlock from '@/components/report/blocks/TableBlock';
import TextNoteBlock from '@/components/report/blocks/TextNoteBlock';
import HowWasThisCalculatedDrawer from '@/components/report/audit/HowWasThisCalculatedDrawer';
import ExportReportModal from '@/components/report/export/ExportReportModal';
import {
  BarChart3,
  Database,
  Lock,
  Download,
  ShieldCheck,
  AlertOctagon,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AuditResult } from '@/types';

function SharedReportContent({ token }: { token: string }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audit Drawer State
  const [selectedAudit, setSelectedAudit] = useState<AuditResult | null>(null);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    loadSharedReport();
  }, [token]);

  const loadSharedReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/share/${token}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorStatus(data.status || 'error');
        setErrorMessage(data.error || 'Failed to load report.');
        return;
      }

      setReport(data.report);
    } catch (err: any) {
      setErrorStatus('error');
      setErrorMessage(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleInspectAudit = (blockId: string) => {
    if (!report?.blockResults?.[blockId]) return;
    setSelectedAudit(report.blockResults[blockId]);
    setIsAuditDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="mt-3 text-xs text-slate-400">Verifying secure share token...</p>
      </div>
    );
  }

  if (errorStatus) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-slate-100 min-h-[60vh]">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] p-8 text-center space-y-4 shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 mx-auto border border-rose-500/30">
            {errorStatus === 'revoked' ? (
              <Lock className="h-6 w-6" />
            ) : errorStatus === 'expired' ? (
              <Clock className="h-6 w-6" />
            ) : (
              <AlertOctagon className="h-6 w-6" />
            )}
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {errorStatus === 'revoked'
              ? 'Report Link Revoked'
              : errorStatus === 'expired'
              ? 'Report Link Expired'
              : 'Access Denied'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
            >
              Go to ByteVox Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Report Overview Banner */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {report.title}
            </h1>
            {report.description && (
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {report.description}
              </p>
            )}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="text-indigo-300 font-medium">{report.datasetName}</span>
              <span>•</span>
              <span>{report.datasetRowCount} source rows</span>
              <span>•</span>
              <span>Published {new Date(report.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3 text-xs text-indigo-200/90 max-w-xs shrink-0">
            <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              Interactive Proof
            </div>
            Click any metric or chart below to open the complete calculation audit and row inclusion breakdown.
          </div>
        </div>

        {/* Blocks Canvas */}
        <div id="shared-report-canvas" className="space-y-6">
          {report.blocks.map((block: any) => {
            const audit = report.blockResults?.[block.id];

            return (
              <div key={block.id}>
                {block.blockType === 'METRIC' && (
                  <MetricBlock
                    id={block.id}
                    title={block.title}
                    config={block.config}
                    auditResult={audit}
                    onInspectAudit={handleInspectAudit}
                    isReadOnly
                  />
                )}

                {block.blockType === 'CHART' && (
                  <ChartBlock
                    id={block.id}
                    title={block.title}
                    config={block.config}
                    auditResult={audit}
                    onInspectAudit={handleInspectAudit}
                    isReadOnly
                  />
                )}

                {block.blockType === 'TABLE' && (
                  <TableBlock
                    id={block.id}
                    title={block.title}
                    config={block.config}
                    auditResult={audit}
                    onInspectAudit={handleInspectAudit}
                    isReadOnly
                  />
                )}

                {block.blockType === 'TEXT_NOTE' && (
                  <TextNoteBlock
                    id={block.id}
                    title={block.title}
                    config={block.config}
                    isReadOnly
                  />
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Audit Drawer (Interactive in shared view!) */}
      <HowWasThisCalculatedDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        audit={selectedAudit}
      />

      {/* Export Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportTitle={report.title}
        reportElementId="shared-report-canvas"
      />
    </>
  );
}

function SharedReportWrapper({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <SharedReportContent token={token} />;
}

export default function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col text-slate-100">
      {/* Shared Viewer Navbar */}
      <header className="border-b border-white/10 bg-[#090d16]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">ByteVox</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Read-Only Secure Share
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Verified Show-Your-Work Report</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-102"
            >
              Sign In to ByteVox
            </a>
          </div>
        </div>
      </header>

      <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-slate-100">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="mt-3 text-xs text-slate-400">Loading shared report...</p>
        </div>
      }>
        <SharedReportWrapper params={params} />
      </Suspense>
    </div>
  );
}
