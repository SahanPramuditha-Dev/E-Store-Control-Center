import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Base Shimmer Skeleton Element
 */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-slate-800/60 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-slate-700/30 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

/**
 * KPI / Metric Stat Card Skeleton
 */
export function StatCardSkeleton({ count = 4, className = '' }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 sm:p-6 rounded-3xl border border-slate-800/80 bg-slate-900/60 shadow-lg shadow-black/10 space-y-4"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-lg" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
          </div>
          <div className="pt-2 border-t border-slate-800/40">
            <Skeleton className="h-3 w-36 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Data Table Skeleton
 */
export function TableSkeleton({ rows = 6, cols = 5, className = '' }) {
  return (
    <div className={cn("rounded-3xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-lg shadow-black/10", className)}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-800/60 flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-3 w-64 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-800/40 p-2 sm:p-4 space-y-2 sm:space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/30 gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <Skeleton className="w-9 h-9 rounded-2xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32 rounded-md" />
                <Skeleton className="h-2.5 w-20 rounded-md" />
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-7 w-16 rounded-xl" />
              <Skeleton className="h-7 w-7 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Complete Dashboard Loading Skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-800/80 bg-slate-900/60 shadow-xl shadow-black/20 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-8 w-72 rounded-lg" />
          <Skeleton className="h-3.5 w-96 rounded-md" />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Skeleton className="h-10 w-36 rounded-2xl" />
          <Skeleton className="h-10 w-32 rounded-2xl" />
        </div>
      </div>

      {/* 4 Stat Cards */}
      <StatCardSkeleton count={4} />

      {/* Main Grid: Chart & Expiring Licenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl border border-slate-800/80 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48 rounded-md" />
            <Skeleton className="h-8 w-36 rounded-2xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>

        <div className="p-6 rounded-3xl border border-slate-800/80 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-2xl bg-slate-950/40 flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                  <Skeleton className="h-2.5 w-16 rounded-md" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
