'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
      className={`group cursor-pointer transition-all hover:shadow-md ${
        isOutOfStock ? 'cursor-not-allowed opacity-50' : ''
      }`}
      onClick={() => !isOutOfStock && onAdd(product)}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Imagen del producto */}
          <div className="flex-shrink-0">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-gray-900">
                  {product.name}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {product.sku && (
                    <span className="text-xs text-gray-500">
                      SKU: {product.sku}
                    </span>
                  )}
                  {product.barcode && (
                    <span className="text-xs text-gray-500">
                      Código: {product.barcode}
                    </span>
                  )}
                </div>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {product.category}
                </Badge>
              </div>

              {/* Precio y stock */}
              <div className="flex flex-col items-end gap-1">
                <p className="text-lg font-bold text-[#2D7A5B]">
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
                            ? 'text-orange-600'
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

          {/* Botón agregar */}
          <div className="flex-shrink-0">
            <Button
              size="sm"
              disabled={isOutOfStock}
              className="bg-[#2D7A5B] hover:bg-[#236449]"
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
