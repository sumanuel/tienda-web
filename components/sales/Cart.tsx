'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart } from 'lucide-react';
import { CartItem } from './CartItem';
import { DualCurrency } from '@/components/common/DualCurrency';
import type { CartItem as CartItemType, CartSummary } from '@/hooks/useCart';

interface CartProps {
  items: CartItemType[];
  summary: CartSummary;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
}

export function Cart({
  items,
  summary,
  onIncrement,
  onDecrement,
  onRemove,
}: CartProps) {
  const taxLocal = summary.totalLocal - summary.subtotalLocal;
  const taxReference = summary.totalReference - summary.subtotalReference;

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      <div className="border-b border-gray-200 p-5 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-brand-primary h-5 w-5" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200">
                Carrito
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Resumen de la venta actual
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <span className="bg-brand-primary rounded-full px-2.5 py-1 text-xs font-medium text-white">
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
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onRemove={onRemove}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-gray-400 dark:text-slate-400 dark:text-slate-500">
            <ShoppingCart className="mb-4 h-14 w-14 text-gray-300 dark:text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
              Carrito vacío
            </p>
            <p className="text-sm">Agrega productos para comenzar la venta</p>
          </div>
        )}
      </ScrollArea>

      {items.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-slate-400">
                Subtotal:
              </span>
              <DualCurrency
                ves={summary.subtotalLocal}
                usd={summary.subtotalReference}
                size="sm"
                primaryClassName="font-medium"
              />
            </div>

            {summary.tax > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">IVA:</span>
                <DualCurrency
                  ves={taxLocal}
                  usd={taxReference}
                  size="sm"
                  primaryClassName="font-medium"
                />
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total:</span>
              <DualCurrency
                ves={summary.totalLocal}
                usd={summary.totalReference}
                size="lg"
                primaryClassName="text-brand-primary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
