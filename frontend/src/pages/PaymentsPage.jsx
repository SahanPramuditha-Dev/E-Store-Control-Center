import React, { useEffect, useState } from 'react';
import { 
  CreditCard, Plus, RefreshCw, X, Loader2, 
  Printer, FileSpreadsheet, Search, Filter 
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import InvoiceModal from '../components/InvoiceModal';

export default function PaymentsPage() {
  const { showToast } = useToast();
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Financial Ledger & Invoices</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete transaction record of initial activations, license renewals, and custom feature upgrades.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-extrabold font-mono text-xs">
            Total Revenue: Rs {totalCollected.toLocaleString()}
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by tenant, shop, license key, or bank ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Types</option>
            <option value="INITIAL">INITIAL</option>
            <option value="RENEWAL">RENEWAL</option>
            <option value="UPGRADE">UPGRADE</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Methods</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="CHEQUE">Cheque</option>
            <option value="ONLINE">Online Gateway</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="uppercase tracking-wider text-[10px] text-slate-400 bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Transaction ID</th>
                <th className="px-5 py-4">Client Organization</th>
                <th className="px-5 py-4">Branch Shop</th>
                <th className="px-5 py-4">Amount (LKR)</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Method & Ref</th>
                <th className="px-5 py-4">Payment Date</th>
                <th className="px-5 py-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading && payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 text-teal-400 animate-spin mx-auto mb-2" />
                    Loading payment records...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No transactions match your search.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-4 font-mono text-slate-400">
                      #{p.id}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-white">{p.tenant_name}</p>
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {p.shop_name}
                    </td>

                    <td className="px-5 py-4 font-bold font-mono text-teal-400 text-sm">
                      Rs {Number(p.amount_lkr).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-200">
                        {p.payment_type}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{p.payment_method}</div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                        {p.reference_no || '—'}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {new Date(p.payment_date || p.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-semibold transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Invoice</span>
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
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          payment={selectedInvoice}
        />
      )}

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Record Client Payment</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Select Tenant</label>
                <select
                  value={form.tenant_id}
                  onChange={(e) => {
                    const tId = e.target.value;
                    const relatedShop = shops.find(s => s.tenant_id.toString() === tId);
                    setForm({
                      ...form,
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
                  value={form.shop_id}
                  onChange={(e) => setForm({ ...form, shop_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none"
                  required
                >
                  {availableShops.map(s => (
                    <option key={s.id} value={s.id}>{s.shop_name} ({s.shop_code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Amount (LKR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="95000"
                    value={form.amount_lkr}
                    onChange={(e) => setForm({ ...form, amount_lkr: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Payment Category</label>
                  <select
                    value={form.payment_type}
                    onChange={(e) => setForm({ ...form, payment_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="INITIAL">INITIAL PURCHASE</option>
                    <option value="RENEWAL">ANNUAL RENEWAL</option>
                    <option value="UPGRADE">PLAN UPGRADE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="BANK_TRANSFER">Bank Deposit / Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="ONLINE">Online Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Reference No / Slip</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-884912"
                    value={form.reference_no}
                    onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Internal Notes</label>
                <input
                  type="text"
                  placeholder="Optional remarks"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  <span>Save Transaction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
