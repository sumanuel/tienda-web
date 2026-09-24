'use client';

import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { DualCurrency } from '@/components/common/DualCurrency';
import type { CartItem as CartItemType } from '@/hooks/useCart';

interface CartItemProps {
  item: CartItemType;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
}

export function CartItem({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemProps) {
  return (
    <div className="group flex gap-3 border-b py-3 last:border-b-0">
      {/* Información del producto */}
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium">{item.productName}</h4>
        {item.sku && (
          <p className="text-xs text-gray-500 dark:text-slate-400">
            SKU: {item.sku}
          </p>
        )}
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          {formatCurrency(item.localPrice, 'VES')} × {item.quantity}
        </p>
      </div>

      {/* Controles de cantidad */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-slate-800">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => onDecrement(item.productId)}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>

          <span className="min-w-[2rem] text-center text-sm font-medium">
            {item.quantity}
          </span>

          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => onIncrement(item.productId)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* Subtotal y botón eliminar */}
        <div className="flex min-w-[110px] items-center justify-end gap-2">
          <DualCurrency
            ves={item.subtotalLocal}
            usd={item.subtotalReference}
            size="sm"
            primaryClassName="font-semibold"
          />

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-red-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
            onClick={() => onRemove(item.productId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
