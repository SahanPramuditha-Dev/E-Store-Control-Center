import React, { useState, useEffect } from 'react';
import { 
  Building2, Layers, CheckCircle2, XCircle, RefreshCw, 
  Sliders, Shield, Sparkles, Smartphone, ShoppingBasket, Shirt, 
  Tv, Sparkle, Tag, Info, Check, Save, ArrowRight
} from 'lucide-react';
import { useToast } from '../components/ToastContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const INDUSTRY_ICONS = {
  MOBILE_RETAIL: Smartphone,
  GROCERY: ShoppingBasket,
  FASHION: Shirt,
  ELECTRONICS: Tv,
  COSMETICS: Sparkle,
  GENERAL_RETAIL: Tag,
};

export default function IndustryTemplatesPage() {
  const { addToast } = useToast();
  const [industries, setIndustries] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState('MOBILE_RETAIL');
  const [previewBreakdown, setPreviewBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('estore_admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [indRes, capRes] = await Promise.all([
        fetch(`${API_BASE}/admin/industries`, { headers }),
        fetch(`${API_BASE}/admin/capabilities/registry`, { headers })
      ]);

      if (indRes.ok && capRes.ok) {
        const indData = await indRes.json();
        const capData = await capRes.json();
        setIndustries(indData);
        setCapabilities(capData);
        if (indData.length > 0) {
          fetchPreview(selectedIndustry || indData[0].code);
        }
      }
    } catch (e) {
      addToast('Failed to load industry configurations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async (indCode) => {
    try {
      const token = localStorage.getItem('estore_admin_token');
      const res = await fetch(`${API_BASE}/admin/capabilities/resolve-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ industry_code: indCode })
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewBreakdown(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSelectIndustry = (code) => {
    setSelectedIndustry(code);
    fetchPreview(code);
  };

  const currentTemplate = industries.find(i => i.code === selectedIndustry);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="text-indigo-600 dark:text-indigo-400" />
            Industry Templates & Capabilities
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Centrally govern industry templates, capability matrices, and feature flags across all E-Store ERP tenants.
          </p>
        </div>
        <button
          onClick={fetchInitialData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Industry Selector Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {industries.map((ind) => {
          const Icon = INDUSTRY_ICONS[ind.code] || Tag;
          const isSelected = selectedIndustry === ind.code;
          return (
            <button
              key={ind.code}
              onClick={() => handleSelectIndustry(ind.code)}
              className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`p-2.5 rounded-xl w-fit mb-3 ${
                isSelected 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <Icon size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Industry</span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{ind.name}</h4>
              </div>
            </button>
          );
        })}
      </div>

      {/* Details & Capability Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template Details & Purpose */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Selected Template</span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">{currentTemplate?.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {currentTemplate?.description}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Shield size={14} className="text-emerald-500" />
              <span>Authoritative SaaS Governance</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tenants assigned to this industry inherit these default capabilities automatically upon registration.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Hierarchy & Resolution Formula</h4>
            <div className="p-3 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] leading-relaxed">
              Effective = Plan_Entitled && (Org_Override ?? Industry_Default)
            </div>
          </div>
        </div>

        {/* Right: Resolved Capabilities Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Active Capabilities for {currentTemplate?.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Feature switches and behavior flags embedded in signed tenant licenses</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 rounded-full text-[11px] font-bold">
              {previewBreakdown ? Object.values(previewBreakdown.effective_capabilities || {}).filter(Boolean).length : 0} Enabled
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {capabilities.map((cap) => {
              const isEnabled = previewBreakdown?.effective_capabilities?.[cap.key] || false;
              return (
                <div
                  key={cap.key}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition ${
                    isEnabled
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                      : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{cap.name}</span>
                      <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-mono rounded">
                        {cap.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{cap.description}</p>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    {isEnabled ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <XCircle size={18} className="text-slate-400 dark:text-slate-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
