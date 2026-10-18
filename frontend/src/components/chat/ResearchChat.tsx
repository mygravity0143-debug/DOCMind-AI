import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bookmark,
  Copy,
  Check,
  Download,
  RotateCcw,
  Plus,
  Layers,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { ChatMessage, Citation, DocumentItem, ChatSession } from '../../types';
import { api } from '../../services/api';
import { EvidenceDrawer } from './EvidenceDrawer';

interface ResearchChatProps {
  initialSessionId?: string;
  onNavigateToPdf: (docId: string, pageNumber: number, snippet: string) => void;
}

export const ResearchChat: React.FC<ResearchChatProps> = ({
  initialSessionId,
  onNavigateToPdf,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(initialSessionId);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Evidence Drawer state
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load documents
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs = await api.getDocuments();
        setDocuments(docs);
      } catch (err) {
        console.error('Failed to load documents:', err);
      }
    };
    fetchDocs();
  }, []);

  // Load existing session if provided
  useEffect(() => {
    if (!activeSessionId) return;
    const fetchSession = async () => {
      try {
        const detail = await api.getChatSessionDetail(activeSessionId);
        setMessages(detail.messages);
        if (detail.document_ids && detail.document_ids.length > 0) {
          setSelectedDocIds(detail.document_ids);
        }
      } catch (err) {
        console.error('Failed to load session messages:', err);
      }
    };
    fetchSession();
  }, [activeSessionId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (questionText?: string) => {
    const q = questionText || inputQuestion;
    if (!q.trim() || isLoading) return;

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: q,
      citations: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const res = await api.askQuestion({
        question: q,
        session_id: activeSessionId,
        document_ids: selectedDocIds.length > 0 ? selectedDocIds : undefined,
      });

      if (!activeSessionId) {
        setActiveSessionId(res.session_id);
      }

      const asstMsg: ChatMessage = {
        id: res.message_id,
        role: 'assistant',
        content: res.answer,
        citations: res.citations,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, asstMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'system',
        content: `Error generating response: ${err.message || 'Server request failed.'}`,
        citations: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportNotes = () => {
    if (messages.length === 0) return;
    let md = `# DocMind AI — Research Notes\n*Exported on ${new Date().toLocaleString()}*\n\n`;

    messages.forEach((m) => {
      if (m.role === 'user') {
        md += `### Q: ${m.content}\n\n`;
      } else if (m.role === 'assistant') {
        md += `${m.content}\n\n`;
        if (m.citations && m.citations.length > 0) {
          md += `**Sources:**\n`;
          m.citations.forEach((c) => {
            md += `- *${c.filename}* (Page ${c.page_number}): "${c.text_snippet}"\n`;
          });
          md += `\n`;
        }
        md += `---\n\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DocMind_Research_Notes_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveSessionId(undefined);
  };

  const toggleDocSelection = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const sampleQuestions = [
    "What is the coherence time of the 128 physical qubit superconducting processor?",
    "What quorum formula does Raft require for leader election?",
    "How does Shor's algorithm impact RSA-2048 encryption?",
    "What are the election timeout and heartbeat intervals in Raft?",
  ];

  return (
    <div className="flex flex-col h-full bg-[#0B0F19] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl relative">
      {/* Top Bar: Multi-Document Scope Selector & Actions */}
      <div className="border-b border-slate-800 bg-[#111827]/90 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 shrink-0 mr-1">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Search Scope:</span>
          </span>

          <button
            onClick={() => setSelectedDocIds([])}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              selectedDocIds.length === 0
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Uploaded Documents ({documents.length})
          </button>

          {documents.map((d) => {
            const isSelected = selectedDocIds.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggleDocSelection(d.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all max-w-[170px] truncate shrink-0 border ${
                  isSelected
                    ? 'bg-blue-500/15 border-blue-500 text-blue-300'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {d.filename}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleExportNotes}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              title="Export research notes as markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Notes</span>
            </button>
          )}

          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-xl mx-auto py-12 text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-7 h-7 text-white" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Ask DocMind AI
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Query across your uploaded PDFs using natural language. Every answer is
                rigorously grounded in source passages and verifiable down to exact page numbers.
              </p>
            </div>

            <div className="space-y-2 text-left pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
                Suggested Research Queries:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sampleQuestions.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sq)}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 text-xs text-slate-300 text-left transition-all leading-snug group"
                  >
                    <span className="text-blue-400 group-hover:text-cyan-300 mr-1.5 font-bold">
                      →
                    </span>
                    {sq}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            const isSys = m.role === 'system';

            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20'
                      : isSys
                      ? 'bg-rose-950/40 border border-rose-500/30 text-rose-200'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* Citations list for assistant response */}
                  {!isUser && m.citations && m.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-cyan-400 flex items-center gap-1">
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Sources & Citations ({m.citations.length})</span>
                        </span>
                        <button
                          onClick={() => {
                            setActiveCitations(m.citations);
                            setDrawerOpen(true);
                          }}
                          className="text-[11px] text-blue-400 hover:underline"
                        >
                          View All Passages
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {m.citations.map((c, idx) => (
                          <button
                            key={c.citation_id || idx}
                            onClick={() => onNavigateToPdf(c.document_id, c.page_number, c.text_snippet)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-xs text-blue-300 transition-all font-mono group"
                            title={`Jump to Page ${c.page_number} in viewer`}
                          >
                            <span className="truncate max-w-[130px] font-sans">
                              {c.filename}
                            </span>
                            <span className="text-cyan-400 font-bold">P{c.page_number}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isUser && !isSys && (
                    <div className="flex items-center justify-end gap-2 mt-2 pt-1">
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                        title="Copy answer"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-center gap-3 text-slate-400 text-xs italic py-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <span>Retrieving evidentiary passages and verifying citations...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Query Input Box */}
      <div className="p-4 border-t border-slate-800 bg-[#111827]/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-inner"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask a question across your research documents..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-all shadow-md shadow-blue-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Side Evidence Drawer */}
      <EvidenceDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        citations={activeCitations}
        onJumpToPage={(docId, pageNum, snippet) => {
          setDrawerOpen(false);
          onNavigateToPdf(docId, pageNum, snippet);
        }}
      />
    </div>
  );
};
