import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface DualCurrencyProps {
  /** Monto en VES (moneda principal). Si se omite, se deriva de usd * exchangeRate. */
  ves?: number;
  /** Monto en USD (moneda de referencia). Si se omite, se deriva de ves / exchangeRate. */
  usd?: number;
  /** Tasa de cambio USD → VES, usada para derivar el monto faltante. */
  exchangeRate?: number;
  /** Tamaño del texto principal */
  size?: 'sm' | 'md' | 'lg';
  /** Alineación del bloque */
  align?: 'left' | 'right';
  className?: string;
  primaryClassName?: string;
}

const sizeClasses: Record<NonNullable<DualCurrencyProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
};

export function DualCurrency({
  ves,
  usd,
  exchangeRate,
  size = 'md',
  align = 'right',
  className,
  primaryClassName,
}: DualCurrencyProps) {
  const resolvedVes =
    ves ?? (usd !== undefined && exchangeRate ? usd * exchangeRate : 0);
  const resolvedUsd =
    usd ?? (ves !== undefined && exchangeRate ? ves / exchangeRate : 0);

  return (
    <div
      className={cn(
        'flex flex-col',
        align === 'right' ? 'items-end' : 'items-start',
        className
      )}
    >
      <span
        className={cn(
          'font-mono font-semibold text-gray-900 tabular-nums dark:text-slate-100',
          sizeClasses[size],
          primaryClassName
        )}
      >
        {formatCurrency(resolvedVes, 'VES')}
      </span>
      <span className="font-mono text-xs text-gray-500 tabular-nums dark:text-slate-400">
        ≈ {formatCurrency(resolvedUsd, 'USD')}
      </span>
    </div>
  );
}
