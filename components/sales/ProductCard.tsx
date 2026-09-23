'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, Package } from 'lucide-react';
import { formatCurrency, type Currency } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category: string;
  price: number;
  priceVES?: number;
  priceUSD?: number;
  stock: number;
  minStock: number;
  image?: string;
  trackInventory?: boolean;
}

interface ProductCardProps {
  product: Product;
  currency: Currency;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, currency, onAdd }: ProductCardProps) {
  const isLowStock =
    product.trackInventory && product.stock <= product.minStock;
  const isOutOfStock = product.trackInventory && product.stock <= 0;

  const displayPrice =
    currency === 'VES'
      ? product.priceVES || product.price
      : currency === 'USD'
        ? product.priceUSD || product.price
        : product.price;

  return (
    <Card
      className={`group hover:border-brand-primary/30 overflow-hidden rounded-2xl border-gray-200 transition-all hover:shadow-sm dark:border-slate-800 ${
        isOutOfStock ? 'cursor-not-allowed opacity-50' : ''
      }`}
      onClick={() => !isOutOfStock && onAdd(product)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-16 w-16 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-800">
                <Package className="h-8 w-8 text-gray-400 dark:text-slate-400 dark:text-slate-500" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-gray-900 dark:text-slate-100">
                  {product.name}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {product.sku && (
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      SKU: {product.sku}
                    </span>
                  )}
                  {product.barcode && (
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      Código: {product.barcode}
                    </span>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className="mt-2 rounded-full bg-gray-100 text-xs text-gray-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {product.category}
                </Badge>
              </div>

              <div className="flex flex-col items-end gap-1">
                <p className="text-brand-primary text-xl font-bold">
                  {formatCurrency(displayPrice, currency)}
                </p>
                {product.trackInventory && (
                  <div className="flex items-center gap-1">
                    {isLowStock && !isOutOfStock && (
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        isOutOfStock
                          ? 'text-red-600'
                          : isLowStock
                            ? 'text-amber-700'
                            : 'text-green-600'
                      }`}
                    >
                      {isOutOfStock ? 'Agotado' : `Stock: ${product.stock}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <Button
              size="sm"
              disabled={isOutOfStock}
              className="bg-brand-primary hover:bg-brand-primary-dark rounded-xl px-3"
              onClick={(e) => {
                e.stopPropagation();
                !isOutOfStock && onAdd(product);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
