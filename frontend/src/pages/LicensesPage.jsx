import React, { useEffect, useState } from 'react';
import { 
  Key, Plus, RefreshCw, Copy, Check, RotateCcw, 
  AlertTriangle, X, Loader2, Ban, PlayCircle, History, ShieldAlert
} from 'lucide-react';
import api from '../api';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [shops, setShops] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('suspend'); // 'suspend' or 'revoke'
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [selectedLicense, setSelectedLicense] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [issueForm, setIssueForm] = useState({
    tenant_id: '',
    shop_id: '',
    package_code: 'BUSINESS',
    license_type: 'ANNUAL',
    validity_days: 365,
    max_machines: 1,
    payment_amount: 95000,
    payment_method: 'BANK_TRANSFER',
    payment_reference: ''
  });

  const [resetReason, setResetReason] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [renewForm, setRenewForm] = useState({
    validity_days: 365,
    payment_amount: 30000,
    payment_method: 'BANK_TRANSFER',
    payment_reference: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [licRes, tenantsRes, shopsRes, pkgRes] = await Promise.all([
        api.get('/admin/licenses'),
        api.get('/admin/tenants'),
        api.get('/admin/shops'),
        api.get('/admin/packages')
      ]);
      setLicenses(licRes.data);
      setTenants(tenantsRes.data);
      setShops(shopsRes.data);
      const pkgList = pkgRes.data.packages || [];
      setPackages(pkgList);

      // Auto-select first available tenant and shop if not set
      if (tenantsRes.data.length > 0) {
        const firstTenant = tenantsRes.data[0];
        const firstShop = shopsRes.data.find(s => s.tenant_id === firstTenant.id);
        const defaultPkg = pkgList.find(p => p.code === 'BUSINESS') || pkgList[0];
        setIssueForm(prev => ({
          ...prev,
          tenant_id: prev.tenant_id || firstTenant.id.toString(),
          shop_id: prev.shop_id || (firstShop ? firstShop.id.toString() : ''),
          package_code: prev.package_code || (defaultPkg ? defaultPkg.code : 'BUSINESS'),
          payment_amount: defaultPkg ? defaultPkg.price_lkr : prev.payment_amount
        }));
      }
    } catch (err) {
      console.error('Failed to load licenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const openHistory = async (lic) => {
    setSelectedLicense(lic);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/admin/licenses/${lic.id}/history`);
      setHistoryData(res.data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleIssueLicense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/licenses', {
        ...issueForm,
        tenant_id: parseInt(issueForm.tenant_id),
        shop_id: parseInt(issueForm.shop_id),
        validity_days: parseInt(issueForm.validity_days),
        payment_amount: parseFloat(issueForm.payment_amount) || 0
      });
      setShowIssueModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to issue license');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetMachine = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/admin/licenses/${selectedLicense.id}/reset-machine`, {
        reason: resetReason
      });
      setShowResetModal(false);
      setResetReason('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reset machine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenewLicense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/admin/licenses/${selectedLicense.id}/renew`, {
        validity_days: parseInt(renewForm.validity_days),
        payment_amount: parseFloat(renewForm.payment_amount) || 0,
        payment_method: renewForm.payment_method,
        payment_reference: renewForm.payment_reference
      });
      setShowRenewModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to renew license');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspendOrRevoke = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = actionType === 'suspend' 
        ? `/admin/licenses/${selectedLicense.id}/suspend` 
        : `/admin/licenses/${selectedLicense.id}/revoke`;
      
      await api.post(endpoint, { reason: actionReason });
      setShowActionModal(false);
      setActionReason('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed action');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivate = async (licId) => {
    if (!window.confirm('Are you sure you want to reactivate this license?')) return;
    try {
      await api.post(`/admin/licenses/${licId}/reactivate`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reactivate license');
    }
  };

  const availableShops = shops.filter(s => !issueForm.tenant_id || s.tenant_id === parseInt(issueForm.tenant_id));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Cryptographic Licenses</h1>
          <p className="text-sm text-slate-400 mt-1">Issue, renew, suspend, and monitor Ed25519 digitally-signed shop licenses</p>
        </div>
        <button
          onClick={() => setShowIssueModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl text-sm transition shadow-lg shadow-teal-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Generate New License</span>
        </button>
      </div>

      {/* Licenses Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
          </div>
        ) : licenses.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No licenses issued yet</h3>
            <p className="text-xs text-slate-500 mt-1">Click the button above to generate your first client license key.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">License Key</th>
                  <th className="px-6 py-4">Shop & Customer</th>
                  <th className="px-6 py-4">Package</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Terminals</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {licenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
                          {lic.license_key}
                        </span>
                        <button
                          onClick={() => handleCopy(lic.license_key)}
                          title="Copy License Key"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          {copiedKey === lic.license_key ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{lic.shop_name}</p>
                      <span className="text-xs text-slate-400">{lic.tenant_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                        {lic.package_code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                        lic.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : lic.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : lic.status === 'SUSPENDED'
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {lic.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">
                      <span>{lic.active_machines_count} / {lic.max_machines} Online</span>
                      {lic.replacement_count > 0 && (
                        <p className="text-[10px] text-slate-500 mt-0.5">{lic.replacement_count} reset(s)</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {lic.expires_at ? new Date(lic.expires_at).toLocaleDateString() : 'Lifetime'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => openHistory(lic)}
                        title="View Full History"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLicense(lic);
                          setShowResetModal(true);
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                      >
                        Reset PC
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLicense(lic);
                          setShowRenewModal(true);
                        }}
                        className="px-2.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg text-xs font-medium transition"
                      >
                        Renew
                      </button>
                      {lic.status === 'ACTIVE' ? (
                        <button
                          onClick={() => {
                            setSelectedLicense(lic);
                            setActionType('suspend');
                            setShowActionModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-medium transition"
                        >
                          Suspend
                        </button>
                      ) : lic.status === 'SUSPENDED' ? (
                        <button
                          onClick={() => handleReactivate(lic.id)}
                          className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition"
                        >
                          Reactivate
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: License Full History */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">License Audit Trail & History</h2>
                <p className="font-mono text-xs text-teal-400">{historyData?.license_key}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {historyLoading ? (
              <div className="p-8 flex justify-center">
                <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6 mt-4">
                {/* Events */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Lifecycle Events</h3>
                  <div className="space-y-2">
                    {historyData?.events?.map(e => (
                      <div key={e.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-teal-400">{e.event_type}</span>
                            <span className="text-[10px] text-slate-500">by {e.actor}</span>
                          </div>
                          {e.notes && <p className="text-slate-300 mt-1">{e.notes}</p>}
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0">{new Date(e.created_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Machines */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Bound Machines</h3>
                  <div className="space-y-2">
                    {historyData?.machines?.map(m => (
                      <div key={m.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs flex items-center justify-between">
                        <div>
                          <p className="font-mono text-slate-200">{m.fingerprint}</p>
                          <span className="text-[10px] text-slate-500">{m.name} | v{m.app_version}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Issue License */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Generate License Key</h2>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleIssueLicense} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Company Tenant</label>
                <select
                  required
                  value={issueForm.tenant_id}
                  onChange={(e) => setIssueForm({ ...issueForm, tenant_id: e.target.value, shop_id: '' })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                >
                  <option value="">-- Select Customer Company --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.company_name} ({t.tenant_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Shop Branch</label>
                <select
                  required
                  value={issueForm.shop_id}
                  onChange={(e) => setIssueForm({ ...issueForm, shop_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                >
                  <option value="">-- Select Branch --</option>
                  {availableShops.map(s => (
                    <option key={s.id} value={s.id}>{s.shop_name} ({s.shop_code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Package Plan</label>
                  <select
                    value={issueForm.package_code}
                    onChange={(e) => {
                      const p = packages.find(pkg => pkg.code === e.target.value);
                      setIssueForm({ 
                        ...issueForm, 
                        package_code: e.target.value,
                        payment_amount: p ? p.price_lkr : issueForm.payment_amount
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none font-semibold"
                  >
                    {packages.length > 0 ? (
                      packages.map(p => (
                        <option key={p.code} value={p.code}>{p.name} (~LKR {p.price_lkr?.toLocaleString()})</option>
                      ))
                    ) : (
                      <>
                        <option value="STARTER">STARTER (~LKR 35,000)</option>
                        <option value="BUSINESS">BUSINESS (~LKR 95,000)</option>
                        <option value="ENTERPRISE">ENTERPRISE (~LKR 250,000)</option>
                        <option value="RETAIL">RETAIL (~LKR 55,000)</option>
                        <option value="BUSINESS_AI">BUSINESS AI (~LKR 145,000)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Duration</label>
                  <select
                    value={issueForm.validity_days}
                    onChange={(e) => setIssueForm({ ...issueForm, validity_days: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="365">1 Year (365 Days)</option>
                    <option value="730">2 Years (730 Days)</option>
                    <option value="30">1 Month Trial (30 Days)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Initial Payment (LKR)</label>
                  <input
                    type="number"
                    value={issueForm.payment_amount}
                    onChange={(e) => setIssueForm({ ...issueForm, payment_amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Reference</label>
                  <input
                    type="text"
                    placeholder="BOC-TX-98721"
                    value={issueForm.payment_reference}
                    onChange={(e) => setIssueForm({ ...issueForm, payment_reference: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Sign & Issue Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Suspend / Revoke */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white capitalize">{actionType} License</h2>
                <p className="text-xs text-slate-400">{selectedLicense?.shop_name}</p>
              </div>
            </div>
            <form onSubmit={handleSuspendOrRevoke} className="space-y-4 mt-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                {actionType === 'suspend' 
                  ? 'This will immediately lock all premium POS/Repair features for this shop until reactivated.' 
                  : 'WARNING: Revoking permanently invalidates this license key.'}
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Reason for Action</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Non-payment of annual renewal invoice..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-xl text-sm flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span className="capitalize">Confirm {actionType}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Machine */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Reset Hardware Machine</h2>
                <p className="text-xs text-slate-400">{selectedLicense?.shop_name}</p>
              </div>
            </div>
            <form onSubmit={handleResetMachine} className="space-y-4 mt-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                This will unbind all existing computers from this license and allow the client to activate on a replacement computer.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Reason for Hardware Reset</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Motherboard replacement, new cashier PC installed..."
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-sm flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirm Reset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Renew License */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">Renew License Subscription</h2>
                <p className="text-xs text-slate-400">{selectedLicense?.shop_name}</p>
              </div>
              <button onClick={() => setShowRenewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRenewLicense} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Extend Validity By</label>
                <select
                  value={renewForm.validity_days}
                  onChange={(e) => setRenewForm({ ...renewForm, validity_days: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                >
                  <option value="365">1 Year Extension (365 Days)</option>
                  <option value="730">2 Years Extension (730 Days)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Renewal Fee (LKR)</label>
                  <input
                    type="number"
                    value={renewForm.payment_amount}
                    onChange={(e) => setRenewForm({ ...renewForm, payment_amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Bank Reference</label>
                  <input
                    type="text"
                    placeholder="TX-RENEW-1122"
                    value={renewForm.payment_reference}
                    onChange={(e) => setRenewForm({ ...renewForm, payment_reference: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
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
                  <span>Save & Renew</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
