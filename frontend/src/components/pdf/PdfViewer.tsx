import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Bookmark,
  Highlighter,
  ExternalLink,
  Layers
} from 'lucide-react';
import { DocumentItem, DocumentDetail, Citation } from '../../types';
import { api } from '../../services/api';

interface PdfViewerProps {
  documentId?: string;
  initialPage?: number;
  highlightText?: string;
  citation?: Citation | null;
  onSelectDocument?: (docId: string) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  documentId,
  initialPage = 1,
  highlightText,
  citation,
  onSelectDocument,
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(documentId || '');
  const [docDetail, setDocDetail] = useState<DocumentDetail | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeHighlight, setActiveHighlight] = useState<string>(highlightText || citation?.text_snippet || '');

  // Load document list
  useEffect(() => {
    const loadDocs = async () => {
      try {
        const list = await api.getDocuments();
        setDocuments(list);
        if (!selectedDocId && list.length > 0) {
          setSelectedDocId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load documents:', err);
      }
    };
    loadDocs();
  }, []);

  // Update selected doc if prop changes
  useEffect(() => {
    if (documentId) {
      setSelectedDocId(documentId);
    }
  }, [documentId]);

  // Update page & highlight if citation changes
  useEffect(() => {
    if (initialPage) {
      setCurrentPage(initialPage);
    }
    if (citation) {
      setCurrentPage(citation.page_number);
      setActiveHighlight(citation.text_snippet);
      if (citation.document_id) {
        setSelectedDocId(citation.document_id);
      }
    } else if (highlightText) {
      setActiveHighlight(highlightText);
    }
  }, [initialPage, citation, highlightText]);

  // Load active doc details
  useEffect(() => {
    if (!selectedDocId) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const detail = await api.getDocumentDetail(selectedDocId);
        setDocDetail(detail);
      } catch (err) {
        console.error('Failed to load doc detail:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [selectedDocId]);

  const maxPages = docDetail?.page_count || 1;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= maxPages) {
      setCurrentPage(newPage);
    }
  };

  // Get chunks on the current page to display formatted extracted text
  const currentPageChunks = docDetail?.chunks.filter((c) => c.page_number === currentPage) || [];

  const pdfUrl = selectedDocId ? `${api.getDocumentFileUrl(selectedDocId)}#page=${currentPage}` : '';

  return (
    <div className="flex flex-col h-full bg-[#0B0F19] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-slate-800 bg-[#111827]/90 px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <select
              value={selectedDocId}
              onChange={(e) => {
                setSelectedDocId(e.target.value);
                setCurrentPage(1);
                onSelectDocument?.(e.target.value);
              }}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium max-w-[240px] truncate"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename}
                </option>
              ))}
            </select>
          </div>

          {activeHighlight && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
              <Highlighter className="w-3.5 h-3.5" />
              <span>Evidence Highlight Active (Page {currentPage})</span>
            </div>
          )}
        </div>

        {/* Page navigation controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-40 hover:bg-slate-800 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center px-2 text-xs font-medium text-slate-300">
              <input
                type="number"
                min={1}
                max={maxPages}
                value={currentPage}
                onChange={(e) => handlePageChange(Number(e.target.value))}
                className="w-10 bg-transparent text-center text-blue-400 font-semibold focus:outline-none"
              />
              <span className="text-slate-500">/ {maxPages}</span>
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= maxPages}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-40 hover:bg-slate-800 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-2 text-slate-400">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {selectedDocId && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Open raw PDF in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Viewer Content Area: Split PDF display and Extracted Evidence Highlights */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left: Native PDF render frame */}
        <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden">
          {pdfUrl ? (
            <iframe
              key={`${selectedDocId}-p${currentPage}`}
              src={pdfUrl}
              className="w-full h-full border-none"
              title="PDF Reader"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <FileText className="w-12 h-12 mb-3 stroke-1" />
              <p className="text-sm">No document selected</p>
            </div>
          )}
        </div>

        {/* Right: Extracted Page Text & Real-Time Evidence Highlighter */}
        <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-slate-800 bg-[#111827]/95 flex flex-col shrink-0">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">
                Page {currentPage} Evidentiary Excerpts
              </span>
            </div>
            <span className="text-[10px] text-slate-500">
              {currentPageChunks.length} chunk{currentPageChunks.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {activeHighlight && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1.5">
                  <Highlighter className="w-3.5 h-3.5" />
                  <span>Target Citation Passage</span>
                </div>
                <blockquote className="text-slate-300 italic border-l-2 border-amber-400 pl-2.5 py-1">
                  "{activeHighlight}"
                </blockquote>
              </div>
            )}

            <div className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Indexed Text on Page {currentPage}
              </div>
              {currentPageChunks.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  No textual chunks extracted on this page.
                </p>
              ) : (
                currentPageChunks.map((chunk, idx) => {
                  const isHighlighted =
                    activeHighlight &&
                    chunk.content.toLowerCase().includes(activeHighlight.slice(0, 30).toLowerCase());

                  return (
                    <div
                      key={chunk.id || idx}
                      className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                        isHighlighted
                          ? 'bg-blue-600/15 border-blue-500/40 text-blue-200 shadow-md shadow-blue-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1.5">
                        <span>Chunk #{chunk.chunk_index}</span>
                        {isHighlighted && (
                          <span className="text-cyan-400 font-semibold">Matched Source</span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{chunk.content}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
