'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconChip, type IconChipTone } from '@/components/common/IconChip';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  tone?: IconChipTone;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  badge?: {
    label: string;
    variant: 'success' | 'warning' | 'info';
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'neutral',
  trend,
  badge,
  action,
  className,
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900',
          className
        )}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-800" />
          <div className="h-8 w-32 rounded bg-gray-200 dark:bg-slate-800" />
          <div className="h-3 w-20 rounded bg-gray-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 dark:border-slate-800 dark:bg-slate-900',
        'hover:scale-[1.02] hover:shadow-md',
        'active:scale-[0.98]',
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-slate-400">
          {title}
        </p>
        <div className="flex items-center gap-2">
          {badge && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                badge.variant === 'success' &&
                  'bg-tsuma-primary-light text-tsuma-primary-dark',
                badge.variant === 'warning' &&
                  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400',
                badge.variant === 'info' &&
                  'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400'
              )}
            >
              {badge.label}
            </span>
          )}
          <IconChip icon={Icon} tone={tone} />
        </div>
      </div>

      {/* Value */}
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
          {value}
        </h3>
        {trend && (
          <span
            className={cn(
              'flex items-center text-sm font-medium',
              trend.isPositive
                ? 'text-tsuma-primary'
                : 'text-red-500 dark:text-red-400'
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-slate-400">{subtitle}</p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="text-tsuma-primary hover:text-tsuma-primary-dark mt-4 text-sm font-medium transition-colors"
        >
          {action.label} →
        </button>
      )}

      {/* Decorative gradient */}
      <div className="bg-tsuma-primary pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-10" />
    </div>
  );
}
