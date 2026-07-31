export interface Product {
  id: string;
  storeId: string;
  code: string; // Código único del producto
  barcode?: string; // Código de barras
  name: string;
  description?: string;
  category: string; // Categoría (Electrónica, Alimentos, etc.)

  // Precios multi-moneda
  prices: {
    VES?: number;
    USD?: number;
    EUR?: number;
  };

  cost: number; // Costo de adquisición
  costCurrency: string; // Moneda del costo

  stock: number; // Stock actual
  stockMin: number; // Stock mínimo (alerta)
  trackInventory: boolean; // ¿Controlar inventario?

  supplierId?: string; // ID del proveedor
  imageUrl?: string; // URL de la imagen en Firebase Storage

  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  code?: string;
  barcode?: string;
  name: string;
  description?: string;
  category: string;
  priceVES?: number;
  priceUSD?: number;
  priceEUR?: number;
  cost: number;
  costCurrency: string;
  stock: number;
  stockMin: number;
  trackInventory: boolean;
  supplierId?: string;
  image?: File;
  imageUrl?: string;
}
