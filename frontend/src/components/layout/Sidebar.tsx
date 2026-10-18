import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderArchive,
  UploadCloud,
  MessageSquare,
  FileText,
  History,
  GraduationCap,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'library', label: 'Document Library', icon: FolderArchive },
    { id: 'upload', label: 'Upload & Ingest', icon: UploadCloud },
    { id: 'chat', label: 'Research Chat', icon: MessageSquare, highlight: true },
    { id: 'pdf-viewer', label: 'PDF Viewer', icon: FileText },
    { id: 'history', label: 'Conversation History', icon: History },
    { id: 'study', label: 'AI Study Tools', icon: GraduationCap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Console', icon: ShieldCheck });
  }

  return (
    <aside
      className={`relative border-r border-slate-800/80 bg-[#0B0F19]/95 flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between px-2">
          {!collapsed && (
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Workspace
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ml-auto"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-blue-400' : 'text-slate-400'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate flex items-center justify-between w-full">
                    <span>{item.label}</span>
                    {item.highlight && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 font-mono">
                        RAG
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {!collapsed && (
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-b from-blue-950/30 to-indigo-950/20 border border-blue-500/20 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dual-Mode AI Engine</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Grounding powered by PyMuPDF + Hybrid BM25 & dense vectors.
          </p>
        </div>
      )}
    </aside>
  );
};
