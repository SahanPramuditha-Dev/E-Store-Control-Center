import React, { useEffect, useMemo, useState } from 'react';
import { 
  Building2, Store, Key, CreditCard, CheckCircle2, 
  Copy, Download, X, ArrowRight, ArrowLeft, Loader2, Sparkles, RefreshCw,
  Smartphone, ShoppingBag, Shirt, Tv, Sparkles as SparklesIcon, Tag,
  Zap, Crown, Shield, Clock, Infinity as InfinityIcon,
  Landmark, Banknote, Globe
} from 'lucide-react';
import api from '../api';
import { useToast } from './ToastContext';
import CentralSelect from './CentralSelect';

const INDUSTRY_OPTIONS = [
  {
    value: 'MOBILE_RETAIL',
    label: 'Mobile Retail & Repair Center',
    desc: 'IMEI tracking, workshop repairs & serialized warranty',
    icon: Smartphone,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/25',
  },
  {
    value: 'GROCERY',
    label: 'Supermarket & Grocery Store',
    desc: 'Scale barcodes, weight/decimal qty, batch & expiry (FEFO)',
    icon: ShoppingBag,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
  },
  {
    value: 'FASHION',
    label: 'Fashion, Apparel & Footwear',
    desc: 'Size × Color variant matrix, season & apparel collections',
    icon: Shirt,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/25',
  },
  {
    value: 'ELECTRONICS',
    label: 'Consumer Electronics & Appliances',
    desc: 'Serial tracking, warranty claim vault & diagnostic jobs',
    icon: Tv,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/25',
  },
  {
    value: 'COSMETICS',
    label: 'Cosmetics, Beauty & Pharmacy',
    desc: 'Batch tracking, expiry alerts & compact shelf tagging',
    icon: SparklesIcon,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
  },
  {
    value: 'GENERAL_RETAIL',
    label: 'General Retail & Hardware',
    desc: 'Universal barcode inventory, unit conversion & fast billing',
    icon: Tag,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/25',
  },
];

const PACKAGE_OPTIONS = [
  {
    value: 'STARTER',
    price_lkr: 35000,
    label: 'Starter Retail Plan (Rs 35,000)',
    desc: 'Single terminal basic inventory & POS',
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
  },
  {
    value: 'BUSINESS',
    price_lkr: 95000,
    label: 'Business Pro Plan (Rs 95,000)',
    desc: 'Multi-device & full industry workflows',
    icon: Crown,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/25',
  },
  {
    value: 'BUSINESS_AI',
    price_lkr: 145000,
    label: 'iStore Business AI (Rs 145,000)',
    desc: 'AI forecasting, demand & smart ledger',
    icon: Sparkles,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/25',
  },
  {
    value: 'ENTERPRISE',
    price_lkr: 250000,
    label: 'Enterprise AI Suite (Rs 250,000)',
    desc: 'Multi-branch warehouse & unlimited seats',
    icon: Shield,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/25',
  },
];

const LICENSE_TYPE_OPTIONS = [
  {
    value: 'ANNUAL',
    label: 'Annual License (365 Days)',
    desc: 'Standard commercial 1-year entitlement',
    icon: Clock,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/25',
  },
  {
    value: 'TRIAL',
    label: 'Trial Evaluation (14 Days)',
    desc: 'Short demo for pilot evaluation',
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
  },
  {
    value: 'LIFETIME',
    label: 'Lifetime Enterprise License',
    desc: 'Perpetual runtime entitlement',
    icon: InfinityIcon,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
  },
];

const PAYMENT_METHOD_OPTIONS = [
  {
    value: 'BANK_TRANSFER',
    label: 'Bank Transfer / Deposit',
    desc: 'Direct corporate account transfer or slip upload',
    icon: Landmark,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/25',
  },
  {
    value: 'CASH',
    label: 'Cash Collection',
    desc: 'Physical currency collected by sales rep',
    icon: Banknote,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
  },
  {
    value: 'CARD',
    label: 'Credit / Debit Card POS',
    desc: 'Electronic card swipe / merchant terminal',
    icon: CreditCard,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/25',
  },
  {
    value: 'ONLINE',
    label: 'Online Gateway Payment',
    desc: 'Payment link, Stripe / PayHere gateway',
    icon: Globe,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/25',
  },
];

export default function OnboardingModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [availablePackages, setAvailablePackages] = useState([]);

  const [formData, setFormData] = useState({
    // Tenant
    tenant_code: '',
    company_name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    industry_code: 'MOBILE_RETAIL',
    // Shop
    shop_code: '',
    shop_name: '',
    city: '',
    // Package & License
    package_code: 'BUSINESS',
    license_type: 'ANNUAL',
    validity_days: 365,
    max_machines: 2,
    // Payment
    payment_amount: 95000,
    payment_method: 'BANK_TRANSFER',
    payment_reference: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    api.get('/admin/packages').then((res) => {
      if (active) setAvailablePackages((res.data?.packages || []).filter((pkg) => pkg.code !== 'RETAIL'));
    }).catch(() => {
      if (active) setAvailablePackages([]);
    });
    return () => { active = false; };
  }, [isOpen]);

  const packageOptions = useMemo(() => {
    if (!availablePackages.length) return PACKAGE_OPTIONS;
    return availablePackages.map((pkg) => ({
      value: pkg.code,
      label: `${pkg.name} (Rs ${Number(pkg.price_lkr || 0).toLocaleString()})`,
      desc: pkg.description || `${pkg.max_devices || 1} device(s), ${pkg.max_stores || 1} store(s)`,
      icon: pkg.code === 'BUSINESS_AI' ? Sparkles : pkg.code === 'ENTERPRISE' ? Shield : pkg.code === 'BUSINESS' ? Crown : Zap,
      color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/25',
      price_lkr: Number(pkg.price_lkr || 0),
    }));
  }, [availablePackages]);

  const packagePrices = useMemo(
    () => Object.fromEntries(packageOptions.map((pkg) => [pkg.value, Number(pkg.price_lkr ?? availablePackages.find((row) => row.code === pkg.value)?.price_lkr ?? 0)])),
    [packageOptions, availablePackages]
  );

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Only update the direct field being edited, do not overwrite tenant_code or shop_code
      if (name === 'package_code') {
        updated.payment_amount = packagePrices[value] || 0;
      }
      if (name === 'license_type') {
        if (value === 'TRIAL') updated.validity_days = 14;
        else if (value === 'ANNUAL') updated.validity_days = 365;
        else if (value === 'LIFETIME') updated.validity_days = 3650;
      }
      return updated;
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.tenant_code || !formData.company_name || !formData.phone || !formData.contact_name) {
        showToast('Please fill in required organization fields (Company, Code, Contact, Phone).', 'error');
        return;
      }
      if (!formData.shop_name) formData.shop_name = `${formData.company_name} Main Branch`;
      if (!formData.shop_code) formData.shop_code = `${formData.tenant_code}-HQ`;
    } else if (step === 2) {
      if (!formData.shop_code || !formData.shop_name) {
        showToast('Please provide shop code and branch name.', 'error');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        validity_days: parseInt(formData.validity_days, 10),
        max_machines: parseInt(formData.max_machines, 10),
        payment_amount: formData.payment_amount ? parseFloat(formData.payment_amount) : 0,
      };

      const res = await api.post('/admin/onboard', payload);
      setResult(res.data);
      setStep(4); // Success step
      showToast('Client successfully onboarded and license issued!', 'success');
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to complete onboarding.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyLicenseKey = () => {
    if (!result?.license_key) return;
    navigator.clipboard.writeText(result.license_key);
    setCopied(true);
    showToast('License Key copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadToken = async () => {
    if (!result?.license_id) return;
    try {
      const res = await api.get(`/admin/licenses/${result.license_id}/export-token`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `license-${result.license_key}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded offline license token JSON.', 'success');
    } catch (err) {
      showToast('Failed to export license token', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Rapid Client Onboarding Wizard</h2>
              <p className="text-xs text-slate-400">Create organization, branch shop, and issue digital license</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {step < 4 && (
          <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/20 text-xs">
            <div className={`p-3 text-center font-bold border-b-2 transition ${step === 1 ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-transparent text-slate-400'}`}>
              1. Organization
            </div>
            <div className={`p-3 text-center font-bold border-b-2 transition ${step === 2 ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-transparent text-slate-400'}`}>
              2. Branch & Package
            </div>
            <div className={`p-3 text-center font-bold border-b-2 transition ${step === 3 ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-transparent text-slate-400'}`}>
              3. Billing & Review
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Tenant / Enterprise Profile
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">Company / Business Name *</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="e.g. Apex Cellular Ltd"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-slate-300 font-semibold">Tenant Code (Unique ID) *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const code = (formData.company_name || 'SHOP').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) || 'TENANT';
                        setFormData(prev => ({ ...prev, tenant_code: code }));
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <RefreshCw size={10} /> Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    name="tenant_code"
                    value={formData.tenant_code}
                    onChange={handleChange}
                    placeholder="e.g. APEXMOBI or IPOINTHQ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 uppercase transition"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Unique slug used in database isolation & license cryptographic signing.</p>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">Contact Person *</label>
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +94 77 123 4567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. billing@apex.lk"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">Physical Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. 120 Galle Road, Colombo 03"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition"
                  />
                </div>
                <div className="col-span-2">
                  <CentralSelect
                    label="Industry Vertical *"
                    value={formData.industry_code || 'MOBILE_RETAIL'}
                    onChange={(val) => setFormData(prev => ({ ...prev, industry_code: val }))}
                    options={INDUSTRY_OPTIONS}
                    placement="auto"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-sky-400" />
                First Branch Outlet & Software Plan
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">Branch Name *</label>
                  <input
                    type="text"
                    name="shop_name"
                    value={formData.shop_name}
                    onChange={handleChange}
                    placeholder="e.g. Main Flagship Store"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">Branch Code *</label>
                  <input
                    type="text"
                    name="shop_code"
                    value={formData.shop_code}
                    onChange={handleChange}
                    placeholder="e.g. APEX-HQ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 uppercase transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">City / Region</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Colombo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition"
                  />
                </div>
                <CentralSelect
                  label="Software Package Tier"
                  value={formData.package_code}
                  onChange={(val) => {
                    setFormData(prev => ({
                      ...prev,
                      package_code: val,
                      payment_amount: packagePrices[val] || 0
                    }));
                  }}
                  options={packageOptions}
                  placement="auto"
                />
                <CentralSelect
                  label="License Duration / Type"
                  value={formData.license_type}
                  onChange={(val) => {
                    let validity = 365;
                    if (val === 'TRIAL') validity = 14;
                    else if (val === 'LIFETIME') validity = 3650;
                    setFormData(prev => ({
                      ...prev,
                      license_type: val,
                      validity_days: validity
                    }));
                  }}
                  options={LICENSE_TYPE_OPTIONS}
                  placement="auto"
                />
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">Max Authorized Terminals (PCs)</label>
                  <input
                    type="number"
                    name="max_machines"
                    min="1"
                    max="50"
                    value={formData.max_machines}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                Initial Invoice & Payment Recording
              </h3>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Organization:</span>
                  <span className="font-semibold text-white">{formData.company_name} ({formData.tenant_code})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>First Branch:</span>
                  <span className="font-semibold text-white">{formData.shop_name} ({formData.shop_code})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Selected Tier:</span>
                  <span className="font-semibold text-indigo-300">{formData.package_code} ({formData.license_type})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Terminal Quota:</span>
                  <span className="font-semibold text-white">{formData.max_machines} Connected POS PCs</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">Payment Amount (LKR)</label>
                  <input
                    type="number"
                    name="payment_amount"
                    value={formData.payment_amount}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 font-mono transition"
                  />
                </div>
                <CentralSelect
                  label="Payment Method"
                  value={formData.payment_method}
                  onChange={(val) => setFormData(prev => ({ ...prev, payment_method: val }))}
                  options={PAYMENT_METHOD_OPTIONS}
                  placement="auto"
                />
                <div className="col-span-2">
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">Payment Reference / Cheque No</label>
                  <input
                    type="text"
                    name="payment_reference"
                    value={formData.payment_reference}
                    onChange={handleChange}
                    placeholder="e.g. TXN-99881234 or Bank Slip Number"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && result && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Client Successfully Activated!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tenant, branch shop, and Ed25519 digitally signed license key are ready for POS deployment.
                </p>
              </div>

              {/* License Key Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                    Generated License Key
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-mono">
                    {result.package_code}
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-sm text-indigo-300 select-all">
                  <span className="truncate">{result.license_key}</span>
                  <button
                    onClick={copyLicenseKey}
                    className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition shrink-0 ml-2 cursor-pointer"
                    title="Copy License Key"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {result.expires_at && (
                  <p className="text-[11px] text-slate-400">
                    Expires on: <span className="text-white font-medium">{new Date(result.expires_at).toLocaleDateString()}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleDownloadToken}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  Download Offline Token (.json)
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {step < 4 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-slate-300 hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold transition shadow-md shadow-indigo-500/25 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Complete Onboarding
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
