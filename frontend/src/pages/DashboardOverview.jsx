import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, Key, Laptop, AlertTriangle, 
  ArrowUpRight, CreditCard, RefreshCw, Shield, Sparkles, 
  Plus, CheckCircle2, Clock, Ban, ArrowRight, TrendingUp, Activity,
  Server, Cpu, Wifi, FileCheck, Layers, Users, ExternalLink,
  Smartphone, ShoppingBag, Shirt, Tv, Sparkles as SparklesIcon, Tag,
  History, CheckCircle, HelpCircle
} from 'lucide-react';
import api from '../api';
import { useTheme } from '../components/ThemeContext';
import { formatDate } from '../utils/dateUtils';
import OnboardingModal from '../components/OnboardingModal';

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [timelineRange, setTimelineRange] = useState('30D');
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'devices'
  const [hoveredPoint, setHoveredPoint] = useState(null);
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

  const handleExportLedgerCSV = () => {
    if (!stats?.recent_payments || stats.recent_payments.length === 0) {
      return;
    }
    const headers = ['Receipt ID', 'Organization', 'Amount (LKR)', 'Type', 'Method', 'Reference No', 'Date'];
    const rows = stats.recent_payments.map(p => [
      p.id,
      `"${p.tenant_name || 'Direct'}"`,
      p.amount_lkr,
      p.payment_type,
      p.payment_method,
      p.reference_no || 'N/A',
      p.created_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `estore_financial_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Format growth badge dynamically
  const formatGrowth = (pct) => {
    if (pct === undefined || pct === null) return 'Active Sync';
    if (pct > 0) return `+${pct}% MoM`;
    if (pct < 0) return `${pct}% MoM`;
    return 'Stable';
  };

  const statCards = [
    {
      title: 'Active Outlets',
      value: stats?.total_shops || 0,
      sub: `${stats?.total_tenants || 0} Organizations Enrolled`,
      badge: formatGrowth(stats?.growth_metrics?.tenants_mom_pct),
      icon: Store,
      color: 'text-teal-400',
      bg: isDark ? 'bg-teal-500/10 border-teal-500/25' : 'bg-teal-50 border-teal-200',
      glow: 'hover:border-teal-500/50 hover:shadow-teal-500/10',
      link: '/shops',
    },
    {
      title: 'Active Licenses',
      value: stats?.active_licenses || 0,
      sub: `${stats?.total_licenses || 0} Total Tokens Issued`,
      badge: stats?.growth_metrics?.licenses_mom_pct ? formatGrowth(stats?.growth_metrics?.licenses_mom_pct) : 'Ed25519 Signed',
      icon: Key,
      color: 'text-sky-400',
      bg: isDark ? 'bg-sky-500/10 border-sky-500/25' : 'bg-sky-50 border-sky-200',
      glow: 'hover:border-sky-500/50 hover:shadow-sky-500/10',
      link: '/licenses',
    },
    {
      title: 'Authorized Devices',
      value: stats?.active_machines || 0,
      sub: 'Terminals Hardware-Bound',
      badge: formatGrowth(stats?.growth_metrics?.devices_mom_pct),
      icon: Laptop,
      color: 'text-indigo-400',
      bg: isDark ? 'bg-indigo-500/10 border-indigo-500/25' : 'bg-indigo-50 border-indigo-200',
      glow: 'hover:border-indigo-500/50 hover:shadow-indigo-500/10',
      link: '/machines',
    },
    {
      title: 'Platform Billing',
      value: `Rs ${(stats?.total_revenue_lkr || 0).toLocaleString()}`,
      sub: 'Lifetime Revenue Invoiced',
      badge: formatGrowth(stats?.growth_metrics?.revenue_mom_pct),
      icon: CreditCard,
      color: 'text-emerald-400',
      bg: isDark ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200',
      glow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      link: '/payments',
    },
  ];

  // Dynamic Chart calculations based on backend timeline data
  const currentSeries = stats?.timeline_series?.[timelineRange] || [];
  const maxMetricVal = Math.max(...currentSeries.map(d => chartMetric === 'revenue' ? d.revenue : d.devices), 1);

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 20;

  const points = currentSeries.map((d, index) => {
    const x = currentSeries.length > 1 
      ? paddingX + (index / (currentSeries.length - 1)) * (svgWidth - paddingX * 2) 
      : svgWidth / 2;
    const val = chartMetric === 'revenue' ? d.revenue : d.devices;
    const y = svgHeight - paddingY - (val / maxMetricVal) * (svgHeight - paddingY * 2);
    return { x, y, data: d, val };
  });

  // Generate SVG Path
  const generatePathD = (pts) => {
    if (pts.length === 0) return `M 0 ${svgHeight} L ${svgWidth} ${svgHeight}`;
    if (pts.length === 1) return `M 0 ${pts[0].y} L ${svgWidth} ${pts[0].y}`;
    
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      path += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = generatePathD(points);
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`
    : `M 0 ${svgHeight} L ${svgWidth} ${svgHeight} Z`;

  // Industry icons mapping
  const getIndustryIcon = (code) => {
    switch (code) {
      case 'MOBILE_RETAIL': return Smartphone;
      case 'GROCERY': return ShoppingBag;
      case 'FASHION': return Shirt;
      case 'ELECTRONICS': return Tv;
      case 'COSMETICS': return SparklesIcon;
      default: return Tag;
    }
  };

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
              
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                <Cpu className="w-3 h-3 text-teal-500" />
                <span>{stats?.system_health?.crypto_engine || 'Ed25519 Active'}</span>
              </span>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                isDark ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-100 border-slate-200 text-emerald-700'
              }`}>
                <Wifi className="w-3 h-3 text-emerald-500" />
                <span>Cluster {stats?.system_health?.status || 'Online'}</span>
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
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-slate-950 rounded-2xl text-xs font-extrabold transition-all duration-200 shadow-lg shadow-teal-500/25 active:scale-95 hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Rapid Onboarding</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expiry Alert Warning Banner if Applicable */}
      {stats?.expiring_soon_30d > 0 && (
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-medium shadow-sm transition-all ${
          isDark 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
            <span>
              <strong>{stats.expiring_soon_30d} license(s)</strong> expire within 30 days. Send automated renewal notices or issue renewals to prevent POS lockouts.
            </span>
          </div>
          <button
            onClick={() => navigate('/licenses')}
            className="font-bold underline hover:opacity-80 flex items-center gap-1 shrink-0 cursor-pointer text-amber-400"
          >
            <span>Review Expiring Licenses</span>
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

      {/* Operations & System Health Matrix */}
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
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 group hover:-translate-y-0.5 cursor-pointer ${
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
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 group hover:-translate-y-0.5 cursor-pointer ${
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
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 group hover:-translate-y-0.5 cursor-pointer ${
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
        <div className={`rounded-3xl p-6 sm:p-7 space-y-4 border transition-all ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Shield className="w-4 h-4 text-teal-500" />
                Cryptographic Telemetry
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ecosystem licensing breakdown
              </p>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl border shadow-xs ${
              isDark ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-teal-50 border-teal-200 text-teal-700'
            }`}>
              Ed25519
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <div 
              onClick={() => navigate('/licenses')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer hover:border-teal-500/40 ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/90 border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-teal-500 text-[11px] font-bold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active</span>
              </div>
              <span className={`text-xl sm:text-2xl font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats?.active_licenses || 0}
              </span>
              <p className={`text-[9px] mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Healthy</p>
            </div>

            <div 
              onClick={() => navigate('/licenses')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer hover:border-amber-500/40 ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/90 border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-amber-500 text-[11px] font-bold mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Expiring</span>
              </div>
              <span className={`text-xl sm:text-2xl font-extrabold font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                {stats?.expiring_soon_30d || 0}
              </span>
              <p className={`text-[9px] mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>&lt; 30 Days</p>
            </div>

            <div 
              onClick={() => navigate('/licenses')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer hover:border-rose-500/40 ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/90 border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-rose-500 text-[11px] font-bold mb-1">
                <Ban className="w-3.5 h-3.5" />
                <span>Blocked</span>
              </div>
              <span className={`text-xl sm:text-2xl font-extrabold font-mono ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                {stats?.suspended_licenses || 0}
              </span>
              <p className={`text-[9px] mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Inactive</p>
            </div>
          </div>
        </div>

        {/* Industry Verticals Distribution */}
        <div className={`rounded-3xl p-6 sm:p-7 space-y-4 border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Layers className="w-4 h-4 text-teal-500" />
              Industry Vertical Mix
            </h2>
            <button 
              onClick={() => navigate('/industry-templates')}
              className="text-[10px] text-teal-400 hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
            >
              <span>Catalog</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
            {!stats?.industry_breakdown || stats.industry_breakdown.length === 0 ? (
              <p className={`text-xs text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No vertical data logged yet.
              </p>
            ) : (
              stats.industry_breakdown.map((ind) => {
                const IconComp = getIndustryIcon(ind.code);
                return (
                  <div key={ind.code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
                        <IconComp className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="truncate">{ind.label}</span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 shrink-0">
                        {ind.count} ({ind.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(ind.percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Platform Telemetry & Growth Chart */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-5 transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-[11px] font-bold text-teal-500 uppercase tracking-wider font-mono">Live Telemetry Analytics</span>
            </div>
            <h2 className={`text-base font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <TrendingUp className="w-4 h-4 text-teal-500" />
              Platform Telemetry & Growth Trajectory
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {chartMetric === 'revenue' ? 'Real revenue invoiced across customer shops' : 'Active concurrent hardware terminals connected'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Switcher */}
            <div className={`p-1 rounded-xl border flex gap-1 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  chartMetric === 'revenue'
                    ? 'bg-teal-500 text-slate-950 shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Revenue (LKR)
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('devices')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  chartMetric === 'devices'
                    ? 'bg-teal-500 text-slate-950 shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Devices
              </button>
            </div>

            {/* Timeframe filters */}
            <div className={`p-1 rounded-xl border flex gap-1 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              {['7D', '30D', '90D', '1Y'].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => { setTimelineRange(range); setHoveredPoint(null); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    timelineRange === range
                      ? 'bg-teal-500 text-slate-950 shadow-xs'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleExportLedgerCSV}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-teal-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Dynamic Interactive SVG Chart */}
        <div className={`h-56 w-full rounded-2xl border p-4 flex flex-col justify-between relative overflow-hidden ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/90 border-slate-200'
        }`}>
          {/* Tooltip Overlay */}
          {hoveredPoint && (
            <div 
              className="absolute top-4 left-6 z-10 p-2.5 rounded-xl bg-slate-900/95 border border-teal-500/40 text-xs shadow-xl animate-in fade-in duration-100"
            >
              <div className="text-slate-400 font-mono text-[10px]">{hoveredPoint.data.full_date}</div>
              <div className="font-bold text-teal-300 font-mono text-sm mt-0.5">
                {chartMetric === 'revenue' 
                  ? `Rs ${hoveredPoint.val.toLocaleString()}` 
                  : `${hoveredPoint.val} Connected Device(s)`}
              </div>
            </div>
          )}

          <svg className="w-full h-40" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="dynamicRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Background Grid */}
            <line x1="0" y1="30" x2={svgWidth} y2="30" stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeDasharray="4" />
            <line x1="0" y1="75" x2={svgWidth} y2="75" stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeDasharray="4" />
            <line x1="0" y1="120" x2={svgWidth} y2="120" stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeDasharray="4" />

            {/* Gradient Area */}
            <path d={areaPath} fill="url(#dynamicRevenueGrad)" />

            {/* Trend Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#14b8a6"
              strokeWidth="3"
            />

            {/* Data Dots with Hover Interactions */}
            {points.map((pt, idx) => (
              <g key={idx}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  className="fill-teal-400 stroke-slate-950 stroke-2 hover:r-7 transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(pt)}
                />
              </g>
            ))}
          </svg>

          {/* Dynamic Timeline Labels */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800/40">
            {currentSeries.map((d, i) => (
              <span key={i} className="truncate px-1">{d.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Payments & Live Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Payments Ledger (2 Cols wide) */}
        <div className={`lg:col-span-2 p-6 sm:p-7 rounded-3xl border space-y-4 shadow-sm ${
          isDark ? 'bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <CreditCard className="w-4 h-4 text-emerald-500" />
                Recent Payment Transactions
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Latest financial receipts across all customer shops
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/payments')}
                className="text-xs font-bold text-teal-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Ledger</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!stats?.recent_payments || stats.recent_payments.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center space-y-3 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <CreditCard className="w-8 h-8 text-slate-500 mx-auto" />
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                No payment transactions recorded yet.
              </p>
              <button
                onClick={() => navigate('/payments')}
                className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition cursor-pointer"
              >
                Record Payment
              </button>
            </div>
          ) : (
            <div className={`overflow-x-auto rounded-2xl border ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
              <table className="w-full text-left text-xs">
                <thead className={`uppercase tracking-wider text-[10px] font-bold border-b ${
                  isDark 
                    ? 'text-slate-400 bg-slate-950/60 border-slate-800' 
                    : 'text-slate-600 bg-slate-50 border-slate-200'
                }`}>
                  <tr>
                    <th className="px-4 py-3.5">Receipt</th>
                    <th className="px-4 py-3.5">Organization</th>
                    <th className="px-4 py-3.5">Amount (LKR)</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Method</th>
                    <th className="px-4 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
                }`}>
                  {stats?.recent_payments?.map((pmt) => (
                    <tr key={pmt.id} className={`transition ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}`}>
                      <td className="px-4 py-3 font-mono text-slate-400">#{pmt.id}</td>
                      <td className="px-4 py-3 font-semibold text-white truncate max-w-[140px]">
                        {pmt.tenant_name || 'Direct Client'}
                      </td>
                      <td className="px-4 py-3 font-bold font-mono text-teal-400">
                        Rs {Number(pmt.amount_lkr).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isDark ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {pmt.payment_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-400">{pmt.payment_method}</td>
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

        {/* Right Column: Live Audit & Activity Stream */}
        <div className={`p-6 sm:p-7 rounded-3xl border space-y-4 shadow-sm ${
          isDark ? 'bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Activity className="w-4 h-4 text-teal-500" />
              Live Audit Stream
            </h2>
            <button
              onClick={() => navigate('/audit-logs')}
              className="text-[11px] font-bold text-teal-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Logs</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
            {!stats?.recent_activity || stats.recent_activity.length === 0 ? (
              <p className={`text-xs text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No recent activity logged.
              </p>
            ) : (
              stats.recent_activity.map((act) => (
                <div 
                  key={act.id} 
                  className={`p-3 rounded-2xl border text-xs space-y-1 transition ${
                    isDark ? 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-400 font-mono text-[11px] truncate">
                      {act.action}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {act.created_at ? formatDate(act.created_at) : 'Just now'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="truncate">Actor: <span className="text-white font-medium">{act.actor}</span></span>
                    {act.record_hash && (
                      <span className="font-mono text-[9px] text-slate-500 truncate" title="SHA-256 Chain Hash">
                        {act.record_hash}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
