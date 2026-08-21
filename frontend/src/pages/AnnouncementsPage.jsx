import React, { useEffect, useState } from 'react';
import { 
  Bell, Plus, RefreshCw, X, Loader2, 
  Megaphone, AlertTriangle, Sparkles, CheckCircle2, 
  Info, Calendar, Trash2 
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { formatDate } from '../utils/dateUtils';


export default function AnnouncementsPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    announcement_type: 'INFO',
    target_type: 'ALL'
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      showToast('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/announcements', form);
      showToast('Announcement broadcast created successfully.', 'success');
      setShowModal(false);
      setForm({
        title: '',
        content: '',
        announcement_type: 'INFO',
        target_type: 'ALL'
      });
      fetchAnnouncements();
    } catch (err) {
      showToast('Failed to create announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Platform Communications & Announcements
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Broadcast platform-wide notices, release announcements, maintenance alerts, and targeted messages
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnnouncements}
            className={`p-2.5 rounded-2xl border transition shadow-xs active:scale-95 ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
                : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-2xl text-xs transition shadow-md shadow-teal-500/20 active:scale-95 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        </div>
      </div>

      {/* Grid of Announcements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {announcements.map((ann) => {
          const isMaint = ann.announcement_type === 'MAINTENANCE';
          const isWarn = ann.announcement_type === 'WARNING';
          const isFeat = ann.announcement_type === 'FEATURE';

          return (
            <div
              key={ann.id}
              className={`p-6 rounded-3xl border space-y-4 transition-all duration-300 hover:-translate-y-1 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                  isMaint ? (isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200') :
                  isWarn ? (isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200') :
                  isFeat ? (isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200') :
                  (isDark ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200')
                }`}>
                  {ann.announcement_type}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatDate(ann.created_at)}
                </span>

              </div>

              <div>
                <h3 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{ann.title}</h3>
                <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{ann.content}</p>
              </div>

              <div className={`pt-4 border-t flex justify-between items-center text-xs ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                <span>Target: <strong>{ann.target_type}</strong></span>
                <span className="text-teal-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Announcement */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-teal-500" />
                <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Broadcast Announcement
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Maintenance Window"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Announcement Type</label>
                <select
                  value={form.announcement_type}
                  onChange={(e) => setForm({ ...form, announcement_type: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                  }`}
                >
                  <option value="INFO">INFO (General Notice)</option>
                  <option value="FEATURE">FEATURE (New Capabilities)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Scheduled Downtime)</option>
                  <option value="WARNING">WARNING (Critical Alert)</option>
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Content Body *</label>
                <textarea
                  required
                  placeholder="Enter message details visible to tenant portals and POS devices..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none h-24 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-xl font-bold border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl shadow-md shadow-teal-500/20"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
