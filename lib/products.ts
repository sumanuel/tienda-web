/**
 * Servicio de Productos - Migrado a PostgreSQL
 */

import { apiClient } from '@/lib/api';
import type { Product, ProductFormData } from '@/types/product';

/**
 * Crear producto
 */
export async function createProduct(
  storeId: string,
  data: ProductFormData
): Promise<Product> {
  try {
    const response = await apiClient.createProduct({
      storeId,
      code: data.code || undefined,
      barcode: data.barcode || undefined,
      name: data.name,
      description: data.description || undefined,
      category: data.category,
      cost: data.cost,
      priceVES: data.priceVES || 0,
      priceUSD: data.priceUSD || 0,
      stock: data.stock || 0,
      minStock: data.minStock || 0,
      imageUrl: data.imageUrl || undefined,
    });

    return {
      id: response.product.id,
      storeId: response.product.storeId,
      code: response.product.code,
      barcode: response.product.barcode || undefined,
      name: response.product.name,
      description: response.product.description || undefined,
      category: response.product.category,
      cost: response.product.cost,
      prices: {
        VES: response.product.priceVES,
        USD: response.product.priceUSD,
      },
      stock: response.product.stock,
      minStock: response.product.minStock,
      imageUrl: response.product.imageUrl || undefined,
      createdAt: new Date(response.product.createdAt),
      updatedAt: new Date(response.product.updatedAt),
    };
  } catch (error: any) {
    console.error('Error creando producto:', error);
    throw new Error(error.message || 'Error al crear producto');
  }
}

/**
 * Obtener todos los productos de una tienda
 */
export async function getProducts(storeId: string): Promise<Product[]> {
  try {
    const response = await apiClient.getProducts({ storeId, limit: 1000 });

    return response.products.map((product) => ({
      id: product.id,
      storeId: product.storeId,
      code: product.code,
      barcode: product.barcode || undefined,
      name: product.name,
      description: product.description || undefined,
      category: product.category,
      cost: product.cost,
      prices: {
        VES: product.priceVES,
        USD: product.priceUSD,
      },
      stock: product.stock,
      minStock: product.minStock,
      imageUrl: product.imageUrl || undefined,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt),
    }));
  } catch (error: any) {
    console.error('Error obteniendo productos:', error);
    throw new Error('Error al obtener productos');
  }
}

/**
 * Obtener producto por ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const response = await apiClient.getProduct(id);

    return {
      id: response.product.id,
      storeId: response.product.storeId,
      code: response.product.code,
      barcode: response.product.barcode || undefined,
      name: response.product.name,
      description: response.product.description || undefined,
      category: response.product.category,
      cost: response.product.cost,
      prices: {
        VES: response.product.priceVES,
        USD: response.product.priceUSD,
      },
      stock: response.product.stock,
      minStock: response.product.minStock,
      imageUrl: response.product.imageUrl || undefined,
      createdAt: new Date(response.product.createdAt),
      updatedAt: new Date(response.product.updatedAt),
    };
  } catch (error: any) {
    console.error('Error obteniendo producto:', error);
    return null;
  }
}

/**
 * Actualizar producto
 */
export async function updateProduct(
  id: string,
  data: Partial<ProductFormData>
): Promise<void> {
  try {
    await apiClient.updateProduct(id, {
      code: data.code || undefined,
      barcode: data.barcode || undefined,
      name: data.name,
      description: data.description || undefined,
      category: data.category,
      cost: data.cost,
      priceVES: data.priceVES,
      priceUSD: data.priceUSD,
      minStock: data.minStock,
      imageUrl: data.imageUrl || undefined,
    });
  } catch (error: any) {
    console.error('Error actualizando producto:', error);
    throw new Error(error.message || 'Error al actualizar producto');
  }
}

/**
 * Eliminar producto
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    await apiClient.deleteProduct(id);
  } catch (error: any) {
    console.error('Error eliminando producto:', error);
    throw new Error(error.message || 'Error al eliminar producto');
  }
}

/**
 * Obtener productos con bajo stock
 */
export async function getLowStockProducts(storeId: string): Promise<Product[]> {
  try {
    const response = await apiClient.getLowStock(storeId);

    return response.products.map((product) => ({
      id: product.id,
      storeId,
      code: product.code,
      name: product.name,
      category: product.category,
      stock: product.stock,
      minStock: product.minStock,
      cost: 0, // No disponible en este endpoint
      prices: { VES: 0, USD: 0 }, // No disponible
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  } catch (error: any) {
    console.error('Error obteniendo productos con bajo stock:', error);
    throw new Error('Error al obtener productos con bajo stock');
  }
}

/**
 * Obtener categorías únicas de productos
 */
export async function getProductCategories(storeId: string): Promise<string[]> {
  try {
    const response = await apiClient.getCategories(storeId);
    return response.categories;
  } catch (error: any) {
    console.error('Error obteniendo categorías:', error);
    return [];
  }
}

/**
 * Buscar productos por término
 */
export async function searchProducts(
  storeId: string,
  searchTerm: string
): Promise<Product[]> {
  try {
    const response = await apiClient.getProducts({
      storeId,
      search: searchTerm,
      limit: 100,
    });

    return response.products.map((product) => ({
      id: product.id,
      storeId: product.storeId,
      code: product.code,
      barcode: product.barcode || undefined,
      name: product.name,
      description: product.description || undefined,
      category: product.category,
      cost: product.cost,
      prices: {
        VES: product.priceVES,
        USD: product.priceUSD,
      },
      stock: product.stock,
      minStock: product.minStock,
      imageUrl: product.imageUrl || undefined,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt),
    }));
  } catch (error: any) {
    console.error('Error buscando productos:', error);
    throw new Error('Error al buscar productos');
  }
}

/**
 * Actualizar stock de producto (legacy - ya no se usa directamente)
 * El stock se actualiza automáticamente a través de ventas y movimientos de inventario
 */
export async function updateProductStock(
  productId: string,
  newStock: number
): Promise<void> {
  console.warn(
    'updateProductStock es legacy - usar movimientos de inventario en su lugar'
  );
  // No-op: El stock se actualiza automáticamente
}
