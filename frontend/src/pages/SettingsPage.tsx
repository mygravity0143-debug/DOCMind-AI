import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Key,
  User,
  Shield,
  Save,
  CheckCircle2,
  HardDrive,
  Cpu,
  Moon
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUserSettings } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [geminiKey, setGeminiKey] = useState(user?.settings?.gemini_api_key || '');
  const [openaiKey, setOpenaiKey] = useState(user?.settings?.openai_api_key || '');
  const [preferredModel, setPreferredModel] = useState(user?.settings?.preferred_model || 'gemini');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSaved(false);

    try {
      await updateUserSettings({
        full_name: fullName,
        gemini_api_key: geminiKey,
        openai_api_key: openaiKey,
        preferred_model: preferredModel,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Account & AI Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure model providers, enter custom API keys, and manage your researcher profile.
        </p>
      </div>

      {isSaved && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings successfully saved and applied.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm border-b border-slate-800 pb-3">
            <User className="w-4 h-4" />
            <span>Profile Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email (Read-only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* AI Model Keys Configuration */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4" />
            <span>AI Model & Provider Configuration</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Default LLM Generator
              </label>
              <select
                value={preferredModel}
                onChange={(e) => setPreferredModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="gemini">Google Gemini 1.5 Flash (Recommended)</option>
                <option value="openai">OpenAI GPT-4o Mini</option>
                <option value="offline">Offline Grounded Engine (No API key needed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Google Gemini API Key</span>
                <span className="text-[10px] text-slate-500">Optional (Offline fallback available)</span>
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>OpenAI API Key</span>
                <span className="text-[10px] text-slate-500">Optional</span>
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Storage Capacity Gauge */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-violet-400 font-semibold text-sm border-b border-slate-800 pb-3">
            <HardDrive className="w-4 h-4" />
            <span>Storage & Indexing Quota</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Document Storage</span>
              <span className="font-semibold text-slate-200">2.4 MB / 500 MB</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 w-[1%]" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/25 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
