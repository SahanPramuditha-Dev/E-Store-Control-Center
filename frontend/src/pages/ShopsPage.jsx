import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, Plus, Search, Building2, MapPin, Phone, Mail, 
  RefreshCw, X, Loader2, Wand2, Users, ArrowRight, ExternalLink,
  ShieldCheck, HardDrive, CreditCard, Activity, Laptop, Key,
  Globe, CheckCircle2, ChevronRight
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { Select, Button, Badge, PageHeader, Modal, EmptyState } from '../components/UI';

export default function ShopsPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [tenants, setTenants] = useState(() => {
    try {
      const c = sessionStorage.getItem('estore_tenants');
      return c ? JSON.parse(c) : [];
    } catch {
      return [];
    }
  });
  const [shops, setShops] = useState(() => {
    try {
      const c = sessionStorage.getItem('estore_shops');
      return c ? JSON.parse(c) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => !sessionStorage.getItem('estore_shops'));
  const searchParams = new URLSearchParams(window.location.search);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('tenant') || '');
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || (searchParams.get('tenant') ? 'shops' : 'companies'));

  // Modals
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [tenantForm, setTenantForm] = useState({
    tenant_code: '',
    company_name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: ''
  });

  const [shopForm, setShopForm] = useState({
    tenant_id: '',
    shop_code: '',
    shop_name: '',
    city: '',
    phone: ''
  });

  const generateAutoTenantCode = (companyName = '') => {
    let prefix = 'TNT';
    if (companyName.trim()) {
      const clean = companyName.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      prefix = clean.slice(0, 4) || 'TNT';
    }
    const randNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randNum}`;
  };

  const generateAutoShopCode = (shopName = '', city = '') => {
    let prefix = 'SHP';
    if (shopName.trim()) {
      const clean = shopName.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      prefix = clean.slice(0, 4) || 'SHP';
    }
    const cityPart = city.trim() ? `-${city.trim().slice(0, 3).toUpperCase()}` : '';
    const randNum = Math.floor(100 + Math.random() * 900);
    return `${prefix}${cityPart}-${randNum}`;
  };

  const openTenantModal = () => {
    setTenantForm({
      tenant_code: generateAutoTenantCode(),
      company_name: '',
      contact_name: '',
      phone: '',
      email: '',
      address: ''
    });
    setShowTenantModal(true);
  };

  const openShopModal = (defaultTenantId = '') => {
    setShopForm({
      tenant_id: defaultTenantId || (tenants.length > 0 ? tenants[0].id : ''),
      shop_code: generateAutoShopCode(),
      shop_name: '',
      city: '',
      phone: ''
    });
    setShowShopModal(true);
  };

  const fetchData = async () => {
    try {
      if (shops.length === 0 && tenants.length === 0) setLoading(true);
      const [tRes, sRes] = await Promise.allSettled([
        api.getCached('/admin/tenants'),
        api.getCached('/admin/shops')
      ]);

      if (tRes.status === 'fulfilled' && Array.isArray(tRes.value)) {
        setTenants(tRes.value);
        try { sessionStorage.setItem('estore_tenants', JSON.stringify(tRes.value)); } catch {}
      }
      if (sRes.status === 'fulfilled' && Array.isArray(sRes.value)) {
        setShops(sRes.value);
        try { sessionStorage.setItem('estore_shops', JSON.stringify(sRes.value)); } catch {}
      }

      if (tRes.status === 'rejected' && sRes.status === 'rejected') {
        console.error('Failed to load tenants & shops', tRes.reason, sRes.reason);
        showToast('Failed to load store data', 'error');
      }
    } catch (err) {
      console.error('Failed to load shops', err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/tenants', tenantForm);
      showToast('Tenant organization registered successfully.', 'success');
      setShowTenantModal(false);
      await fetchData();
      setActiveTab('companies');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create tenant', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateShop = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/shops', {
        ...shopForm,
        tenant_id: parseInt(shopForm.tenant_id, 10)
      });
      showToast('Branch shop created successfully.', 'success');
      setShowShopModal(false);
      await fetchData();
      setActiveTab('shops');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create shop', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterByCompany = (e, companyName) => {
    e.stopPropagation();
    setSearchTerm(companyName);
    setActiveTab('shops');
  };

  const searchLower = (searchTerm || '').toLowerCase();
  const filteredTenants = tenants.filter(t =>
    (t.company_name || '').toLowerCase().includes(searchLower) ||
    (t.tenant_code || '').toLowerCase().includes(searchLower) ||
    (t.contact_name || '').toLowerCase().includes(searchLower) ||
    (t.phone || '').toLowerCase().includes(searchLower)
  );

  const filteredShops = shops.filter(s =>
    (s.shop_name || '').toLowerCase().includes(searchLower) ||
    (s.shop_code || '').toLowerCase().includes(searchLower) ||
    (s.tenant_name || '').toLowerCase().includes(searchLower) ||
    (s.city || '').toLowerCase().includes(searchLower)
  );

  // Get shops for selected tenant
  const tenantShops = selectedTenant ? shops.filter(s => s.tenant_id === selectedTenant.id || s.tenant_code === selectedTenant.tenant_code) : [];

  return (
    <div className="space-y-7 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Centralized Page Header */}
      <PageHeader
        eyebrow="Commercial Retail Network"
        title="Tenant Organizations & Branch Outlets"
        subtitle="Manage client corporate structures, distributed retail branches, hardware terminals, and store profiles"
        badges={[
          { label: `${tenants.length} Organizations`, tone: 'indigo' },
          { label: `${shops.length} Retail Outlets`, tone: 'purple' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={openTenantModal}
              icon={Building2}
            >
              Add Organization
            </Button>
            <Button
              variant="purple-gradient"
              size="sm"
              onClick={() => openShopModal()}
              icon={Plus}
            >
              Add Branch Shop
            </Button>
          </div>
        }
      />

      {/* Tabs & Search Bar */}
      <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className={`flex items-center p-1 rounded-2xl border ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('companies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'companies'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Companies ({tenants.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('shops')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'shops'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Branch Outlets ({shops.length})</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'companies' ? "Search organizations..." : "Search shop outlets..."}
            className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs focus:outline-none transition border ${
              isDark 
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
            }`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
          <p className="text-xs text-slate-400">Loading Directory...</p>
        </div>
      ) : activeTab === 'companies' ? (
        filteredTenants.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border ${
            isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>No Organizations Found</h3>
            <p className="text-xs text-slate-500 mt-1">Click "Add Organization" to register your first tenant.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTenants.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTenant(t)}
                className={`p-6 rounded-3xl border space-y-4 transition-all duration-300 hover:-translate-y-1 cursor-pointer group ${
                  isDark 
                    ? 'bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20 hover:border-indigo-500/60 hover:shadow-indigo-500/10' 
                    : 'bg-white border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-500/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl border ${
                      isDark ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    }`}>
                      {t.tenant_code}
                    </span>
                    <h3 className={`text-base font-extrabold mt-2.5 group-hover:text-indigo-400 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.company_name}</h3>
                    <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Contact: <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{t.contact_name}</span>
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                <div className={`pt-3 border-t space-y-2 text-xs ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                }`}>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.phone}</span>
                  </div>
                  {t.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.email}</span>
                    </div>
                  )}
                </div>

                <div className={`pt-3 border-t flex items-center justify-between ${
                  isDark ? 'border-slate-800' : 'border-slate-100'
                }`}>
                  <button
                    onClick={(e) => handleFilterByCompany(e, t.company_name)}
                    className="text-xs font-semibold text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition"
                    title="Click to view branches in Outlets tab"
                  >
                    <span>{t.shops_count} Physical Branch(es)</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openShopModal(t.id);
                    }}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                  >
                    <span>Add Branch</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Shops Tab */
        filteredShops.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No Branch Outlets Found"
            description="No physical branch outlets match your search query."
            action={
              <Button
                variant="purple-gradient"
                size="sm"
                onClick={() => openShopModal()}
                icon={Plus}
              >
                Add Branch Shop
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredShops.map((shop) => (
              <div
                key={shop.id}
                onClick={() => setSelectedShop(shop)}
                className={`p-6 rounded-3xl border space-y-4 transition-all duration-300 hover:-translate-y-1 cursor-pointer group ${
                  isDark 
                    ? 'bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20 hover:border-sky-500/60 hover:shadow-sky-500/10' 
                    : 'bg-white border-slate-200/90 shadow-sm hover:shadow-md hover:border-sky-500/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl border ${
                      isDark ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-700'
                    }`}>
                      {shop.shop_code}
                    </span>
                    <h3 className={`text-base font-extrabold mt-2.5 group-hover:text-sky-400 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{shop.shop_name}</h3>
                    <p className={`text-xs font-medium flex items-center gap-1.5 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{shop.tenant_name}</span>
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <Store className="w-5 h-5" />
                  </div>
                </div>

                <div className={`pt-3 border-t space-y-2 text-xs ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                }`}>
                  {shop.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>{shop.city}</span>
                    </div>
                  )}
                  {shop.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>{shop.phone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/40">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                    shop.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {shop.is_active ? 'Active Outlet' : 'Inactive'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: #{shop.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal: Company / Organization Details */}
      <Modal
        isOpen={!!selectedTenant}
        onClose={() => setSelectedTenant(null)}
        title={selectedTenant?.company_name || 'Organization Profile'}
        subtitle={`Tenant ID: ${selectedTenant?.tenant_code} • Master Corporate Record`}
        icon={Building2}
        maxWidth="max-w-2xl"
      >
        {selectedTenant && (
          <div className="space-y-5 text-xs">
            {/* Quick Badges */}
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
              <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-bold">
                {selectedTenant.tenant_code}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                {selectedTenant.status || 'ACTIVE'}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold">
                Industry: {selectedTenant.industry || selectedTenant.industry_code || 'MOBILE_RETAIL'}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                Plan: {selectedTenant.current_plan || 'BUSINESS'}
              </span>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Primary Contact</span>
                <p className="font-bold text-slate-200 text-sm">{selectedTenant.contact_name}</p>
                <div className="flex items-center gap-2 text-slate-400 pt-1">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{selectedTenant.phone}</span>
                </div>
                {selectedTenant.email && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{selectedTenant.email}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Location & Locale</span>
                <p className="font-bold text-slate-200">{selectedTenant.address || 'Colombo, Sri Lanka'}</p>
                <div className="flex items-center gap-2 text-slate-400 pt-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{selectedTenant.country || 'Sri Lanka'} • {selectedTenant.currency || 'LKR'}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Timezone: {selectedTenant.timezone || 'Asia/Colombo'}
                </div>
              </div>
            </div>

            {/* Quota Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Outlets</span>
                <span className="text-base font-extrabold text-indigo-400">{selectedTenant.shops_count || tenantShops.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Storage Quota</span>
                <span className="text-base font-extrabold text-emerald-400">
                  {selectedTenant.storage_used_mb ? `${selectedTenant.storage_used_mb}MB` : '0 MB'} / {selectedTenant.storage_limit_gb || 50}GB
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Monthly Tx Limit</span>
                <span className="text-base font-extrabold text-sky-400">{selectedTenant.monthly_transactions_limit?.toLocaleString() || '25,000'}</span>
              </div>
            </div>

            {/* Outlets List under this company */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 text-xs">Retail Branch Outlets ({tenantShops.length})</span>
                <button
                  onClick={() => {
                    const tId = selectedTenant.id;
                    setSelectedTenant(null);
                    openShopModal(tId);
                  }}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Branch</span>
                </button>
              </div>

              {tenantShops.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-slate-500 text-xs">
                  No branch outlets registered yet. Click "Add Branch" to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {tenantShops.map(s => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedTenant(null);
                        setSelectedShop(s);
                      }}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 cursor-pointer flex items-center justify-between transition"
                    >
                      <div>
                        <span className="text-[10px] font-mono font-bold text-sky-400">{s.shop_code}</span>
                        <p className="font-bold text-slate-200 text-xs">{s.shop_name}</p>
                        <span className="text-[10px] text-slate-500">{s.city || 'Colombo'}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigate(`/organizations`);
                }}
                icon={ExternalLink}
              >
                Open in Organizations Hub
              </Button>
              <Button
                variant="purple-gradient"
                size="sm"
                onClick={() => setSelectedTenant(null)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Branch Shop Details */}
      <Modal
        isOpen={!!selectedShop}
        onClose={() => setSelectedShop(null)}
        title={selectedShop?.shop_name || 'Branch Outlet Details'}
        subtitle={`Branch Code: ${selectedShop?.shop_code} • Location Profile`}
        icon={Store}
        maxWidth="max-w-lg"
      >
        {selectedShop && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-sky-400 block">{selectedShop.shop_code}</span>
                <h3 className="text-base font-extrabold text-white mt-0.5">{selectedShop.shop_name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Parent Org: <span className="text-slate-200 font-bold">{selectedShop.tenant_name}</span></p>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                selectedShop.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {selectedShop.is_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">City / Location</span>
                <span className="text-xs font-bold text-slate-200">{selectedShop.city || 'Not specified'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Phone Number</span>
                <span className="text-xs font-bold text-slate-200">{selectedShop.phone || 'Not specified'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Hardware &amp; License Status</span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Laptop className="w-4 h-4 text-indigo-400" />
                  <span>Active Connected POS Machines:</span>
                </div>
                <span className="font-mono font-bold text-emerald-400">{selectedShop.active_machines_count || 0}</span>
              </div>
              {selectedShop.active_license_key && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Key className="w-4 h-4 text-purple-400" />
                    <span>License Key:</span>
                  </div>
                  <span className="font-mono text-[10px] text-purple-300">{selectedShop.active_license_key}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigate(`/licenses?shop=${selectedShop.id}`);
                }}
                icon={Key}
              >
                View Licenses
              </Button>
              <Button
                variant="purple-gradient"
                size="sm"
                onClick={() => setSelectedShop(null)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Register Tenant */}
      <Modal
        isOpen={showTenantModal}
        onClose={() => setShowTenantModal(false)}
        title="Register Client Organization"
        subtitle="Create tenant master profile and system tenant code"
        icon={Building2}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1 text-slate-300">Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Cellular"
                value={tenantForm.company_name}
                onChange={(e) => setTenantForm(prev => ({
                  ...prev,
                  company_name: e.target.value,
                  tenant_code: prev.tenant_code || generateAutoTenantCode(e.target.value)
                }))}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-300">Tenant Code *</label>
              <input
                type="text"
                required
                value={tenantForm.tenant_code}
                onChange={(e) => setTenantForm(prev => ({ ...prev, tenant_code: e.target.value.toUpperCase() }))}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none font-mono uppercase bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-300">Contact Person *</label>
              <input
                type="text"
                required
                placeholder="e.g. Nimal Perera"
                value={tenantForm.contact_name}
                onChange={(e) => setTenantForm({ ...tenantForm, contact_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-300">Phone Number *</label>
              <input
                type="text"
                required
                placeholder="+94 77 123 4567"
                value={tenantForm.phone}
                onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block font-bold mb-1 text-slate-300">Email Address</label>
              <input
                type="email"
                placeholder="billing@apex.lk"
                value={tenantForm.email}
                onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowTenantModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="purple-gradient"
              size="sm"
              loading={submitting}
            >
              Save Organization
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Shop */}
      <Modal
        isOpen={showShopModal}
        onClose={() => setShowShopModal(false)}
        title="Create Shop Outlet"
        subtitle="Add a physical retail store location under a parent company"
        icon={Store}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateShop} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1 text-slate-300">Parent Organization *</label>
            <Select
              value={shopForm.tenant_id}
              onChange={(val) => setShopForm({ ...shopForm, tenant_id: String(val) })}
              options={tenants.map(t => ({
                value: String(t.id),
                label: `${t.company_name} (${t.tenant_code})`,
              }))}
              placeholder="Select tenant..."
              size="md"
              fullWidth
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1 text-slate-300">Branch Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Flagship Store"
                value={shopForm.shop_name}
                onChange={(e) => setShopForm({ ...shopForm, shop_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-300">Branch Code *</label>
              <input
                type="text"
                required
                value={shopForm.shop_code}
                onChange={(e) => setShopForm({ ...shopForm, shop_code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none font-mono uppercase bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-300">City / Location</label>
              <input
                type="text"
                placeholder="e.g. Colombo"
                value={shopForm.city}
                onChange={(e) => setShopForm({ ...shopForm, city: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-300">Branch Phone</label>
              <input
                type="text"
                placeholder="+94 11 234 5678"
                value={shopForm.phone}
                onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowShopModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="purple-gradient"
              size="sm"
              loading={submitting}
            >
              Create Branch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
