import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Store, Key, Laptop, CreditCard, 
  ShieldCheck, LogOut, Package, History, Search, Plus, 
  User, Sun, Moon, Activity, Sliders, LifeBuoy, Megaphone, 
  PackageCheck, Server, Settings, ChevronRight, Sparkles, Layers 
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import CommandPalette from './CommandPalette';
import OnboardingModal from './OnboardingModal';

export default function Layout({ onLogout }) {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const userStr = localStorage.getItem('estore_admin_user');
  const user = userStr ? JSON.parse(userStr) : { username: 'Sahan', role: 'SUPER_ADMIN' };

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navSections = [
    {
      title: 'Platform Overview',
      items: [
        { to: '/', label: 'Executive Dashboard', icon: LayoutDashboard },
        { to: '/activity', label: 'Activity Center', icon: Activity },
      ]
    },
    {
      title: 'Tenants & Monetization',
      items: [
        { to: '/organizations', label: 'Organizations', icon: Building2 },
        { to: '/shops', label: 'Store Outlets', icon: Store },
        { to: '/subscriptions', label: 'Subscriptions & Plans', icon: Package },
        { to: '/payments', label: 'Billing & Ledger', icon: CreditCard },
      ]
    },
    {
      title: 'Licensing & Hardware',
      items: [
        { to: '/licenses', label: 'Licenses & Tokens', icon: Key },
        { to: '/machines', label: 'Device Telemetry', icon: Laptop },
      ]
    },
    {
      title: 'Product & Rollout',
      items: [
        { to: '/industry-templates', label: 'Industry Templates', icon: Layers },
        { to: '/feature-flags', label: 'Feature Flags', icon: Sliders },
        { to: '/releases', label: 'POS Releases & OTA', icon: PackageCheck },
      ]
    },
    {
      title: 'Intelligence & Support',
      items: [
        { to: '/analytics', label: 'Analytics & BI', icon: Sparkles },
        { to: '/support', label: 'Support Desk', icon: LifeBuoy },
        { to: '/announcements', label: 'Announcements', icon: Megaphone },
      ]
    },
    {
      title: 'Operations & Security',
      items: [
        { to: '/monitoring', label: 'System Health & Jobs', icon: Server },
        { to: '/audit-logs', label: 'Security & Audit Logs', icon: History },
        { to: '/settings', label: 'Settings & Tools', icon: Settings },
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('estore_admin_token');
    localStorage.removeItem('estore_admin_user');
    onLogout();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen flex font-sans selection:bg-teal-500/30 selection:text-teal-400 transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Sidebar */}
      <aside className={`w-64 border-r flex flex-col shrink-0 transition-colors duration-300 ${
        isDark 
          ? 'border-slate-800/80 bg-slate-900/80 backdrop-blur-xl' 
          : 'border-slate-200 bg-white shadow-sm'
      }`}>
        {/* Brand Header */}
        <div className={`p-4 flex items-center gap-3 border-b ${
          isDark ? 'border-slate-800/80' : 'border-slate-100'
        }`}>
          <div className="px-2.5 py-1 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center h-9 w-14">
            <img 
              src="/logo.png" 
              alt="E-Store Logo" 
              className="max-h-6 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden text-teal-600 font-extrabold text-[10px]">E-STORE</div>
          </div>
          <div>
            <h1 className={`font-extrabold text-xs tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              E-Store Control Panel
            </h1>
            <span className="text-[10px] text-teal-500 font-bold">25-Module SaaS Platform</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="p-3 space-y-4 flex-1 overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className={`px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => `
                      flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200
                      ${isActive 
                        ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20 translate-x-0.5' 
                        : isDark
                          ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
                    `}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Account & Quick Onboard */}
        <div className={`p-3 border-t space-y-2 ${
          isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm border ${
              isDark
                ? 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/30 text-teal-300'
                : 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard Client</span>
          </button>

          <div className={`flex items-center justify-between p-2 rounded-xl border ${
            isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 truncate">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                <User className="w-3 h-3" />
              </div>
              <div className="truncate">
                <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.username}</p>
                <span className="text-[9px] text-teal-500 uppercase font-mono font-semibold">{user.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className={`h-16 border-b px-6 flex items-center justify-between shrink-0 transition-colors duration-300 ${
          isDark 
            ? 'border-slate-800/80 bg-slate-900/50 backdrop-blur-md' 
            : 'border-slate-200 bg-white/80 backdrop-blur-md shadow-xs'
        }`}>
          {/* Global Search Bar */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl border text-xs transition max-w-md w-full ${
              isDark 
                ? 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Search className="w-4 h-4 text-teal-500" />
            <span className="flex-1 text-left">Search organizations, licenses, devices, tickets...</span>
            <kbd className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
              isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
            }`}>Ctrl+K</kbd>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
              className={`p-2 rounded-xl border transition-all duration-200 ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
              isDark 
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' 
                : 'bg-teal-50 border-teal-200 text-teal-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>SaaS Live</span>
            </div>

            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition shadow-md shadow-teal-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Rapid Onboard</span>
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className={`flex-1 overflow-y-auto p-6 md:p-8 transition-colors duration-300 ${
          isDark ? 'bg-slate-950' : 'bg-slate-50'
        }`}>
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette & Onboarding Modal */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
