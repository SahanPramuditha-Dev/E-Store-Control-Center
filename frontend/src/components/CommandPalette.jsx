import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Store, Key, Laptop, Building2, ArrowRight, X, Loader2 } from 'lucide-react';
import api from '../api';

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tenants: [], shops: [], licenses: [], machines: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ tenants: [], shops: [], licenses: [], machines: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ tenants: [], shops: [], licenses: [], machines: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    (results.tenants?.length || 0) +
    (results.shops?.length || 0) +
    (results.licenses?.length || 0) +
    (results.machines?.length || 0);

  const handleSelect = (link) => {
    onClose();
    navigate(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/40">
          <Search className="w-5 h-5 text-teal-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Quick search tenants, shops, license keys, or machines (ESC to close)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-teal-400 animate-spin shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {!query && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Type anything to search across all tenants, branch outlets, issued licenses, and registered POS hardware.
            </div>
          )}

          {query && totalResults === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-sm">
              No results found for <span className="text-white font-medium">"{query}"</span>
            </div>
          )}

          {/* Tenants Section */}
          {results.tenants?.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Tenants ({results.tenants.length})</span>
              </div>
              <div className="space-y-1">
                {results.tenants.map((item) => (
                  <button
                    key={`tenant-${item.id}`}
                    onClick={() => handleSelect(item.link)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-800/80 transition group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-teal-300 transition">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400">{item.subtitle}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transform group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Shops Section */}
          {results.shops?.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-sky-400" />
                <span>Branch Shops ({results.shops.length})</span>
              </div>
              <div className="space-y-1">
                {results.shops.map((item) => (
                  <button
                    key={`shop-${item.id}`}
                    onClick={() => handleSelect(item.link)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-800/80 transition group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-sky-300 transition">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400">{item.subtitle}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transform group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Licenses Section */}
          {results.licenses?.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Licenses ({results.licenses.length})</span>
              </div>
              <div className="space-y-1">
                {results.licenses.map((item) => (
                  <button
                    key={`lic-${item.id}`}
                    onClick={() => handleSelect(item.link)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-800/80 transition group font-mono"
                  >
                    <div>
                      <p className="text-sm font-semibold text-teal-300 group-hover:text-teal-200 transition">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400 font-sans">{item.subtitle}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transform group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Machines Section */}
          {results.machines?.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-purple-400" />
                <span>Registered Machines ({results.machines.length})</span>
              </div>
              <div className="space-y-1">
                {results.machines.map((item) => (
                  <button
                    key={`machine-${item.id}`}
                    onClick={() => handleSelect(item.link)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-800/80 transition group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">{item.subtitle}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transform group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">ESC</kbd> to close
          </div>
          <span className="text-[11px] text-teal-400">E-Store Control Center Global Search</span>
        </div>
      </div>
    </div>
  );
}
