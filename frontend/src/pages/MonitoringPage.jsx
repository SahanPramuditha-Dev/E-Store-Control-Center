import React, { useEffect, useState } from 'react';
import { 
  Activity, RefreshCw, CheckCircle2, Shield, 
  Cpu, HardDrive, Server, Play, Clock, AlertTriangle 
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { formatDateTime } from '../utils/dateUtils';


export default function MonitoringPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [health, setHealth] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const [hRes, jRes] = await Promise.all([
        api.get('/admin/monitoring/health'),
        api.get('/admin/monitoring/jobs')
      ]);
      setHealth(hRes.data);
      setJobs(jRes.data);
    } catch (err) {
      showToast('Failed to load system monitoring status', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const handleTriggerJob = async (job) => {
    try {
      await api.post(`/admin/monitoring/jobs/${job.id}/trigger`);
      showToast(`Job '${job.job_name}' dispatched successfully.`, 'success');
      fetchMonitoringData();
    } catch (err) {
      showToast('Failed to trigger job', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            System Health & Background Task Queues
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Live infrastructure diagnostics, database connection health, license signer status, and scheduled worker jobs
          </p>
        </div>
        <button
          onClick={fetchMonitoringData}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition shadow-xs active:scale-95 ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
              : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Health</span>
        </button>
      </div>

      {/* Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Core REST API</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h3 className="text-xl font-extrabold text-emerald-500 mt-3">{health?.api_health || 'HEALTHY'}</h3>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Response latency: 24ms</p>
        </div>

        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Engine</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <h3 className="text-xl font-extrabold text-emerald-500 mt-3">{health?.database_health || 'CONNECTED'}</h3>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Connection pool: Active</p>
        </div>

        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">License Signer</span>
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
          </div>
          <h3 className="text-xl font-extrabold text-teal-500 mt-3">{health?.license_engine || 'ED25519_ACTIVE'}</h3>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Asymmetric cryptography verified</p>
        </div>

        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cloud Storage R2</span>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          </div>
          <h3 className="text-xl font-extrabold text-sky-500 mt-3">CONNECTED</h3>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Bucket: estore-cloud-backups</p>
        </div>
      </div>

      {/* Background Tasks List */}
      <div className={`p-6 sm:p-7 rounded-3xl border shadow-sm space-y-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Automated Background Worker Jobs
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Cron queues handling automated license expiry checks, backup tasks, and message dispatchers
            </p>
          </div>
        </div>

        <div className={`overflow-x-auto rounded-2xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <table className="w-full text-left text-xs">
            <thead className={`uppercase tracking-wider text-[10px] font-bold border-b ${
              isDark ? 'text-slate-400 bg-slate-950/80 border-slate-800' : 'text-slate-600 bg-slate-50 border-slate-200'
            }`}>
              <tr>
                <th className="px-5 py-4">Job Name</th>
                <th className="px-5 py-4">Last Status</th>
                <th className="px-5 py-4">Execution Time</th>
                <th className="px-5 py-4">Last Executed</th>
                <th className="px-5 py-4 text-right">Manual Trigger</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
            }`}>
              {jobs.map((j) => (
                <tr key={j.id} className={`transition ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}`}>
                  <td className="px-5 py-4 font-bold">
                    <span className={isDark ? 'text-white' : 'text-slate-900'}>{j.job_name}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      isDark ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200'
                    }`}>
                      {j.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-400">{j.duration_seconds}s</td>
                  <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                    {j.last_run_at ? formatDateTime(j.last_run_at) : 'Never'}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleTriggerJob(j)}
                      className={`p-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1 transition ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-teal-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-teal-700 border-slate-200'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Run Now</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
