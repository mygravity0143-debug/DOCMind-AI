import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, User as UserIcon, LogOut, Shield, Sparkles } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
            <div className="w-full h-full bg-[#0B0F19] rounded-[11px] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-blue-300 transition-colors">
                DocMind <span className="text-cyan-400">AI</span>
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Research v1.0
              </span>
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <button
              onClick={() => onNavigate('chat')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors text-xs font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Assistant</span>
            </button>

            <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
              <button
                onClick={() => onNavigate('settings')}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-850 flex items-center justify-center border border-slate-700 text-xs font-semibold text-slate-300">
                  {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-200">
                    {user?.full_name || user?.email.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">{user?.role}</div>
                </div>
              </button>

              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('login')}
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="text-sm font-medium px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
