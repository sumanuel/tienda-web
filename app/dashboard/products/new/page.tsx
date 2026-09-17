'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createProduct } from '@/lib/products';
import { ProductFormData } from '@/types/product';
import ProductFormWithCalculations from '@/components/products/ProductFormWithCalculations';
import { ArrowLeft, PackagePlus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewProductPage() {
  const router = useRouter();
  const { profile } = useAuth();

  const handleSubmit = async (data: ProductFormData) => {
    try {
      if (!profile?.storeId) {
        toast.error('No se encontró la tienda');
        return;
      }

      await createProduct(profile.storeId, data);
      toast.success('Producto creado exitosamente');
      router.push('/dashboard/products');
    } catch (error: any) {
      toast.error(error.message || 'Error al crear producto');
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/products');
  };

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand-primary-light text-brand-primary flex h-11 w-11 items-center justify-center rounded-xl">
            <PackagePlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
            <p className="text-sm text-gray-500">
              Registra identidad, precios e inventario en una sola vista.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>
      </div>

      <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <ProductFormWithCalculations
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
