import React, { useState } from 'react';
import { 
  Building2, Store, Key, CreditCard, CheckCircle2, 
  Copy, Download, X, ArrowRight, ArrowLeft, Loader2, Sparkles 
} from 'lucide-react';
import api from '../api';
import { useToast } from './ToastContext';

export default function OnboardingModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    // Tenant
    tenant_code: '',
    company_name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
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

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Only update the direct field being edited, do not overwrite tenant_code or shop_code
      if (name === 'package_code') {
        const prices = {
          STARTER: 35000,
          BUSINESS: 95000,
          ENTERPRISE: 250000,
          RETAIL: 55000,
          BUSINESS_AI: 145000
        };
        updated.payment_amount = prices[value] || 0;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
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
            <div className={`p-3 text-center font-medium border-b-2 transition ${step === 1 ? 'border-teal-400 text-teal-400 bg-teal-500/5' : 'border-transparent text-slate-400'}`}>
              1. Organization
            </div>
            <div className={`p-3 text-center font-medium border-b-2 transition ${step === 2 ? 'border-teal-400 text-teal-400 bg-teal-500/5' : 'border-transparent text-slate-400'}`}>
              2. Branch & Package
            </div>
            <div className={`p-3 text-center font-medium border-b-2 transition ${step === 3 ? 'border-teal-400 text-teal-400 bg-teal-500/5' : 'border-transparent text-slate-400'}`}>
              3. Billing & Review
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-400" />
                Tenant / Enterprise Profile
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Company / Business Name *</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="e.g. Apex Cellular Ltd"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Tenant Code (Unique ID) *</label>
                  <input
                    type="text"
                    name="tenant_code"
                    value={formData.tenant_code}
                    onChange={handleChange}
                    placeholder="e.g. APEX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-teal-500 uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Contact Person *</label>
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +94 77 123 4567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. billing@apex.lk"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Industry Vertical *</label>
                  <select
                    name="industry_code"
                    value={formData.industry_code || 'MOBILE_RETAIL'}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="MOBILE_RETAIL">📱 Mobile Retail & Repair Center</option>
                    <option value="GROCERY">🥦 Supermarket & Grocery Store</option>
                    <option value="FASHION">👗 Fashion, Apparel & Footwear</option>
                    <option value="ELECTRONICS">📺 Consumer Electronics</option>
                    <option value="COSMETICS">✨ Cosmetics & Pharmacy</option>
                    <option value="GENERAL_RETAIL">🏷️ General Retail & Hardware</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Physical Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. 120 Galle Road, Colombo 03"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          )}


          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-sky-400" />
                First Branch Outlet & Software Plan
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Branch Name *</label>
                  <input
                    type="text"
                    name="shop_name"
                    value={formData.shop_name}
                    onChange={handleChange}
                    placeholder="e.g. Main Flagship Store"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Branch Code *</label>
                  <input
                    type="text"
                    name="shop_code"
                    value={formData.shop_code}
                    onChange={handleChange}
                    placeholder="e.g. APEX-HQ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-teal-500 uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">City / Region</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Colombo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Software Package Tier</label>
                  <select
                    name="package_code"
                    value={formData.package_code}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="STARTER">Starter Retail Plan (Rs 35,000)</option>
                    <option value="BUSINESS">Business Pro Plan (Rs 95,000)</option>
                    <option value="BUSINESS_AI">iStore Business AI (Rs 145,000)</option>
                    <option value="ENTERPRISE">Enterprise AI Suite (Rs 250,000)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">License Duration / Type</label>
                  <select
                    name="license_type"
                    value={formData.license_type}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="ANNUAL">Annual (1 Year - 365 Days)</option>
                    <option value="TRIAL">Trial (14 Days Demo)</option>
                    <option value="LIFETIME">Lifetime License</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Max Authorized Terminals (PCs)</label>
                  <input
                    type="number"
                    name="max_machines"
                    min="1"
                    max="50"
                    value={formData.max_machines}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
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
                  <span className="font-semibold text-teal-300">{formData.package_code} ({formData.license_type})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Terminal Quota:</span>
                  <span className="font-semibold text-white">{formData.max_machines} Connected POS PCs</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Payment Amount (LKR)</label>
                  <input
                    type="number"
                    name="payment_amount"
                    value={formData.payment_amount}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Payment Method</label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer / Deposit</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="ONLINE">Online Gateway</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 font-medium block mb-1">Payment Reference / Cheque No</label>
                  <input
                    type="text"
                    name="payment_reference"
                    value={formData.payment_reference}
                    onChange={handleChange}
                    placeholder="e.g. TXN-99881234 or Bank Slip Number"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && result && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto shadow-xl shadow-teal-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Client Successfully Activated!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tenant, branch shop, and Ed25519 digitally signed license key are ready for POS deployment.
                </p>
              </div>

              {/* License Key Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-teal-500/30 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400">
                    Generated License Key
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 font-mono">
                    {result.package_code}
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-sm text-teal-300 select-all">
                  <span className="truncate">{result.license_key}</span>
                  <button
                    onClick={copyLicenseKey}
                    className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition shrink-0 ml-2"
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  <Download className="w-4 h-4 text-teal-400" />
                  Download Offline Token (.json)
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-teal-500/20"
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-medium transition"
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition shadow-md shadow-teal-500/20"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition shadow-md shadow-teal-500/20 disabled:opacity-50"
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
