'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
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
  trend,
  badge,
  action,
  className,
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <div
        className={cn('rounded-2xl border bg-white p-6 shadow-sm', className)}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-8 w-32 rounded bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-md',
        'active:scale-[0.98]',
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
          {title}
        </p>
        <div className="flex items-center gap-2">
          {badge && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                badge.variant === 'success' &&
                  'bg-tsuma-primary-light text-tsuma-primary-dark',
                badge.variant === 'warning' && 'bg-amber-100 text-amber-800',
                badge.variant === 'info' && 'bg-blue-100 text-blue-800'
              )}
            >
              {badge.label}
            </span>
          )}
          <Icon
            className={cn(
              'h-5 w-5 transition-colors',
              badge?.variant === 'success'
                ? 'text-tsuma-primary'
                : 'text-gray-400'
            )}
          />
        </div>
      </div>

      {/* Value */}
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        {trend && (
          <span
            className={cn(
              'flex items-center text-sm font-medium',
              trend.isPositive ? 'text-tsuma-primary' : 'text-red-500'
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}

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
