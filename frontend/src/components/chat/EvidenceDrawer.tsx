import React from 'react';
import { X, ExternalLink, Bookmark, CheckCircle, Percent } from 'lucide-react';
import { Citation } from '../../types';

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  citations: Citation[];
  onJumpToPage: (docId: string, pageNumber: number, snippet: string) => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  isOpen,
  onClose,
  citations,
  onJumpToPage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#111827] border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-slide-left">
      <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-sm text-white">Retrieved Evidence & Citations</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {citations.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No citations available for this answer.
          </div>
        ) : (
          citations.map((c, i) => (
            <div
              key={c.citation_id || i}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-400 truncate max-w-[180px]">
                  {c.filename}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-cyan-300 font-mono text-[11px] font-medium border border-blue-500/20">
                  Page {c.page_number}
                </span>
              </div>

              <blockquote className="text-xs text-slate-300 leading-relaxed italic border-l-2 border-cyan-500 pl-3 py-0.5 bg-slate-950/40 rounded-r">
                "{c.text_snippet}"
              </blockquote>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                <div className="flex items-center gap-1 text-slate-400">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Relevance: {Math.round((c.confidence_score || 0.95) * 100)}%</span>
                </div>

                <button
                  onClick={() => onJumpToPage(c.document_id, c.page_number, c.text_snippet)}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  <span>Open Page {c.page_number}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
