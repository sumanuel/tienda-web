'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProductsStore } from '@/store/productsStore';
import { getProducts } from '@/lib/products';
import { generateKardex } from '@/lib/inventory';
import { KardexEntry } from '@/types/inventory';
import { Product } from '@/types/product';
import KardexView from '@/components/inventory/KardexView';
import { FileDown, BarChart3, FileSearch } from 'lucide-react';
import toast from 'react-hot-toast';

export default function KardexPage() {
  const { profile } = useAuth();
  const { products, setProducts } = useProductsStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [kardex, setKardex] = useState<KardexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingKardex, setGeneratingKardex] = useState(false);

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

  const handleProductChange = async (productId: string) => {
    if (!productId || !profile) return;

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setSelectedProduct(product);
    setGeneratingKardex(true);

    try {
      const kardexData = await generateKardex(profile.storeId, productId);
      setKardex(kardexData);
    } catch (error) {
      toast.error('Error al generar kardex');
    } finally {
      setGeneratingKardex(false);
    }
  };

  const exportToCSV = () => {
    if (!selectedProduct || kardex.length === 0) return;

    const headers = [
      'Fecha',
      'Referencia',
      'Tipo',
      'Entrada',
      'Salida',
      'Saldo',
      'Costo Unitario',
      'Total',
    ];

    const rows = kardex.map((entry) => [
      entry.date.toISOString(),
      entry.reference,
      entry.type,
      entry.quantityIn,
      entry.quantityOut,
      entry.balance,
      entry.unitCost || '',
      entry.totalCost || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kardex-${selectedProduct.code}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-7 w-48 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="mt-3 h-4 w-72 rounded bg-gray-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Kardex de Productos
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Historial detallado de movimientos por producto.
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Producto */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-end dark:border-slate-800 dark:bg-slate-900">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Seleccionar Producto
          </label>
          <select
            onChange={(e) => handleProductChange(e.target.value)}
            className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
          >
            <option value="">Seleccionar producto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.code} - {product.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && kardex.length > 0 && (
          <button
            onClick={exportToCSV}
            className="hover:border-tsuma-primary hover:text-tsuma-primary flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors dark:border-slate-800 dark:text-slate-300"
          >
            <FileDown size={18} />
            Exportar CSV
          </button>
        )}
      </div>

      {/* Vista de Kardex */}
      {generatingKardex && (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-gray-500 dark:text-slate-400">
            Generando kardex...
          </p>
        </div>
      )}

      {!generatingKardex && selectedProduct && (
        <KardexView
          kardex={kardex}
          productName={selectedProduct.name}
          productCode={selectedProduct.code}
        />
      )}

      {!generatingKardex && !selectedProduct && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <FileSearch className="mb-4 h-12 w-12 text-gray-300 dark:text-slate-700" />
          <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
            Selecciona un producto para ver su kardex
          </p>
        </div>
      )}
    </div>
  );
}
