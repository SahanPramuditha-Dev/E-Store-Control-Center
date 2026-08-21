import React, { useRef } from 'react';
import { Printer, Download, X, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function InvoiceModal({ isOpen, onClose, payment }) {
  const printRef = useRef(null);

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-w-none print:h-auto print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Modal Top Bar (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Payment Receipt / Tax Invoice</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 font-mono">
              #{payment.id || 'INV-001'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div ref={printRef} className="p-8 overflow-y-auto space-y-6 text-slate-200 print:text-black print:p-6">
          {/* Company & Invoice Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-6 print:border-gray-300">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  E
                </div>
                <h1 className="text-xl font-extrabold tracking-tight text-white print:text-black">E-Store Ecosystem</h1>
              </div>
              <p className="text-xs text-slate-400 print:text-gray-600">Central SaaS & Licensing Administration Console</p>
              <p className="text-xs text-slate-400 print:text-gray-600 mt-1">support@estore.lk • www.estore.lk</p>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2 print:border-gray-400 print:text-black">
                Official Receipt
              </div>
              <p className="text-xs text-slate-400 print:text-gray-600">Receipt No: <span className="font-mono font-semibold text-white print:text-black">EST-{String(payment.id).padStart(6, '0')}</span></p>
              <p className="text-xs text-slate-400 print:text-gray-600">Date: <span className="text-white print:text-black">{new Date(payment.payment_date || payment.created_at).toLocaleDateString()}</span></p>
            </div>
          </div>

          {/* Billed To / Client Details */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 print:bg-gray-50 print:border-gray-200 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-1 print:text-gray-500">
                Billed Client
              </span>
              <p className="font-bold text-white text-sm print:text-black">{payment.tenant_name}</p>
              <p className="text-slate-400 print:text-gray-600 mt-0.5">Branch: {payment.shop_name}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-1 print:text-gray-500">
                Payment Info
              </span>
              <p className="font-semibold text-white print:text-black">Method: {payment.payment_method}</p>
              <p className="text-slate-400 print:text-gray-600 mt-0.5 font-mono">Ref: {payment.reference_no || 'N/A'}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden print:border-gray-300">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 print:bg-gray-100 print:text-gray-700 print:border-gray-300">
                <tr>
                  <th className="p-3">Item / Service Description</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 font-mono">Linked License</th>
                  <th className="p-3 text-right">Amount (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                <tr>
                  <td className="p-3">
                    <p className="font-semibold text-white print:text-black">E-Store POS Subscription / Licensing</p>
                    <span className="text-[11px] text-slate-400 print:text-gray-500">{payment.notes || 'Full license entitlement & cloud sync services'}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium text-[10px] print:bg-gray-200 print:text-black">
                      {payment.payment_type}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-teal-300 print:text-black truncate max-w-[150px]">
                    {payment.license_key || '—'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-white text-sm print:text-black">
                    Rs {Number(payment.amount_lkr).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Box */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 print:text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono">Rs {Number(payment.amount_lkr).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-400 print:text-gray-600">
                <span>Tax / VAT (0%):</span>
                <span className="font-mono">Rs 0.00</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold text-white print:text-black print:border-gray-300">
                <span>Total Paid:</span>
                <span className="text-teal-400 font-mono print:text-black">
                  Rs {Number(payment.amount_lkr).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Verified Footer */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-[11px] text-slate-500 print:border-gray-300 print:text-gray-500">
            <div className="flex items-center gap-1.5 text-teal-400 print:text-gray-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Status: Fully Paid & Authenticated</span>
            </div>
            <span>Generated electronically by E-Store Central Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}
