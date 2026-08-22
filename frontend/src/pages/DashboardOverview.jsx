import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, Key, Laptop, AlertTriangle, 
  ArrowUpRight, CreditCard, RefreshCw, Shield, Sparkles, 
  Plus, CheckCircle2, Clock, Ban, ArrowRight, TrendingUp, Activity,
  Server, Cpu, Wifi, FileCheck, Layers, Users
} from 'lucide-react';
import api from '../api';
import { useTheme } from '../components/ThemeContext';
import { formatDate } from '../utils/dateUtils';
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
      <div className="p-16 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 animate-ping absolute inset-0" />
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        </div>
        <p className={`text-xs font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Initializing Platform Telemetry & Cryptographic Engine...
        </p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Outlets',
      value: stats?.total_shops || 0,
      sub: `${stats?.total_tenants || 0} Organizations Enrolled`,
      badge: '+12% MoM',
      icon: Store,
      color: 'text-teal-400',
      bg: isDark ? 'bg-teal-500/10 border-teal-500/25' : 'bg-teal-50 border-teal-200',
      glow: 'hover:border-teal-500/50 hover:shadow-teal-500/10',
      link: '/shops',
      sparkline: 'M0 25 Q 15 15, 30 20 T 60 10 T 90 15 T 120 5'
    },
    {
      title: 'Active Licenses',
      value: stats?.active_licenses || 0,
      sub: `${stats?.total_licenses || 0} Total Tokens Issued`,
      badge: 'Ed25519 Signed',
      icon: Key,
      color: 'text-sky-400',
      bg: isDark ? 'bg-sky-500/10 border-sky-500/25' : 'bg-sky-50 border-sky-200',
      glow: 'hover:border-sky-500/50 hover:shadow-sky-500/10',
      link: '/licenses',
      sparkline: 'M0 22 Q 20 28, 40 18 T 80 12 T 120 4'
    },
    {
      title: 'Authorized Devices',
      value: stats?.active_machines || 0,
      sub: 'Terminals Hardware-Bound',
      badge: 'SHA-256 Verified',
      icon: Laptop,
      color: 'text-indigo-400',
      bg: isDark ? 'bg-indigo-500/10 border-indigo-500/25' : 'bg-indigo-50 border-indigo-200',
      glow: 'hover:border-indigo-500/50 hover:shadow-indigo-500/10',
      link: '/machines',
      sparkline: 'M0 20 Q 30 10, 60 22 T 90 8 T 120 2'
    },
    {
      title: 'Platform Billing',
      value: `Rs ${(stats?.total_revenue_lkr || 0).toLocaleString()}`,
      sub: 'Lifetime Revenue Invoiced',
      badge: 'Audited Ledger',
      icon: CreditCard,
      color: 'text-emerald-400',
      bg: isDark ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200',
      glow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      link: '/payments',
      sparkline: 'M0 24 Q 25 18, 50 14 T 85 8 T 120 3'
    },
  ];

  return (
    <div className="space-y-7 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Executive Command Header */}
      <div className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/40 border-slate-800/90 shadow-xl shadow-black/20' 
          : 'bg-gradient-to-r from-white via-white to-teal-50/70 border-slate-200/90 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                isDark ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-teal-50 border-teal-200 text-teal-700'
              }`}>
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span>Executive Command Center</span>
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                <Cpu className="w-3 h-3 text-teal-500" />
                <span>Ed25519 Core Active</span>
              </span>
            </div>

            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Platform Overview & SaaS Control
            </h1>
            <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Real-time multi-tenant telemetry, cryptographic license verification, machine fleet monitoring, and financial ledgers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchStats}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all duration-200 active:scale-95 ${
                isDark 
                  ? 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
                  : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-xs'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Telemetry</span>
            </button>

            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-slate-950 rounded-2xl text-xs font-extrabold transition-all duration-200 shadow-lg shadow-teal-500/25 active:scale-95 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Rapid Onboarding</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expiry Alert Warning Banner if Applicable */}
      {stats?.expiring_soon_30d > 0 && (
        <div className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between text-xs font-medium shadow-sm transition-all ${
          isDark 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
            <span>
              <strong>{stats.expiring_soon_30d} license(s)</strong> expire within 30 days. Send automated renewal notices to prevent POS interruption.
            </span>
          </div>
          <button
            onClick={() => navigate('/licenses')}
            className="font-bold underline hover:opacity-80 flex items-center gap-1 shrink-0 ml-2"
          >
            <span>Review Expiring</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(card.link)}
              className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 cursor-pointer group hover:-translate-y-1 ${
                isDark 
                  ? `bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20 ${card.glow}` 
                  : `bg-white border-slate-200/90 shadow-sm hover:shadow-md ${card.glow}`
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {card.title}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border font-mono ${
                  isDark ? 'bg-slate-950 border-slate-800 text-teal-400' : 'bg-slate-50 border-slate-200 text-teal-700'
                }`}>
                  {card.badge}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {card.value}
                </span>
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${card.bg} ${card.color} group-hover:scale-110 transition duration-300 shadow-xs shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/40 flex items-center justify-between text-[11px]">
                <span className={`truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.sub}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-400 group-hover:translate-x-1 transition duration-200 shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Grid: Operations & System Health Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Workflows Column */}
        <div className={`rounded-3xl p-6 sm:p-7 space-y-4 border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Sparkles className="w-4 h-4 text-teal-500" />
              Administrative Workflows
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">1-Click</span>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 group hover:-translate-y-0.5 ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 hover:border-teal-500/50 hover:bg-slate-900' 
                  : 'bg-slate-50/80 border-slate-200 hover:border-teal-500 hover:bg-white shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs font-bold transition-colors ${isDark ? 'text-white group-hover:text-teal-400' : 'text-slate-900 group-hover:text-teal-700'}`}>
                    Rapid Client Onboard
                  </p>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Create tenant, shop & issue token
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transform group-hover:translate-x-1 transition duration-200" />
            </button>

            <button
              onClick={() => navigate('/licenses')}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 group hover:-translate-y-0.5 ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 hover:border-sky-500/50 hover:bg-slate-900' 
                  : 'bg-slate-50/80 border-slate-200 hover:border-sky-500 hover:bg-white shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs font-bold transition-colors ${isDark ? 'text-white group-hover:text-sky-400' : 'text-slate-900 group-hover:text-sky-700'}`}>
                    Issue / Renew License
                  </p>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Generate crypto tokens or reset machine binds
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transform group-hover:translate-x-1 transition duration-200" />
            </button>

            <button
              onClick={() => navigate('/payments')}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 group hover:-translate-y-0.5 ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900' 
                  : 'bg-slate-50/80 border-slate-200 hover:border-emerald-500 hover:bg-white shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs font-bold transition-colors ${isDark ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-700'}`}>
                    Record Client Payment
                  </p>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Log bank deposits & print receipts
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transform group-hover:translate-x-1 transition duration-200" />
            </button>
          </div>
        </div>

        {/* System Health & Status Matrix Column */}
        <div className={`lg:col-span-2 rounded-3xl p-6 sm:p-7 space-y-4 border transition-all ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Shield className="w-4 h-4 text-teal-500" />
                Licensing & Engine Telemetry Status
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Real-time breakdown of ecosystem cryptographic health
              </p>
            </div>
            <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-xl border shadow-xs ${
              isDark ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-teal-50 border-teal-200 text-teal-700'
            }`}>
              Ed25519 Verified
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3.5 pt-2">
            <div className={`p-4 sm:p-5 rounded-2xl border text-center transition-all ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/90 border-slate-200 shadow-2xs'
            }`}>
              <div className="flex items-center justify-center gap-1.5 text-teal-500 text-xs font-bold mb-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active & Healthy</span>
              </div>
              <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats?.active_licenses || 0}
              </span>
              <p className={`text-[10px] mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Operating normal</p>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border text-center transition-all ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/90 border-slate-200 shadow-2xs'
            }`}>
              <div className="flex items-center justify-center gap-1.5 text-amber-500 text-xs font-bold mb-1.5">
                <Clock className="w-4 h-4" />
                <span>Expiring Soon</span>
              </div>
              <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                {stats?.expiring_soon_30d || 0}
              </span>
              <p className={`text-[10px] mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Within 30 days</p>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border text-center transition-all ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/90 border-slate-200 shadow-2xs'
            }`}>
              <div className="flex items-center justify-center gap-1.5 text-rose-500 text-xs font-bold mb-1.5">
                <Ban className="w-4 h-4" />
                <span>Suspended / Inactive</span>
              </div>
              <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                {stats?.suspended_licenses || 0}
              </span>
              <p className={`text-[10px] mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Terminals blocked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments & Ledger Stream */}
      <div className={`p-6 sm:p-8 rounded-3xl border space-y-4 shadow-sm ${
        isDark ? 'bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Recent Payment Transactions
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Latest revenue collections across all customer shops
            </p>
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
          <div className={`overflow-x-auto rounded-2xl border ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <table className="w-full text-left text-xs">
              <thead className={`uppercase tracking-wider text-[10px] font-bold border-b ${
                isDark 
                  ? 'text-slate-400 bg-slate-950/60 border-slate-800' 
                  : 'text-slate-600 bg-slate-50 border-slate-200'
              }`}>
                <tr>
                  <th className="px-4 py-3.5">ID</th>
                  <th className="px-4 py-3.5">Amount (LKR)</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5">Reference No</th>
                  <th className="px-4 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
              }`}>
                {stats?.recent_payments?.map((pmt) => (
                  <tr key={pmt.id} className={`transition ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-4 py-3 font-mono text-slate-400">#{pmt.id}</td>
                    <td className="px-4 py-3 font-bold font-mono text-teal-500">
                      Rs {Number(pmt.amount_lkr).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        isDark ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {pmt.payment_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{pmt.payment_method}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{pmt.reference_no || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {formatDate(pmt.created_at)}
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
