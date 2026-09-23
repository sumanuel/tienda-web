import { cn } from '@/lib/utils';

export type StatusPillTone = 'ok' | 'warn' | 'crit' | 'info' | 'mute';

const toneStyles: Record<StatusPillTone, string> = {
  ok: 'text-tsuma-primary-dark bg-tsuma-primary-light border-tsuma-primary/30',
  warn: 'text-amber-700 bg-amber-50 border-amber-300 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800',
  crit: 'text-red-700 bg-red-50 border-red-300 dark:text-red-400 dark:bg-red-950 dark:border-red-800',
  info: 'text-blue-700 bg-blue-50 border-blue-300 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800',
  mute: 'text-gray-500 bg-gray-100 border-gray-300 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700',
};

interface StatusPillProps {
  tone?: StatusPillTone;
  children: React.ReactNode;
  className?: string;
}

export function StatusPill({
  tone = 'mute',
  children,
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[0.65rem] font-semibold tracking-wide uppercase',
        toneStyles[tone],
        className
      )}
    >
      <span className="h-1.5 w-1.5 flex-none rounded-full bg-current" />
      {children}
    </span>
  );
}
