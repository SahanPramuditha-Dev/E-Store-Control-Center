import React, { useEffect, useState } from 'react';
import { 
  PackageCheck, Plus, RefreshCw, X, Loader2, 
  Download, Laptop, ShieldCheck, CheckCircle2, ArrowUpRight, Radio 
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { formatDate } from '../utils/dateUtils';
import { Select, Button, Badge, PageHeader, Modal, EmptyState } from '../components/UI';


export default function ReleasesPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    version: '',
    channel: 'STABLE',
    release_notes: '',
    download_url: '',
    min_supported_version: '1.0.0',
    is_mandatory: false,
    rollout_percentage: 100
  });

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/releases');
      setReleases(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to load POS releases', 'error');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchReleases();
  }, []);

  const handleCreateRelease = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/releases', {
        ...form,
        rollout_percentage: parseInt(form.rollout_percentage, 10)
      });
      showToast('New POS version release published successfully.', 'success');
      setShowModal(false);
      setForm({
        version: '',
        channel: 'STABLE',
        release_notes: '',
        download_url: '',
        min_supported_version: '1.0.0',
        is_mandatory: false,
        rollout_percentage: 100
      });
      fetchReleases();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to publish release', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const [channelFilter, setChannelFilter] = useState('ALL');

  const filteredReleases = releases.filter((r) => {
    if (channelFilter === 'ALL') return true;
    return r.channel === channelFilter;
  });

  return (
    <div className="space-y-7 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Centralized Page Header */}
      <PageHeader
        eyebrow="Binary Artifacts & OTA Channels"
        title="Electron POS Releases & OTA Updates"
        subtitle="Desktop POS terminal app versioning, cryptographically verified binary distribution, and staged rollouts"
        badges={[
          { label: `${releases.length} Published Releases`, tone: 'indigo' },
          { label: 'OTA Engine Live', tone: 'emerald' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <div className={`p-1 rounded-2xl border flex gap-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              {['ALL', 'STABLE', 'BETA', 'NIGHTLY'].map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannelFilter(ch)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    channelFilter === ch
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchReleases}
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
              Publish Release
            </Button>
          </div>
        }
      />

      {/* Grid of Releases */}
      {filteredReleases.length === 0 && !loading ? (
        <EmptyState
          icon={PackageCheck}
          title="No Release Artifacts Found"
          description="There are no desktop POS versions published under this distribution channel."
          action={
            <Button
              variant="purple-gradient"
              size="sm"
              onClick={() => setShowModal(true)}
              icon={Plus}
            >
              Publish New Release
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReleases.map((rel) => (
            <div
              key={rel.id}
              className={`p-6 rounded-3xl border space-y-4 transition-all duration-300 hover:-translate-y-1 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black font-mono text-indigo-400">{rel.version}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    rel.channel === 'STABLE'
                      ? (isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200')
                      : (isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200')
                  }`}>
                    {rel.channel}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {formatDate(rel.created_at)}
                </span>
              </div>

              <div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {rel.release_notes || 'No release notes provided.'}
                </p>
              </div>

              <div className={`pt-3 border-t space-y-2 text-xs font-semibold ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'}`}>
                <div className="flex justify-between">
                  <span>Staged Rollout:</span>
                  <span className="font-mono text-indigo-400">{rel.rollout_percentage}%</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${rel.rollout_percentage}%` }} />
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span>Min Compatible Version:</span>
                  <span className="font-mono">{rel.min_supported_version}</span>
                </div>
              </div>

              {rel.download_url && (
                <div className="pt-2">
                  <a
                    href={rel.download_url}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition ${
                      isDark ? 'bg-slate-950 border-slate-800 text-indigo-400 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-indigo-700 hover:bg-slate-100'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Package Binary</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Release */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Publish POS Version Release"
        subtitle="Deploy signed desktop binaries to selected release channel"
        icon={PackageCheck}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateRelease} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1 text-slate-300">Version Tag *</label>
              <input
                type="text"
                required
                placeholder="e.g. v2.5.0"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none font-mono bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-300">Release Channel</label>
              <Select
                value={form.channel}
                onChange={(val) => setForm({ ...form, channel: val })}
                options={[
                  { value: 'STABLE', label: 'STABLE', badge: 'Prod' },
                  { value: 'BETA', label: 'BETA', badge: 'Preview' },
                  { value: 'NIGHTLY', label: 'NIGHTLY', badge: 'Dev' },
                ]}
                size="md"
                fullWidth
              />
            </div>

            <div className="col-span-2">
              <label className="block font-bold mb-1 text-slate-300">Binary Download URL</label>
              <input
                type="url"
                placeholder="https://releases.estore.lk/pos/v2.5.0/setup.exe"
                value={form.download_url}
                onChange={(e) => setForm({ ...form, download_url: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block font-bold mb-1 text-slate-300">Release Notes</label>
              <textarea
                placeholder="Key features, bugfixes and cryptographic signature improvements..."
                value={form.release_notes}
                onChange={(e) => setForm({ ...form, release_notes: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none h-20 bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block font-bold mb-1 text-slate-300">
                Staged Rollout Target ({form.rollout_percentage}%)
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={form.rollout_percentage}
                onChange={(e) => setForm({ ...form, rollout_percentage: e.target.value })}
                className="w-full accent-indigo-600"
              />
            </div>
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
              Publish Release
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
