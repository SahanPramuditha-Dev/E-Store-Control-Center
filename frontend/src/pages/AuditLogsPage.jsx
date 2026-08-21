import React, { useEffect, useState } from 'react';
import { History, Shield, RefreshCw, AlertCircle, Clock, UserCheck } from 'lucide-react';
import api from '../api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/audit-logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action) => {
    if (action.includes('CREATE') || action.includes('ISSUE')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (action.includes('SUSPEND') || action.includes('REVOKE') || action.includes('RESET')) {
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
    if (action.includes('RENEW') || action.includes('REACTIVATE')) {
      return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security & Audit Logs</h1>
          <p className="text-sm text-slate-400 mt-1">Immutable administrative action trail, license alterations, and security events</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No audit events recorded yet</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target Entity</th>
                  <th className="px-6 py-4">Entity ID</th>
                  <th className="px-6 py-4">Details / Metadata</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{log.entity_type}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#{log.entity_id}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-300 max-w-md truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
