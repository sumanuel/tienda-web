'use client';

import { useEffect, useState } from 'react';
import { useProductsStore } from '@/store/productsStore';
import { useAuth } from '@/hooks/useAuth';
import { getProducts, deleteProduct } from '@/lib/products';
import ProductTable from '@/components/products/ProductTable';
import { Box, Plus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const { profile } = useAuth();
  const { products, setProducts, removeProduct } = useProductsStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      if (!profile?.storeId) return;
      setLoading(true);
      const data = await getProducts(profile.storeId);
      setProducts(data);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      removeProduct(productId);
      toast.success('Producto eliminado');
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen space-y-6 bg-gray-50 p-6">
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-7 w-48 rounded bg-gray-200" />
          <div className="mt-3 h-4 w-72 rounded bg-gray-100" />
        </div>
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-10 w-full rounded bg-gray-100" />
          <div className="mt-4 h-80 w-full rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-brand-primary-light text-brand-primary flex h-11 w-11 items-center justify-center rounded-xl">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
              <p className="text-sm text-gray-500">
                Administra catálogo, precios y control de inventario.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            {products.length} productos registrados
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="bg-brand-primary hover:bg-brand-primary-dark inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
        >
          <Plus size={20} />
          Nuevo Producto
        </Link>
      </div>

      <ProductTable products={products} onDelete={handleDelete} />
    </div>
  );
}
