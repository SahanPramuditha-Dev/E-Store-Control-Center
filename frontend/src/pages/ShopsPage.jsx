import React, { useEffect, useState } from 'react';
import { Store, Plus, Search, Building2, MapPin, Phone, Mail, RefreshCw, X, Loader2, Wand2, Users } from 'lucide-react';
import api from '../api';

export default function ShopsPage() {
  const [tenants, setTenants] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('companies'); // 'companies' or 'shops'

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
      console.error('Failed to load data', err);
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
      setShowTenantModal(false);
      await fetchData();
      setActiveTab('companies');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create tenant');
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
        tenant_id: parseInt(shopForm.tenant_id)
      });
      setShowShopModal(false);
      await fetchData();
      setActiveTab('shops');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create shop');
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
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tenants & Shop Branches</h1>
          <p className="text-sm text-slate-400 mt-1">Manage customer companies and their individual physical retail branches</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openTenantModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800 transition"
          >
            <Building2 className="w-4 h-4 text-teal-400" />
            <span>+ Add Company</span>
          </button>
          <button
            onClick={() => openShopModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl text-sm transition shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Branch</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('companies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'companies'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Companies ({tenants.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('shops')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'shops'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Shop Branches ({shops.length})</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'companies' ? "Search companies..." : "Search shop branches..."}
            className="w-full pl-11 pr-4 py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
          />
        </div>
      </div>

      {/* Content based on Active Tab */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      ) : activeTab === 'companies' ? (
        /* Companies Tab */
        filteredTenants.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No company tenants found</h3>
            <p className="text-xs text-slate-500 mt-1">Click "+ Add Company" to register your first business client.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTenants.map((t) => (
              <div
                key={t.id}
                className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      {t.tenant_code}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">{t.company_name}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Contact: <span className="text-slate-200">{t.contact_name}</span>
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center text-teal-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.phone}</span>
                  </div>
                  {t.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t.email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {t.shops_count} Physical Branch(es)
                  </span>
                  <button
                    onClick={() => openShopModal(t.id)}
                    className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg text-xs font-semibold transition"
                  >
                    + Add Branch
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Shops Tab */
        filteredShops.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl">
            <Store className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No shop branches found</h3>
            <p className="text-xs text-slate-500 mt-1">Add a physical branch under your company tenants.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredShops.map((shop) => (
              <div
                key={shop.id}
                className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      {shop.shop_code}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">{shop.shop_name}</h3>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{shop.tenant_name}</span>
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center text-teal-400">
                    <Store className="w-5 h-5" />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 space-y-2 text-xs text-slate-400">
                  {shop.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{shop.city}, Sri Lanka</span>
                    </div>
                  )}
                  {shop.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
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
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Create Company Tenant</h2>
              <button onClick={() => setShowTenantModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTenant} className="space-y-4 mt-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-400">Tenant Code (Unique)</label>
                  <button
                    type="button"
                    onClick={() => setTenantForm(prev => ({ ...prev, tenant_code: generateAutoTenantCode(prev.company_name) }))}
                    className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. TNT-8821"
                  value={tenantForm.tenant_code}
                  onChange={(e) => setTenantForm({ ...tenantForm, tenant_code: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none uppercase font-mono tracking-wider"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Company / Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC Mobile Solutions Ltd"
                  value={tenantForm.company_name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setTenantForm(prev => ({
                      ...prev,
                      company_name: name,
                      tenant_code: generateAutoTenantCode(name)
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Owner Contact Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kasun Perera"
                    value={tenantForm.contact_name}
                    onChange={(e) => setTenantForm({ ...tenantForm, contact_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+94 77 123 4567"
                    value={tenantForm.phone}
                    onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="owner@abcmobile.lk"
                  value={tenantForm.email}
                  onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTenantModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl text-sm flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Company</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Shop Branch */}
      {showShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Create Shop Branch</h2>
              <button onClick={() => setShowShopModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateShop} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Parent Company Tenant</label>
                <select
                  required
                  value={shopForm.tenant_id}
                  onChange={(e) => setShopForm({ ...shopForm, tenant_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                >
                  <option value="">-- Select Parent Company --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.company_name} ({t.tenant_code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-400">Shop Code (Unique)</label>
                    <button
                      type="button"
                      onClick={() => setShopForm(prev => ({ ...prev, shop_code: generateAutoShopCode(prev.shop_name, prev.city) }))}
                      className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Auto</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SHP-CMB-101"
                    value={shopForm.shop_code}
                    onChange={(e) => setShopForm({ ...shopForm, shop_code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none uppercase font-mono tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Branch Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Majestic City Branch"
                    value={shopForm.shop_name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setShopForm(prev => ({
                        ...prev,
                        shop_name: name,
                        shop_code: generateAutoShopCode(name, prev.city)
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Colombo 04"
                    value={shopForm.city}
                    onChange={(e) => {
                      const city = e.target.value;
                      setShopForm(prev => ({
                        ...prev,
                        city: city,
                        shop_code: generateAutoShopCode(prev.shop_name, city)
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Branch Phone</label>
                  <input
                    type="text"
                    placeholder="+94 11 255 6677"
                    value={shopForm.phone}
                    onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowShopModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl text-sm flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Branch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
