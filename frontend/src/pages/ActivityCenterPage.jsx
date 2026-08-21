import React, { useEffect, useState } from 'react';
import { 
  Clock, RefreshCw, Activity, ShieldCheck, Key, 
  Building2, Laptop, User, CheckCircle2, Search, Filter 
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { formatDateTime, formatRelativeTime } from '../utils/dateUtils';

export default function ActivityCenterPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/activity/timeline?limit=50');
      setTimeline(res.data);
    } catch (err) {
      showToast('Failed to load activity timeline', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Unified Platform Activity Center
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time chronological timeline of tenant setups, license actions, POS heartbeats, and operator events
          </p>
        </div>
        <button
          onClick={fetchTimeline}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition shadow-xs active:scale-95 ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
              : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Timeline List */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {loading && timeline.length === 0 ? (
          <div className="py-12 text-center text-slate-400">Loading timeline events...</div>
        ) : timeline.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No activity logged yet.</div>
        ) : (
          <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
            {timeline.map((item, idx) => (
              <div key={idx} className="relative pl-6">
                <div className={`absolute -left-2.5 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isDark ? 'bg-slate-950 border-teal-500 text-teal-400' : 'bg-white border-teal-600 text-teal-700'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                </div>

                <div className={`p-4 rounded-2xl border transition ${
                  isDark ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                        item.type === 'AUDIT' 
                          ? (isDark ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200')
                          : (isDark ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-200')
                      }`}>
                        {item.title}
                      </span>
                      <p className={`font-extrabold text-sm mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.entity}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-mono text-teal-400 font-bold">
                        {formatDateTime(item.timestamp)}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {formatRelativeTime(item.timestamp)}
                      </div>
                    </div>

                  </div>

                  {item.details && (
                    <div className="mt-2 text-xs font-mono text-slate-400">
                      {typeof item.details === 'object' ? JSON.stringify(item.details) : item.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
