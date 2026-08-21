import React, { useEffect, useState } from 'react';
import { 
  CreditCard, Check, RefreshCw, Sparkles, Shield, Cpu, 
  Edit3, X, Loader2, Layers, CheckCircle2, ArrowRight, DollarSign
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';

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
      setPackages(res.data.packages || []);
      setAllFeatures(res.data.all_features || []);
    } catch (err) {
      showToast('Failed to load subscriptions & plans.', 'error');
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
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Subscriptions & Monetization Plans
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Configure commercial pricing tiers, device authorizations, storage limits, and module entitlement matrices
          </p>
        </div>
        <button
          onClick={fetchPackages}
          className={`p-2.5 rounded-2xl border transition shadow-xs active:scale-95 ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
              : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`p-6 rounded-3xl border flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${
                  pkg.code.includes('AI') 
                    ? (isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200')
                    : (isDark ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200')
                }`}>
                  {pkg.code}
                </span>
                <button
                  onClick={() => openEditModal(pkg)}
                  className={`p-1.5 rounded-xl border text-xs font-bold transition ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className={`text-xl font-extrabold mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{pkg.name}</h3>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{pkg.description}</p>

              <div className="mt-5">
                <span className={`text-2xl sm:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Rs {pkg.price_lkr.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 ml-1.5 font-semibold">/ year</span>
              </div>

              {/* Quotas */}
              <div className={`mt-5 pt-4 border-t space-y-2 text-xs font-medium ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-700'}`}>
                <div className="flex justify-between">
                  <span className="text-slate-400">POS Terminals:</span>
                  <span className="font-bold text-teal-500">{pkg.max_devices || 2} Devices</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stores / Outlets:</span>
                  <span className="font-bold text-teal-500">{pkg.max_stores || 1} Branches</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cloud Storage:</span>
                  <span className="font-bold">{pkg.storage_gb || 10} GB</span>
                </div>
              </div>
            </div>

            {/* Feature Modules */}
            <div className={`pt-4 border-t space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Enabled Modules ({pkg.features.length})
              </span>
              <div className="space-y-1.5">
                {pkg.features.slice(0, 4).map((fCode) => (
                  <div key={fCode} className="flex items-center gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span className={`font-mono truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{fCode}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-500" />
                <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Edit Plan Limits: {selectedPkg.code}
                </h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePackage} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Plan Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Annual Price (LKR)</label>
                  <input
                    type="number"
                    required
                    value={editForm.price_lkr}
                    onChange={(e) => setEditForm({ ...editForm, price_lkr: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none font-mono ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Max Devices</label>
                  <input
                    type="number"
                    value={editForm.max_devices}
                    onChange={(e) => setEditForm({ ...editForm, max_devices: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Max Stores</label>
                  <input
                    type="number"
                    value={editForm.max_stores}
                    onChange={(e) => setEditForm({ ...editForm, max_stores: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>
              </div>

              <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
