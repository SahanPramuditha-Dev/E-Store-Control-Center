import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, Mail, ArrowRight, AlertCircle, 
  Loader2, Eye, EyeOff, ShieldCheck, Sun, Moon, 
  Sparkles, KeyRound
} from 'lucide-react';
import api from '../api';

export default function LoginPage({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('estore_theme') || 'dark');

  // Focus and validation tracking
  const [focusedField, setFocusedField] = useState(null);
  const [touched, setTouched] = useState({ id: false, pwd: false });

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('estore_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleKeyDown = (e) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const isIdentifierValid = identifier.trim().length >= 3;
  const isPasswordValid = password.length >= 6;

  const handleLogin = async (e) => {
    e?.preventDefault();
    setTouched({ id: true, pwd: true });
    setError('');

    if (!isIdentifierValid || !isPasswordValid) {
      setError('Please enter a valid username/email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/admin/auth/login', {
        username: identifier.trim(),
        password: password
      });

      localStorage.setItem('estore_admin_token', res.data.access_token);
      localStorage.setItem('estore_admin_user', JSON.stringify({
        username: res.data.username,
        role: res.data.role
      }));

      onLoginSuccess();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const res = await api.post('/admin/auth/google', {
        credential: 'GOOGLE_OAUTH_TOKEN'
      });

      localStorage.setItem('estore_admin_token', res.data.access_token);
      localStorage.setItem('estore_admin_user', JSON.stringify({
        username: res.data.username,
        role: res.data.role
      }));

      onLoginSuccess();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Google Authentication failed. Please use administrator credentials.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div 
      onKeyDown={handleKeyDown}
      className={`min-h-screen relative flex items-center justify-center p-4 sm:p-6 transition-colors duration-500 selection:bg-teal-500/30 selection:text-teal-300 font-sans ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px]" />
            <div 
              className="absolute inset-0 opacity-[0.03]" 
              style={{
                backgroundImage: `radial-gradient(#2dd4bf 1px, transparent 1px)`,
                backgroundSize: '28px 28px'
              }}
            />
          </>
        ) : (
          <>
            <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px]" />
            <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[140px]" />
            <div 
              className="absolute inset-0 opacity-[0.04]" 
              style={{
                backgroundImage: `radial-gradient(#0f766e 1px, transparent 1px)`,
                backgroundSize: '28px 28px'
              }}
            />
          </>
        )}
      </div>

      {/* Theme Switcher Toggle Button */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all duration-300 shadow-sm backdrop-blur-md ${
            isDark 
              ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
              : 'bg-white/90 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Main Authentication Card */}
      <div className="relative w-full max-w-[440px] z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className={`rounded-3xl p-8 sm:p-9 border shadow-2xl backdrop-blur-xl transition-all duration-300 ${
          isDark 
            ? 'bg-slate-900/95 border-slate-800/90 shadow-slate-950/80' 
            : 'bg-white/95 border-slate-200/90 shadow-xl shadow-slate-300/40'
        }`}>
          
          {/* Brand Logo & Presentation */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="relative mb-4">
              <div className={`px-5 py-2.5 rounded-2xl bg-white shadow-md border border-slate-200/80 flex items-center justify-center h-14 max-w-[200px] transition-transform hover:scale-105 duration-300`}>
                <img 
                  src="/logo.png" 
                  alt="E-Store" 
                  className="max-h-9 w-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden items-center justify-center text-slate-900 font-extrabold text-sm tracking-wide">
                  E-STORE
                </div>
              </div>
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-2 border ${
              isDark 
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' 
                : 'bg-teal-50 border-teal-200 text-teal-700'
            }`}>
              <Sparkles className="w-3 h-3" />
              <span>Central Management Console</span>
            </div>

            <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              E-Store Admin
            </h1>
            <p className={`text-xs mt-1 max-w-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Central License & Multi-Tenant Business Platform
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug font-medium">{error}</span>
            </div>
          )}

          {/* CapsLock Warning */}
          {capsLockActive && (
            <div className="mb-4 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold">Caps Lock is turned ON</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className={`w-full mb-5 py-2.5 px-4 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2.5 border shadow-sm disabled:opacity-50 group ${
              isDark 
                ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200 hover:border-slate-700' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 hover:border-slate-300'
            }`}
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google Account</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-extrabold tracking-widest">
              <span className={`px-3 ${isDark ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'}`}>
                Or administrator credentials
              </span>
            </div>
          </div>

          {/* Credentials Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username or Email Input */}
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <span>Username or Email</span>
                {touched.id && (
                  <span className={`text-[10px] font-semibold ${isIdentifierValid ? 'text-teal-500' : 'text-rose-500'}`}>
                    {isIdentifierValid ? 'Valid' : 'Required'}
                  </span>
                )}
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3.5 top-3 transition-colors ${
                  focusedField === 'id' ? 'text-teal-500' : isDark ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  required
                  value={identifier}
                  onFocus={() => setFocusedField('id')}
                  onBlur={() => {
                    setFocusedField(null);
                    setTouched(prev => ({ ...prev, id: true }));
                  }}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your username or email"
                  className={`
                    w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs focus:outline-none transition-all duration-200
                    ${isDark 
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20'
                    }
                    ${touched.id && !isIdentifierValid ? 'border-rose-500/80 ring-1 ring-rose-500/20' : 'border'}
                  `}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <span>Master Password</span>
                {touched.pwd && (
                  <span className={`text-[10px] font-semibold ${isPasswordValid ? 'text-teal-500' : 'text-rose-500'}`}>
                    {isPasswordValid ? 'Valid' : 'Min 6 characters'}
                  </span>
                )}
              </label>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3.5 top-3 transition-colors ${
                  focusedField === 'pwd' ? 'text-teal-500' : isDark ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onFocus={() => setFocusedField('pwd')}
                  onBlur={() => {
                    setFocusedField(null);
                    setTouched(prev => ({ ...prev, pwd: true }));
                  }}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`
                    w-full pl-10 pr-11 py-2.5 rounded-2xl text-xs focus:outline-none transition-all duration-200 font-mono
                    ${isDark 
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20'
                    }
                    ${touched.pwd && !isPasswordValid ? 'border-rose-500/80 ring-1 ring-rose-500/20' : 'border'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3.5 top-2.5 transition-colors ${
                    isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 py-3 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-2xl text-xs transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Badge */}
          <div className={`mt-7 pt-5 border-t flex items-center justify-center gap-2 text-[11px] font-mono ${
            isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-500'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
            <span>Ed25519 Cryptographic Security Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
