import React from 'react';
import {
  BookOpen,
  Sparkles,
  ShieldCheck,
  Search,
  FileCheck,
  Layers,
  ArrowRight,
  GraduationCap,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-full flex flex-col bg-[#0B0F19] text-white">
      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-32 overflow-hidden flex flex-col items-center text-center">
        {/* Glow ambient background elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[250px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Intelligent Document Research Assistant</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] text-slate-100">
          Transform Your Research with{' '}
          <span className="gradient-text">Verifiable Evidence</span> & AI
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          DocMind AI extracts, indexes, and compares complex multi-document PDFs with
          deterministic hybrid retrieval. Receive comprehensive answers with exact source page
          citations—never hallucinations.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('chat')}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all transform hover:-translate-y-0.5"
          >
            <span>Start Researching Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('login')}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm transition-all"
          >
            <span>Demo Account Login</span>
          </button>
        </div>

        {/* Feature Badges Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full text-left">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <FileCheck className="w-5 h-5 text-cyan-400 mb-2" />
            <h4 className="text-sm font-semibold text-slate-200">100% Citation Grounding</h4>
            <p className="text-xs text-slate-400 mt-1">Exact page numbers & verbatim source passages.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <Layers className="w-5 h-5 text-blue-400 mb-2" />
            <h4 className="text-sm font-semibold text-slate-200">Multi-Doc Synthesis</h4>
            <p className="text-xs text-slate-400 mt-1">Cross-document comparison & contradiction detection.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <ShieldCheck className="w-5 h-5 text-indigo-400 mb-2" />
            <h4 className="text-sm font-semibold text-slate-200">Injection Defense</h4>
            <p className="text-xs text-slate-400 mt-1">Rigorous sanitization against malicious embedded prompts.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <GraduationCap className="w-5 h-5 text-violet-400 mb-2" />
            <h4 className="text-sm font-semibold text-slate-200">AI Study Suite</h4>
            <p className="text-xs text-slate-400 mt-1">Instant MCQs, flashcard flip decks, & revision notes.</p>
          </div>
        </div>
      </section>

      {/* Interactive Workflow Section */}
      <section className="px-6 py-16 bg-[#111827]/40 border-y border-slate-800/80">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Enterprise RAG Pipeline Built for Rigorous Precision
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              How DocMind AI ingests and grounds answers with sub-millisecond retrieval.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-base font-semibold text-white">PyMuPDF Ingestion & OCR</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extracts text page-by-page preserving exact coordinate bounds and page indices.
                Splits content into sentence-aware sliding chunks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-base font-semibold text-white">Hybrid Retrieval (Dense + BM25)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Merges neural semantic cosine vectors with BM25 Okapi lexical scoring to catch
                both semantic intent and rare technical terminology.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-base font-semibold text-white">Verified Citation Synthesis</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Feeds delimited evidence into the LLM. Verifies that every assertion is corroborated
                by a cited passage, explicitly flagging missing facts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>© 2026 DocMind AI. Intelligent Document Research Assistant. Full-Stack RAG Platform.</p>
      </footer>
    </div>
  );
};
