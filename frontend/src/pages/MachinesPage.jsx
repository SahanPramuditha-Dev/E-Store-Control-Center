import React, { useEffect, useState } from 'react';
import { 
  Laptop, RefreshCw, CheckCircle2, XCircle, AlertCircle, 
  Search, Power, RotateCcw, Ban, Copy, Check, Filter, 
  Cpu, HardDrive, Clock, Activity, Shield, ShieldAlert
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { formatRelativeTime, formatDateTime } from '../utils/dateUtils';
import { Select, Button, Badge, PageHeader, Modal, ConfirmModal, EmptyState } from '../components/UI';

export default function MachinesPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [machines, setMachines] = useState(() => {
    try {
      const c = sessionStorage.getItem('estore_machines');
      return c ? JSON.parse(c) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => !sessionStorage.getItem('estore_machines'));
  const searchParams = new URLSearchParams(window.location.search);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('tenant') || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedFp, setCopiedFp] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  const fetchMachines = async () => {
    try {
      if (machines.length === 0) setLoading(true);
      const data = await api.getCached('/admin/machines');
      setMachines(Array.isArray(data) ? data : []);
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
    const prevMachines = [...machines];
    setMachines(prev => prev.map(m => m.id === machineId ? { ...m, status: newStatus } : m));
    showToast(`Machine terminal status updated to ${newStatus}.`, 'success');

    try {
      await api.post(`/admin/machines/${machineId}/status`, {
        status: newStatus,
        reason: `Admin set status to ${newStatus}`
      });
      api.clearCache('/admin/machines');
    } catch (err) {
      setMachines(prevMachines);
      showToast('Failed to update terminal status on server. Reverted.', 'error');
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
    <div className="space-y-7 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Centralized Page Header */}
      <PageHeader
        eyebrow="Fleet Telemetry & Machine Fingerprints"
        title="Terminal Telemetry & Hardware Matrix"
        subtitle="Real-time live heartbeat monitoring, hardware SHA-256 fingerprint tracking, and remote machine access control"
        badges={[
          { label: `${machines.length} Fleet Terminals`, tone: 'indigo' },
          { label: `${machines.filter(m => isOnline(m.last_seen_at)).length} Live Heartbeats`, tone: 'emerald' },
        ]}
        actions={
          <Button
            variant="purple-gradient"
            size="sm"
            onClick={fetchMachines}
            icon={RefreshCw}
            loading={loading}
          >
            Refresh Telemetry
          </Button>
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
            placeholder="Search by terminal name, hardware fingerprint, branch, or tenant..."
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
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'ALL', label: 'All Terminal Statuses' },
              { value: 'ACTIVE', label: 'Active', badge: 'Live' },
              { value: 'DEACTIVATED', label: 'Deactivated', badge: 'Off' },
              { value: 'BLOCKED', label: 'Blocked', badge: 'Lock' },
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
                <th className="px-5 py-4">Terminal & Hardware ID</th>
                <th className="px-5 py-4">Assigned Location</th>
                <th className="px-5 py-4">OS & App Version</th>
                <th className="px-5 py-4">Heartbeat Telemetry</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
            }`}>
              {loading && machines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                    Loading terminal matrix...
                  </td>
                </tr>
              ) : filteredMachines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8">
                    <EmptyState
                      icon={Laptop}
                      title="No POS Terminals Found"
                      description="No hardware registers match your search query or status filter."
                      action={
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('ALL');
                          }}
                        >
                          Clear Filters
                        </Button>
                      }
                    />
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
                                {(m.machine_fingerprint || 'UNKNOWN').slice(0, 16)}...
                              </span>
                              <button
                                onClick={() => handleCopy(m.machine_fingerprint)}
                                title="Copy Full Fingerprint"
                                className={`p-1 rounded-md transition ${
                                  isDark ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
                                }`}
                              >
                                {copiedFp === m.machine_fingerprint ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {m.shop_name || 'Main Branch'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {m.tenant_name || 'Direct Tenant'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-mono text-slate-300">
                          {m.os_info || 'Windows 11'}
                        </div>
                        <div className="text-[10px] text-indigo-400 font-mono">
                          App v{m.app_version || '2026.1.0'}
                        </div>
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
                        <Badge tone={active ? 'indigo' : 'rose'}>{m.status}</Badge>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
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
                              title="Revoke / Deactivate Terminal"
                              className={`p-1.5 rounded-xl border transition ${
                                isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(m.id, 'ACTIVE')}
                              title="Re-authorize Terminal"
                              className={`p-1.5 rounded-xl border transition ${
                                isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
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

      {/* Modal: Machine Specs Inspector */}
      {selectedMachine && (
        <Modal
          isOpen={showSpecModal}
          onClose={() => setShowSpecModal(false)}
          title={`Terminal Spec: ${selectedMachine.machine_name || 'POS'}`}
          subtitle="Cryptographic hardware binding signature and telemetry logs"
          icon={Cpu}
          maxWidth="max-w-md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl border space-y-1 bg-slate-950 border-slate-800">
              <span className="text-slate-400 font-mono text-[10px]">SHA-256 HARDWARE FINGERPRINT</span>
              <p className="font-mono text-[11px] font-bold text-indigo-400 break-all">{selectedMachine.machine_fingerprint}</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl border bg-slate-950 border-slate-800">
                <span className="text-slate-400 text-[10px]">OPERATING SYSTEM</span>
                <p className="font-bold mt-0.5 text-white">{selectedMachine.os_info || 'Windows 11 POS'}</p>
              </div>
              <div className="p-3 rounded-2xl border bg-slate-950 border-slate-800">
                <span className="text-slate-400 text-[10px]">DESKTOP APP VERSION</span>
                <p className="font-mono text-indigo-400 font-bold mt-0.5">v{selectedMachine.app_version || '2026.1.0'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl border bg-slate-950 border-slate-800">
                <span className="text-slate-400 text-[10px]">TENANT ENTITY</span>
                <p className="font-bold mt-0.5 text-white">{selectedMachine.tenant_name}</p>
              </div>
              <div className="p-3 rounded-2xl border bg-slate-950 border-slate-800">
                <span className="text-slate-400 text-[10px]">REGISTERED SHOP</span>
                <p className="font-bold mt-0.5 text-white">{selectedMachine.shop_name}</p>
              </div>
            </div>

            {/* Live Telemetry Health Matrix */}
            {selectedMachine.telemetry && Object.keys(selectedMachine.telemetry).length > 0 && (
              <div className="p-3.5 rounded-2xl border space-y-2 bg-slate-900/60 border-slate-800">
                <span className="text-slate-400 font-mono text-[10px] uppercase font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" /> Live System Telemetry
                </span>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">CPU Load</span>
                    <span className="font-bold text-white">{selectedMachine.telemetry.cpu_percent ?? '--'}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">Memory</span>
                    <span className="font-bold text-white">{selectedMachine.telemetry.memory_percent ?? '--'}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">Free Disk</span>
                    <span className="font-bold text-white">{selectedMachine.telemetry.disk_free_gb ?? '--'} GB</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">DB Size</span>
                    <span className="font-bold text-white">{selectedMachine.telemetry.database_size_mb ?? '--'} MB</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">Pending Sync</span>
                    <span className="font-bold text-amber-400">{selectedMachine.telemetry.pending_outbox_events ?? 0}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">IP Address</span>
                    <span className="font-mono text-[10px] text-slate-300 truncate block">{selectedMachine.ip_address || '127.0.0.1'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Remote Command Dispatch */}
            <div className="p-3.5 rounded-2xl border space-y-2 bg-slate-950 border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Remote Control Dispatch</span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={async () => {
                    try {
                      await api.post(`/admin/machines/${selectedMachine.id}/command`, { command: 'FORCE_SYNC' });
                      showToast('Force Sync command queued for terminal.', 'success');
                    } catch {
                      showToast('Failed to queue command.', 'error');
                    }
                  }}
                >
                  Force Outbox Sync
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={async () => {
                    try {
                      await api.post(`/admin/machines/${selectedMachine.id}/command`, { command: 'REFRESH_LICENSE' });
                      showToast('Refresh License command queued.', 'success');
                    } catch {
                      showToast('Failed to queue command.', 'error');
                    }
                  }}
                >
                  Refresh License
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => setShowSpecModal(false)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ConfirmModal: Terminal Revocation */}
      {selectedMachine && (
        <ConfirmModal
          isOpen={showRevokeModal}
          onClose={() => setShowRevokeModal(false)}
          onConfirm={async () => {
            await handleUpdateStatus(selectedMachine.id, 'DEACTIVATED');
            setShowRevokeModal(false);
          }}
          title="Revoke POS Terminal Authorization?"
          description={`This will immediately invalidate the local license cryptographic session on terminal ${selectedMachine.machine_name || 'Terminal'} and lock checkout operations.`}
          confirmText="Revoke Authorization"
          cancelText="Cancel"
          tone="danger"
          icon={ShieldAlert}
        />
      )}
    </div>
  );
}
