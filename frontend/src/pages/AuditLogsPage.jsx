import React, { useEffect, useState } from 'react';
import { 
  History, Shield, RefreshCw, AlertCircle, Clock, 
  UserCheck, Search, Filter, FileSpreadsheet, Eye, X, ShieldAlert 
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { formatDateTime } from '../utils/dateUtils';


export default function AuditLogsPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
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
      return isDark 
        ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' 
        : 'bg-teal-50 text-teal-700 border-teal-200';
    }
    if (action.includes('SUSPEND') || action.includes('REVOKE') || action.includes('RESET') || action.includes('DEACTIVATE')) {
      return isDark 
        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
        : 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('RENEW') || action.includes('REACTIVATE')) {
      return isDark 
        ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' 
        : 'bg-sky-50 text-sky-700 border-sky-200';
    }
    return isDark 
      ? 'bg-slate-800 text-slate-300 border-slate-700' 
      : 'bg-slate-100 text-slate-700 border-slate-200';
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
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Security & Administrative Audit Logs
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Immutable audit record of all tenant setups, license issuances, renewals, machine resets, and operator actions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition shadow-xs active:scale-95 ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
                : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchLogs}
            className={`p-2.5 rounded-2xl border transition shadow-xs active:scale-95 ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
                : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400'
            }`}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={`flex flex-col md:flex-row gap-3 p-4 rounded-3xl border shadow-sm ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search audit actions, entity IDs, keywords in details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none transition border ${
              isDark 
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-teal-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-teal-600'
            }`}
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className={`rounded-2xl px-3 py-2.5 text-xs font-bold focus:outline-none border ${
            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <option value="ALL">All Actions</option>
          <option value="ONBOARD">ONBOARD</option>
          <option value="ISSUE">ISSUE</option>
          <option value="RENEW">RENEW</option>
          <option value="RESET">RESET</option>
          <option value="SUSPEND">SUSPEND</option>
          <option value="REACTIVATE">REACTIVATE</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-sm ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`uppercase tracking-wider text-[10px] font-bold border-b ${
              isDark ? 'text-slate-400 bg-slate-950/80 border-slate-800' : 'text-slate-600 bg-slate-50 border-slate-200'
            }`}>
              <tr>
                <th className="px-5 py-4">Log ID</th>
                <th className="px-5 py-4">Action Event</th>
                <th className="px-5 py-4">Target Resource</th>
                <th className="px-5 py-4">Audit Details</th>
                <th className="px-5 py-4">Timestamp</th>
                <th className="px-5 py-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
            }`}>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 text-teal-500 animate-spin mx-auto mb-2" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No audit records match your search filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className={`transition ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-5 py-4 font-mono text-slate-400">
                      #{log.id}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{log.entity_type}</div>
                      <div className="font-mono text-slate-400 text-[10px]">ID: #{log.entity_id}</div>
                    </td>

                    <td className="px-5 py-4 max-w-xs truncate font-mono text-[11px] text-slate-400">
                      {JSON.stringify(log.details)}
                    </td>

                    <td className="px-5 py-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {formatDateTime(log.created_at)}
                    </td>


                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        title="View Full JSON Details"
                        className={`p-1.5 rounded-xl border transition ${
                          isDark ? 'bg-slate-800/80 hover:bg-slate-700 text-teal-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-teal-700 border-slate-200'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-teal-500" />
                <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Audit Event #{selectedLog.id}
                </h2>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400">Action:</span>
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono border ${getActionBadge(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400">Target Entity:</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedLog.entity_type} #{selectedLog.entity_id}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400">Timestamp:</span>
                <span className="font-mono text-slate-400">{new Date(selectedLog.created_at).toLocaleString()}</span>
              </div>

              <div>
                <span className="block font-bold text-slate-400 mb-1.5">JSON Payload & Metadata:</span>
                <pre className={`p-4 rounded-2xl border font-mono text-[11px] overflow-x-auto max-h-60 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-teal-400' : 'bg-slate-50 border-slate-200 text-teal-800'
                }`}>
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              <div className={`flex justify-end pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className={`px-5 py-2 rounded-xl font-bold border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
