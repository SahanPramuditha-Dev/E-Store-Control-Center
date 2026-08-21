import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Store, Key, Laptop, CreditCard, 
  ShieldCheck, LogOut, Package, History, Search, Plus, 
  Wifi, User
} from 'lucide-react';
import CommandPalette from './CommandPalette';
import OnboardingModal from './OnboardingModal';

export default function Layout({ onLogout }) {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const userStr = localStorage.getItem('estore_admin_user');
  const user = userStr ? JSON.parse(userStr) : { username: 'admin', role: 'SUPER_ADMIN' };

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

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/shops', label: 'Tenants & Shops', icon: Store },
    { to: '/licenses', label: 'Licenses', icon: Key },
    { to: '/packages', label: 'Packages & Tiers', icon: Package },
    { to: '/machines', label: 'Device Telemetry', icon: Laptop },
    { to: '/payments', label: 'Billing & Ledger', icon: CreditCard },
    { to: '/audit-logs', label: 'Security & Audit', icon: History },
  ];

  const handleLogout = () => {
    localStorage.removeItem('estore_admin_token');
    localStorage.removeItem('estore_admin_user');
    onLogout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400/20 to-teal-600/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-500/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-tight">E-Store Admin</h1>
            <span className="text-[11px] text-teal-400 font-medium">License & SaaS Console</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3.5 space-y-1.5 flex-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-lg shadow-teal-500/20 translate-x-0.5' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Launch & User Card */}
        <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/40">
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            <span>Onboard Client</span>
          </button>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user.username}</p>
                <span className="text-[10px] text-teal-400 uppercase font-mono font-medium">{user.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          {/* Global Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition max-w-md w-full"
          >
            <Search className="w-4 h-4 text-teal-400" />
            <span className="flex-1 text-left">Search tenants, shops, licenses, machines...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">Ctrl+K</kbd>
          </button>

          {/* Header Action Buttons & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>Engine Active</span>
            </div>

            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition shadow-md shadow-teal-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Rapid Onboard</span>
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Rapid Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={() => {
          // Trigger refresh if needed
          window.location.reload();
        }}
      />
    </div>
  );
}
