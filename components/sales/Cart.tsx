'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart } from 'lucide-react';
import { CartItem } from './CartItem';
import { formatCurrency, type Currency } from '@/lib/currency';
import type { CartItem as CartItemType, CartSummary } from '@/hooks/useCart';

interface CartProps {
  items: CartItemType[];
  summary: CartSummary;
  currency: Currency;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
}

export function Cart({
  items,
  summary,
  currency,
  onIncrement,
  onDecrement,
  onRemove,
}: CartProps) {
  const displaySubtotal =
    currency === 'VES'
      ? summary.subtotalLocal
      : currency === 'USD'
        ? summary.subtotalReference
        : summary.subtotal;

  const displayTotal =
    currency === 'VES'
      ? summary.totalLocal
      : currency === 'USD'
        ? summary.totalReference
        : summary.total;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[#2D7A5B]" />
            <h2 className="text-lg font-semibold">Carrito</h2>
          </div>
          {items.length > 0 && (
            <span className="rounded-full bg-[#2D7A5B] px-2.5 py-1 text-xs font-medium text-white">
              {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
      </div>

      {/* Lista de items */}
      <ScrollArea className="flex-1 px-4">
        {items.length > 0 ? (
          <div className="py-2">
            {items.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                currency={currency}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onRemove={onRemove}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-gray-400">
            <ShoppingCart className="mb-4 h-16 w-16" />
            <p className="text-lg font-medium">Carrito vacío</p>
            <p className="text-sm">Agrega productos para comenzar</p>
          </div>
        )}
      </ScrollArea>

      {/* Resumen de totales */}
      {items.length > 0 && (
        <div className="border-t bg-gray-50 p-4">
          <div className="space-y-2">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">
                {formatCurrency(displaySubtotal, currency)}
              </span>
            </div>

            {/* IVA (si aplica) */}
            {summary.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IVA:</span>
                <span className="font-medium">
                  {formatCurrency(summary.tax, currency)}
                </span>
              </div>
            )}

            <Separator />

            {/* Total */}
            <div className="flex justify-between">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-[#2D7A5B]">
                {formatCurrency(displayTotal, currency)}
              </span>
            </div>

            {/* Conversión a moneda de referencia */}
            {currency === 'VES' && summary.totalReference > 0 && (
              <div className="mt-2 text-center text-xs text-gray-500">
                ≈ {formatCurrency(summary.totalReference, 'USD')}
              </div>
            )}
            {currency === 'USD' && summary.totalLocal > 0 && (
              <div className="mt-2 text-center text-xs text-gray-500">
                ≈ {formatCurrency(summary.totalLocal, 'VES')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
