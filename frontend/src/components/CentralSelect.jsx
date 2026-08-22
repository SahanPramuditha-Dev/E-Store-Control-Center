import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Modern Glassmorphic Centralized Dropdown Menu
 * 
 * Props:
 * - value: Current selected value
 * - onChange: Callback when value changes (passes value)
 * - options: Array of { value, label, desc?, icon?, color?, bg?, border? }
 * - label?: Field label
 * - placeholder?: Placeholder text
 * - size?: 'sm' | 'md' | 'lg' (default 'md')
 * - className?: Additional container styling
 * - fullWidth?: boolean (default true)
 * - error?: Error string
 */
export default function CentralSelect({
  value,
  onChange,
  options = [],
  label,
  placeholder = 'Select an option...',
  size = 'md',
  className = '',
  fullWidth = true,
  error,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);
  const SelectedIcon = selectedOption?.icon;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-3.5 py-2.5 text-sm rounded-xl',
    lg: 'px-4 py-3 text-base rounded-2xl',
  }[size] || 'px-3.5 py-2.5 text-sm rounded-xl';

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'inline-block'} ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-xs text-slate-400 font-medium block mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-950/80 hover:bg-slate-900 border ${
          error 
            ? 'border-rose-500/80 focus:border-rose-500' 
            : isOpen 
            ? 'border-teal-500/80 shadow-[0_0_15px_rgba(20,184,166,0.15)]' 
            : 'border-slate-800 hover:border-slate-700'
        } ${sizeClasses} text-white flex items-center justify-between transition-all duration-200 focus:outline-none cursor-pointer group shadow-sm`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {SelectedIcon && (
            <div className={`p-1 rounded-md border shrink-0 ${selectedOption.bg || 'bg-teal-500/10'} ${selectedOption.border || 'border-teal-500/20'} ${selectedOption.color || 'text-teal-400'}`}>
              <SelectedIcon size={size === 'sm' ? 13 : 15} />
            </div>
          )}
          <span className={`font-medium truncate ${selectedOption ? 'text-slate-100' : 'text-slate-500'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown 
          size={16} 
          className={`text-slate-400 group-hover:text-slate-300 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-teal-400' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl z-50 divide-y divide-slate-800/60 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {options.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-500">No options available</div>
          ) : (
            options.map((opt) => {
              const IconComponent = opt.icon;
              const isSelected = opt.value === value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-150 cursor-pointer text-left ${
                    isSelected
                      ? 'bg-teal-500/15 border border-teal-500/30 text-white shadow-sm'
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {IconComponent && (
                      <div className={`p-2 rounded-xl border shrink-0 ${opt.bg || 'bg-slate-800/50'} ${opt.border || 'border-slate-700/50'} ${opt.color || 'text-slate-300'}`}>
                        <IconComponent size={16} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate text-slate-100">{opt.label}</div>
                      {opt.desc && <div className="text-[10px] text-slate-400 truncate mt-0.5">{opt.desc}</div>}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="p-1 rounded-full bg-teal-500/20 text-teal-400 shrink-0 ml-2">
                      <Check size={12} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-rose-400 mt-1">{error}</p>}
    </div>
  );
}
