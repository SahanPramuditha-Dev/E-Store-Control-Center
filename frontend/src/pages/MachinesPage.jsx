import React, { useEffect, useState } from 'react';
import { 
  Laptop, RefreshCw, CheckCircle2, XCircle, AlertCircle, 
  Search, Power, RotateCcw, Ban, Copy, Check, Filter, 
  Cpu, HardDrive, Clock, Activity, Shield
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { formatRelativeTime, formatDateTime } from '../utils/dateUtils';


export default function MachinesPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedFp, setCopiedFp] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);


  const fetchMachines = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/machines');
      setMachines(res.data);
    } catch (err) {
      showToast('Failed to load machine telemetry data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleCopy = (fp) => {
    navigator.clipboard.writeText(fp);
    setCopiedFp(fp);
    showToast('Hardware fingerprint copied to clipboard!', 'success');
    setTimeout(() => setCopiedFp(null), 2500);
  };

  const handleUpdateStatus = async (machineId, newStatus) => {
    try {
      await api.post(`/admin/machines/${machineId}/status`, {
        status: newStatus,
        reason: `Admin set status to ${newStatus}`
      });
      showToast(`Machine terminal status updated to ${newStatus}.`, 'success');
      fetchMachines();
    } catch (err) {
      showToast('Failed to update terminal status', 'error');
    }
  };

  const getTimeAgo = (dateStr) => {
    return formatRelativeTime(dateStr);
  };


  const isOnline = (dateStr) => {
    if (!dateStr) return false;
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    return diff < 300; // within 5 minutes
  };

  const filteredMachines = machines.filter((m) => {
    const matchesSearch =
      (m.machine_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.machine_fingerprint || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.shop_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.tenant_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Terminal Telemetry & Hardware Matrix
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time live heartbeat monitoring, hardware SHA-256 fingerprint tracking, and remote machine access control.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMachines}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition shadow-xs active:scale-95 ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
                : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
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
            placeholder="Search by terminal name, hardware fingerprint, branch, or tenant..."
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`rounded-2xl px-3 py-2.5 text-xs font-bold focus:outline-none border ${
            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <option value="ALL">All Terminal Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DEACTIVATED">DEACTIVATED</option>
          <option value="BLOCKED">BLOCKED</option>
        </select>
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
                <th className="px-5 py-4">Terminal & Hardware ID</th>
                <th className="px-5 py-4">Assigned Location</th>
                <th className="px-5 py-4">OS & App Version</th>
                <th className="px-5 py-4">Heartbeat Status</th>
                <th className="px-5 py-4">Access State</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
            }`}>
              {loading && machines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 text-teal-500 animate-spin mx-auto mb-2" />
                    Loading terminal matrix...
                  </td>
                </tr>
              ) : filteredMachines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No machine terminals registered yet.
                  </td>
                </tr>
              ) : (
                filteredMachines.map((m) => {
                  const online = isOnline(m.last_seen_at);
                  const active = m.status === 'ACTIVE';

                  return (
                    <tr key={m.id} className={`transition ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                            isDark ? 'bg-slate-950 border-slate-800 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-700'
                          }`}>
                            <Laptop className="w-4 h-4" />
                          </div>
                          <div>
                            <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {m.machine_name || 'POS Terminal'}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] text-slate-400 select-all">
                                {m.machine_fingerprint.slice(0, 16)}...
                              </span>
                              <button
                                onClick={() => handleCopy(m.machine_fingerprint)}
                                title="Copy Full Fingerprint"
                                className={`p-1 rounded-md transition ${
                                  isDark ? 'text-slate-400 hover:text-teal-400 hover:bg-slate-800' : 'text-slate-500 hover:text-teal-600 hover:bg-slate-100'
                                }`}
                              >
                                {copiedFp === m.machine_fingerprint ? (
                                  <Check className="w-3 h-3 text-teal-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{m.shop_name}</div>
                        <div className="text-slate-400 text-[11px]">{m.tenant_name}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-400">{m.os_info || 'Windows POS'}</div>
                        <div className="text-[10px] font-mono text-teal-500">v{m.app_version || '1.0.0'}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span className={`font-bold ${online ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {getTimeAgo(m.last_seen_at)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          active 
                            ? isDark ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200' 
                            : isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {m.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Hardware Spec Inspector */}
                          <button
                            onClick={() => {
                              setSelectedMachine(m);
                              setShowSpecModal(true);
                            }}
                            title="Inspect Hardware Telemetry"
                            className={`p-1.5 rounded-xl border transition ${
                              isDark ? 'bg-slate-800 text-sky-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-sky-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <Cpu className="w-3.5 h-3.5" />
                          </button>

                          {active ? (
                            <button
                              onClick={() => {
                                setSelectedMachine(m);
                                setShowRevokeModal(true);
                              }}
                              title="Emergency Revoke / Unbind"
                              className={`p-1.5 rounded-xl border transition ${
                                isDark ? 'bg-slate-800 text-rose-400 border-slate-700 hover:bg-rose-950/40' : 'bg-slate-100 text-rose-700 border-slate-200 hover:bg-rose-50'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(m.id, 'ACTIVE')}
                              title="Re-activate Machine"
                              className={`p-1.5 rounded-xl border transition ${
                                isDark ? 'bg-slate-800 text-teal-400 border-slate-700 hover:bg-teal-950/40' : 'bg-slate-100 text-teal-700 border-slate-200 hover:bg-teal-50'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Hardware Telemetry Inspector */}
      {showSpecModal && selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-5 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-teal-500" />
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedMachine.machine_name || 'Terminal POS Device'}
                </h3>
              </div>
              <button onClick={() => setShowSpecModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`p-3 rounded-2xl border space-y-1 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400 font-mono text-[10px]">SHA-256 HARDWARE FINGERPRINT</span>
                <p className="font-mono text-[11px] font-bold text-teal-400 break-all">{selectedMachine.machine_fingerprint}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-slate-400 text-[10px]">OPERATING SYSTEM</span>
                  <p className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedMachine.os_info || 'Windows 11 POS'}</p>
                </div>
                <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-slate-400 text-[10px]">DESKTOP APP VERSION</span>
                  <p className="font-mono text-teal-400 font-bold mt-0.5">v{selectedMachine.app_version || '2026.1.0'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-slate-400 text-[10px]">TENANT ENTITY</span>
                  <p className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedMachine.tenant_name}</p>
                </div>
                <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-slate-400 text-[10px]">REGISTERED SHOP</span>
                  <p className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedMachine.shop_name}</p>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400 text-[10px]">LAST HEARTBEAT TELEMETRY</span>
                <p className={`font-mono text-[11px] mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatDateTime(selectedMachine.last_seen_at)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSpecModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* Modal: Emergency Terminal Revocation / Kill Switch */}
      {showRevokeModal && selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-5 text-center ${
            isDark ? 'bg-slate-900 border-rose-500/30' : 'bg-white border-rose-200'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Revoke POS Terminal Authorization?
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                This will immediately invalidate the local license cryptographic session on terminal <span className="font-mono font-bold text-rose-400">{selectedMachine.machine_name || 'Terminal'}</span> and lock checkout operations.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRevokeModal(false)}
                className={`py-2.5 rounded-2xl text-xs font-bold border transition ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleUpdateStatus(selectedMachine.id, 'DEACTIVATED');
                  setShowRevokeModal(false);
                }}
                className="py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-rose-500/25"
              >
                Revoke Immediately
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
