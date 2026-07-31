'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProductsStore } from '@/store/productsStore';
import { getProducts } from '@/lib/products';
import { generateKardex } from '@/lib/inventory';
import { KardexEntry } from '@/types/inventory';
import { Product } from '@/types/product';
import KardexView from '@/components/inventory/KardexView';
import { FileDown } from 'lucide-react';
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
    return <div className="p-6">Cargando productos...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Kardex de Productos</h1>
        <p className="text-gray-600">
          Historial detallado de movimientos por producto
        </p>
      </div>

      {/* Selector de Producto */}
      <div className="mb-6 flex items-end gap-4">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Seleccionar Producto
          </label>
          <select
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            <FileDown size={20} />
            Exportar CSV
          </button>
        )}
      </div>

      {/* Vista de Kardex */}
      {generatingKardex && (
        <div className="py-12 text-center">
          <p className="text-gray-500">Generando kardex...</p>
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
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">
            Selecciona un producto para ver su kardex
          </p>
        </div>
      )}
    </div>
  );
}
