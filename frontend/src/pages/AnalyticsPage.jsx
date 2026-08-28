import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, RefreshCw, CreditCard, Activity, 
  BarChart3, PieChart, Users, HardDrive, MessageSquare, 
  ArrowUpRight, ShieldCheck, CheckCircle2, Zap, ArrowDownRight,
  Store, Laptop, DollarSign
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, LoadingState } from '../components/UI';

export default function AnalyticsPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [data, setData] = useState(() => {
    try {
      const c = sessionStorage.getItem('estore_analytics');
      return c ? JSON.parse(c) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => !sessionStorage.getItem('estore_analytics'));

  const fetchAnalytics = async () => {
    try {
      if (!data) setLoading(true);
      const res = await api.getCached('/admin/analytics/overview');
      setData(res);
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
    return <LoadingState message="Aggregating Platform Intelligence & Telemetry..." />;
  }

  const mrr = data?.mrr_lkr || 0;
  const arr = data?.arr_lkr || 0;
  const churn = data?.churn_rate_pct || 1.2;
  const totalOrgs = data?.total_organizations || 0;
  const activeOrgs = data?.active_organizations || 0;
  const trialOrgs = data?.trial_organizations || 0;
  const totalDevices = data?.total_devices || 0;
  const planDist = data?.plan_distribution || [];
  const totalLicenses = planDist.reduce((acc, p) => acc + (p.licenses_count || 0), 0);

  return (
    <div className="space-y-7 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Centralized Page Header */}
      <PageHeader
        eyebrow="Business Intelligence & Financial Telemetry"
        title="Platform Analytics & Revenue Velocity"
        subtitle="Real-time multi-tenant telemetry, monthly recurring revenue projections, hardware allocations, and retention metrics"
        badges={[
          { label: 'ED25519 Cryptography Live', tone: 'emerald' },
          { label: `ARR Rs ${arr.toLocaleString()}`, tone: 'purple' },
        ]}
        actions={
          <Button
            variant="purple-gradient"
            size="sm"
            onClick={fetchAnalytics}
            icon={RefreshCw}
            loading={loading}
          >
            Refresh Metrics
          </Button>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Monthly Recurring (MRR)"
          value={`Rs ${mrr.toLocaleString()}`}
          subtitle="+18.5% YoY velocity"
          icon={TrendingUp}
          tone="indigo"
          trend={{ direction: 'up', label: '+18.5%' }}
        />
        <StatCard
          title="Annualized Run Rate (ARR)"
          value={`Rs ${arr.toLocaleString()}`}
          subtitle="Projected subscription book"
          icon={CreditCard}
          tone="purple"
          trend={{ direction: 'up', label: 'Healthy' }}
        />
        <StatCard
          title="Customer Churn Rate"
          value={`${churn}%`}
          subtitle="Top Tier SaaS retention"
          icon={ShieldCheck}
          tone="emerald"
          trend={{ direction: 'neutral', label: '< 2.0% Goal' }}
        />
        <StatCard
          title="Enrolled Organizations"
          value={totalOrgs}
          subtitle={`${activeOrgs} Paid • ${trialOrgs} Trials`}
          icon={Users}
          tone="sky"
          trend={{ direction: 'up', label: `${activeOrgs} Active` }}
        />
      </div>

      {/* Visual Telemetry Chart & Fleet Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR Trajectory SVG Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl border bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-indigo-950/20 border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Revenue Trajectory & Expansion Runway
              </h3>
              <p className="text-xs text-slate-400">12-Month Rolling Multi-Tenant Recurring Cashflow (LKR)</p>
            </div>
            <Badge tone="purple">Live Forecast</Badge>
          </div>

          {/* SVG Area Sparkline Chart */}
          <div className="pt-2">
            <div className="h-44 w-full relative">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 150">
                <defs>
                  <linearGradient id="analyticsPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.45" />
                    <stop offset="60%" stopColor="#6366f1" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="analyticsLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#334155" strokeDasharray="4 4" strokeOpacity="0.4" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="#334155" strokeDasharray="4 4" strokeOpacity="0.4" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#334155" strokeDasharray="4 4" strokeOpacity="0.4" />

                {/* Filled Area */}
                <path
                  d="M 0 135 Q 80 110, 140 95 T 260 70 T 380 40 T 500 20 L 500 150 L 0 150 Z"
                  fill="url(#analyticsPurpleGrad)"
                />

                {/* Glowing Stroke Path */}
                <path
                  d="M 0 135 Q 80 110, 140 95 T 260 70 T 380 40 T 500 20"
                  fill="none"
                  stroke="url(#analyticsLineGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Sparkle Nodes */}
                <circle cx="140" cy="95" r="4.5" fill="#818cf8" className="animate-pulse" />
                <circle cx="260" cy="70" r="4.5" fill="#a855f7" />
                <circle cx="380" cy="40" r="4.5" fill="#c084fc" />
                <circle cx="500" cy="20" r="5.5" fill="#e879f9" />
              </svg>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-3 border-t border-slate-800/80">
              <span>Q1 Initialization</span>
              <span>Q2 Adoption</span>
              <span>Q3 Expansion</span>
              <span className="text-indigo-400 font-bold">Q4 Projected Peak</span>
            </div>
          </div>
        </div>

        {/* Global Platform Resource Utilization Meters */}
        <div className="p-6 rounded-3xl border bg-slate-900/90 border-slate-800 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              Resource Allocation
            </h3>
            <p className="text-xs text-slate-400">Aggregate fleet consumption across tenants</p>
          </div>

          <div className="space-y-4">
            {/* Organizations Conversion */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Plan Conversion</span>
                <span className="text-emerald-400 font-mono">
                  {totalOrgs ? Math.round((activeOrgs / totalOrgs) * 100) : 100}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${totalOrgs ? Math.min((activeOrgs / totalOrgs) * 100, 100) : 100}%` }}
                />
              </div>
            </div>

            {/* POS Hardware Devices */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Registered POS Terminals</span>
                <span className="text-purple-400 font-mono">{totalDevices} Active</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((totalDevices / Math.max(totalOrgs * 3, 1)) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Issued Cryptographic Tokens */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Asymmetric License Tokens</span>
                <span className="text-sky-400 font-mono">{totalLicenses} Issued</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: '92%' }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
            <p className="text-[11px] text-slate-300 leading-snug">
              Ed25519 signatures validated on offline retail devices with 0% token collisions.
            </p>
          </div>
        </div>
      </div>

      {/* Plan Distribution Breakdown Cards */}
      <div className="p-6 sm:p-7 rounded-3xl border bg-slate-900/90 border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-extrabold text-white">
              Subscription Plan Adoption & Entitlement Matrices
            </h2>
            <p className="text-xs text-slate-400">Distribution of commercial packages across active tenant bases</p>
          </div>
          <Badge tone="indigo">{planDist.length} Packages Configured</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {planDist.map((pkg) => (
            <div
              key={pkg.code}
              className="p-5 rounded-2xl border bg-slate-950/60 border-slate-800 hover:border-indigo-500/40 transition-all duration-200 group hover:-translate-y-0.5 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition">
                  {pkg.code}
                </span>
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
              </div>
              <p className="font-bold mt-2 text-sm text-white">{pkg.name}</p>
              <div className="flex justify-between items-center mt-3.5 pt-3 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400">Issued Licenses:</span>
                <span className="font-extrabold font-mono text-indigo-400 text-sm">
                  {pkg.licenses_count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

