import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, RefreshCw, X, Loader2 } from 'lucide-react';
import api from '../api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    } catch (err) {
      console.error('Failed to load payments', err);
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
        tenant_id: parseInt(form.tenant_id),
        shop_id: parseInt(form.shop_id),
        amount_lkr: parseFloat(form.amount_lkr)
      });
      setShowModal(false);
      setForm({
        tenant_id: '',
        shop_id: '',
        amount_lkr: '',
        payment_type: 'RENEWAL',
        payment_method: 'BANK_TRANSFER',
        reference_no: '',
        notes: ''
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount_lkr || 0), 0);
  const availableShops = shops.filter(s => !form.tenant_id || s.tenant_id === parseInt(form.tenant_id));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Payment Ledger & Invoices</h1>
          <p className="text-sm text-slate-400 mt-1">Audit log of all initial software purchases, annual renewals, and plan upgrades</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-sm">
            Total: LKR {totalCollected.toLocaleString()}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl text-sm transition shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Payment</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No payment records found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Customer & Branch</th>
                  <th className="px-6 py-4">Amount (LKR)</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Reference No</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {payments.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">TXN-{pmt.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{pmt.tenant_name}</p>
                      <span className="text-xs text-slate-400">{pmt.shop_name}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      LKR {pmt.amount_lkr.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-200">
                        {pmt.payment_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{pmt.payment_method}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{pmt.reference_no || '—'}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(pmt.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Record Manual Payment */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Record Payment / Invoice</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Company Tenant</label>
                <select
                  required
                  value={form.tenant_id}
                  onChange={(e) => setForm({ ...form, tenant_id: e.target.value, shop_id: '' })}
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
                  value={form.shop_id}
                  onChange={(e) => setForm({ ...form, shop_id: e.target.value })}
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
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Amount (LKR)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 95000"
                    value={form.amount_lkr}
                    onChange={(e) => setForm({ ...form, amount_lkr: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Type</label>
                  <select
                    value={form.payment_type}
                    onChange={(e) => setForm({ ...form, payment_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="INITIAL">Initial Purchase</option>
                    <option value="RENEWAL">Annual Renewal</option>
                    <option value="UPGRADE">Package Upgrade</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer / Slip</option>
                    <option value="CASH">Cash Deposit</option>
                    <option value="ONLINE_GATEWAY">Online Payment</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Bank Reference No</label>
                  <input
                    type="text"
                    placeholder="e.g. BOC-TX-98721"
                    value={form.reference_no}
                    onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional billing details..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  <span>Save Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
