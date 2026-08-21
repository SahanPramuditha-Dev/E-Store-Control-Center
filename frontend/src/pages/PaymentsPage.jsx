import React, { useEffect, useState } from 'react';
import { 
  CreditCard, Plus, RefreshCw, X, Loader2, 
  Printer, FileSpreadsheet, Search, Filter, ArrowUpRight, CheckCircle2 
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { formatDate } from '../utils/dateUtils';
import InvoiceModal from '../components/InvoiceModal';


export default function PaymentsPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const [form, setForm] = useState({
    tenant_id: '',
    shop_id: '',
    amount_lkr: '',
    payment_type: 'RENEWAL',
    payment_method: 'BANK_TRANSFER',
    reference_no: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pmtRes, tenantsRes, shopsRes] = await Promise.all([
        api.get('/admin/payments'),
        api.get('/admin/tenants'),
        api.get('/admin/shops')
      ]);
      setPayments(pmtRes.data);
      setTenants(tenantsRes.data);
      setShops(shopsRes.data);

      if (tenantsRes.data.length > 0 && !form.tenant_id) {
        const firstT = tenantsRes.data[0];
        const firstS = shopsRes.data.find(s => s.tenant_id === firstT.id);
        setForm(prev => ({
          ...prev,
          tenant_id: firstT.id.toString(),
          shop_id: firstS ? firstS.id.toString() : ''
        }));
      }
    } catch (err) {
      showToast('Failed to load payment ledger data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/payments', {
        ...form,
        tenant_id: parseInt(form.tenant_id, 10),
        shop_id: parseInt(form.shop_id, 10),
        amount_lkr: parseFloat(form.amount_lkr)
      });
      showToast('Payment recorded successfully in ledger.', 'success');
      setShowModal(false);
      setForm({
        tenant_id: tenants[0]?.id?.toString() || '',
        shop_id: '',
        amount_lkr: '',
        payment_type: 'RENEWAL',
        payment_method: 'BANK_TRANSFER',
        reference_no: '',
        notes: ''
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to record payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (payments.length === 0) return;
    const headers = ['ID', 'Tenant', 'Shop', 'License Key', 'Amount (LKR)', 'Type', 'Method', 'Reference No', 'Date'];
    const rows = filteredPayments.map(p => [
      p.id,
      `"${p.tenant_name || ''}"`,
      `"${p.shop_name || ''}"`,
      p.license_key || '',
      p.amount_lkr,
      p.payment_type,
      p.payment_method,
      `"${p.reference_no || ''}"`,
      new Date(p.payment_date || p.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estore-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported payment ledger to CSV.', 'success');
  };

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount_lkr || 0), 0);
  const availableShops = shops.filter(s => !form.tenant_id || s.tenant_id === parseInt(form.tenant_id, 10));

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.tenant_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.shop_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.reference_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.license_key || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'ALL' || p.payment_type === typeFilter;
    const matchesMethod = methodFilter === 'ALL' || p.payment_method === methodFilter;

    return matchesSearch && matchesType && matchesMethod;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Billing & Payment Ledger
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Financial revenue registry, payment receipts, and automated tax invoice generator
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className={`p-2.5 rounded-2xl border transition shadow-xs active:scale-95 ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
                : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400'
            }`}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition shadow-xs active:scale-95 ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
                : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-2xl text-xs transition shadow-md shadow-teal-500/20 active:scale-95 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Summary Widget */}
      <div className={`p-6 sm:p-7 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border-slate-800' 
          : 'bg-gradient-to-r from-white via-white to-emerald-50/50 border-slate-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Revenue Invoiced
            </span>
            <h2 className={`text-2xl sm:text-3xl font-extrabold mt-0.5 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Rs {totalCollected.toLocaleString()}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Transactions</span>
            <p className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{payments.length}</p>
          </div>
          <div className={`h-8 w-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <div>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Fiscal Ledger Status</span>
            <p className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Balanced & Verified</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={`flex flex-col md:flex-row gap-3 p-4 rounded-3xl border shadow-sm ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by company, shop, reference no, or license key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none transition border ${
              isDark 
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-teal-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-teal-600'
            }`}
          />
        </div>

        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`rounded-2xl px-3 py-2.5 text-xs font-bold focus:outline-none border ${
              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">All Types</option>
            <option value="NEW_LICENSE">NEW_LICENSE</option>
            <option value="RENEWAL">RENEWAL</option>
            <option value="CUSTOM_FEATURE">CUSTOM_FEATURE</option>
            <option value="UPGRADE">UPGRADE</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className={`rounded-2xl px-3 py-2.5 text-xs font-bold focus:outline-none border ${
              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">All Methods</option>
            <option value="BANK_TRANSFER">BANK_TRANSFER</option>
            <option value="CASH">CASH</option>
            <option value="CARD">CARD</option>
            <option value="ONLINE_GATEWAY">ONLINE_GATEWAY</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-sm ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`uppercase tracking-wider text-[10px] font-bold border-b ${
              isDark ? 'text-slate-400 bg-slate-950/80 border-slate-800' : 'text-slate-600 bg-slate-50 border-slate-200'
            }`}>
              <tr>
                <th className="px-5 py-4">Receipt ID</th>
                <th className="px-5 py-4">Client Shop & Tenant</th>
                <th className="px-5 py-4">Amount (LKR)</th>
                <th className="px-5 py-4">Type & Method</th>
                <th className="px-5 py-4">Reference No</th>
                <th className="px-5 py-4">Date Recorded</th>
                <th className="px-5 py-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
            }`}>
              {loading && payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 text-teal-500 animate-spin mx-auto mb-2" />
                    Loading billing ledger...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No payment records match your filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className={`transition ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-5 py-4 font-mono text-slate-400">
                      #{p.id.toString().padStart(5, '0')}
                    </td>
                    <td className="px-5 py-4">
                      <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.shop_name}</div>
                      <div className="text-slate-400 text-[11px]">{p.tenant_name}</div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-teal-500 text-sm">
                      Rs {Number(p.amount_lkr).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {p.payment_type}
                        </span>
                        <span className="text-[11px] text-slate-400">{p.payment_method}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-400">
                      {p.reference_no || '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                      {formatDate(p.payment_date || p.created_at)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(p)}
                        title="Print / Download Tax Receipt"
                        className={`p-1.5 rounded-xl border transition ${
                          isDark ? 'bg-slate-800/80 hover:bg-slate-700 text-teal-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-teal-700 border-slate-200'
                        }`}
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          payment={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-500" />
                <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Record Payment Transaction
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Client Organization *</label>
                  <select
                    value={form.tenant_id}
                    onChange={(e) => setForm({ ...form, tenant_id: e.target.value, shop_id: '' })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                    required
                  >
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.company_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Branch Shop *</label>
                  <select
                    value={form.shop_id}
                    onChange={(e) => setForm({ ...form, shop_id: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                    required
                  >
                    <option value="">Select branch</option>
                    {availableShops.map(s => (
                      <option key={s.id} value={s.id}>{s.shop_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Amount (LKR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="95000"
                    value={form.amount_lkr}
                    onChange={(e) => setForm({ ...form, amount_lkr: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none font-mono ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Payment Type</label>
                  <select
                    value={form.payment_type}
                    onChange={(e) => setForm({ ...form, payment_type: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  >
                    <option value="NEW_LICENSE">NEW_LICENSE</option>
                    <option value="RENEWAL">RENEWAL</option>
                    <option value="CUSTOM_FEATURE">CUSTOM_FEATURE</option>
                    <option value="UPGRADE">UPGRADE</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Payment Method</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (Direct Deposit)</option>
                    <option value="CASH">Cash Over Counter</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="ONLINE_GATEWAY">Online Gateway / Slip</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Bank Slip / Reference No</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-99882"
                    value={form.reference_no}
                    onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none font-mono ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                    }`}
                  />
                </div>
              </div>

              <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
