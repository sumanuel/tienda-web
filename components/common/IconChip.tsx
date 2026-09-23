import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type IconChipTone = 'accent' | 'info' | 'warning' | 'danger' | 'neutral';

export const iconChipToneStyles: Record<
  IconChipTone,
  { bg: string; icon: string }
> = {
  accent: {
    bg: 'bg-tsuma-primary-light',
    icon: 'text-tsuma-primary',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-950',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-950',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-950',
    icon: 'text-red-600 dark:text-red-400',
  },
  neutral: {
    bg: 'bg-gray-100 dark:bg-slate-800',
    icon: 'text-tsuma-primary-dark',
  },
};

interface IconChipProps {
  icon: LucideIcon;
  tone?: IconChipTone;
  className?: string;
  iconClassName?: string;
}

export function IconChip({
  icon: Icon,
  tone = 'neutral',
  className,
  iconClassName,
}: IconChipProps) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-xl',
        iconChipToneStyles[tone].bg,
        className
      )}
    >
      <Icon className={cn('h-5 w-5', iconChipToneStyles[tone].icon, iconClassName)} />
    </div>
  );
}
