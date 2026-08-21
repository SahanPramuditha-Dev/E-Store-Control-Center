import React, { useEffect, useState } from 'react';
import { 
  PackageCheck, Plus, RefreshCw, X, Loader2, 
  Download, Laptop, ShieldCheck, CheckCircle2, ArrowUpRight, Radio 
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { formatDate } from '../utils/dateUtils';


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

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Electron POS Releases & OTA Updates
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Desktop POS app binary versioning, mandatory security updates, and staged OTA distribution
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReleases}
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
            <span>Publish Release</span>
          </button>
        </div>
      </div>

      {/* Grid of Releases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {releases.map((rel) => (
          <div
            key={rel.id}
            className={`p-6 rounded-3xl border space-y-4 transition-all duration-300 hover:-translate-y-1 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black font-mono text-teal-500">{rel.version}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  rel.channel === 'STABLE'
                    ? (isDark ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200')
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
                <span className="font-mono text-teal-500">{rel.rollout_percentage}%</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div className="bg-teal-500 h-full rounded-full" style={{ width: `${rel.rollout_percentage}%` }} />
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
                    isDark ? 'bg-slate-950 border-slate-800 text-teal-400 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-teal-700 hover:bg-slate-100'
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

      {/* Modal: Create Release */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-teal-500" />
                <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Publish POS Version Release
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRelease} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Version Tag *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. v2.5.0"
                    value={form.version}
                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none font-mono ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Release Channel</label>
                  <select
                    value={form.channel}
                    onChange={(e) => setForm({ ...form, channel: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  >
                    <option value="STABLE">STABLE</option>
                    <option value="BETA">BETA</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Binary Download URL</label>
                  <input
                    type="url"
                    placeholder="https://releases.estore.lk/pos/v2.5.0/setup.exe"
                    value={form.download_url}
                    onChange={(e) => setForm({ ...form, download_url: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div className="col-span-2">
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Release Notes</label>
                  <textarea
                    placeholder="Key features, bugfixes and cryptographic signature improvements..."
                    value={form.release_notes}
                    onChange={(e) => setForm({ ...form, release_notes: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none h-20 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Rollout ({form.rollout_percentage}%)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={form.rollout_percentage}
                    onChange={(e) => setForm({ ...form, rollout_percentage: e.target.value })}
                    className="w-full accent-teal-500"
                  />
                </div>
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Release'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
