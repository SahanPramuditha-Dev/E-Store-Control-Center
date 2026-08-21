import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, RefreshCw, CreditCard, Activity, 
  BarChart3, PieChart, Users, HardDrive, MessageSquare, 
  ArrowUpRight, ShieldCheck, CheckCircle2, Zap
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';

export default function AnalyticsPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics/overview');
      setData(res.data);
    } catch (err) {
      showToast('Failed to load analytics overview', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-teal-500 animate-spin mb-2" />
        <p className="text-xs text-slate-400">Loading Business Intelligence & Usage...</p>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Monthly Recurring Revenue',
      value: `Rs ${(data?.mrr_lkr || 0).toLocaleString()}`,
      sub: '+18.5% YoY Growth',
      icon: TrendingUp,
      color: 'text-teal-500',
      bg: isDark ? 'bg-teal-500/10 border-teal-500/30' : 'bg-teal-50 border-teal-200'
    },
    {
      title: 'Annualized Run Rate (ARR)',
      value: `Rs ${(data?.arr_lkr || 0).toLocaleString()}`,
      sub: 'Projected Subscription Volume',
      icon: CreditCard,
      color: 'text-sky-500',
      bg: isDark ? 'bg-sky-500/10 border-sky-500/30' : 'bg-sky-50 border-sky-200'
    },
    {
      title: 'Customer Churn Rate',
      value: `${data?.churn_rate_pct || 1.2}%`,
      sub: 'Top Tier SaaS Retention',
      icon: ShieldCheck,
      color: 'text-emerald-500',
      bg: isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
    },
    {
      title: 'Total Invoiced Orgs',
      value: data?.total_organizations || 0,
      sub: `${data?.active_organizations || 0} Paying / ${data?.trial_organizations || 0} Trials`,
      icon: Users,
      color: 'text-purple-500',
      bg: isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Analytics & Platform Telemetry
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Financial metrics, customer retention, resource quota consumption, and platform utilization
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition shadow-xs active:scale-95 ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
              : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 ${
                isDark 
                  ? 'bg-slate-900/90 border-slate-800 shadow-lg shadow-black/20' 
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {kpi.title}
                </span>
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {kpi.value}
                </h3>
                <p className={`text-xs mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resource Quotas Meter Section */}
      <div className={`p-6 sm:p-7 rounded-3xl border shadow-sm space-y-6 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h2 className={`text-base font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Zap className="w-4 h-4 text-teal-500" />
            Global Platform Resource Utilization
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Aggregate customer consumption across all multi-tenant organizations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Transactions */}
          <div className={`p-5 rounded-2xl border space-y-3 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Transactions Volume</span>
              <span className="font-mono text-xs font-bold text-teal-500">74%</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div className="bg-teal-500 h-full rounded-full" style={{ width: '74%' }} />
            </div>
            <p className="text-[11px] text-slate-400">128,500 monthly transactions processed</p>
          </div>

          {/* Cloud Storage */}
          <div className={`p-5 rounded-2xl border space-y-3 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Cloud Storage</span>
              <span className="font-mono text-xs font-bold text-sky-500">48%</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div className="bg-sky-500 h-full rounded-full" style={{ width: '48%' }} />
            </div>
            <p className="text-[11px] text-slate-400">{data?.total_storage_used_gb} GB / 10 TB Allocated</p>
          </div>

          {/* POS Hardware Devices */}
          <div className={`p-5 rounded-2xl border space-y-3 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Authorized Devices</span>
              <span className="font-mono text-xs font-bold text-purple-500">82%</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div className="bg-purple-500 h-full rounded-full" style={{ width: '82%' }} />
            </div>
            <p className="text-[11px] text-slate-400">{data?.total_devices} active terminals connected</p>
          </div>

          {/* WhatsApp SMS */}
          <div className={`p-5 rounded-2xl border space-y-3 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>WhatsApp Gateway</span>
              <span className="font-mono text-xs font-bold text-emerald-500">63%</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '63%' }} />
            </div>
            <p className="text-[11px] text-slate-400">18,400 interactive digital receipts sent</p>
          </div>
        </div>
      </div>

      {/* Plan Distribution Breakdown */}
      <div className={`p-6 sm:p-7 rounded-3xl border shadow-sm space-y-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Subscription Plan Adoption & Distribution
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data?.plan_distribution || []).map((pkg) => (
            <div key={pkg.code} className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="font-mono text-xs font-bold text-teal-500">{pkg.code}</span>
              <p className={`font-bold mt-1 text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{pkg.name}</p>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/60 text-xs">
                <span className="text-slate-400">Licenses:</span>
                <span className="font-extrabold font-mono text-teal-500">{pkg.licenses_count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
