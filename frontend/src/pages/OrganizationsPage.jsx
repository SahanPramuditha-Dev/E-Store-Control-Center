import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Plus, Search, MapPin, Phone, Mail, 
  RefreshCw, X, Loader2, Store, Key, Laptop, 
  ShieldCheck, HardDrive, CreditCard, Activity, 
  UserCheck, Ban, CheckCircle2, ArrowRight, ExternalLink, Globe,
  Layers, Sliders, Sparkles, Check, XCircle, Copy, Edit3, Save,
  AlertCircle
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { Skeleton } from '../components/Skeleton';
import { formatDate } from '../utils/dateUtils';
import OnboardingModal from '../components/OnboardingModal';
import { Select, Button, Badge, PageHeader, Modal, ConfirmModal, EmptyState } from '../components/UI';

export default function OrganizationsPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState(() => {
    try {
      const cached = sessionStorage.getItem('estore_organizations');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => !sessionStorage.getItem('estore_organizations'));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  
  // Selected Organization & Details Drawer
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgDetails, setOrgDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'shops' | 'licenses' | 'payments'
  
  // Inline Profile Edit State
  const [editForm, setEditForm] = useState({
    company_name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    country: '',
    currency: '',
    timezone: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [impersonating, setImpersonating] = useState(false);
  
  // Industry & Capability Switching State
  const [industryModalOpen, setIndustryModalOpen] = useState(false);
  const [availableIndustries, setAvailableIndustries] = useState([]);
  const [targetIndustryCode, setTargetIndustryCode] = useState('MOBILE_RETAIL');
  const [previewCaps, setPreviewCaps] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [savingIndustry, setSavingIndustry] = useState(false);

  const fetchOrganizations = async () => {
    try {
      if (organizations.length === 0) setLoading(true);
      const data = await api.getCached('/admin/organizations');
      setOrganizations(Array.isArray(data) ? data : []);
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

  const handleSelectOrg = async (org) => {
    setSelectedOrg(org);
    setActiveTab('overview');
    setEditForm({
      company_name: org.company_name || '',
      contact_name: org.contact_name || '',
      phone: org.phone || '',
      email: org.email || '',
      address: org.address || '',
      country: org.country || 'Sri Lanka',
      currency: org.currency || 'LKR',
      timezone: org.timezone || 'Asia/Colombo'
    });

    try {
      setLoadingDetails(true);
      const res = await api.get(`/admin/tenants/${org.id}`);
      setOrgDetails(res.data);
    } catch (err) {
      console.error('Failed to load detailed tenant profile', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (!selectedOrg) return;
    try {
      setSavingProfile(true);
      const res = await api.patch(`/admin/tenants/${selectedOrg.id}`, editForm);
      showToast(res.data.message || 'Organization profile updated!', 'success');
      fetchOrganizations();
      setSelectedOrg(prev => ({ ...prev, ...editForm }));
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update organization profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleImpersonate = async (org) => {
    try {
      setImpersonating(true);
      const res = await api.post(`/admin/organizations/${org.id}/impersonate`);
      showToast(res.data.message, 'info');
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

  const handleOpenIndustryModal = async (org) => {
    try {
      const curInd = org.industry_code || org.industry || 'MOBILE_RETAIL';
      setTargetIndustryCode(curInd);
      setIndustryModalOpen(true);
      
      const res = await api.get('/admin/industries');
      const indList = Array.isArray(res.data) ? res.data : [];
      setAvailableIndustries(indList);
      
      fetchCapabilityPreview(curInd);
    } catch (e) {
      showToast('Could not load industry templates', 'error');
    }
  };

  const fetchCapabilityPreview = async (indCode) => {
    try {
      setLoadingPreview(true);
      const res = await api.post('/admin/capabilities/resolve-preview', {
        industry_code: indCode
      });
      setPreviewCaps(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSaveIndustry = async () => {
    if (!selectedOrg) return;
    try {
      setSavingIndustry(true);
      const res = await api.put(`/admin/tenants/${selectedOrg.id}/capabilities`, {
        industry_code: targetIndustryCode,
        reason: `Administrator switched business model to ${targetIndustryCode}`
      });
      showToast(`Business model switched to ${targetIndustryCode}! ${res.data.re_signed_licenses_count || 0} licenses re-signed with new capabilities.`, 'success');
      setIndustryModalOpen(false);
      fetchOrganizations();
      setSelectedOrg(prev => ({ ...prev, industry: targetIndustryCode, industry_code: targetIndustryCode }));
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update industry', 'error');
    } finally {
      setSavingIndustry(false);
    }
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    showToast('License Key copied!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportCSV = () => {
    if (organizations.length === 0) return;
    const headers = ['Tenant Code', 'Company Name', 'Contact Name', 'Phone', 'Email', 'Industry', 'Status', 'Stores', 'Licenses', 'Storage (MB)'];
    const rows = organizations.map(o => [
      o.tenant_code || 'N/A',
      `"${(o.company_name || '').replace(/"/g, '""')}"`,
      `"${(o.contact_name || '').replace(/"/g, '""')}"`,
      o.phone || '',
      o.email || 'N/A',
      o.industry || 'General',
      o.status || 'ACTIVE',
      o.shops_count || 0,
      o.licenses_count || 0,
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
    const searchLower = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (o.company_name || '').toLowerCase().includes(searchLower) ||
      (o.tenant_code || '').toLowerCase().includes(searchLower) ||
      (o.contact_name || '').toLowerCase().includes(searchLower) ||
      (o.email || '').toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesIndustry = industryFilter === 'ALL' || (o.industry_code === industryFilter) || (o.industry === industryFilter);
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  return (
    <div className="space-y-7 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Centralized Page Header */}
      <PageHeader
        eyebrow="Multi-Tenant SaaS Directory"
        title="Organizations & Tenancies"
        subtitle="Centralized tenant governance, capability matrices, resource quota allocations, and audited support impersonation"
        badges={[
          { label: `${organizations.length} Total Registered`, tone: 'indigo' },
          { label: `${organizations.filter(o => o.status === 'ACTIVE').length} Active Commercial`, tone: 'emerald' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              icon={HardDrive}
            >
              Export CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchOrganizations}
              icon={RefreshCw}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              variant="purple-gradient"
              size="sm"
              onClick={() => setShowOnboardModal(true)}
              icon={Plus}
            >
              Add Organization
            </Button>
          </div>
        }
      />

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
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
            }`}
          />
        </div>

        <div className="w-48 shrink-0">
          <Select
            value={industryFilter}
            onChange={(val) => setIndustryFilter(val)}
            options={[
              { value: 'ALL', label: 'All Industries' },
              { value: 'MOBILE_RETAIL', label: 'Mobile Retail & Repairs' },
              { value: 'GROCERY', label: 'Supermarket & Grocery' },
              { value: 'FASHION', label: 'Fashion & Apparel' },
              { value: 'ELECTRONICS', label: 'Consumer Electronics' },
              { value: 'COSMETICS', label: 'Cosmetics & Beauty' },
              { value: 'GENERAL_RETAIL', label: 'General Retail POS' },
            ]}
            size="md"
            fullWidth
          />
        </div>

        <div className="w-40 shrink-0">
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active', badge: 'Live' },
              { value: 'TRIAL', label: 'Trial', badge: '14D' },
              { value: 'PAST_DUE', label: 'Past Due', badge: 'Alert' },
              { value: 'SUSPENDED', label: 'Suspended', badge: 'Lock' },
            ]}
            size="md"
            fullWidth
          />
        </div>
      </div>

      {/* Organizations Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-xl ${
        isDark ? 'bg-slate-900/90 border-slate-800/90' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b text-[11px] font-black uppercase tracking-wider ${
                isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50/80 border-slate-200 text-slate-600'
              }`}>
                <th className="px-5 py-4">Organization & Code</th>
                <th className="px-5 py-4">Current Plan</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Branches & Devices</th>
                <th className="px-5 py-4">Industry Vertical</th>
                <th className="px-5 py-4 text-right text-slate-400 font-semibold"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-2xl shrink-0" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32 rounded-md" />
                          <Skeleton className="h-2.5 w-20 rounded-md" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24 rounded-md" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20 rounded-md" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-28 rounded-md" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-6 w-6 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8">
                    <EmptyState
                      icon={Building2}
                      title="No Organizations Match Your Search"
                      description="Try adjusting your industry filters, status filters, or search keywords."
                      action={
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('ALL');
                            setIndustryFilter('ALL');
                          }}
                        >
                          Clear Filters
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => {
                  const isActive = org.status === 'ACTIVE';
                  const isTrial = org.status === 'TRIAL';

                  return (
                    <tr 
                      key={org.id} 
                      onClick={() => handleSelectOrg(org)}
                      className={`transition cursor-pointer ${
                        isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center font-bold ${
                            isDark ? 'bg-slate-950 border-slate-800 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className={`font-extrabold text-sm block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {org.company_name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-indigo-400 font-bold">{org.tenant_code}</span>
                              <span className="text-slate-400 text-[10px]">• {org.contact_name}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {(() => {
                          const plan = (org.current_plan || 'BUSINESS').toUpperCase();
                          const planStyles = {
                            STARTER: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200',
                            BUSINESS: isDark ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
                            BUSINESS_AI: isDark ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
                            ENTERPRISE: isDark ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200',
                            RETAIL: isDark ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-200',
                          };
                          const style = planStyles[plan] || planStyles.BUSINESS;
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold font-mono border ${style}`}>
                              <Sparkles className="w-3 h-3 shrink-0" />
                              {plan}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isActive ? (isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200') :
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
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[11px] text-indigo-400 font-mono">
                            {org.industry || 'MOBILE_RETAIL'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {org.country || 'Sri Lanka'} • {org.currency || 'LKR'}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelectOrg(org); }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition ${
                            isDark ? 'bg-slate-800/80 hover:bg-slate-700 text-indigo-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-indigo-700 border-slate-200'
                          }`}
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Organization Command Center Modal Dialog */}
      {selectedOrg && (
        <div 
          onClick={() => setSelectedOrg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-3xl rounded-3xl border shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in-95 duration-200 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            {/* Drawer Header */}
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                  isDark ? 'bg-slate-950 border-slate-800 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                }`}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {selectedOrg.company_name}
                    </h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedOrg.status === 'ACTIVE'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {selectedOrg.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs">
                    <span className="font-mono font-bold text-indigo-400">{selectedOrg.tenant_code}</span>
                    <span className="text-slate-400">• {selectedOrg.industry || 'MOBILE_RETAIL'}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrg(null)} 
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & Navigation Bar */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => handleImpersonate(selectedOrg)}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-sm active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Client Portal</span>
              </button>

              <button
                onClick={() => handleOpenIndustryModal(selectedOrg)}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-sm active:scale-95"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Change Vertical</span>
              </button>

              {selectedOrg.status === 'ACTIVE' ? (
                <button
                  onClick={() => handleToggleStatus(selectedOrg, 'SUSPENDED')}
                  className="flex items-center justify-center gap-1.5 p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold rounded-xl text-xs transition active:scale-95"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Suspend</span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleStatus(selectedOrg, 'ACTIVE')}
                  className="flex items-center justify-center gap-1.5 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Activate</span>
                </button>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className={`grid grid-cols-4 border-b text-xs font-bold ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 text-center transition border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-indigo-400 text-indigo-400'
                    : 'border-transparent hover:text-slate-200'
                }`}
              >
                Profile & Settings
              </button>
              <button
                onClick={() => setActiveTab('shops')}
                className={`pb-3 text-center transition border-b-2 ${
                  activeTab === 'shops'
                    ? 'border-indigo-400 text-indigo-400'
                    : 'border-transparent hover:text-slate-200'
                }`}
              >
                Stores ({orgDetails?.shops?.length ?? selectedOrg.shops_count})
              </button>
              <button
                onClick={() => setActiveTab('licenses')}
                className={`pb-3 text-center transition border-b-2 ${
                  activeTab === 'licenses'
                    ? 'border-indigo-400 text-indigo-400'
                    : 'border-transparent hover:text-slate-200'
                }`}
              >
                Licenses ({selectedOrg.licenses_count})
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`pb-3 text-center transition border-b-2 ${
                  activeTab === 'payments'
                    ? 'border-indigo-400 text-indigo-400'
                    : 'border-transparent hover:text-slate-200'
                }`}
              >
                Ledger ({orgDetails?.payments?.length ?? 0})
              </button>
            </div>

            {/* TAB 1: Profile & Settings */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Profile Editor Form */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Organization Settings & Profile
                    </h3>
                    <span className="text-[10px] text-slate-500">Edit business details and save</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">Business Name *</label>
                      <input
                        type="text"
                        value={editForm.company_name}
                        onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border font-bold ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">Contact Person *</label>
                      <input
                        type="text"
                        value={editForm.contact_name}
                        onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">Phone Number *</label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">Email Address</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-slate-400 block mb-1 font-medium">Physical Address</label>
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">Country</label>
                      <input
                        type="text"
                        value={editForm.country}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">Default Currency</label>
                      <input
                        type="text"
                        value={editForm.currency}
                        onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border font-mono ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex items-center justify-center gap-2 w-full p-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-indigo-500/25 active:scale-95 disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Profile Changes</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: Branch Outlets */}
            {activeTab === 'shops' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Active Branch Stores
                  </h3>
                  <button
                    onClick={() => navigate(`/shops?tenant=${selectedOrg.tenant_code}&tab=shops`)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                  >
                    <span>Open in Stores View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {loadingDetails ? (
                  <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" /></div>
                ) : !orgDetails?.shops || orgDetails.shops.length === 0 ? (
                  <div className="p-6 rounded-2xl border text-center text-slate-400 text-xs border-dashed">
                    No physical branch stores registered yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {orgDetails.shops.map((shop) => (
                      <div 
                        key={shop.id} 
                        className={`p-4 rounded-2xl border text-xs space-y-2 transition ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-indigo-400" />
                            <span className="font-bold text-white text-sm">{shop.shop_name}</span>
                          </div>
                          <span className="font-mono text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded-full font-bold">
                            {shop.shop_code}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/60">
                          <span>City: <strong className="text-slate-200">{shop.city || 'Colombo'}</strong></span>
                          <span className="flex items-center gap-1 text-slate-300 font-bold">
                            <Laptop className="w-3.5 h-3.5 text-sky-400" />
                            {shop.active_machines_count || 0} Connected PCs
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Digital Licenses */}
            {activeTab === 'licenses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Cryptographic Software Licenses
                  </h3>
                  <button
                    onClick={() => navigate(`/licenses?tenant=${selectedOrg.tenant_code}`)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                  >
                    <span>Open in Licenses View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {loadingDetails ? (
                  <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" /></div>
                ) : (
                  <div className="space-y-2.5">
                    {orgDetails?.shops?.flatMap(s => (s.licenses || []).map(l => ({ ...l, shop_name: s.shop_name }))).length === 0 ? (
                      <div className="p-6 rounded-2xl border text-center text-slate-400 text-xs border-dashed">
                        No active licenses issued.
                      </div>
                    ) : (
                      orgDetails?.shops?.flatMap(s => (s.licenses || []).map(l => ({ ...l, shop_name: s.shop_name }))).map((lic) => (
                        <div 
                          key={lic.id}
                          className={`p-4 rounded-2xl border text-xs space-y-2 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-bold font-mono text-[10px]">
                              {lic.package_code}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              lic.status === 'ACTIVE' ? 'text-indigo-400' : 'text-rose-400'
                            }`}>
                              {lic.status}
                            </span>
                          </div>

                          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs text-indigo-300">
                            <span className="truncate">{lic.license_key}</span>
                            <button
                              onClick={() => handleCopyKey(lic.license_key)}
                              className="p-1 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition shrink-0 ml-2"
                              title="Copy Key"
                            >
                              {copiedKey === lic.license_key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Branch: <strong className="text-slate-200">{lic.shop_name}</strong></span>
                            <span>Expires: <strong className="text-slate-200">{lic.expires_at ? formatDate(lic.expires_at) : 'Perpetual'}</strong></span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Billing & Payments */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Payment Receipts & Billing Ledger
                  </h3>
                  <button
                    onClick={() => navigate(`/payments?tenant=${selectedOrg.tenant_code}`)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                  >
                    <span>Open in Billing View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {loadingDetails ? (
                  <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" /></div>
                ) : !orgDetails?.payments || orgDetails.payments.length === 0 ? (
                  <div className="p-6 rounded-2xl border text-center text-slate-400 text-xs border-dashed">
                    No payment transactions recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orgDetails.payments.map((pmt) => (
                      <div
                        key={pmt.id}
                        className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-white text-sm">
                            Rs {(pmt.amount_lkr || 0).toLocaleString()}
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {pmt.payment_method} • Ref: {pmt.reference_no || 'N/A'}
                          </div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-bold font-mono text-[10px]">
                            {pmt.payment_type}
                          </span>
                          <div className="text-[10px] text-slate-500">
                            {pmt.created_at ? formatDate(pmt.created_at) : '—'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CHANGE INDUSTRY & RE-SIGN LICENSES */}
      {industryModalOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Switch Business Model / Industry
                  </h3>
                  <p className="text-xs text-slate-500">Tenant: <span className="font-bold text-indigo-400">{selectedOrg.company_name}</span> ({selectedOrg.tenant_code})</p>
                </div>
              </div>
              <button onClick={() => setIndustryModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Select Target Industry Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { code: 'MOBILE_RETAIL', label: 'Mobile Retail & Repairs', desc: 'IMEI, Repairs, Warranty' },
                    { code: 'GROCERY', label: 'Supermarket & Grocery', desc: 'Batches, Expiry, Weight' },
                    { code: 'FASHION', label: 'Fashion & Apparel', desc: 'Sizes, Colors, Matrix' },
                    { code: 'ELECTRONICS', label: 'Consumer Electronics', desc: 'Serial tracking, Repairs' },
                    { code: 'COSMETICS', label: 'Cosmetics & Beauty', desc: 'Batches, Expiry' },
                    { code: 'GENERAL_RETAIL', label: 'General Retail POS', desc: 'Standard Inventory & POS' },
                  ].map((ind) => {
                    const isSelected = targetIndustryCode === ind.code;
                    return (
                      <button
                        key={ind.code}
                        type="button"
                        onClick={() => {
                          setTargetIndustryCode(ind.code);
                          fetchCapabilityPreview(ind.code);
                        }}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-500/20'
                            : isDark
                            ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs font-black block">{ind.label}</span>
                        <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>{ind.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Capability Matrix Preview */}
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Auto-Configured Capabilities for {targetIndustryCode}
                  </span>
                  {loadingPreview && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
                </div>

                {previewCaps && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(previewCaps.capabilities || {}).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                        <span className="font-mono text-[11px] text-slate-400">{key}</span>
                        {val ? (
                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">ENABLED</span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">DISABLED</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIndustryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveIndustry}
                  disabled={savingIndustry}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                >
                  {savingIndustry ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Switch Industry & Re-sign</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ONBOARD NEW CLIENT ORGANIZATION */}
      <OnboardingModal
        isOpen={showOnboardModal}
        onClose={() => setShowOnboardModal(false)}
        onSuccess={fetchOrganizations}
      />
    </div>
  );
}
