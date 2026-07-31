'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getProductById, updateProduct } from '@/lib/products';
import { Product, ProductFormData } from '@/types/product';
import ProductForm from '@/components/products/ProductForm';
import toast from 'react-hot-toast';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      const productId = params.id as string;
      const data = await getProductById(productId);
      setProduct(data);
    } catch (error) {
      toast.error('Error al cargar producto');
      router.push('/dashboard/products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: ProductFormData) => {
    try {
      if (!product) return;

      await updateProduct(product.id, data);
      toast.success('Producto actualizado exitosamente');
      router.push('/dashboard/products');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar producto');
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/products');
  };

  if (loading) {
    return <div className="p-6">Cargando producto...</div>;
  }

  if (!product) {
    return <div className="p-6">Producto no encontrado</div>;
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Editar Producto</h1>
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6">
        <ProductForm
          initialData={{
            code: product.code,
            barcode: product.barcode,
            name: product.name,
            description: product.description,
            category: product.category,
            priceUSD: product.prices.USD,
            cost: product.cost,
            costCurrency: product.costCurrency,
            stock: product.stock,
            stockMin: product.stockMin,
            trackInventory: product.trackInventory,
            imageUrl: product.imageUrl,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
