import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, Key, Laptop, AlertTriangle, 
  ArrowUpRight, CreditCard, RefreshCw, Shield, Sparkles, 
  Plus, CheckCircle2, Clock, Ban, ArrowRight
} from 'lucide-react';
import api from '../api';
import { useTheme } from '../components/ThemeContext';
import OnboardingModal from '../components/OnboardingModal';

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const { isDark } = useTheme();
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
        <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Shops',
      value: stats?.total_shops || 0,
      sub: `${stats?.total_tenants || 0} Organizations`,
      icon: Store,
      color: 'text-teal-500',
      bg: isDark ? 'bg-teal-500/10 border-teal-500/20' : 'bg-teal-50 border-teal-200',
      link: '/shops'
    },
    {
      title: 'Active Licenses',
      value: stats?.active_licenses || 0,
      sub: `${stats?.total_licenses || 0} Total Generated`,
      icon: Key,
      color: 'text-sky-500',
      bg: isDark ? 'bg-sky-500/10 border-sky-500/20' : 'bg-sky-50 border-sky-200',
      link: '/licenses'
    },
    {
      title: 'Online Machines',
      value: stats?.active_machines || 0,
      sub: 'Terminals Authorized',
      icon: Laptop,
      color: 'text-purple-500',
      bg: isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200',
      link: '/machines'
    },
    {
      title: 'Total Revenue',
      value: `Rs ${(stats?.total_revenue_lkr || 0).toLocaleString()}`,
      sub: 'Lifetime Invoiced',
      icon: CreditCard,
      color: 'text-emerald-500',
      bg: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200',
      link: '/payments'
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl border transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/40 border-slate-800' 
          : 'bg-gradient-to-r from-white via-white to-teal-50 border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              isDark ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-teal-50 border-teal-200 text-teal-700'
            }`}>
              Live Operations Control
            </span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Platform Command Center
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Centralized telemetry, cryptographic licensing tokens, multi-tenant outlets, and billing management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
              isDark 
                ? 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800' 
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-extrabold transition shadow-md shadow-teal-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Client</span>
          </button>
        </div>
      </div>

      {/* Expiry Warning Banner if any */}
      {stats?.expiring_soon_30d > 0 && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium ${
          isDark 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
            <span>
              <strong>{stats.expiring_soon_30d} license(s)</strong> are due for renewal within the next 30 days. Send renewal notices to avoid POS lockout.
            </span>
          </div>
          <button
            onClick={() => navigate('/licenses')}
            className="font-bold underline hover:opacity-80 flex items-center gap-1 shrink-0 ml-2"
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
              className={`p-5 rounded-3xl border relative overflow-hidden transition cursor-pointer group ${
                isDark 
                  ? 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {card.title}
                </span>
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${card.bg} ${card.color} group-hover:scale-105 transition`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className={`text-2xl font-extrabold tracking-tight transition ${isDark ? 'text-white group-hover:text-teal-400' : 'text-slate-900 group-hover:text-teal-600'}`}>
                  {card.value}
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Launch & Health Telemetry Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rapid Actions */}
        <div className={`rounded-3xl p-6 space-y-4 border ${
          isDark ? 'bg-slate-900/70 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Sparkles className="w-4 h-4 text-teal-500" />
              Quick Action Shortcuts
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Common licensing & tenant workflows
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition group ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 hover:border-teal-500/40 hover:bg-slate-900' 
                  : 'bg-slate-50 border-slate-200 hover:border-teal-400 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs font-bold transition ${isDark ? 'text-white group-hover:text-teal-400' : 'text-slate-900 group-hover:text-teal-700'}`}>
                    Rapid Client Onboarding
                  </p>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Create tenant, shop & license key in 1 step
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transform group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => navigate('/licenses')}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition group ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 hover:border-sky-500/40 hover:bg-slate-900' 
                  : 'bg-slate-50 border-slate-200 hover:border-sky-400 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs font-bold transition ${isDark ? 'text-white group-hover:text-sky-400' : 'text-slate-900 group-hover:text-sky-700'}`}>
                    Issue or Renew License
                  </p>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Generate crypto tokens or reset machine binds
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transform group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => navigate('/payments')}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition group ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900' 
                  : 'bg-slate-50 border-slate-200 hover:border-emerald-400 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs font-bold transition ${isDark ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-700'}`}>
                    Record Client Payment
                  </p>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Log bank deposits & print receipts
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transform group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>

        {/* System Health & Status Matrix */}
        <div className={`lg:col-span-2 rounded-3xl p-6 space-y-4 border ${
          isDark ? 'bg-slate-900/70 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Shield className="w-4 h-4 text-teal-500" />
                Licensing & Engine Telemetry Status
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Real-time breakdown of ecosystem health
              </p>
            </div>
            <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
              isDark ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-teal-50 border-teal-200 text-teal-700'
            }`}>
              Ed25519 Verified
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className={`p-4 rounded-2xl border text-center ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-center gap-1.5 text-teal-500 text-xs font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active & Healthy</span>
              </div>
              <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats?.active_licenses || 0}
              </span>
              <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Operating normal</p>
            </div>

            <div className={`p-4 rounded-2xl border text-center ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-center gap-1.5 text-amber-500 text-xs font-bold mb-1">
                <Clock className="w-4 h-4" />
                <span>Expiring Soon</span>
              </div>
              <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats?.expiring_soon_30d || 0}
              </span>
              <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Within 30 days</p>
            </div>

            <div className={`p-4 rounded-2xl border text-center ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-center gap-1.5 text-rose-500 text-xs font-bold mb-1">
                <Ban className="w-4 h-4" />
                <span>Suspended / Inactive</span>
              </div>
              <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats?.suspended_licenses || 0}
              </span>
              <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Terminals blocked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className={`rounded-3xl p-6 border ${
        isDark ? 'bg-slate-900/70 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent Payment Transactions</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Latest revenue collections across all customer shops</p>
          </div>
          <button
            onClick={() => navigate('/payments')}
            className="text-xs font-bold text-teal-500 hover:underline flex items-center gap-1"
          >
            <span>View Full Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats?.recent_payments?.length === 0 ? (
          <p className={`text-xs text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            No payment records logged yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`uppercase tracking-wider text-[10px] border-b ${
                isDark 
                  ? 'text-slate-400 bg-slate-950/60 border-slate-800' 
                  : 'text-slate-500 bg-slate-50 border-slate-200'
              }`}>
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">ID</th>
                  <th className="px-4 py-3">Amount (LKR)</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference No</th>
                  <th className="px-4 py-3 rounded-r-xl">Date</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
              }`}>
                {stats?.recent_payments?.map((pmt) => (
                  <tr key={pmt.id} className={`transition ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-3 font-mono text-slate-500">#{pmt.id}</td>
                    <td className="px-4 py-3 font-bold font-mono text-teal-500">
                      Rs {Number(pmt.amount_lkr).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${
                        isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {pmt.payment_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{pmt.payment_method}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{pmt.reference_no || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">
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
