import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  ArrowRight,
  Clock,
  Plus
} from 'lucide-react';
import { ChatSession } from '../types';
import { api } from '../services/api';

interface ConversationHistoryPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ConversationHistoryPage: React.FC<ConversationHistoryPageProps> = ({ onNavigate }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getChatSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this conversation history?')) return;
    try {
      await api.deleteChatSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert('Failed to delete chat session.');
    }
  };

  const handleSaveRename = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      const updated = await api.updateChatSession(id, { title: editTitle.trim() });
      setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditingId(null);
    } catch (err) {
      alert('Failed to rename session.');
    }
  };

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Conversation History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review previous research threads, resume questions, or rename session contexts.
          </p>
        </div>

        <button
          onClick={() => onNavigate('chat')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Research Chat</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversation topics..."
          className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading conversations...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Conversations Found</h3>
          <p className="text-xs text-slate-400">
            Start a new research chat to begin interrogating your documents.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl bg-[#111827] border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-4 shadow-lg group"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  {editingId === s.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="px-2.5 py-1 rounded bg-slate-900 border border-blue-500 text-xs text-white focus:outline-none w-full max-w-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRename(s.id)}
                        className="p-1 rounded text-emerald-400 hover:bg-slate-800"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 rounded text-slate-400 hover:bg-slate-800"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="font-semibold text-xs text-slate-200 group-hover:text-blue-300 transition-colors truncate">
                      {s.title}
                    </h3>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(s.updated_at).toLocaleDateString()}</span>
                    </span>
                    <span>•</span>
                    <span>{s.message_count} messages</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigate('chat', { sessionId: s.id })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors"
                >
                  <span>Resume</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    setEditingId(s.id);
                    setEditTitle(s.title);
                  }}
                  title="Rename session"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(s.id)}
                  title="Delete session"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
