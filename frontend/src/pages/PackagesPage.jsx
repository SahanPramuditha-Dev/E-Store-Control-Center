import React, { useEffect, useState } from 'react';
import { Package, Check, RefreshCw, Sparkles, Shield, Cpu, Edit3, X, Loader2 } from 'lucide-react';
import api from '../api';

export default function PackagesPage() {
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
      console.error('Failed to load packages', err);
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
      setShowEditModal(false);
      fetchPackages();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update package');
    } finally {
      setSubmitting(false);
    }
  };

  const getTierDetails = (code) => {
    switch (code) {
      case 'RETAIL':
        return {
          color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          tag: 'Small Retail & General Stores'
        };
      case 'BUSINESS':
        return {
          color: 'from-teal-500/20 to-emerald-500/20 border-teal-500/30',
          badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
          tag: 'Mobile & Computer Repair (Primary)'
        };
      case 'BUSINESS_AI':
        return {
          color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          tag: 'Flagship with Gemini AI Insights'
        };
      default:
        return {
          color: 'from-slate-500/20 to-slate-500/20 border-slate-700',
          badge: 'bg-slate-800 text-slate-300',
          tag: 'Custom Plan'
        };
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Commercial Packages & Entitlements</h1>
          <p className="text-sm text-slate-400 mt-1">Feature entitlement catalog and pricing tiers offered to shops</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const tier = getTierDetails(pkg.code);
            return (
              <div
                key={pkg.id}
                className={`p-6 bg-gradient-to-b ${tier.color} bg-slate-900/80 border rounded-2xl flex flex-col justify-between space-y-6 shadow-xl backdrop-blur-sm relative`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${tier.badge}`}>
                      {pkg.code}
                    </span>
                    <button
                      onClick={() => openEditModal(pkg)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-white mt-4">{pkg.name}</h3>
                  <p className="text-xs text-slate-300 mt-1">{pkg.description}</p>

                  <div className="mt-6">
                    <span className="text-3xl font-extrabold text-white tracking-tight">
                      LKR {pkg.price_lkr.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5 font-medium">/ license</span>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-800 space-y-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-3">
                      Enabled Features ({pkg.features.length})
                    </span>
                    {pkg.features.map((fCode, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-200">
                        <div className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className="font-mono text-slate-300">{fCode}</span>
                      </div>
                    ))}
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
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Edit Package Entitlements</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdatePackage} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Package Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Price (LKR)</label>
                  <input
                    type="number"
                    required
                    value={editForm.price_lkr}
                    onChange={(e) => setEditForm({ ...editForm, price_lkr: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Feature Entitlements (Check to enable)
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-48 overflow-y-auto">
                  {allFeatures.map(feat => {
                    const isChecked = editForm.feature_codes.includes(feat.code);
                    return (
                      <label
                        key={feat.code}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition ${
                          isChecked 
                            ? 'bg-teal-500/10 border-teal-500/30 text-teal-300' 
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFeature(feat.code)}
                          className="rounded border-slate-700 text-teal-500 focus:ring-0"
                        />
                        <span className="font-mono">{feat.code}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Entitlements</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
