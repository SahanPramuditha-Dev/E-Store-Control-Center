import React, { useEffect, useState } from 'react';
import { 
  Key, Plus, RefreshCw, Copy, Check, RotateCcw, 
  AlertTriangle, X, Loader2, Ban, PlayCircle, History, 
  ShieldAlert, ShieldCheck, Download, Search, Filter, FileSpreadsheet
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import TokenInspectorModal from '../components/TokenInspectorModal';

export default function LicensesPage() {
  const { showToast } = useToast();
  const [licenses, setLicenses] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [shops, setShops] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [packageFilter, setPackageFilter] = useState('ALL');

  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('suspend');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
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
      showToast('Failed to load licenses data.', 'error');
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
    showToast('License Key copied to clipboard!', 'success');
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
      showToast('Failed to load license audit history.', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleIssueLicense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        tenant_id: parseInt(issueForm.tenant_id, 10),
        shop_id: parseInt(issueForm.shop_id, 10),
        package_code: issueForm.package_code,
        license_type: issueForm.license_type,
        validity_days: parseInt(issueForm.validity_days, 10),
        max_machines: parseInt(issueForm.max_machines, 10),
        payment_amount: issueForm.payment_amount ? parseFloat(issueForm.payment_amount) : 0,
        payment_method: issueForm.payment_method,
        payment_reference: issueForm.payment_reference
      };
      await api.post('/admin/licenses', payload);
      showToast('Digital license generated and signed successfully.', 'success');
      setShowIssueModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to issue license', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetMachine = async (e) => {
    e.preventDefault();
    if (!selectedLicense) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/licenses/${selectedLicense.id}/reset-machine`, { reason: resetReason });
      showToast('Machine binding reset. Client can now activate a new PC.', 'success');
      setShowResetModal(false);
      setResetReason('');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Reset failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenewLicense = async (e) => {
    e.preventDefault();
    if (!selectedLicense) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/licenses/${selectedLicense.id}/renew`, {
        validity_days: parseInt(renewForm.validity_days, 10),
        payment_amount: renewForm.payment_amount ? parseFloat(renewForm.payment_amount) : 0,
        payment_method: renewForm.payment_method,
        payment_reference: renewForm.payment_reference
      });
      showToast('License extended and renewed successfully.', 'success');
      setShowRenewModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Renewal failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActionLicense = async (e) => {
    e.preventDefault();
    if (!selectedLicense) return;
    setSubmitting(true);
    try {
      const endpoint = actionType === 'suspend' 
        ? `/admin/licenses/${selectedLicense.id}/suspend` 
        : `/admin/licenses/${selectedLicense.id}/revoke`;
      await api.post(endpoint, { reason: actionReason });
      showToast(`License ${actionType}ed successfully.`, 'success');
      setShowActionModal(false);
      setActionReason('');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Action failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivate = async (lic) => {
    try {
      await api.post(`/admin/licenses/${lic.id}/reactivate`);
      showToast('License reactivated successfully.', 'success');
      fetchData();
    } catch (err) {
      showToast('Reactivation failed', 'error');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (licenses.length === 0) return;
    const headers = ['ID', 'License Key', 'Tenant', 'Shop', 'Package', 'Status', 'Max Machines', 'Active Machines', 'Issued Date', 'Expires Date'];
    const rows = filteredLicenses.map(l => [
      l.id,
      l.license_key,
      `"${l.tenant_name || ''}"`,
      `"${l.shop_name || ''}"`,
      l.package_code,
      l.status,
      l.max_machines,
      l.active_machines_count,
      l.issued_at ? new Date(l.issued_at).toLocaleDateString() : '',
      l.expires_at ? new Date(l.expires_at).toLocaleDateString() : 'LIFETIME'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estore-licenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported licenses to CSV.', 'success');
  };

  // Filtered List
  const filteredLicenses = licenses.filter((lic) => {
    const matchesSearch =
      (lic.license_key || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lic.shop_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lic.tenant_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || lic.status === statusFilter;
    const matchesPackage = packageFilter === 'ALL' || lic.package_code === packageFilter;

    return matchesSearch && matchesStatus && matchesPackage;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">License Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate, sign, extend, and audit Ed25519 cryptographic tokens for client shops.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New License</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by license key, company or shop name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING">PENDING</option>
            <option value="EXPIRING">EXPIRING</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="REVOKED">REVOKED</option>
          </select>

          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Packages</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.code}>{pkg.name || pkg.code}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Licenses */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="uppercase tracking-wider text-[10px] text-slate-400 bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">License Key</th>
                <th className="px-5 py-4">Shop & Tenant</th>
                <th className="px-5 py-4">Package</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Hardware Binding</th>
                <th className="px-5 py-4">Expiry Date</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading && licenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <Loader2 className="w-6 h-6 text-teal-400 animate-spin mx-auto mb-2" />
                    Loading licenses...
                  </td>
                </tr>
              ) : filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No licenses match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((lic) => {
                  const isActive = lic.status === 'ACTIVE';
                  const isSuspended = lic.status === 'SUSPENDED';
                  const isRevoked = lic.status === 'REVOKED';

                  return (
                    <tr key={lic.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-300 select-all">
                            {lic.license_key}
                          </span>
                          <button
                            onClick={() => handleCopy(lic.license_key)}
                            title="Copy License Key"
                            className="p-1 text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded-lg transition"
                          >
                            {copiedKey === lic.license_key ? (
                              <Check className="w-3.5 h-3.5 text-teal-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Issued: {lic.issued_at ? new Date(lic.issued_at).toLocaleDateString() : '—'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-white">{lic.shop_name}</div>
                        <div className="text-slate-400 text-[11px]">{lic.tenant_name}</div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono bg-slate-800 text-teal-300 border border-slate-700">
                          {lic.package_code}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                          isActive ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30' :
                          isSuspended ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' :
                          isRevoked ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {lic.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-white">
                            {lic.active_machines_count} / {lic.max_machines}
                          </span>
                          <span className="text-[11px] text-slate-400">Terminals</span>
                        </div>
                        {lic.replacement_count > 0 && (
                          <span className="text-[10px] text-amber-400">
                            (Reset {lic.replacement_count}x)
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-white">
                          {lic.expires_at ? new Date(lic.expires_at).toLocaleDateString() : 'Lifetime'}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Inspect Token */}
                          <button
                            onClick={() => {
                              setSelectedLicense(lic);
                              setShowTokenModal(true);
                            }}
                            title="Inspect Signed Token & Signature"
                            className="p-1.5 text-teal-400 hover:bg-teal-500/10 rounded-lg transition"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>

                          {/* Renew Button */}
                          <button
                            onClick={() => {
                              setSelectedLicense(lic);
                              setShowRenewModal(true);
                            }}
                            title="Extend Validity / Renew"
                            className="p-1.5 text-sky-400 hover:bg-sky-500/10 rounded-lg transition"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>

                          {/* Reset Machine */}
                          <button
                            onClick={() => {
                              setSelectedLicense(lic);
                              setShowResetModal(true);
                            }}
                            title="Reset Hardware Machine Bindings"
                            className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          {/* Suspend / Reactivate */}
                          {isActive ? (
                            <button
                              onClick={() => {
                                setSelectedLicense(lic);
                                setActionType('suspend');
                                setShowActionModal(true);
                              }}
                              title="Suspend License"
                              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : isSuspended ? (
                            <button
                              onClick={() => handleReactivate(lic)}
                              title="Reactivate License"
                              className="p-1.5 text-teal-400 hover:bg-teal-500/10 rounded-lg transition"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          ) : null}

                          {/* Audit History */}
                          <button
                            onClick={() => openHistory(lic)}
                            title="View Lifecycle Audit Trail"
                            className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg transition"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Token Inspector */}
      {showTokenModal && selectedLicense && (
        <TokenInspectorModal
          isOpen={showTokenModal}
          onClose={() => setShowTokenModal(false)}
          licenseId={selectedLicense.id}
          licenseKey={selectedLicense.license_key}
        />
      )}

      {/* Modal: Issue License */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Generate Cryptographic License</h2>
              </div>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueLicense} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Select Tenant</label>
                  <select
                    value={issueForm.tenant_id}
                    onChange={(e) => {
                      const tId = e.target.value;
                      const relatedShop = shops.find(s => s.tenant_id.toString() === tId);
                      setIssueForm({
                        ...issueForm,
                        tenant_id: tId,
                        shop_id: relatedShop ? relatedShop.id.toString() : ''
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none"
                    required
                  >
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.company_name} ({t.tenant_code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Branch Shop</label>
                  <select
                    value={issueForm.shop_id}
                    onChange={(e) => setIssueForm({ ...issueForm, shop_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none"
                    required
                  >
                    {shops
                      .filter(s => s.tenant_id.toString() === issueForm.tenant_id)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.shop_name} ({s.shop_code})</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Package Tier</label>
                  <select
                    value={issueForm.package_code}
                    onChange={(e) => {
                      const selectedPkg = packages.find(p => p.code === e.target.value);
                      setIssueForm({
                        ...issueForm,
                        package_code: e.target.value,
                        payment_amount: selectedPkg ? selectedPkg.price_lkr : issueForm.payment_amount
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none"
                  >
                    {packages.map(p => (
                      <option key={p.id} value={p.code}>{p.name} (Rs {p.price_lkr.toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">License Duration</label>
                  <select
                    value={issueForm.license_type}
                    onChange={(e) => setIssueForm({ ...issueForm, license_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="ANNUAL">Annual (365 Days)</option>
                    <option value="TRIAL">Trial (14 Days)</option>
                    <option value="LIFETIME">Lifetime License</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Max Machines (Seats)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={issueForm.max_machines}
                    onChange={(e) => setIssueForm({ ...issueForm, max_machines: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Payment Received (LKR)</label>
                  <input
                    type="number"
                    value={issueForm.payment_amount}
                    onChange={(e) => setIssueForm({ ...issueForm, payment_amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-teal-500/20"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Generate Signed Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Hardware Machine */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Reset Hardware Machine</h2>
                <p className="text-xs text-slate-400">{selectedLicense?.shop_name}</p>
              </div>
            </div>
            <form onSubmit={handleResetMachine} className="space-y-4 mt-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                This will unbind all existing computers from this license and allow the client to activate on a replacement computer.
              </p>
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Reason for Hardware Reset</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Motherboard replacement, new cashier PC installed..."
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-2"
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
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">Renew License Subscription</h2>
                <p className="text-xs text-slate-400">{selectedLicense?.shop_name}</p>
              </div>
              <button onClick={() => setShowRenewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRenewLicense} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Extend Validity By</label>
                <select
                  value={renewForm.validity_days}
                  onChange={(e) => setRenewForm({ ...renewForm, validity_days: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none"
                >
                  <option value="365">1 Year Extension (365 Days)</option>
                  <option value="730">2 Years Extension (730 Days)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Renewal Fee (LKR)</label>
                  <input
                    type="number"
                    value={renewForm.payment_amount}
                    onChange={(e) => setRenewForm({ ...renewForm, payment_amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Bank Reference</label>
                  <input
                    type="text"
                    placeholder="TX-RENEW-1122"
                    value={renewForm.payment_reference}
                    onChange={(e) => setRenewForm({ ...renewForm, payment_reference: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-teal-500/20"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save & Renew</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Suspend / Revoke */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white capitalize">{actionType} License</h2>
                <p className="text-xs text-slate-400">{selectedLicense?.shop_name}</p>
              </div>
            </div>
            <form onSubmit={handleActionLicense} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Reason for {actionType}</label>
                <textarea
                  required
                  rows={3}
                  placeholder={`Provide justification for ${actionType}ing this license...`}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span className="capitalize">Confirm {actionType}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: History Audit Trail */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">License Lifecycle Audit Trail</h2>
                <p className="text-xs font-mono text-teal-400">{selectedLicense?.license_key}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              {historyLoading ? (
                <div className="text-center py-8 text-slate-500">
                  <Loader2 className="w-6 h-6 text-teal-400 animate-spin mx-auto mb-2" />
                  Loading history...
                </div>
              ) : historyData?.events?.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No logged lifecycle events.</p>
              ) : (
                historyData?.events?.map((ev) => (
                  <div key={ev.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white uppercase tracking-wider">{ev.event_type}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ev.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1">{ev.notes || 'Status transition event'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Operator: <span className="text-slate-300 font-medium">{ev.actor || 'System'}</span></p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 bg-slate-800 text-slate-200 rounded-xl font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
