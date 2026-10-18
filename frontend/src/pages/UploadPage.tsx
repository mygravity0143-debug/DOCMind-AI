import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  ScanText
} from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem } from '../types';

interface UploadPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onNavigate }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [enableOcr, setEnableOcr] = useState(true);
  const [uploadedDocs, setUploadedDocs] = useState<DocumentItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndAddFiles = (filesList: FileList | null) => {
    if (!filesList) return;
    setErrorMessage(null);
    const valid: File[] = [];

    Array.from(filesList).forEach((file) => {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage(`"${file.name}" is not a PDF. Only PDF files are supported.`);
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage(`"${file.name}" exceeds the 50MB upload limit.`);
        return;
      }
      valid.push(file);
    });

    setSelectedFiles((prev) => [...prev, ...valid]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndAddFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    setIsUploading(true);
    setErrorMessage(null);

    try {
      const results = await api.uploadDocuments(selectedFiles);
      setUploadedDocs(results);
      setSelectedFiles([]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload and indexing failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Upload & Ingest PDFs</h1>
        <p className="text-xs text-slate-400 mt-1">
          Ingest multi-page documents for vector indexing, sliding chunk creation, and citation grounding.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-4 ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-700/80 hover:border-slate-600 bg-[#111827]/70'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => validateAndAddFiles(e.target.files)}
          multiple
          accept=".pdf"
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
          <UploadCloud className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white">
            Drag & drop PDF files here, or <span className="text-blue-400 underline">browse</span>
          </h3>
          <p className="text-xs text-slate-400">
            Supports research papers, technical specs, scanned documents (up to 50MB each)
          </p>
        </div>
      </div>

      {/* Upload Settings / Ingestion options */}
      <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScanText className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="text-xs font-semibold text-slate-200">
              Scanned Document & OCR Detection
            </div>
            <div className="text-[11px] text-slate-400">
              Automatically identify image-heavy and scanned pages for text recovery
            </div>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enableOcr}
            onChange={(e) => setEnableOcr(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Selected File Queue */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Queued Files ({selectedFiles.length})
            </span>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-rose-400 hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-medium text-slate-200 truncate">{file.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                </div>

                <button
                  onClick={() => removeFile(idx)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Extracting Text & Generating Vectors...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Start Ingestion & Indexing</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Successfully Uploaded Results */}
      {uploadedDocs.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5" />
            <span>Successfully Processed & Indexed ({uploadedDocs.length})</span>
          </div>

          <div className="space-y-2">
            {uploadedDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200">{doc.filename}</div>
                  <div className="text-[11px] text-slate-400">
                    {doc.page_count} pages • {(doc.file_size / 1024).toFixed(0)} KB • Status:{' '}
                    <span className="text-emerald-400 font-semibold">{doc.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('pdf-viewer', { documentId: doc.id })}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-medium transition-colors"
                  >
                    View PDF
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onNavigate('chat')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20"
            >
              <span>Ask Questions in Research Chat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
