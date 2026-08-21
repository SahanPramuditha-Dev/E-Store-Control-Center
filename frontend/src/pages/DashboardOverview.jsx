import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, Key, Laptop, AlertTriangle, 
  ArrowUpRight, CreditCard, RefreshCw, Shield, Sparkles, 
  Plus, CheckCircle2, Clock, Ban, ArrowRight
} from 'lucide-react';
import api from '../api';
import OnboardingModal from '../components/OnboardingModal';

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const navigate = useNavigate();

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
      sub: `${stats?.total_tenants || 0} Organizations`,
      icon: Store,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20',
      link: '/shops'
    },
    {
      title: 'Active Licenses',
      value: stats?.active_licenses || 0,
      sub: `${stats?.total_licenses || 0} Total Generated`,
      icon: Key,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
      link: '/licenses'
    },
    {
      title: 'Online Machines',
      value: stats?.active_machines || 0,
      sub: 'Terminals Authorized',
      icon: Laptop,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      link: '/machines'
    },
    {
      title: 'Total Revenue',
      value: `Rs ${(stats?.total_revenue_lkr || 0).toLocaleString()}`,
      sub: 'Lifetime Invoiced',
      icon: CreditCard,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      link: '/payments'
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/40 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold">
              Live Operations Control
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Platform Command Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized telemetry, licensing tokens, multi-tenant outlets, and billing management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Client</span>
          </button>
        </div>
      </div>

      {/* Expiry Warning Banner if any */}
      {stats?.expiring_soon_30d > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-300 text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>
              <strong>{stats.expiring_soon_30d} license(s)</strong> are due for renewal within the next 30 days. Send renewal notices to avoid POS lockout.
            </span>
          </div>
          <button
            onClick={() => navigate('/licenses')}
            className="font-bold underline hover:text-amber-200 flex items-center gap-1 shrink-0"
          >
            <span>Review Licenses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(card.link)}
              className="p-5 bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-3xl relative overflow-hidden backdrop-blur-sm transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {card.title}
                </span>
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${card.bg} ${card.color} group-hover:scale-105 transition`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-teal-300 transition">
                  {card.value}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Launch & Telemetry Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rapid Actions */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Quick Action Shortcuts
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Common licensing & tenant workflows</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-teal-500/40 hover:bg-slate-900 text-left transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-teal-300">Rapid Client Onboarding</p>
                  <p className="text-[11px] text-slate-400">Create tenant, shop & license key in 1 step</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transform group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => navigate('/licenses')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900 text-left transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-sky-300">Issue or Renew License</p>
                  <p className="text-[11px] text-slate-400">Generate crypto tokens or reset machine binds</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transform group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => navigate('/payments')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900 text-left transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-emerald-300">Record Client Payment</p>
                  <p className="text-[11px] text-slate-400">Log bank deposits & print receipts</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transform group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>

        {/* System Health & Status Matrix */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                Licensing & Engine Telemetry Status
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time breakdown of ecosystem health</p>
            </div>
            <span className="text-[11px] font-mono text-teal-400 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20">
              Ed25519 Verified
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
              <div className="flex items-center justify-center gap-1.5 text-teal-400 text-xs font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active & Healthy</span>
              </div>
              <span className="text-2xl font-extrabold text-white">{stats?.active_licenses || 0}</span>
              <p className="text-[10px] text-slate-400 mt-1">Operating normal</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                <Clock className="w-4 h-4" />
                <span>Expiring Soon</span>
              </div>
              <span className="text-2xl font-extrabold text-white">{stats?.expiring_soon_30d || 0}</span>
              <p className="text-[10px] text-slate-400 mt-1">Within 30 days</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
              <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-bold mb-1">
                <Ban className="w-4 h-4" />
                <span>Suspended / Inactive</span>
              </div>
              <span className="text-2xl font-extrabold text-white">{stats?.suspended_licenses || 0}</span>
              <p className="text-[10px] text-slate-400 mt-1">Terminals blocked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-white">Recent Payment Transactions</h2>
            <p className="text-xs text-slate-400">Latest revenue collections across all customer shops</p>
          </div>
          <button
            onClick={() => navigate('/payments')}
            className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
          >
            <span>View Full Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats?.recent_payments?.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No payment records logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase tracking-wider text-[10px] text-slate-400 bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">ID</th>
                  <th className="px-4 py-3">Amount (LKR)</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference No</th>
                  <th className="px-4 py-3 rounded-r-xl">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {stats?.recent_payments?.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-mono text-slate-400">#{pmt.id}</td>
                    <td className="px-4 py-3 font-bold font-mono text-teal-400">
                      Rs {Number(pmt.amount_lkr).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-200">
                        {pmt.payment_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{pmt.payment_method}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{pmt.reference_no || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(pmt.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={fetchStats}
      />
    </div>
  );
}
