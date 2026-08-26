'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Barcode, Package } from 'lucide-react';
import { ProductCard } from './ProductCard';
import type { Currency } from '@/lib/currency';

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

interface ProductCatalogProps {
  products: Product[];
  currency: Currency;
  onAddProduct: (product: Product) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function ProductCatalog({
  products,
  currency,
  onAddProduct,
  searchQuery = '',
  onSearchChange,
}: ProductCatalogProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  // Extraer categorías únicas
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return Array.from(cats).sort();
  }, [products]);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Filtro de búsqueda
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesSku = product.sku?.toLowerCase().includes(query);
        const matchesBarcode = product.barcode?.toLowerCase().includes(query);

        if (!matchesName && !matchesSku && !matchesBarcode) {
          return false;
        }
      }

      // Filtro de categoría
      if (categoryFilter !== 'all' && product.category !== categoryFilter) {
        return false;
      }

      // Filtro de stock
      if (
        stockFilter === 'in_stock' &&
        product.trackInventory &&
        product.stock <= 0
      ) {
        return false;
      }
      if (
        stockFilter === 'low_stock' &&
        (!product.trackInventory || product.stock > product.minStock)
      ) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, categoryFilter, stockFilter]);

  return (
    <div className="flex h-full flex-col">
      {/* Barra de búsqueda y filtros */}
      <div className="sticky top-0 z-10 space-y-3 border-b bg-white p-4">
        {/* Campo de búsqueda */}
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, SKU o código de barras..."
            className="pr-10 pl-10"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            autoFocus
          />
          <Barcode className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el inventario</SelectItem>
              <SelectItem value="in_stock">En stock</SelectItem>
              <SelectItem value="low_stock">Stock bajo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contador de resultados */}
        <p className="text-sm text-gray-600">
          {filteredProducts.length}{' '}
          {filteredProducts.length === 1 ? 'producto' : 'productos'}
          {searchQuery &&
            ` encontrado${filteredProducts.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Grid de productos */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProducts.length > 0 ? (
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={currency}
                onAdd={onAddProduct}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-gray-400">
            <Package className="mb-4 h-16 w-16" />
            <p className="text-lg font-medium">No se encontraron productos</p>
            {searchQuery && (
              <p className="text-sm">Intenta con otra búsqueda</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
