'use client';

import { useEffect, useState } from 'react';
import { useProductsStore } from '@/store/productsStore';
import { useAuth } from '@/hooks/useAuth';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/products';
import { Product, ProductFormData } from '@/types/product';
import ProductTable from '@/components/products/ProductTable';
import ProductForm from '@/components/products/ProductForm';
import ProductFormWithCalculations from '@/components/products/ProductFormWithCalculations';
import { SidePanel } from '@/components/common/SidePanel';
import { Box, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const { profile } = useAuth();
  const { products, setProducts, addProduct, removeProduct } =
    useProductsStore();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

  const closePanel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleCreate = async (data: ProductFormData) => {
    try {
      if (!profile?.storeId) {
        toast.error('No se encontró la tienda');
        return;
      }
      const newProduct = await createProduct(profile.storeId, data);
      addProduct(newProduct);
      toast.success('Producto creado exitosamente');
      closePanel();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear producto');
    }
  };

  const handleUpdate = async (data: ProductFormData) => {
    try {
      if (!editingProduct) return;
      await updateProduct(editingProduct.id, data);
      await loadProducts();
      toast.success('Producto actualizado exitosamente');
      closePanel();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar producto');
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
      <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-7 w-48 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="mt-3 h-4 w-72 rounded bg-gray-100 dark:bg-slate-800" />
        </div>
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-10 w-full rounded bg-gray-100 dark:bg-slate-800" />
          <div className="mt-4 h-80 w-full rounded bg-gray-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-brand-primary-light text-brand-primary flex h-11 w-11 items-center justify-center rounded-xl">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                Productos
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Administra catálogo, precios y control de inventario.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-slate-400">
            {products.length} productos registrados
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="bg-brand-primary hover:bg-brand-primary-dark inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      <SidePanel
        open={showForm || !!editingProduct}
        onClose={closePanel}
        title={
          editingProduct
            ? `Editar producto ${editingProduct.code}`
            : 'Nuevo Producto'
        }
        subtitle={
          editingProduct
            ? 'El código identifica el producto y no se modifica después de crearlo.'
            : 'Registra identidad, precios e inventario en una sola vista.'
        }
      >
        {editingProduct ? (
          <ProductForm
            initialData={{
              code: editingProduct.code,
              barcode: editingProduct.barcode,
              name: editingProduct.name,
              description: editingProduct.description,
              category: editingProduct.category,
              priceUSD: editingProduct.prices.USD,
              cost: editingProduct.cost,
              costCurrency: editingProduct.costCurrency,
              stock: editingProduct.stock,
              stockMin: editingProduct.stockMin,
              trackInventory: editingProduct.trackInventory,
              imageUrl: editingProduct.imageUrl,
            }}
            onSubmit={handleUpdate}
            onCancel={closePanel}
          />
        ) : (
          <ProductFormWithCalculations
            onSubmit={handleCreate}
            onCancel={closePanel}
          />
        )}
      </SidePanel>

      <ProductTable
        products={products}
        onEdit={setEditingProduct}
        onDelete={handleDelete}
      />
    </div>
  );
}
