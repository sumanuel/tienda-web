'use client';

import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatCurrency, type Currency } from '@/lib/currency';
import type { CartItem as CartItemType } from '@/hooks/useCart';

interface CartItemProps {
  item: CartItemType;
  currency: Currency;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
}

export function CartItem({
  item,
  currency,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemProps) {
  const displayPrice =
    currency === 'VES'
      ? item.localPrice
      : currency === 'USD'
        ? item.referencePrice
        : item.price;

  const displaySubtotal =
    currency === 'VES'
      ? item.subtotalLocal
      : currency === 'USD'
        ? item.subtotalReference
        : item.subtotal;

  return (
    <div className="group flex gap-3 border-b py-3 last:border-b-0">
      {/* Información del producto */}
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium">{item.productName}</h4>
        {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
        <p className="mt-1 text-sm text-gray-600">
          {formatCurrency(displayPrice, currency)} × {item.quantity}
        </p>
      </div>

      {/* Controles de cantidad */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
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
        <div className="flex min-w-[100px] items-center justify-end gap-2">
          <span className="text-sm font-semibold">
            {formatCurrency(displaySubtotal, currency)}
          </span>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-red-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
            onClick={() => onRemove(item.productId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
