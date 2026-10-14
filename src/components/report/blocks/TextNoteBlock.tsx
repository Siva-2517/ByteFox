'use client';

import { FileText } from 'lucide-react';
import { TextNoteConfig } from '@/types';

interface TextNoteBlockProps {
  id: string;
  title: string | null;
  config: TextNoteConfig;
  isReadOnly?: boolean;
}

export default function TextNoteBlock({
  id,
  title,
  config,
  isReadOnly = false,
}: TextNoteBlockProps) {
  return (
    <div className="precision-card p-6 border-l-2 border-l-[#e5a93c] relative overflow-hidden transition-all">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-[#161c28] text-[#e5a93c] border border-[#232d3f]">
          <FileText className="h-3.5 w-3.5" />
        </div>
        <div>
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
            ANALYST NOTE
          </span>
          <h3 className="text-sm font-semibold text-slate-200">
            {title || 'Context & Strategic Annotation'}
          </h3>
        </div>
      </div>

      <div className="text-xs sm:text-sm leading-relaxed text-slate-300 whitespace-pre-wrap rounded-xl bg-[#090b10] p-4 border border-[#1b2230] font-sans">
        {config.content || 'No content provided for this note.'}
      </div>
    </div>
  );
}
