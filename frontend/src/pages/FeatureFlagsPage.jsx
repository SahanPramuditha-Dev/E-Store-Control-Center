import React, { useEffect, useState } from 'react';
import { 
  Sliders, Plus, RefreshCw, Sparkles, CheckCircle2, 
  XCircle, ToggleLeft, ToggleRight, X, Loader2, 
  Layers, ShieldAlert, Cpu, AlertCircle, Zap
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { PageHeader, Card, Button, Badge, Modal, EmptyState, LoadingState } from '../components/UI';

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
    <div className="space-y-7 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Centralized Page Header */}
      <PageHeader
        eyebrow="Canary Deployments & Phased Rollouts"
        title="Feature Flags & Circuit Breakers"
        subtitle="Gradual rollout percentages, targeted subscription tiers, and zero-downtime feature switches"
        badges={[
          { label: `${flags.filter(f => f.is_enabled).length} Flags Active`, tone: 'emerald' },
          { label: `${flags.length} Total Registered`, tone: 'indigo' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchFlags}
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
              Create Flag
            </Button>
          </div>
        }
      />

      {/* Grid of Flags */}
      {loading && flags.length === 0 ? (
        <LoadingState message="Loading Feature Flags & Circuits..." />
      ) : flags.length === 0 ? (
        <EmptyState
          icon={Sliders}
          title="No Feature Flags Defined"
          description="Create your first feature flag to control phased releases and plan gating."
          action={
            <Button variant="purple-gradient" size="sm" onClick={() => setShowModal(true)}>
              Create First Flag
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="p-6 rounded-3xl border space-y-4 transition-all duration-300 hover:-translate-y-1 bg-slate-900/90 border-slate-800 shadow-xl shadow-black/20"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Badge tone={flag.is_enabled ? 'indigo' : 'neutral'}>
                    {flag.code}
                  </Badge>
                  <h3 className="text-base font-extrabold mt-2.5 text-white">{flag.name}</h3>
                  <p className="text-xs mt-1 leading-relaxed text-slate-400">{flag.description}</p>
                </div>

                <button
                  onClick={() => handleToggle(flag)}
                  className={`p-1 rounded-xl transition cursor-pointer ${
                    flag.is_enabled ? 'text-indigo-400 hover:text-indigo-300' : 'text-slate-600 hover:text-slate-400'
                  }`}
                  title={flag.is_enabled ? 'Disable Flag' : 'Enable Flag'}
                >
                  {flag.is_enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              {/* Rollout Progress Gauge */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Target Rollout</span>
                  <span className="font-mono font-bold text-indigo-400">{flag.rollout_percentage}% Audience</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      flag.is_enabled 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                        : 'bg-slate-600'
                    }`} 
                    style={{ width: `${flag.rollout_percentage}%` }} 
                  />
                </div>
              </div>

              {/* Target Plans */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {(flag.target_plans || []).map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border bg-slate-950 border-slate-800 text-slate-300">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Flag */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Feature Flag"
        subtitle="Define dynamic entitlement rules and rollout percentage"
        icon={Sliders}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateFlag} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1 text-slate-300">Flag Code (UPPERCASE) *</label>
            <input
              type="text"
              required
              placeholder="e.g. WHATSAPP_V2_GATEWAY"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none font-mono bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-300">Display Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. WhatsApp Interactive Bot 2.0"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-300">Description</label>
            <textarea
              placeholder="Describe the rollout intent..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none h-20 bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-300">
              Rollout Percentage ({form.rollout_percentage}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={form.rollout_percentage}
              onChange={(e) => setForm({ ...form, rollout_percentage: e.target.value })}
              className="w-full accent-indigo-600 cursor-pointer"
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
              Create Flag
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

