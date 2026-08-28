import React, { useEffect, useState } from 'react';
import { 
  History, Shield, RefreshCw, AlertCircle, Clock, 
  UserCheck, Search, Filter, FileSpreadsheet, Eye, X, ShieldAlert 
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { formatDateTime } from '../utils/dateUtils';
import { Select, Button, Badge, PageHeader, Modal, EmptyState } from '../components/UI';

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
        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
        : 'bg-indigo-50 text-indigo-700 border-indigo-200';
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
    <div className="space-y-7 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Centralized Page Header */}
      <PageHeader
        eyebrow="Immutable Compliance & Governance"
        title="Security & Administrative Audit Logs"
        subtitle="Immutable audit record of all tenant setups, license issuances, renewals, machine resets, and operator actions"
        badges={[
          { label: `${logs.length} Recorded Events`, tone: 'indigo' },
          { label: 'Append-Only Ledger', tone: 'emerald' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              icon={FileSpreadsheet}
            >
              Export CSV
            </Button>
            <Button
              variant="purple-gradient"
              size="sm"
              onClick={fetchLogs}
              icon={RefreshCw}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        }
      />

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
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
            }`}
          />
        </div>

        <div className="w-52 shrink-0">
          <Select
            value={actionFilter}
            onChange={(val) => setActionFilter(val)}
            options={[
              { value: 'ALL', label: 'All Log Actions' },
              { value: 'CREATE', label: 'Creations & Onboarding' },
              { value: 'ISSUE', label: 'Key Issuances' },
              { value: 'RENEW', label: 'Renewals' },
              { value: 'RESET', label: 'Hardware Resets' },
              { value: 'SUSPEND', label: 'Suspensions & Blocks' },
            ]}
            size="md"
            fullWidth
          />
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-sm ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`uppercase tracking-wider text-[10px] font-bold border-b ${
              isDark ? 'text-slate-400 bg-slate-950/80 border-slate-800' : 'text-slate-600 bg-slate-50 border-slate-200'
            }`}>
              <tr>
                <th className="px-5 py-4">Event ID</th>
                <th className="px-5 py-4">Security Action</th>
                <th className="px-5 py-4">Target Entity</th>
                <th className="px-5 py-4">Payload Summary</th>
                <th className="px-5 py-4">Timestamp</th>
                <th className="px-5 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
            }`}>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8">
                    <EmptyState
                      icon={History}
                      title="No Audit Records Found"
                      description="No administrative or cryptographic events match your filter criteria."
                      action={
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSearchQuery('');
                            setActionFilter('ALL');
                          }}
                        >
                          Clear Filters
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className={`transition ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-5 py-4 font-mono font-bold text-slate-400">
                      #{log.id}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{log.entity_type}</span>
                      <span className="text-indigo-400 font-mono font-bold ml-1.5">#{log.entity_id}</span>
                    </td>

                    <td className="px-5 py-4 max-w-xs truncate font-mono text-[11px] text-slate-400">
                      {JSON.stringify(log.details)}
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-400 text-[11px]">
                      {formatDateTime(log.created_at)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        title="View Full JSON Payload"
                        className={`p-1.5 rounded-xl border transition ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
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
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event #${selectedLog.id}`}
          subtitle="Cryptographic verification audit record and raw event metadata"
          icon={ShieldAlert}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
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
              <pre className="p-4 rounded-2xl border font-mono text-[11px] overflow-x-auto max-h-60 bg-slate-950 border-slate-800 text-indigo-400">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
