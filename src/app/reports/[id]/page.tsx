'use client';

import { useState, useEffect, use, Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import GlobalFilterBar from '@/components/report/GlobalFilterBar';
import MetricBlock from '@/components/report/blocks/MetricBlock';
import ChartBlock from '@/components/report/blocks/ChartBlock';
import TableBlock from '@/components/report/blocks/TableBlock';
import TextNoteBlock from '@/components/report/blocks/TextNoteBlock';
import HowWasThisCalculatedDrawer from '@/components/report/audit/HowWasThisCalculatedDrawer';
import AddBlockModal from '@/components/report/AddBlockModal';
import ShareModal from '@/components/report/share/ShareModal';
import ExportReportModal from '@/components/report/export/ExportReportModal';
import {
  Plus,
  Share2,
  Download,
  ChevronUp,
  ChevronDown,
  Trash2,
  Database,
  Calculator,
  RefreshCw,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { AuditResult, ColumnProfile, GlobalFilters } from '@/types';

function ReportBuilderContent({ reportId }: { reportId: string }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calculationResults, setCalculationResults] = useState<Record<string, any>>({});
  const [calculating, setCalculating] = useState(false);

  // Modals and Drawers
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Audit Drawer State
  const [selectedAudit, setSelectedAudit] = useState<AuditResult | null>(null);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/${reportId}`);
      if (!res.ok) throw new Error('Failed to load report');
      const data = await res.json();
      setReport(data.report);

      calculateAllBlocks();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAllBlocks = async (overrideFilters?: GlobalFilters) => {
    try {
      setCalculating(true);
      const res = await fetch(`/api/reports/${reportId}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        setCalculationResults(data.results || {});
      }
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleGlobalFiltersChange = async (updatedFilters: GlobalFilters) => {
    try {
      await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalFilters: updatedFilters }),
      });

      setReport((prev: any) => ({ ...prev, globalFilters: updatedFilters }));
      calculateAllBlocks(updatedFilters);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInspectAudit = async (blockId: string) => {
    try {
      setIsAuditDrawerOpen(true);
      setAuditLoading(true);

      const res = await fetch(`/api/reports/${reportId}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedAudit(data.audit);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleMoveBlock = async (index: number, direction: 'up' | 'down') => {
    if (!report?.blocks) return;
    const newBlocks = [...report.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    setReport({ ...report, blocks: newBlocks });

    try {
      await fetch(`/api/reports/${reportId}/blocks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderedBlockIds: newBlocks.map((b) => b.id),
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this block?')) return;
    try {
      const res = await fetch(`/api/reports/${reportId}/blocks/${blockId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setReport((prev: any) => ({
          ...prev,
          blocks: prev.blocks.filter((b: any) => b.id !== blockId),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e5a93c] border-t-transparent" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-3 min-h-[60vh] font-mono">
        <p className="text-xs text-slate-400">Report not found or access denied.</p>
        <a href="/reports" className="text-xs text-[#e5a93c] hover:text-[#fbbf24]">
          &larr; Back to Reports
        </a>
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Workspace Toolbar Header */}
      <div className="precision-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
              {report.title}
            </h1>
            <span className="rounded-full bg-[#151c27] px-2.5 py-0.5 text-[10px] font-mono font-semibold text-[#e5a93c] border border-[#26354a] shrink-0 flex items-center gap-1">
              <Database className="h-3 w-3 text-[#10b981]" />
              {report.dataset.name}
            </span>
          </div>
          {report.description && (
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              {report.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => calculateAllBlocks()}
            disabled={calculating}
            className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono disabled:opacity-50"
            title="Refresh all server calculations"
          >
            <RefreshCw className={`h-3 w-3 ${calculating ? 'animate-spin text-[#e5a93c]' : ''}`} />
            <span>Recalculate</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono"
          >
            <Download className="h-3 w-3 text-slate-400" />
            <span>Export</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#e5a93c] border-[#2f3d53]"
          >
            <Share2 className="h-3 w-3" />
            <span>Share Link</span>
          </button>

          <button
            onClick={() => setIsAddBlockOpen(true)}
            className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Block</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <GlobalFilterBar
        columns={report.dataset.columns || []}
        filters={report.globalFilters || {}}
        onFiltersChange={handleGlobalFiltersChange}
      />

      {/* Report Canvas (Exportable Container) */}
      <div id="report-canvas" className="space-y-6 pt-1">
        {report.blocks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#202838] bg-[#0c1017] p-12 text-center space-y-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#141b27] text-[#e5a93c] mx-auto border border-[#273448]">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Your report canvas is ready</h3>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Add metrics, charts, tables, or notes. Every figure will show its exact provenance.
              </p>
            </div>
            <button
              onClick={() => setIsAddBlockOpen(true)}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              Add First Block
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {report.blocks.map((block: any, index: number) => {
              const audit = calculationResults[block.id];

              return (
                <div key={block.id} className="relative group">
                  {/* Block Controls Toolbar */}
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#080b11]/90 backdrop-blur-md border border-[#242f42] rounded-lg p-1 shadow-xl">
                    <button
                      onClick={() => handleMoveBlock(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Up"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleMoveBlock(index, 'down')}
                      disabled={index === report.blocks.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Down"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-1 rounded text-slate-400 hover:text-[#f43f5e]"
                      title="Delete Block"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Block Content Rendering */}
                  {block.blockType === 'METRIC' && (
                    <MetricBlock
                      id={block.id}
                      title={block.title}
                      config={block.config}
                      auditResult={audit}
                      onInspectAudit={handleInspectAudit}
                    />
                  )}

                  {block.blockType === 'CHART' && (
                    <ChartBlock
                      id={block.id}
                      title={block.title}
                      config={block.config}
                      auditResult={audit}
                      onInspectAudit={handleInspectAudit}
                    />
                  )}

                  {block.blockType === 'TABLE' && (
                    <TableBlock
                      id={block.id}
                      title={block.title}
                      config={block.config}
                      auditResult={audit}
                      onInspectAudit={handleInspectAudit}
                    />
                  )}

                  {block.blockType === 'TEXT_NOTE' && (
                    <TextNoteBlock
                      id={block.id}
                      title={block.title}
                      config={block.config}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Block Modal */}
      <AddBlockModal
        isOpen={isAddBlockOpen}
        onClose={() => setIsAddBlockOpen(false)}
        reportId={reportId}
        columns={report.dataset.columns || []}
        onBlockAdded={loadReport}
      />

      {/* Share Link Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        reportId={reportId}
        shareLinks={report.shareLinks || []}
        onLinksUpdated={loadReport}
      />

      {/* Export PDF / Image Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportTitle={report.title}
        reportElementId="report-canvas"
      />

      {/* How Was This Calculated Signature Drawer */}
      <HowWasThisCalculatedDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        audit={selectedAudit}
        loading={auditLoading}
      />
    </main>
  );
}

function ReportBuilderWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ReportBuilderContent reportId={id} />;
}

export default function ReportBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col text-slate-100">
      <Navbar />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e5a93c] border-t-transparent" />
        </div>
      }>
        <ReportBuilderWrapper params={params} />
      </Suspense>
    </div>
  );
}
