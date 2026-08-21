import React, { useEffect, useState } from 'react';
import { 
  Store, Plus, Search, Building2, MapPin, Phone, Mail, 
  RefreshCw, X, Loader2, Wand2, Users, ArrowRight 
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';

export default function ShopsPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [tenants, setTenants] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('companies');

  // Modals
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
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
      setLoading(true);
      const [tenantsRes, shopsRes] = await Promise.all([
        api.get('/admin/tenants'),
        api.get('/admin/shops')
      ]);
      setTenants(tenantsRes.data);
      setShops(shopsRes.data);
    } catch (err) {
      showToast('Failed to load tenants and shops', 'error');
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

  const filteredTenants = tenants.filter(t =>
    t.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tenant_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredShops = shops.filter(s =>
    s.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.shop_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Tenants & Shop Branches
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Manage client organizations, parent companies, and their respective retail outlets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openTenantModal}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all duration-200 shadow-xs active:scale-95 ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700' 
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            <Building2 className="w-4 h-4 text-teal-500" />
            <span>Add Organization</span>
          </button>
          <button
            onClick={() => openShopModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-2xl text-xs transition-all duration-200 shadow-md shadow-teal-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Branch Shop</span>
          </button>
        </div>
      </div>

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
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
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
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
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
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-teal-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-teal-600'
            }`}
          />
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-teal-500 animate-spin mb-2" />
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
                className={`p-6 rounded-3xl border space-y-4 transition-all duration-300 hover:-translate-y-1 ${
                  isDark 
                    ? 'bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20 hover:border-teal-500/50' 
                    : 'bg-white border-slate-200/90 shadow-sm hover:shadow-md hover:border-teal-500/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl border ${
                      isDark ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-teal-50 border-teal-200 text-teal-700'
                    }`}>
                      {t.tenant_code}
                    </span>
                    <h3 className={`text-base font-extrabold mt-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.company_name}</h3>
                    <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Contact: <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{t.contact_name}</span>
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-teal-500 ${
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
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t.shops_count} Physical Branch(es)
                  </span>
                  <button
                    onClick={() => openShopModal(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      isDark 
                        ? 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border-teal-500/30' 
                        : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Branch</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Shops Tab */
        filteredShops.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border ${
            isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <Store className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>No Branch Outlets Found</h3>
            <p className="text-xs text-slate-500 mt-1">Add a physical branch under your parent company.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredShops.map((shop) => (
              <div
                key={shop.id}
                className={`p-6 rounded-3xl border space-y-4 transition-all duration-300 hover:-translate-y-1 ${
                  isDark 
                    ? 'bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20 hover:border-sky-500/50' 
                    : 'bg-white border-slate-200/90 shadow-sm hover:shadow-md hover:border-sky-500/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl border ${
                      isDark ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-700'
                    }`}>
                      {shop.shop_code}
                    </span>
                    <h3 className={`text-base font-extrabold mt-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{shop.shop_name}</h3>
                    <p className={`text-xs font-medium flex items-center gap-1.5 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{shop.tenant_name}</span>
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-sky-500 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <Store className="w-5 h-5" />
                  </div>
                </div>

                <div className={`pt-3 border-t space-y-2 text-xs ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                }`}>
                  {shop.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{shop.city}, Sri Lanka</span>
                    </div>
                  )}
                  {shop.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{shop.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal: Create Tenant */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-500" />
                <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Register Organization
                </h2>
              </div>
              <button onClick={() => setShowTenantModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Company Name *</label>
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
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Tenant Code *</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.tenant_code}
                    onChange={(e) => setTenantForm(prev => ({ ...prev, tenant_code: e.target.value.toUpperCase() }))}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none font-mono uppercase ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nimal Perera"
                    value={tenantForm.contact_name}
                    onChange={(e) => setTenantForm({ ...tenantForm, contact_name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+94 77 123 4567"
                    value={tenantForm.phone}
                    onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div className="col-span-2">
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
                  <input
                    type="email"
                    placeholder="billing@apex.lk"
                    value={tenantForm.email}
                    onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>
              </div>

              <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setShowTenantModal(false)}
                  className={`px-4 py-2 rounded-xl font-bold border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl shadow-md shadow-teal-500/20"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Shop */}
      {showShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-sky-500" />
                <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Create Shop Outlet
                </h2>
              </div>
              <button onClick={() => setShowShopModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShop} className="space-y-4 mt-4 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Parent Organization *</label>
                <select
                  value={shopForm.tenant_id}
                  onChange={(e) => setShopForm({ ...shopForm, tenant_id: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                  }`}
                  required
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.company_name} ({t.tenant_code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flagship Store"
                    value={shopForm.shop_name}
                    onChange={(e) => setShopForm({ ...shopForm, shop_name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Branch Code *</label>
                  <input
                    type="text"
                    required
                    value={shopForm.shop_code}
                    onChange={(e) => setShopForm({ ...shopForm, shop_code: e.target.value.toUpperCase() })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none font-mono uppercase ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>City / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Colombo"
                    value={shopForm.city}
                    onChange={(e) => setShopForm({ ...shopForm, city: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Branch Phone</label>
                  <input
                    type="text"
                    placeholder="+94 11 234 5678"
                    value={shopForm.phone}
                    onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>
              </div>

              <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setShowShopModal(false)}
                  className={`px-4 py-2 rounded-xl font-bold border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl shadow-md shadow-teal-500/20"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
