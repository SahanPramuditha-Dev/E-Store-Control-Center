import React, { useEffect, useState } from 'react';
import { 
  Clock, RefreshCw, Activity, ShieldCheck, Key, 
  Building2, Laptop, User, CheckCircle2, Search, Filter 
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { formatDateTime, formatRelativeTime } from '../utils/dateUtils';
import { Select, Button, Badge, PageHeader, EmptyState } from '../components/UI';

export default function ActivityCenterPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/activity/timeline?limit=50');
      setTimeline(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to load activity timeline', 'error');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchTimeline();
  }, []);

  return (
    <div className="space-y-7 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Centralized Page Header */}
      <PageHeader
        eyebrow="Real-Time Event Stream"
        title="Unified Platform Activity Center"
        subtitle="Real-time chronological timeline of tenant setups, license actions, POS heartbeats, and operator events"
        badges={[
          { label: `${timeline.length} Logged Events`, tone: 'indigo' },
          { label: 'Live Stream', tone: 'emerald' },
        ]}
        actions={
          <Button
            variant="purple-gradient"
            size="sm"
            onClick={fetchTimeline}
            icon={RefreshCw}
            loading={loading}
          >
            Refresh Feed
          </Button>
        }
      />

      {/* Timeline List */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {loading && timeline.length === 0 ? (
          <div className="py-12 text-center text-slate-400">Loading timeline events...</div>
        ) : timeline.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No Activity Events Recorded"
            description="No recent administrative, checkout, or cryptographic actions have been logged."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchTimeline}
                icon={RefreshCw}
              >
                Refresh Stream
              </Button>
            }
          />
        ) : (
          <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
            {timeline.map((item, idx) => (
              <div key={idx} className="relative pl-6">
                <div className={`absolute -left-2.5 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isDark ? 'bg-slate-950 border-indigo-500 text-indigo-400' : 'bg-white border-indigo-600 text-indigo-700'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                </div>

                <div className={`p-4 rounded-2xl border transition ${
                  isDark ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                        item.type === 'AUDIT' 
                          ? (isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200')
                          : (isDark ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-200')
                      }`}>
                        {item.title}
                      </span>
                      <p className={`font-extrabold text-sm mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.entity}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-mono text-indigo-400 font-bold">
                        {formatDateTime(item.timestamp)}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {formatRelativeTime(item.timestamp)}
                      </div>
                    </div>
                  </div>

                  <p className={`text-xs mt-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {item.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
