import React, { useEffect, useState } from 'react';
import { 
  Laptop, RefreshCw, CheckCircle2, XCircle, AlertCircle, 
  Search, Power, RotateCcw, Ban, Copy, Check, Filter, 
  Cpu, HardDrive, Clock
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';

export default function MachinesPage() {
  const { showToast } = useToast();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedFp, setCopiedFp] = useState(null);

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
    if (!dateStr) return 'Never';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Terminal Telemetry & Hardware Matrix</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time live heartbeat monitoring, hardware SHA-256 fingerprint tracking, and remote machine access control.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMachines}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by terminal name, hardware fingerprint, branch, or tenant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
        >
          <option value="ALL">All Terminal Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DEACTIVATED">DEACTIVATED</option>
          <option value="RESET">RESET</option>
        </select>
      </div>

      {/* Machine Telemetry Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="uppercase tracking-wider text-[10px] text-slate-400 bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Terminal & Hardware ID</th>
                <th className="px-5 py-4">Tenant & Branch</th>
                <th className="px-5 py-4">License Key</th>
                <th className="px-5 py-4">App Version</th>
                <th className="px-5 py-4">Live Status</th>
                <th className="px-5 py-4">Last Telemetry Ping</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading && machines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 text-teal-400 animate-spin mx-auto mb-2" />
                    Loading terminal telemetry...
                  </td>
                </tr>
              ) : filteredMachines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No hardware machines registered yet.
                  </td>
                </tr>
              ) : (
                filteredMachines.map((m) => {
                  const online = isOnline(m.last_seen_at);
                  const isActive = m.status === 'ACTIVE';

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Laptop className="w-4 h-4 text-teal-400 shrink-0" />
                          <span className="font-bold text-white">
                            {m.machine_name || 'POS Cashier Terminal'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-mono text-[11px] text-slate-400 truncate max-w-[180px]">
                            {m.machine_fingerprint}
                          </span>
                          <button
                            onClick={() => handleCopy(m.machine_fingerprint)}
                            title="Copy Fingerprint"
                            className="p-1 text-slate-500 hover:text-teal-300 transition rounded"
                          >
                            {copiedFp === m.machine_fingerprint ? (
                              <Check className="w-3 h-3 text-teal-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-white">{m.shop_name}</p>
                        <span className="text-slate-400 text-[11px]">{m.tenant_name}</span>
                      </td>

                      <td className="px-5 py-4 font-mono text-teal-300 text-[11px]">
                        {m.license_key || '—'}
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 font-mono text-slate-300 text-[11px]">
                          v{m.app_version || '1.0.0'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${online ? 'bg-teal-400 animate-pulse' : 'bg-slate-600'}`} />
                          <span className={`text-[11px] font-semibold ${online ? 'text-teal-300' : 'text-slate-400'}`}>
                            {online ? 'Online' : 'Offline'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive ? 'bg-teal-500/10 text-teal-300' : 'bg-rose-500/10 text-rose-300'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{getTimeAgo(m.last_seen_at)}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {m.last_seen_at ? new Date(m.last_seen_at).toLocaleTimeString() : '—'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isActive ? (
                            <button
                              onClick={() => handleUpdateStatus(m.id, 'DEACTIVATED')}
                              title="Deactivate Machine"
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-[11px] transition flex items-center gap-1"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Deactivate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(m.id, 'ACTIVE')}
                              title="Activate Machine"
                              className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-semibold text-[11px] transition flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Activate</span>
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
    </div>
  );
}
