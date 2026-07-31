'use client';

import { useEffect, useState } from 'react';
import { useProductsStore } from '@/store/productsStore';
import { useAuth } from '@/hooks/useAuth';
import { getProducts, deleteProduct } from '@/lib/products';
import ProductTable from '@/components/products/ProductTable';
import { Plus } from 'lucide-react';
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
    return <div className="p-6">Cargando productos...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-gray-600">
            {products.length} productos registrados
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus size={20} />
          Nuevo Producto
        </Link>
      </div>

      <ProductTable products={products} onDelete={handleDelete} />
    </div>
  );
}
