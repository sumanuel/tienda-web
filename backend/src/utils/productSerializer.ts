export const productSelect = {
  id: true,
  name: true,
  description: true,
  sku: true,
  barcode: true,
  category: true,
  price: true,
  priceVES: true,
  priceUSD: true,
  priceEUR: true,
  cost: true,
  costCurrency: true,
  additionalCost: true,
  margin: true,
  iva: true,
  stock: true,
  minStock: true,
  trackInventory: true,
  image: true,
  storeId: true,
  createdAt: true,
  updatedAt: true,
} as const;

interface ProductRow {
  sku: string | null;
  barcode: string | null;
  image: string | null;
}

/**
 * Agrega los alias que consume el frontend: `code` (SKU o, si no hay, código
 * de barras) e `imageUrl`.
 */
export function serializeProduct<T extends ProductRow>(product: T) {
  return {
    ...product,
    code: product.sku || product.barcode || '',
    imageUrl: product.image,
  };
}
