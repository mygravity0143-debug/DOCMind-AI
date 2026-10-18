import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Trash2,
  RotateCw,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { DocumentItem } from '../types';
import { api } from '../services/api';

interface DocumentLibraryPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DocumentLibraryPage: React.FC<DocumentLibraryPageProps> = ({ onNavigate }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDocuments({
        q: searchQuery || undefined,
        status: statusFilter || undefined,
      });
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [searchQuery, statusFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will remove all indexed chunks and embeddings.`)) {
      return;
    }
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  const handleReprocess = async (id: string) => {
    setReprocessingId(id);
    try {
      const updated = await api.reprocessDocument(id);
      setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch (err) {
      alert('Reprocessing failed.');
    } finally {
      setReprocessingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Document Library</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your ingested PDF collection, inspect page counts, and trigger re-indexing.
          </p>
        </div>

        <button
          onClick={() => onNavigate('upload')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New PDF</span>
        </button>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title..."
              className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="indexed">Indexed</option>
              <option value="processing">Processing</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Document Grid / List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          Loading library documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Documents Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload PDF research papers, technical manuals, or textbooks to begin chatting with
            grounded citations.
          </p>
          <button
            onClick={() => onNavigate('upload')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            Upload Now
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                      doc.status === 'indexed'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : doc.status === 'processing'
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {doc.status}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {(doc.file_size / 1024).toFixed(0)} KB
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-slate-100 group-hover:text-blue-300 transition-colors truncate">
                      {doc.filename}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {doc.page_count} page{doc.page_count === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                {doc.error_message && (
                  <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-300">
                    {doc.error_message}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onNavigate('pdf-viewer', { documentId: doc.id })}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Viewer</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleReprocess(doc.id)}
                    disabled={reprocessingId === doc.id}
                    title="Reprocess and re-embed document"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${reprocessingId === doc.id ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleDelete(doc.id, doc.filename)}
                    title="Delete document and vectors"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#111827] border border-slate-800 overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Document</th>
                <th className="p-4">Pages</th>
                <th className="p-4">Size</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-4 font-semibold flex items-center gap-3">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="truncate max-w-[260px]">{doc.filename}</span>
                  </td>
                  <td className="p-4">{doc.page_count}</td>
                  <td className="p-4 font-mono text-slate-400">{(doc.file_size / 1024).toFixed(0)} KB</td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                        doc.status === 'indexed'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => onNavigate('pdf-viewer', { documentId: doc.id })}
                      className="p-1.5 rounded-lg text-blue-400 hover:bg-slate-800"
                      title="Open viewer"
                    >
                      <ExternalLink className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleReprocess(doc.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
                      title="Reprocess"
                    >
                      <RotateCw className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.filename)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
