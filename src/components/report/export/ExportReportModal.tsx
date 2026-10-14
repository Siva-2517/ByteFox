'use client';

import { useState } from 'react';
import { X, Download, FileText, Image, Check, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  reportElementId: string;
}

export default function ExportReportModal({
  isOpen,
  onClose,
  reportTitle,
  reportElementId,
}: ExportReportModalProps) {
  const [exporting, setExporting] = useState<'pdf' | 'png' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const exportAsImage = async () => {
    try {
      setExporting('png');
      const element = document.getElementById(reportElementId);
      if (!element) throw new Error('Report container element not found.');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#090d16',
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${reportTitle.toLowerCase().replace(/\s+/g, '_')}_export.png`;
      link.href = dataUrl;
      link.click();

      setSuccessMessage('PNG Image downloaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Export PNG failed:', err);
      alert('Failed to export as image: ' + err.message);
    } finally {
      setExporting(null);
    }
  };

  const exportAsPDF = async () => {
    try {
      setExporting('pdf');
      const element = document.getElementById(reportElementId);
      if (!element) throw new Error('Report container element not found.');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#090d16',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${reportTitle.toLowerCase().replace(/\s+/g, '_')}_report.pdf`);

      setSuccessMessage('PDF Document downloaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Export PDF failed:', err);
      alert('Failed to export as PDF: ' + err.message);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Export Report</h3>
              <p className="text-xs text-slate-400">Download formatted executive summary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 p-3 text-xs font-medium text-emerald-300">
            <Check className="h-4 w-4 shrink-0" />
            {successMessage}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={exportAsPDF}
            disabled={exporting !== null}
            className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 p-4 hover:border-indigo-500/40 hover:bg-white/5 transition-all group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <FileText className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  Export as PDF
                </div>
                <div className="text-xs text-slate-400">
                  Formatted vector document with audit summaries
                </div>
              </div>
            </div>
            {exporting === 'pdf' ? (
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            ) : (
              <Download className="h-4 w-4 text-slate-400 group-hover:text-white" />
            )}
          </button>

          <button
            onClick={exportAsImage}
            disabled={exporting !== null}
            className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 p-4 hover:border-cyan-500/40 hover:bg-white/5 transition-all group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Image className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  Export as High-Res Image (PNG)
                </div>
                <div className="text-xs text-slate-400">
                  Ready for slide decks, documentation, and chat
                </div>
              </div>
            </div>
            {exporting === 'png' ? (
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            ) : (
              <Download className="h-4 w-4 text-slate-400 group-hover:text-white" />
            )}
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
