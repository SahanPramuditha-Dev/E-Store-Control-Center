import React from 'react';
import { ShieldAlert, Clock, LogOut, RefreshCw } from 'lucide-react';
import { useTheme } from './ThemeContext';

export default function SessionTimeoutModal({ isOpen, secondsRemaining, onStayLoggedIn, onLogoutNow }) {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const percentage = Math.max(0, Math.min(100, (secondsRemaining / 60) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Animated Security Icon */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-60" />
          <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${
            isDark ? 'bg-slate-950 border-amber-500/40 text-amber-400' : 'bg-amber-50 border-amber-300 text-amber-600'
          }`}>
            <ShieldAlert className="w-8 h-8" />
          </div>
        </div>

        {/* Heading & Explanation */}
        <div className="space-y-1.5">
          <h3 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Session Inactivity Warning
          </h3>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            For security reasons, your administrative session will automatically terminate due to inactivity.
          </p>
        </div>

        {/* Countdown Gauge */}
        <div className={`p-4 rounded-2xl border space-y-2.5 ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Auto-Logout In:</span>
            </span>
            <span className="text-amber-500 text-sm font-extrabold">
              {secondsRemaining}s
            </span>
          </div>

          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div
              className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onLogoutNow}
            className={`flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-bold border transition active:scale-95 ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700'
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Now</span>
          </button>

          <button
            type="button"
            onClick={onStayLoggedIn}
            className="flex items-center justify-center gap-2 p-3 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold rounded-2xl transition shadow-lg shadow-teal-500/25 active:scale-95 hover:-translate-y-0.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Stay Logged In</span>
          </button>
        </div>
      </div>
    </div>
  );
}
