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
import { Select, Button, Badge, PageHeader, Modal, EmptyState } from '../components/UI';

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
      setAnnouncements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to load announcements', 'error');
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
    <div className="space-y-7 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Centralized Page Header */}
      <PageHeader
        eyebrow="Global Communications & Broadcasts"
        title="Platform Announcements & Alerts"
        subtitle="Broadcast ecosystem-wide system notices, release announcements, maintenance schedules, and targeted notices"
        badges={[
          { label: `${announcements.length} Total Broadcasts`, tone: 'indigo' },
          { label: 'Live Dispatch', tone: 'emerald' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAnnouncements}
              icon={RefreshCw}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              variant="purple-gradient"
              size="sm"
              onClick={() => setShowModal(true)}
              icon={Plus}
            >
              New Announcement
            </Button>
          </div>
        }
      />

      {/* Grid of Announcements */}
      {announcements.length === 0 && !loading ? (
        <EmptyState
          icon={Megaphone}
          title="No Announcements Broadcasted"
          description="There are currently no active announcements or maintenance alerts posted to tenant POS devices."
          action={
            <Button
              variant="purple-gradient"
              size="sm"
              onClick={() => setShowModal(true)}
              icon={Plus}
            >
              Broadcast First Announcement
            </Button>
          }
        />
      ) : (
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
                    (isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200')
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
                  <span className="text-indigo-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Announcement */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Broadcast Announcement"
        subtitle="Publish alert banner or update notice to tenant backoffices and POS clients"
        icon={Megaphone}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1 text-slate-300">Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled Maintenance Window"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-300">Announcement Type</label>
            <Select
              value={form.announcement_type}
              onChange={(val) => setForm({ ...form, announcement_type: val })}
              options={[
                { value: 'INFO', label: 'INFO (General Notice)', badge: 'Info' },
                { value: 'FEATURE', label: 'FEATURE (New Capabilities)', badge: 'New' },
                { value: 'MAINTENANCE', label: 'MAINTENANCE (Scheduled Downtime)', badge: 'Maint' },
                { value: 'WARNING', label: 'WARNING (Critical Alert)', badge: 'Alert' },
              ]}
              size="md"
              fullWidth
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-300">Content Body *</label>
            <textarea
              required
              placeholder="Enter message details visible to tenant portals and POS devices..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none h-24 bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="purple-gradient"
              size="sm"
              loading={submitting}
            >
              Publish Announcement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
