import React, { useEffect, useState } from 'react';
import { 
  Store, Key, Laptop, AlertTriangle, 
  ArrowUpRight, CreditCard, RefreshCw, Shield, Sparkles 
} from 'lucide-react';
import api from '../api';

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Shops',
      value: stats?.total_shops || 0,
      sub: `${stats?.total_tenants || 0} Company Tenants`,
      icon: Store,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20'
    },
    {
      title: 'Active Licenses',
      value: stats?.active_licenses || 0,
      sub: `${stats?.total_licenses || 0} Total Generated`,
      icon: Key,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'Active Machines',
      value: stats?.active_machines || 0,
      sub: 'Terminals online',
      icon: Laptop,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      title: 'Total Revenue',
      value: `LKR ${(stats?.total_revenue_lkr || 0).toLocaleString()}`,
      sub: 'Lifetime collections',
      icon: CreditCard,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Business Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time status of client installations and licensing telemetry</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Expiry Warning Banner if any */}
      {stats?.expiring_soon_30d > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-300 text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>
              <strong>{stats.expiring_soon_30d} license(s)</strong> are expiring within the next 30 days. Action required for renewal invoicing.
            </span>
          </div>
          <a href="/licenses" className="font-semibold underline hover:text-amber-200">
            View Expiring &rarr;
          </a>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl relative overflow-hidden backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {card.title}
                </span>
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.bg} ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-white tracking-tight">{card.value}</h3>
                <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Payments Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white">Recent Payment Transactions</h2>
            <p className="text-xs text-slate-400">Latest revenue collections across all customer shops</p>
          </div>
          <a href="/payments" className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1">
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {stats?.recent_payments?.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No payment records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">ID</th>
                  <th className="px-4 py-3">Amount (LKR)</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference No</th>
                  <th className="px-4 py-3 rounded-r-lg">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {stats?.recent_payments?.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">#{pmt.id}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">
                      LKR {pmt.amount_lkr.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300">
                        {pmt.payment_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{pmt.payment_method}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{pmt.reference_no || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(pmt.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
