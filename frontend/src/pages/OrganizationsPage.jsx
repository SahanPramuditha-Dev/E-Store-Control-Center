import React, { useEffect, useState } from 'react';
import { 
  Building2, Plus, Search, MapPin, Phone, Mail, 
  RefreshCw, X, Loader2, Store, Key, Laptop, 
  ShieldCheck, HardDrive, CreditCard, Activity, 
  UserCheck, Ban, CheckCircle2, ArrowRight, ExternalLink, Globe
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';

export default function OrganizationsPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [impersonating, setImpersonating] = useState(false);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/organizations');
      setOrganizations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error loading organizations:', err);
      showToast(err.response?.data?.detail || 'Failed to load organizations', 'error');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleImpersonate = async (org) => {
    try {
      setImpersonating(true);
      const res = await api.post(`/admin/organizations/${org.id}/impersonate`);
      showToast(res.data.message, 'info');
      // In a real environment, this opens the tenant portal in a new tab with the support token
      window.open(`/?impersonate_token=${res.data.impersonation_token}`, '_blank');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Impersonation failed', 'error');
    } finally {
      setImpersonating(false);
    }
  };

  const handleToggleStatus = async (org, newStatus) => {
    try {
      await api.post(`/admin/organizations/${org.id}/status`, {
        status: newStatus,
        reason: `Admin updated status to ${newStatus}`
      });
      showToast(`Organization status changed to ${newStatus}`, 'success');
      fetchOrganizations();
      if (selectedOrg && selectedOrg.id === org.id) {
        setSelectedOrg(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const [industryFilter, setIndustryFilter] = useState('ALL');

  const handleExportCSV = () => {
    if (organizations.length === 0) return;
    const headers = ['Tenant Code', 'Company Name', 'Contact Name', 'Phone', 'Email', 'Industry', 'Status', 'Stores', 'Devices', 'Storage (MB)'];
    const rows = organizations.map(o => [
      o.tenant_code,
      `"${o.company_name.replace(/"/g, '""')}"`,
      `"${o.contact_name.replace(/"/g, '""')}"`,
      o.phone,
      o.email || 'N/A',
      o.industry || 'General',
      o.status,
      o.shops_count || 1,
      o.machines_count || 1,
      o.storage_used_mb || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `estore_organizations_directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrgs = organizations.filter(o => {
    const matchesSearch =
      o.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.tenant_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesIndustry = industryFilter === 'ALL' || (o.industry_code === industryFilter) || (o.industry === industryFilter);
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Organizations & Tenants
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Central multi-tenant directory, business configuration, limits, and audited support impersonation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition shadow-xs active:scale-95 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-teal-500" />
            <span>Export Directory CSV</span>
          </button>
          <button
            onClick={fetchOrganizations}
            className={`p-2.5 rounded-2xl border transition shadow-xs active:scale-95 ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
                : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400'
            }`}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`flex flex-col md:flex-row gap-3 p-4 rounded-3xl border shadow-sm ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search organizations by name, code, contact or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none transition border ${
              isDark 
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-teal-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-teal-600'
            }`}
          />
        </div>

        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className={`rounded-2xl px-3 py-2.5 text-xs font-bold focus:outline-none border ${
            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <option value="ALL">All Industries</option>
          <option value="RETAIL_ELECTRONICS">Electronics & Retail</option>
          <option value="AUTO_PARTS">Automotive & Spare Parts</option>
          <option value="PHARMACY">Pharmacy & Healthcare</option>
          <option value="FASHION_APPAREL">Fashion & Apparel</option>
          <option value="SUPERMARKET">Supermarket & Grocery</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`rounded-2xl px-3 py-2.5 text-xs font-bold focus:outline-none border ${
            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="TRIAL">TRIAL</option>
          <option value="PAST_DUE">PAST_DUE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
      </div>


      {/* Organizations Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-sm ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`uppercase tracking-wider text-[10px] font-bold border-b ${
              isDark ? 'text-slate-400 bg-slate-950/80 border-slate-800' : 'text-slate-600 bg-slate-50 border-slate-200'
            }`}>
              <tr>
                <th className="px-5 py-4">Organization & Code</th>
                <th className="px-5 py-4">Current Plan</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Branches & Devices</th>
                <th className="px-5 py-4">Quota Usage</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
            }`}>
              {loading && organizations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin mx-auto mb-2" />
                    Loading organizations...
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No organizations match your search filters.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => {
                  const isActive = org.status === 'ACTIVE';
                  const isTrial = org.status === 'TRIAL';
                  const isSuspended = org.status === 'SUSPENDED';

                  return (
                    <tr key={org.id} className={`transition ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center font-bold ${
                            isDark ? 'bg-slate-950 border-slate-800 text-teal-400' : 'bg-teal-50 border-teal-200 text-teal-700'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className={`font-extrabold text-sm block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {org.company_name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-teal-500 font-bold">{org.tenant_code}</span>
                              <span className="text-slate-400 text-[10px]">• {org.contact_name}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono border ${
                          isDark ? 'bg-slate-800 text-teal-400 border-slate-700' : 'bg-slate-100 text-teal-700 border-slate-200'
                        }`}>
                          {org.current_plan}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isActive ? (isDark ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200') :
                          isTrial ? (isDark ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-200') :
                          (isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200')
                        }`}>
                          {org.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[11px] font-semibold">
                            <Store className="w-3.5 h-3.5 text-slate-400" />
                            {org.shops_count} Stores
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-semibold">
                            <Key className="w-3.5 h-3.5 text-slate-400" />
                            {org.licenses_count} Lic
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="w-36">
                          <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                            <span>Storage</span>
                            <span>{org.storage_used_mb.toFixed(0)} MB / 50 GB</span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                            <div className="bg-teal-500 h-full rounded-full" style={{ width: `${Math.min((org.storage_used_mb / 50000) * 100, 100)}%` }} />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Detail */}
                          <button
                            onClick={() => setSelectedOrg(org)}
                            className={`p-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
                              isDark ? 'bg-slate-800 hover:bg-slate-700 text-teal-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-teal-700 border-slate-200'
                            }`}
                          >
                            <span>Manage</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          {/* Impersonate */}
                          <button
                            onClick={() => handleImpersonate(org)}
                            disabled={impersonating}
                            title="Audited Support Impersonation"
                            className={`p-1.5 rounded-xl border transition ${
                              isDark ? 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-sky-700 border-slate-200'
                            }`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
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

      {/* Slide-out Organization Details Drawer */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
          <div className={`w-full max-w-xl h-full p-6 sm:p-8 overflow-y-auto border-l shadow-2xl space-y-6 animate-in slide-in-from-right duration-300 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                  isDark ? 'bg-slate-950 border-slate-800 text-teal-400' : 'bg-teal-50 border-teal-200 text-teal-700'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedOrg.company_name}</h2>
                  <span className="text-xs font-mono font-bold text-teal-500">{selectedOrg.tenant_code}</span>
                </div>
              </div>
              <button onClick={() => setSelectedOrg(null)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleImpersonate(selectedOrg)}
                className="flex items-center justify-center gap-2 p-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-2xl text-xs transition shadow-md shadow-sky-500/20 active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Support Impersonate</span>
              </button>

              {selectedOrg.status === 'ACTIVE' ? (
                <button
                  onClick={() => handleToggleStatus(selectedOrg, 'SUSPENDED')}
                  className="flex items-center justify-center gap-2 p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 font-bold rounded-2xl text-xs transition active:scale-95"
                >
                  <Ban className="w-4 h-4" />
                  <span>Suspend Organization</span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleStatus(selectedOrg, 'ACTIVE')}
                  className="flex items-center justify-center gap-2 p-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl text-xs transition shadow-md shadow-teal-500/20 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Activate Organization</span>
                </button>
              )}
            </div>

            {/* Quota & Resource Gauges */}
            <div className={`p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Resource Limits & Live Quotas
              </h3>
              
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Monthly Transactions</span>
                    <span className="font-bold text-teal-500">{selectedOrg.monthly_transactions_count.toLocaleString()} / 25,000</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="bg-teal-500 h-full rounded-full" style={{ width: `${(selectedOrg.monthly_transactions_count / 25000) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Cloud Storage</span>
                    <span className="font-bold text-teal-500">{selectedOrg.storage_used_mb} MB / 50 GB</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="bg-sky-500 h-full rounded-full" style={{ width: `${(selectedOrg.storage_used_mb / 50000) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* General Metadata */}
            <div className="space-y-3 text-xs">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Organization Profile & Localization
              </h3>
              <div className={`p-4 rounded-2xl border space-y-2.5 ${
                isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex justify-between"><span className="text-slate-400">Industry:</span> <span className="font-semibold">{selectedOrg.industry || 'Retail'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Country:</span> <span className="font-semibold">{selectedOrg.country || 'Sri Lanka'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Currency:</span> <span className="font-semibold font-mono">{selectedOrg.currency || 'LKR'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Timezone:</span> <span className="font-semibold font-mono">{selectedOrg.timezone || 'Asia/Colombo'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Phone:</span> <span className="font-semibold">{selectedOrg.phone}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Email:</span> <span className="font-semibold">{selectedOrg.email || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Address:</span> <span className="font-semibold">{selectedOrg.address || '—'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
