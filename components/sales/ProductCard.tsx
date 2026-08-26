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
      <CardContent className="p-4">
        {/* Imagen del producto */}
        <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-gray-100">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          )}

          {/* Badge de stock */}
          {product.trackInventory && (
            <div className="absolute top-2 right-2">
              {isOutOfStock ? (
                <Badge variant="destructive" className="text-xs">
                  Agotado
                </Badge>
              ) : isLowStock ? (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 bg-yellow-100 text-xs text-yellow-800"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Bajo stock
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Stock: {product.stock}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="space-y-2">
          <div>
            <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold">
              {product.name}
            </h3>
            {product.sku && (
              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-[#2D7A5B]">
                {formatCurrency(displayPrice, currency)}
              </p>
              <p className="text-xs text-gray-500">{product.category}</p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <Button
          size="sm"
          className="w-full bg-[#2D7A5B] hover:bg-[#236449]"
          disabled={isOutOfStock}
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          Agregar
        </Button>
      </CardFooter>
    </Card>
  );
}
