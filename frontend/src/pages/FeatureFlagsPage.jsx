import React, { useEffect, useState } from 'react';
import { 
  Sliders, Plus, RefreshCw, Sparkles, CheckCircle2, 
  XCircle, ToggleLeft, ToggleRight, X, Loader2, 
  Layers, ShieldAlert, Cpu, AlertCircle 
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';

export default function FeatureFlagsPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    is_enabled: true,
    rollout_percentage: 100,
    target_plans: ['BUSINESS', 'BUSINESS_AI']
  });

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/feature-flags');
      setFlags(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to load feature flags', 'error');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (flag) => {
    try {
      await api.patch(`/admin/feature-flags/${flag.id}`, {
        ...flag,
        is_enabled: !flag.is_enabled
      });
      showToast(`Flag ${flag.code} ${!flag.is_enabled ? 'enabled' : 'disabled'}`, 'info');
      fetchFlags();
    } catch (err) {
      showToast('Failed to toggle flag', 'error');
    }
  };

  const handleCreateFlag = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/feature-flags', {
        ...form,
        rollout_percentage: parseInt(form.rollout_percentage, 10)
      });
      showToast('Feature flag created successfully.', 'success');
      setShowModal(false);
      fetchFlags();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create feature flag', 'error');
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
            Feature Flags & Phased Rollouts
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Gradual feature release percentages, canary deployments, and plan targeting rules
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchFlags}
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
            <span>Create Flag</span>
          </button>
        </div>
      </div>

      {/* Grid of Flags */}
      {loading && flags.length === 0 ? (
        <div className="p-12 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-teal-500 animate-spin mb-2" />
          <p className="text-xs text-slate-400">Loading flags...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className={`p-6 rounded-3xl border space-y-4 transition-all duration-300 hover:-translate-y-1 ${
                isDark 
                  ? 'bg-slate-900/90 border-slate-800 shadow-lg shadow-black/20' 
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border ${
                    flag.is_enabled
                      ? (isDark ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200')
                      : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200')
                  }`}>
                    {flag.code}
                  </span>
                  <h3 className={`text-base font-extrabold mt-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{flag.name}</h3>
                  <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{flag.description}</p>
                </div>

                <button
                  onClick={() => handleToggle(flag)}
                  className={`p-1 rounded-xl transition ${
                    flag.is_enabled ? 'text-teal-500' : 'text-slate-400'
                  }`}
                  title={flag.is_enabled ? 'Disable Flag' : 'Enable Flag'}
                >
                  {flag.is_enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              {/* Rollout Progress Gauge */}
              <div className={`pt-4 border-t space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex justify-between text-xs font-semibold">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Target Rollout</span>
                  <span className="font-mono font-bold text-teal-500">{flag.rollout_percentage}% Audience</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${flag.is_enabled ? 'bg-teal-500' : 'bg-slate-400'}`} 
                    style={{ width: `${flag.rollout_percentage}%` }} 
                  />
                </div>
              </div>

              {/* Target Plans */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {(flag.target_plans || []).map((p) => (
                  <span key={p} className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Flag */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-teal-500" />
                <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Create Feature Flag
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFlag} className="space-y-4 mt-4 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Flag Code (UPPERCASE) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WHATSAPP_V2_GATEWAY"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none font-mono ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WhatsApp Interactive Bot 2.0"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Description</label>
                <textarea
                  placeholder="Describe the rollout intent..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none h-20 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Rollout Percentage ({form.rollout_percentage}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={form.rollout_percentage}
                  onChange={(e) => setForm({ ...form, rollout_percentage: e.target.value })}
                  className="w-full accent-teal-500"
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Flag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
