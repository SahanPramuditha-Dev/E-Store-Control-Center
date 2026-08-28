import React, { useEffect, useState } from 'react';
import { 
  CreditCard, Check, RefreshCw, Sparkles, Shield, Cpu, 
  Edit3, X, Loader2, Layers, CheckCircle2, ArrowRight, DollarSign
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { Select, Button, Badge, PageHeader, Modal, EmptyState } from '../components/UI';

export default function SubscriptionsPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [packages, setPackages] = useState([]);
  const [allFeatures, setAllFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price_lkr: 0,
    max_users: 5,
    max_devices: 2,
    max_stores: 1,
    storage_gb: 10,
    monthly_transactions_limit: 10000,
    feature_codes: []
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/packages');
      setPackages(res.data?.packages || []);
      setAllFeatures(res.data?.all_features || []);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to load subscriptions & plans.', 'error');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchPackages();
  }, []);

  const openEditModal = (pkg) => {
    setSelectedPkg(pkg);
    setEditForm({
      name: pkg.name,
      description: pkg.description,
      price_lkr: pkg.price_lkr,
      max_users: pkg.max_users || 5,
      max_devices: pkg.max_devices || 2,
      max_stores: pkg.max_stores || 1,
      storage_gb: pkg.storage_gb || 10,
      monthly_transactions_limit: pkg.monthly_transactions_limit || 10000,
      feature_codes: [...pkg.features]
    });
    setShowEditModal(true);
  };

  const handleUpdatePackage = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/admin/packages/${selectedPkg.id}`, {
        ...editForm,
        price_lkr: parseFloat(editForm.price_lkr)
      });
      showToast('Subscription plan quotas updated.', 'success');
      setShowEditModal(false);
      fetchPackages();
    } catch (err) {
      showToast('Failed to update plan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Centralized Page Header */}
      <PageHeader
        eyebrow="Commercial Packaging & Entitlements"
        title="Subscriptions & Monetization Plans"
        subtitle="Configure commercial pricing tiers, device authorizations, storage limits, and module entitlement matrices"
        badges={[
          { label: `${packages.length} Tier Profiles`, tone: 'indigo' },
          { label: 'Active Matrix', tone: 'emerald' },
        ]}
        actions={
          <Button
            variant="purple-gradient"
            size="sm"
            onClick={fetchPackages}
            icon={RefreshCw}
            loading={loading}
          >
            Refresh Plans
          </Button>
        }
      />

      {/* Plans Pricing Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const isEnterprise = pkg.code === 'ENTERPRISE';
          const isPro = pkg.code === 'PRO';

          return (
            <div
              key={pkg.id}
              className={`p-7 rounded-3xl border flex flex-col justify-between transition-all duration-300 relative ${
                isEnterprise 
                  ? 'bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/50 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/20' 
                  : isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              {isEnterprise && (
                <div className="absolute -top-3 right-6">
                  <span className="px-3 py-1 bg-indigo-600 text-white font-extrabold text-[10px] rounded-full shadow-md shadow-indigo-500/50 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>FLAGSHIP TIER</span>
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl border ${
                    isEnterprise ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                    isPro ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                    'bg-slate-800 border-slate-700 text-slate-300'
                  }`}>
                    {pkg.code}
                  </span>
                  <h3 className={`text-xl font-extrabold mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{pkg.name}</h3>
                  <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{pkg.description}</p>
                </div>

                <div className="py-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold text-indigo-400">Rs</span>
                    <span className={`text-3xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {Number(pkg.price_lkr).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">/ year</span>
                  </div>
                </div>

                <div className={`pt-4 border-t space-y-2.5 text-xs ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-700'}`}>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hardware Devices:</span>
                    <strong className="font-mono">{pkg.max_devices} Registers</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Physical Store Outlets:</span>
                    <strong className="font-mono">{pkg.max_stores} Branch</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">User Operators:</span>
                    <strong className="font-mono">{pkg.max_users} Logins</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/40 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Entitled Modules</span>
                  <div className="flex flex-wrap gap-1.5">
                    {pkg.features.map((feat) => (
                      <span key={feat} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-semibold">
                        <Check className="w-3 h-3" />
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => openEditModal(pkg)}
                  icon={Edit3}
                >
                  Edit Plan Quotas
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {selectedPkg && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Edit Plan Limits: ${selectedPkg.code}`}
          subtitle="Configure pricing quotas and register hardware capacity for this tier"
          icon={Layers}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleUpdatePackage} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-300">Plan Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Annual Price (LKR)</label>
                <input
                  type="number"
                  required
                  value={editForm.price_lkr}
                  onChange={(e) => setEditForm({ ...editForm, price_lkr: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none font-mono bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Max Devices</label>
                <input
                  type="number"
                  value={editForm.max_devices}
                  onChange={(e) => setEditForm({ ...editForm, max_devices: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Max Stores</label>
                <input
                  type="number"
                  value={editForm.max_stores}
                  onChange={(e) => setEditForm({ ...editForm, max_stores: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="purple-gradient"
                size="sm"
                loading={submitting}
              >
                Save Plan
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
