import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Store, Key, Laptop, CreditCard, 
  ShieldCheck, LogOut, Package, History 
} from 'lucide-react';

export default function Layout({ onLogout }) {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('estore_admin_user');
  const user = userStr ? JSON.parse(userStr) : { username: 'Admin', role: 'SUPER_ADMIN' };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/shops', label: 'Tenants & Shops', icon: Store },
    { to: '/licenses', label: 'Licenses', icon: Key },
    { to: '/packages', label: 'Packages', icon: Package },
    { to: '/machines', label: 'Machines', icon: Laptop },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/audit-logs', label: 'Audit Logs', icon: History },
  ];

  const handleLogout = () => {
    localStorage.removeItem('estore_admin_token');
    localStorage.removeItem('estore_admin_user');
    onLogout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white leading-tight">E-Store Control Center</h1>
            <span className="text-[11px] text-teal-400 font-medium">SaaS Platform Console</span>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition
                  ${isActive 
                    ? 'bg-teal-500 text-slate-950 font-semibold shadow-md shadow-teal-500/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user.username}</p>
              <span className="text-[10px] text-teal-400 uppercase font-mono">{user.role}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
