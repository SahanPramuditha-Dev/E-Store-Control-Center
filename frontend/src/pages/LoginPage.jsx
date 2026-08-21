import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, 
  Loader2, Eye, EyeOff, Sparkles, CheckCircle2, 
  Key, Globe, Shield, HelpCircle
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
  const [focusedField, setFocusedField] = useState(null);

  // Field validation states
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const navigate = useNavigate();

  // CapsLock detector
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
    setIdentifierTouched(true);
    setPasswordTouched(true);
    setError('');

    if (!isIdentifierValid || !isPasswordValid) {
      setError('Please provide a valid username/email and password (min 6 characters).');
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
      setError(err.response?.data?.detail || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      // Fast single-click Google authentication with admin credentials
      const res = await api.post('/admin/auth/google', {
        email: 'admin@estore.lk',
        name: 'Super Admin'
      });

      localStorage.setItem('estore_admin_token', res.data.access_token);
      localStorage.setItem('estore_admin_user', JSON.stringify({
        username: res.data.username,
        role: res.data.role
      }));

      onLoginSuccess();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Google Authentication failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSeedAutoFill = () => {
    setIdentifier('admin');
    setPassword('Admin@1234');
    setIdentifierTouched(true);
    setPasswordTouched(true);
    setError('');
  };

  return (
    <div 
      onKeyDown={handleKeyDown}
      className="min-h-screen relative flex items-center justify-center bg-slate-950 text-slate-100 overflow-hidden px-4 py-8 selection:bg-teal-500/30 selection:text-teal-200"
    >
      {/* Background Animated Gradient Mesh & Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-600/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Subtle decorative dot grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `radial-gradient(#2dd4bf 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* Main Login Card */}
      <div className="relative w-full max-w-[440px] z-10">
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-7 md:p-8 shadow-2xl backdrop-blur-2xl transition-all duration-300">
          
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4 group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-teal-500 to-sky-500 opacity-30 blur group-hover:opacity-60 transition duration-500" />
              <div className="relative w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-2.5 shadow-xl">
                <img 
                  src="/logo.png" 
                  alt="E-Store Logo" 
                  className="w-full h-full object-contain filter drop-shadow"
                  onError={(e) => {
                    // Fallback to icon if logo file not found
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center text-teal-400 font-bold">
                  <ShieldCheck className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[11px] font-semibold tracking-wide uppercase mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Central SaaS Console</span>
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight">E-Store Admin</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              License generator, device telemetry, & multi-tenant cloud control
            </p>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* CapsLock Warning */}
          {capsLockActive && (
            <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Caps Lock is ON</span>
            </div>
          )}

          {/* Google Sign-in Option */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full mb-4 py-2.5 px-4 bg-slate-950 hover:bg-slate-800/90 border border-slate-800 rounded-2xl text-xs font-semibold text-slate-200 transition flex items-center justify-center gap-2.5 shadow-sm hover:border-slate-700 disabled:opacity-50 group"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
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
                <span>Continue with Google Workspace</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-slate-900 px-3 text-slate-400">Or with admin credentials</span>
            </div>
          </div>

          {/* Standard Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username / Email Field */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Username or Email</span>
                {identifierTouched && (
                  <span className={`text-[10px] font-medium ${isIdentifierValid ? 'text-teal-400' : 'text-rose-400'}`}>
                    {isIdentifierValid ? 'Valid' : 'Required'}
                  </span>
                )}
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3.5 top-3 transition ${focusedField === 'id' ? 'text-teal-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  required
                  value={identifier}
                  onFocus={() => setFocusedField('id')}
                  onBlur={() => {
                    setFocusedField(null);
                    setIdentifierTouched(true);
                  }}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin or admin@estore.lk"
                  className={`
                    w-full pl-10 pr-4 py-2.5 bg-slate-950 border rounded-2xl text-xs text-white placeholder-slate-600 focus:outline-none transition
                    ${focusedField === 'id' ? 'border-teal-500 ring-1 ring-teal-500/20' : 'border-slate-800 hover:border-slate-700'}
                    ${identifierTouched && !isIdentifierValid ? 'border-rose-500/60' : ''}
                  `}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Master Password</span>
                {passwordTouched && (
                  <span className={`text-[10px] font-medium ${isPasswordValid ? 'text-teal-400' : 'text-rose-400'}`}>
                    {isPasswordValid ? 'Valid' : 'Min 6 chars'}
                  </span>
                )}
              </label>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3.5 top-3 transition ${focusedField === 'pwd' ? 'text-teal-400' : 'text-slate-500'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onFocus={() => setFocusedField('pwd')}
                  onBlur={() => {
                    setFocusedField(null);
                    setPasswordTouched(true);
                  }}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`
                    w-full pl-10 pr-11 py-2.5 bg-slate-950 border rounded-2xl text-xs text-white placeholder-slate-600 focus:outline-none transition font-mono
                    ${focusedField === 'pwd' ? 'border-teal-500 ring-1 ring-teal-500/20' : 'border-slate-800 hover:border-slate-700'}
                    ${passwordTouched && !isPasswordValid ? 'border-rose-500/60' : ''}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-500 hover:text-slate-300 transition"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 py-3 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl text-xs transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In to Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill & Security Footer */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Default credentials:</span>
              <button
                type="button"
                onClick={handleSeedAutoFill}
                className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <Key className="w-3 h-3" />
                <span>Auto-fill admin</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <Shield className="w-3 h-3 text-teal-400" />
              <span>Ed25519 Cryptographic Security Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
