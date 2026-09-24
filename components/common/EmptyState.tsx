'use client';

import { PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-gray-100 p-3 dark:bg-slate-800">
          {icon || (
            <PackageSearch className="h-8 w-8 text-gray-400 dark:text-slate-400 dark:text-slate-500" />
          )}
        </div>

        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
          {title}
        </h3>

        {description && (
          <p className="mb-6 max-w-sm text-gray-600 dark:text-slate-400">
            {description}
          </p>
        )}

        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className="bg-brand-primary hover:bg-brand-primary-dark"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
