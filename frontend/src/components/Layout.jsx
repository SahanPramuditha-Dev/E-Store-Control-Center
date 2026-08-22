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
import SessionTimeoutModal from './SessionTimeoutModal';
import { useSessionSecurity } from '../hooks/useSessionSecurity';

export default function Layout({ onLogout }) {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Initialize Enterprise Session Security & Inactivity Timeout
  const {
    isWarningOpen,
    secondsRemaining,
    stayLoggedIn,
    logoutNow
  } = useSessionSecurity(onLogout);

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
    <div className={`h-screen w-screen overflow-hidden flex font-sans selection:bg-teal-500/30 selection:text-teal-400 transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Sidebar: Fixed, Pinned & Independently Scrollable */}
      <aside className={`w-64 md:w-72 h-full flex flex-col shrink-0 border-r z-20 transition-colors duration-300 ${
        isDark 
          ? 'border-slate-800/80 bg-slate-900/95 backdrop-blur-xl' 
          : 'border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-sm'
      }`}>
        {/* Brand Header */}
        <div className={`p-4 sm:p-5 flex items-center gap-3 border-b shrink-0 ${
          isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="px-2.5 py-1 rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center h-10 w-16 shrink-0 transition-transform hover:scale-105 duration-200">
            <img 
              src="/logo.png" 
              alt="E-Store Logo" 
              className="max-h-7 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden text-teal-600 font-extrabold text-[10px]">E-STORE</div>
          </div>
          <div className="truncate">
            <h1 className={`font-extrabold text-xs sm:text-sm tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              E-Store Control
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-[10px] text-teal-500 font-bold uppercase tracking-wider">25 Modules Active</span>
            </div>
          </div>
        </div>

        {/* Navigation Sections with smooth independent scrollbar */}
        <nav className="p-3.5 space-y-4 flex-1 overflow-y-auto overflow-x-hidden">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className={`px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest ${
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
                      flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group
                      ${isActive 
                        ? isDark
                          ? 'bg-teal-500/15 text-teal-300 font-bold border border-teal-500/40 shadow-sm shadow-teal-500/10'
                          : 'bg-teal-50 text-teal-800 font-bold border border-teal-200/80 shadow-xs' 
                        : isDark
                          ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'}
                    `}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isDark ? 'text-slate-400 group-hover:text-teal-400' : 'text-slate-500 group-hover:text-teal-600'
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 shrink-0" />
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Account & Quick Onboard Footer */}
        <div className={`p-3.5 border-t shrink-0 space-y-2.5 ${
          isDark ? 'border-slate-800/80 bg-slate-950/50' : 'border-slate-100 bg-slate-50/70'
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

          <div className={`flex items-center justify-between p-2.5 rounded-2xl border ${
            isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex items-center gap-2.5 truncate">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                isDark ? 'bg-slate-800 text-teal-400 border border-slate-700' : 'bg-teal-50 text-teal-700 border border-teal-200'
              }`}>
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.username}</p>
                <span className="text-[9px] text-teal-500 uppercase font-mono font-semibold">{user.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout Session"
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition active:scale-95 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Top Header */}
        <header className={`h-16 border-b px-6 flex items-center justify-between shrink-0 sticky top-0 z-10 transition-colors duration-300 ${
          isDark 
            ? 'border-slate-800/80 bg-slate-900/70 backdrop-blur-xl' 
            : 'border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-2xs'
        }`}>
          {/* Global Command Search Bar */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl border text-xs transition max-w-md w-full ${
              isDark 
                ? 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Search className="w-4 h-4 text-teal-500 shrink-0" />
            <span className="flex-1 text-left truncate">Search organizations, licenses, devices, tickets...</span>
            <kbd className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] shrink-0 ${
              isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
            }`}>Ctrl+K</kbd>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
              className={`p-2 rounded-2xl border transition-all duration-200 active:scale-95 ${
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
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold transition shadow-md shadow-teal-500/20 active:scale-95 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Rapid Onboard</span>
            </button>
          </div>
        </header>

        {/* Independently Scrollable Page Body */}
        <main className={`flex-1 overflow-y-auto p-6 md:p-8 transition-colors duration-300 ${
          isDark ? 'bg-slate-950' : 'bg-slate-50/70'
        }`}>
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Command Palette, Onboarding Modal & Session Security Modal */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={() => window.location.reload()}
      />
      <SessionTimeoutModal
        isOpen={isWarningOpen}
        secondsRemaining={secondsRemaining}
        onStayLoggedIn={stayLoggedIn}
        onLogoutNow={logoutNow}
      />
    </div>
  );
}
