import React, { useEffect, useState } from 'react';
import { Package, Check, RefreshCw, Sparkles, Shield, Cpu, Edit3, X, Loader2, Layers, CheckCircle2 } from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';

export default function PackagesPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [packages, setPackages] = useState([]);
  const [allFeatures, setAllFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price_lkr: 0,
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
      showToast('Failed to load packages and tiers.', 'error');
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
      feature_codes: [...pkg.features]
    });
    setShowEditModal(true);
  };

  const toggleFeature = (code) => {
    setEditForm(prev => {
      const exists = prev.feature_codes.includes(code);
      if (exists) {
        return { ...prev, feature_codes: prev.feature_codes.filter(c => c !== code) };
      } else {
        return { ...prev, feature_codes: [...prev.feature_codes, code] };
      }
    });
  };

  const handleUpdatePackage = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/admin/packages/${selectedPkg.id}`, {
        ...editForm,
        price_lkr: parseFloat(editForm.price_lkr)
      });
      showToast('Package tier and feature flags updated successfully.', 'success');
      setShowEditModal(false);
      fetchPackages();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update package', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getTierDetails = (code) => {
    switch (code) {
      case 'RETAIL':
        return {
          bg: isDark ? 'from-blue-500/10 to-slate-900/90 border-blue-500/30' : 'from-blue-50/60 to-white border-blue-200',
          badge: isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200',
          accent: 'text-blue-500',
          tag: 'Small Retail & General Stores'
        };
      case 'BUSINESS':
        return {
          bg: isDark ? 'from-teal-500/10 to-slate-900/90 border-teal-500/30' : 'from-teal-50/60 to-white border-teal-200',
          badge: isDark ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200',
          accent: 'text-teal-500',
          tag: 'Mobile & Computer Repair (Primary)'
        };
      case 'BUSINESS_AI':
        return {
          bg: isDark ? 'from-purple-500/10 to-slate-900/90 border-purple-500/30' : 'from-purple-50/60 to-white border-purple-200',
          badge: isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200',
          accent: 'text-purple-500',
          tag: 'Flagship with Gemini AI Insights'
        };
      default:
        return {
          bg: isDark ? 'from-slate-800/20 to-slate-900/90 border-slate-800' : 'from-slate-50 to-white border-slate-200',
          badge: isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200',
          accent: 'text-teal-500',
          tag: 'Custom Plan'
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Commercial Packages & Entitlements
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Configure pricing plans, hardware quotas, and feature flag entitlements
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-teal-500 animate-spin mb-2" />
          <p className="text-xs text-slate-400">Loading Commercial Packages...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const tier = getTierDetails(pkg.code);
            return (
              <div
                key={pkg.id}
                className={`p-6 sm:p-7 bg-gradient-to-b ${tier.bg} border rounded-3xl flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${tier.badge}`}>
                      {pkg.code}
                    </span>
                    <button
                      onClick={() => openEditModal(pkg)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition active:scale-95 ${
                        isDark 
                          ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Plan</span>
                    </button>
                  </div>

                  <h3 className={`text-xl font-extrabold mt-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{pkg.name}</h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{pkg.description || tier.tag}</p>

                  <div className="mt-6">
                    <span className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Rs {pkg.price_lkr.toLocaleString()}
                    </span>
                    <span className={`text-xs ml-2 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ annual license</span>
                  </div>

                  <div className={`mt-6 pt-5 border-t space-y-2.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider block mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Enabled Features ({pkg.features.length})
                    </span>
                    <div className="space-y-2">
                      {pkg.features.map((fCode) => (
                        <div key={fCode} className="flex items-center gap-2 text-xs">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${tier.badge}`}>
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className={`font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {fCode}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Edit Package */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-500" />
                <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Configure Package & Features
                </h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePackage} className="space-y-4 mt-4 text-xs">
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
                <label className={`block font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Entitled Features & Modules
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {allFeatures.map((f) => {
                    const active = editForm.feature_codes.includes(f.code);
                    return (
                      <button
                        type="button"
                        key={f.code}
                        onClick={() => toggleFeature(f.code)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                          active
                            ? 'bg-teal-500/10 border-teal-500/40 text-teal-600 dark:text-teal-400 font-bold'
                            : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="truncate">{f.name || f.code}</span>
                        {active && <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />}
                      </button>
                    );
                  })}
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
