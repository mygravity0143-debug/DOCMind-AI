import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  HardDrive,
  FileText,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  ArrowUpDown,
  Database,
  Cpu,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';

interface AdminStats {
  total_users: number;
  total_documents: number;
  total_chunks: number;
  total_sessions: number;
  total_queries: number;
  storage_used_mb: number;
  avg_latency_ms: number;
  system_status: string;
  uptime_seconds: number;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  document_count: number;
  query_count: number;
}

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'email' | 'created_at' | 'document_count'>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, usersData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = users
    .filter(
      (u) =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'email') cmp = a.email.localeCompare(b.email);
      else if (sortField === 'created_at') cmp = a.created_at.localeCompare(b.created_at);
      else if (sortField === 'document_count') cmp = (a.document_count || 0) - (b.document_count || 0);
      return sortAsc ? cmp : -cmp;
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading admin console…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <p className="text-sm text-slate-300">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Total Users',
      value: stats?.total_users ?? 0,
      icon: Users,
      color: 'blue',
      gradient: 'from-blue-600/20 to-blue-800/10',
      borderColor: 'border-blue-500/30',
      iconBg: 'bg-blue-500/15',
    },
    {
      label: 'Documents',
      value: stats?.total_documents ?? 0,
      icon: FileText,
      color: 'emerald',
      gradient: 'from-emerald-600/20 to-emerald-800/10',
      borderColor: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/15',
    },
    {
      label: 'Total Chunks',
      value: stats?.total_chunks ?? 0,
      icon: Database,
      color: 'violet',
      gradient: 'from-violet-600/20 to-violet-800/10',
      borderColor: 'border-violet-500/30',
      iconBg: 'bg-violet-500/15',
    },
    {
      label: 'Total Queries',
      value: stats?.total_queries ?? 0,
      icon: Activity,
      color: 'cyan',
      gradient: 'from-cyan-600/20 to-cyan-800/10',
      borderColor: 'border-cyan-500/30',
      iconBg: 'bg-cyan-500/15',
    },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600/30 to-amber-600/20 flex items-center justify-center border border-rose-500/30">
            <ShieldCheck className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Admin Console</h1>
            <p className="text-xs text-slate-400">System monitoring &amp; user management</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* System Health Banner */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full ${stats?.system_status === 'healthy' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/40' : 'bg-amber-400 shadow-lg shadow-amber-400/40'} animate-pulse`} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">System Status</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              stats?.system_status === 'healthy'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}>
              {stats?.system_status === 'healthy' ? 'All Systems Operational' : 'Degraded'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Uptime: {formatUptime(stats?.uptime_seconds ?? 0)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>Avg Latency: {(stats?.avg_latency_ms ?? 0).toFixed(1)}ms</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Storage: {(stats?.storage_used_mb ?? 0).toFixed(1)} MB</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-xl border ${card.borderColor} bg-gradient-to-br ${card.gradient} p-5`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 text-${card.color}-400`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {card.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">User Management</h2>
            <span className="text-xs text-slate-500 font-mono">({filteredUsers.length})</span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search users…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider">
                  <button onClick={() => toggleSort('email')} className="flex items-center gap-1 hover:text-slate-200">
                    User <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider">
                  <button onClick={() => toggleSort('document_count')} className="flex items-center gap-1 hover:text-slate-200">
                    Documents <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider">Queries</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider">
                  <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1 hover:text-slate-200">
                    Joined <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-[10px] font-semibold text-slate-300">
                          {(u.full_name || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200">{u.full_name || '—'}</div>
                          <div className="text-[10px] text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.role === 'admin'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                      }`}>
                        {u.role === 'admin' && <ShieldCheck className="w-2.5 h-2.5" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-500">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono">{u.document_count ?? 0}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono">{u.query_count ?? 0}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Storage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Storage Overview</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">Documents &amp; Indices</span>
                <span className="text-slate-300 font-mono">{(stats?.storage_used_mb ?? 0).toFixed(1)} MB</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{ width: `${Math.min(100, ((stats?.storage_used_mb ?? 0) / 1024) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">of 1 GB allocation</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-800/40 p-3">
                <div className="text-[10px] text-slate-500 mb-1">Active Sessions</div>
                <div className="text-lg font-bold text-white">{stats?.total_sessions ?? 0}</div>
              </div>
              <div className="rounded-lg bg-slate-800/40 p-3">
                <div className="text-[10px] text-slate-500 mb-1">Vector Chunks</div>
                <div className="text-lg font-bold text-white">{(stats?.total_chunks ?? 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">System Metrics</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Query Processing', value: `${(stats?.avg_latency_ms ?? 0).toFixed(1)}ms avg`, status: (stats?.avg_latency_ms ?? 0) < 100 ? 'good' : 'warn' },
              { label: 'Document Pipeline', value: 'Healthy', status: 'good' },
              { label: 'Vector Store', value: `${(stats?.total_chunks ?? 0).toLocaleString()} indexed`, status: 'good' },
              { label: 'AI Engine', value: 'Offline Grounded', status: 'good' },
            ].map((metric) => (
              <div key={metric.label} className="flex items-center justify-between rounded-lg bg-slate-800/40 px-4 py-3">
                <span className="text-xs text-slate-400">{metric.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-200 font-mono">{metric.value}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    metric.status === 'good' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
