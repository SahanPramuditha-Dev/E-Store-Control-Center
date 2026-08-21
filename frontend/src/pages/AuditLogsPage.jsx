import React, { useEffect, useState } from 'react';
import { 
  History, Shield, RefreshCw, AlertCircle, Clock, 
  UserCheck, Search, Filter, FileSpreadsheet, Eye, X 
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';

export default function AuditLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/audit-logs?limit=100');
      setLogs(res.data);
    } catch (err) {
      showToast('Failed to load security audit log.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action) => {
    if (action.includes('CREATE') || action.includes('ISSUE') || action.includes('ONBOARD')) {
      return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
    }
    if (action.includes('SUSPEND') || action.includes('REVOKE') || action.includes('RESET') || action.includes('DEACTIVATE')) {
      return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    }
    if (action.includes('RENEW') || action.includes('REACTIVATE')) {
      return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Action', 'Entity Type', 'Entity ID', 'Details', 'Timestamp'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.action,
      l.entity_type,
      `#${l.entity_id}`,
      `"${JSON.stringify(l.details).replace(/"/g, '""')}"`,
      new Date(l.created_at).toLocaleString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estore-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported audit trail to CSV.', 'success');
  };

  const filteredLogs = logs.filter((log) => {
    const detailsStr = JSON.stringify(log.details || {}).toLowerCase();
    const matchesSearch =
      (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.entity_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.entity_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      detailsStr.includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Security & Administrative Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable audit record of all tenant setups, license issuances, renewals, machine resets, and operator actions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchLogs}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search audit actions, entity IDs, keywords in details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
        >
          <option value="ALL">All Event Types</option>
          <option value="ONBOARD">ONBOARD</option>
          <option value="ISSUE">ISSUE / CREATE</option>
          <option value="RENEW">RENEW</option>
          <option value="RESET">RESET</option>
          <option value="SUSPEND">SUSPEND</option>
          <option value="REVOKE">REVOKE</option>
          <option value="PAYMENT">PAYMENT</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="uppercase tracking-wider text-[10px] text-slate-400 bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Action Type</th>
                <th className="px-5 py-4">Target Entity</th>
                <th className="px-5 py-4">Entity ID</th>
                <th className="px-5 py-4">Audit Details</th>
                <th className="px-5 py-4">Timestamp</th>
                <th className="px-5 py-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 text-teal-400 animate-spin mx-auto mb-2" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-semibold text-white">
                      {log.entity_type}
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-400">
                      #{log.entity_id}
                    </td>

                    <td className="px-5 py-4 font-mono text-[11px] text-slate-400 max-w-sm truncate">
                      {JSON.stringify(log.details)}
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-teal-400 hover:bg-teal-500/10 rounded-lg transition"
                        title="View Full Payload Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${getActionBadge(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
                <span className="text-xs text-slate-400">#{selectedLog.entity_id} ({selectedLog.entity_type})</span>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">Timestamp:</span>
              <p className="text-sm font-mono text-white">{new Date(selectedLog.created_at).toLocaleString()}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">Metadata JSON:</span>
              <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-teal-300 overflow-x-auto max-h-60 leading-relaxed">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
