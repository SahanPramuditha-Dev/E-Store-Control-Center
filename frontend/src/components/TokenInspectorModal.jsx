import React, { useState, useEffect } from 'react';
import { ShieldCheck, Download, Copy, Check, X, Loader2, Key, Terminal } from 'lucide-react';
import api from '../api';
import { useToast } from './ToastContext';

export default function TokenInspectorModal({ isOpen, onClose, licenseId, licenseKey }) {
  const { showToast } = useToast();
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSig, setCopiedSig] = useState(false);

  useEffect(() => {
    if (isOpen && licenseId) {
      fetchToken();
    } else {
      setTokenData(null);
    }
  }, [isOpen, licenseId]);

  const fetchToken = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/licenses/${licenseId}/export-token`);
      setTokenData(res.data);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to export license token.', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopySig = () => {
    if (!tokenData?.signature) return;
    navigator.clipboard.writeText(tokenData.signature);
    setCopiedSig(true);
    showToast('Cryptographic signature copied to clipboard!', 'success');
    setTimeout(() => setCopiedSig(false), 2000);
  };

  const handleDownload = () => {
    if (!tokenData) return;
    const blob = new Blob([JSON.stringify(tokenData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `license-${tokenData.license_key}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('License JSON token downloaded successfully.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Cryptographic Token Inspector</h2>
              <p className="text-xs text-slate-400 font-mono">{licenseKey}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
              <p className="text-sm">Generating Ed25519 signed license token...</p>
            </div>
          ) : tokenData ? (
            <>
              {/* Token metadata */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Tenant & Shop</span>
                  <span className="font-semibold text-white">{tokenData.tenant_name} ({tokenData.shop_name})</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Algorithm</span>
                  <span className="font-semibold text-indigo-400 font-mono">Ed25519 Asymmetric DSA</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Package Code</span>
                  <span className="font-semibold text-white">{tokenData.payload?.package_code}</span>
                </div>
              </div>

              {/* Entitlements / Features */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Enabled Feature Entitlements
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tokenData.payload?.entitlements?.map((f) => (
                    <span
                      key={f}
                      className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-xs"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ed25519 Signature Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    Digital Signature (Base64)
                  </span>
                  <button
                    onClick={handleCopySig}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                  >
                    {copiedSig ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSig ? 'Copied' : 'Copy Signature'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 break-all select-all">
                  {tokenData.signature}
                </div>
              </div>

              {/* Payload JSON */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-400" />
                    Payload Object (Signed Claims)
                  </span>
                </div>
                <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto max-h-48 leading-relaxed">
                  {JSON.stringify(tokenData.payload, null, 2)}
                </pre>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={!tokenData}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Offline Token File (`license.json`)
          </button>
        </div>
      </div>
    </div>
  );
}

