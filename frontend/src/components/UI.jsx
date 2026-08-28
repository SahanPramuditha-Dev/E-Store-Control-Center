import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2, AlertCircle, AlertTriangle, CheckCircle2, Info, Sparkles } from 'lucide-react';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Standard Page Header with Eyebrow, Title, Subtitle, and Action Buttons
 */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  badges,
  actions,
  children,
  className = '',
}) {
  return (
    <div className={cn(
      "p-6 sm:p-7 rounded-3xl border transition-all duration-300",
      "bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-indigo-950/30 border-slate-800/80 shadow-xl shadow-black/20",
      "dark:bg-gradient-to-r dark:from-slate-900/90 dark:via-slate-900/80 dark:to-indigo-950/30 dark:border-slate-800/80",
      className
    )}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          {(eyebrow || (badges && (Array.isArray(badges) ? badges.length > 0 : true))) && (
            <div className="flex flex-wrap items-center gap-2">
              {eyebrow && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border bg-indigo-500/10 border-indigo-500/30 text-indigo-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span>{eyebrow}</span>
                </span>
              )}
              {Array.isArray(badges) ? (
                badges.map((b, idx) => {
                  if (React.isValidElement(b)) return React.cloneElement(b, { key: b.key || idx });
                  if (typeof b === 'object' && b !== null && b.label) {
                    const toneVariantMap = {
                      indigo: 'brand',
                      purple: 'purple',
                      emerald: 'success',
                      amber: 'warning',
                      rose: 'danger',
                      sky: 'info',
                    };
                    const variant = toneVariantMap[b.tone] || b.tone || 'brand';
                    return (
                      <Badge key={idx} variant={variant} size="sm">
                        {b.label}
                      </Badge>
                    );
                  }
                  return typeof b === 'string' || typeof b === 'number' ? (
                    <Badge key={idx} variant="brand" size="sm">
                      {b}
                    </Badge>
                  ) : null;
                })
              ) : (
                badges
              )}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Standard Card container
 */
export function Card({ children, className = '', hover = false, glow = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-3xl border transition-all duration-300",
        "bg-slate-900/90 border-slate-800/90 text-slate-100 shadow-lg shadow-black/20",
        hover && "hover:-translate-y-0.5 hover:border-slate-700/80",
        glow && "hover:border-indigo-500/40 hover:shadow-indigo-500/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={cn("p-6 pb-3 border-b border-slate-800/40 flex items-center justify-between gap-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', icon: Icon, ...props }) {
  return (
    <h3 className={cn("text-sm font-bold text-white flex items-center gap-2.5", className)} {...props}>
      {Icon && <Icon className="w-4 h-4 text-indigo-400 shrink-0" />}
      <span>{children}</span>
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={cn("text-xs text-slate-400 leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={cn("p-6 pt-3 border-t border-slate-800/40 flex items-center justify-between gap-4", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Standardized KPI / Stat Metric Card
 */
export function StatCard({
  title,
  value,
  sub,
  badge,
  icon: Icon,
  tone = 'purple', // 'purple' | 'indigo' | 'sky' | 'emerald' | 'amber' | 'rose'
  onClick,
  className = '',
}) {
  const toneMap = {
    purple: {
      text: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/25',
      badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      glow: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
    },
    indigo: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/25',
      badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      glow: 'hover:border-indigo-500/50 hover:shadow-indigo-500/10',
    },
    sky: {
      text: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/25',
      badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
      glow: 'hover:border-sky-500/50 hover:shadow-sky-500/10',
    },
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/25',
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      glow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/25',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      glow: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/25',
      badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      glow: 'hover:border-rose-500/50 hover:shadow-rose-500/10',
    },
  };

  const currentTone = toneMap[tone] || toneMap.purple;

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-5 sm:p-6 rounded-3xl border transition-all duration-300 group",
        "bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20",
        currentTone.glow,
        onClick && "cursor-pointer hover:-translate-y-1",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {badge && (
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg border font-mono", currentTone.badge)}>
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-white">
          {value}
        </span>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-2xl border flex items-center justify-center transition duration-300 group-hover:scale-110 shadow-xs shrink-0", currentTone.bg, currentTone.text)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {sub && (
        <div className="mt-3 pt-3 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">{sub}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Standard Button with variants (purple, outline, secondary, ghost, danger)
 */
export const Button = forwardRef(({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'purple-gradient'
  size = 'md', // 'sm' | 'md' | 'lg' | 'icon'
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none";

  const sizeClasses = {
    sm: "px-3 py-1.5 rounded-xl text-xs gap-1.5",
    md: "px-4 py-2.5 rounded-2xl text-xs gap-2",
    lg: "px-6 py-3 rounded-2xl text-sm gap-2.5",
    icon: "p-2 rounded-xl shrink-0",
  }[size] || "px-4 py-2.5 rounded-2xl text-xs gap-2";

  const variantClasses = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 border border-indigo-500/30 hover:border-indigo-400",
    'purple-gradient': "bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30",
    secondary: "bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white shadow-xs",
    outline: "bg-transparent hover:bg-indigo-500/10 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300",
    ghost: "bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-transparent",
    danger: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 shadow-xs",
    success: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 shadow-xs",
  }[variant] || "bg-indigo-600 hover:bg-indigo-500 text-white";

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(baseClasses, sizeClasses, variantClasses, className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
});

/**
 * Standard Status and Category Badges
 */
export function Badge({
  children,
  variant,
  tone,
  size = 'md',
  dot = false,
  className = '',
  ...props
}) {
  const toneMap = {
    indigo: 'brand',
    purple: 'purple',
    emerald: 'success',
    green: 'success',
    amber: 'warning',
    yellow: 'warning',
    rose: 'danger',
    red: 'danger',
    sky: 'info',
    blue: 'info',
    neutral: 'neutral',
  };

  const resolvedVariant = variant || (tone && toneMap[tone]) || tone || 'brand';

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[9px]",
    md: "px-2.5 py-1 text-[10px]",
    lg: "px-3 py-1.5 text-xs",
  }[size] || "px-2.5 py-1 text-[10px]";

  const variantClasses = {
    brand: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300",
    purple: "bg-purple-500/10 border-purple-500/30 text-purple-300",
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    danger: "bg-rose-500/10 border-rose-500/30 text-rose-400",
    info: "bg-sky-500/10 border-sky-500/30 text-sky-300",
    neutral: "bg-slate-800 border-slate-700 text-slate-300",
  }[resolvedVariant] || "bg-indigo-500/10 border-indigo-500/30 text-indigo-300";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider border font-mono",
        sizeClasses,
        variantClasses,
        className
      )}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {children}
    </span>
  );
}

/**
 * Centralized Input Component
 */
export const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <Icon className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        )}
        <input
          ref={ref}
          className={cn(
            "w-full bg-slate-950/90 border rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-all duration-200",
            Icon && "pl-10",
            error
              ? "border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50"
              : "border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 hover:border-slate-700",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[11px] text-rose-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

/**
 * Attractive Centralized Dropdown / Select Component
 */
export function Select({
  value,
  onChange,
  options = [],
  label,
  placeholder = 'Select option...',
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: LeadingIcon,
  fullWidth = false,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  error,
  disabled = false,
  searchable = false,
  placement = 'bottom', // 'bottom' | 'top'
  name,
  ...props
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const dropdownRef = React.useRef(null);
  const searchInputRef = React.useRef(null);

  // Normalize options array: string[] -> { value, label }[]
  const normalizedOptions = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { value: opt, label: String(opt) };
      }
      return opt;
    });
  }, [options]);

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));
  const SelectedIcon = selectedOption?.icon || LeadingIcon;

  // Filter options by search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q) ||
      (opt.desc && opt.desc.toLowerCase().includes(q)) ||
      String(opt.value).toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery]);

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation & Escape
  React.useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  // Focus search input when opened
  React.useEffect(() => {
    if (isOpen && (searchable || normalizedOptions.length > 8)) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen, searchable, normalizedOptions.length]);

  const handleSelect = (optionValue) => {
    if (onChange) {
      // Support both direct value callback and standard synthetic event
      onChange(optionValue);
      if (props.onBlur) props.onBlur();
    }
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-xl gap-2",
    md: "px-3.5 py-2.5 text-xs font-semibold rounded-2xl gap-2.5",
    lg: "px-4 py-3 text-sm font-semibold rounded-2xl gap-3",
  }[size] || "px-3.5 py-2.5 text-xs font-semibold rounded-2xl gap-2.5";

  const showSearch = searchable || normalizedOptions.length > 8;

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "relative",
        fullWidth ? "w-full" : "inline-block",
        className
      )}
    >
      {label && (
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-slate-950/90 hover:bg-slate-900 border text-left flex items-center justify-between transition-all duration-200 focus:outline-none cursor-pointer group shadow-sm select-none",
          sizeClasses,
          error
            ? "border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40"
            : isOpen
            ? "border-indigo-500/90 ring-2 ring-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.25)] bg-slate-900"
            : "border-slate-800/90 hover:border-slate-700",
          disabled && "opacity-50 cursor-not-allowed",
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {SelectedIcon && (
            <div className={cn(
              "p-1 rounded-lg border shrink-0",
              selectedOption?.bg || "bg-indigo-500/10",
              selectedOption?.border || "border-indigo-500/20",
              selectedOption?.color || "text-indigo-400"
            )}>
              <SelectedIcon className="w-3.5 h-3.5" />
            </div>
          )}
          <span className={cn(
            "truncate font-bold tracking-tight",
            selectedOption ? "text-slate-100" : "text-slate-500 font-normal"
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {selectedOption?.badge && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              {selectedOption.badge}
            </span>
          )}
          <svg
            className={cn(
              "w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform duration-200",
              isOpen ? "rotate-180 text-indigo-400" : ""
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Floating Dropdown Popover */}
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 right-0 z-[120] rounded-2xl p-1.5 shadow-2xl border transition-all animate-in fade-in zoom-in-95 duration-150",
            "bg-slate-900/98 backdrop-blur-2xl border-slate-700/80 shadow-black/80",
            placement === 'top' ? "bottom-full mb-2" : "top-full mt-2",
            menuClassName
          )}
          style={{
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.15), 0 0 25px rgba(99,102,241,0.15)',
            minWidth: '100%',
          }}
        >
          {showSearch && (
            <div className="p-1.5 pb-2 border-b border-slate-800/80 mb-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = String(opt.value) === String(value);

                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-150 cursor-pointer text-left group",
                      isSelected
                        ? "bg-indigo-600/20 border border-indigo-500/50 text-white shadow-sm"
                        : "hover:bg-slate-800/80 hover:text-white text-slate-300 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {IconComponent && (
                        <div className={cn(
                          "p-1.5 rounded-lg border shrink-0 transition-colors",
                          isSelected ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : (opt.bg || "bg-slate-800/60 border-slate-700/50 text-slate-400 group-hover:text-indigo-400")
                        )}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className={cn(
                          "text-xs font-bold truncate leading-tight",
                          isSelected ? "text-indigo-200" : "text-slate-200 group-hover:text-white"
                        )}>
                          {opt.label}
                        </div>
                        {opt.desc && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {opt.desc}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {opt.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-slate-800 text-slate-400">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-[11px] text-rose-400 mt-1">{error}</p>}
    </div>
  );
}

// Aliases
export const CentralSelect = Select;
export const Dropdown = Select;

/**
 * Standard Modal Shell
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  maxWidth = 'max-w-2xl',
  className = '',
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className={cn(
        "w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8",
        maxWidth,
        className
      )}>
        {(title || onClose) && (
          <div className="p-6 pb-4 border-b border-slate-800/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
              )}
              <div>
                {title && <h2 className="text-base font-bold text-white">{title}</h2>}
                {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="p-6 pt-4 border-t border-slate-800/60 flex items-center justify-end gap-3 bg-slate-950/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Standard Tabs System
 */
export function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={cn("flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800/80 rounded-2xl overflow-x-auto", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer",
              isActive
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={cn(
                "px-1.5 py-0.2 rounded-md text-[10px] font-mono",
                isActive ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-400"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Feedback States
 */
export function LoadingState({ message = 'Loading data...', className = '' }) {
  return (
    <div className={cn("p-12 flex flex-col items-center justify-center space-y-4 text-center", className)}>
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 animate-ping absolute inset-0" />
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-400 tracking-wide">
        {message}
      </p>
    </div>
  );
}

export function ErrorState({ error, onRetry, className = '' }) {
  return (
    <div className={cn("p-12 flex flex-col items-center justify-center space-y-4 text-center", className)}>
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white mb-1">Failed to Load Content</h3>
        <p className="text-xs text-slate-400 max-w-md">{error}</p>
      </div>
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry}>
          Retry Connection
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action, icon: Icon, className = '' }) {
  return (
    <div className={cn("p-12 border border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-3", className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-sm font-bold text-white">{title}</h3>
      {description && <p className="text-xs text-slate-400 max-w-sm">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

/**
 * Standardized High-Impact Confirmation Modal
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed with this operation?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
  icon: Icon,
}) {
  if (!isOpen) return null;

  const toneConfig = {
    danger: {
      iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-rose-500/20',
      btnVariant: 'danger',
      DefaultIcon: AlertCircle,
    },
    warning: {
      iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-amber-500/20',
      btnVariant: 'primary',
      DefaultIcon: AlertTriangle,
    },
    primary: {
      iconBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400 shadow-indigo-500/20',
      btnVariant: 'primary',
      DefaultIcon: Sparkles,
    },
  }[tone] || {
    iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
    btnVariant: 'danger',
    DefaultIcon: AlertCircle,
  };

  const RenderIcon = Icon || toneConfig.DefaultIcon;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/80 animate-in zoom-in-95 duration-200 space-y-5">
        <div className="flex items-start gap-4">
          <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg", toneConfig.iconBg)}>
            <RenderIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1 pt-0.5">
            <h3 className="text-base font-bold text-white leading-snug">{title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={toneConfig.btnVariant}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Dropdown Menu / Action Menu for Table Rows
 */
export function DropdownMenu({
  trigger,
  items = [],
  align = 'right', // 'right' | 'left'
  className = '',
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-[110] mt-1.5 w-48 rounded-2xl p-1.5 border shadow-2xl animate-in fade-in zoom-in-95 duration-150",
            "bg-slate-900/98 backdrop-blur-2xl border-slate-700/80 shadow-black/80",
            align === 'right' ? "right-0" : "left-0"
          )}
          style={{
            boxShadow: '0 20px 35px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.15)',
          }}
        >
          <div className="space-y-0.5">
            {items.map((item, idx) => {
              if (item.divider) {
                return <div key={idx} className="my-1 border-t border-slate-800" />;
              }

              const ItemIcon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left cursor-pointer",
                    item.danger
                      ? "text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                      : "text-slate-200 hover:bg-slate-800 hover:text-white",
                    item.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {ItemIcon && <ItemIcon className="w-3.5 h-3.5 shrink-0" />}
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

