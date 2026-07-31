'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createProduct } from '@/lib/products';
import { ProductFormData } from '@/types/product';
import ProductForm from '@/components/products/ProductForm';
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
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Nuevo Producto</h1>
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6">
        <ProductForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
