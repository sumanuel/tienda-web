'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DualCurrency } from '@/components/common/DualCurrency';
import { formatCurrency } from '@/lib/currency';
import { getSuppliers } from '@/lib/suppliers';
import { getProducts } from '@/lib/products';
import { usePurchases } from '@/hooks/usePurchases';
import type { Supplier } from '@/types/supplier';
import type { Product } from '@/types/product';
import type { Purchase } from '@/hooks/usePurchases';
import type { CreatePurchaseReturnData } from '@/hooks/usePurchaseReturns';
import { Plus, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReturnLineItem {
  productId: string;
  productName: string;
  quantity: number;
  costUsd: number;
  purchaseItemId?: string;
}

interface PurchaseReturnFormProps {
  storeId: string;
  exchangeRate: number;
  onSubmit: (data: CreatePurchaseReturnData) => Promise<void>;
  onCancel: () => void;
}

const inputClass =
  'focus:border-brand-primary focus:ring-brand-primary w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900';

const labelClass =
  'mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300';

export default function PurchaseReturnForm({
  storeId,
  exchangeRate,
  onSubmit,
  onCancel,
}: PurchaseReturnFormProps) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierPurchases, setSupplierPurchases] = useState<Purchase[]>([]);
  const { getPurchases } = usePurchases();

  const [supplierId, setSupplierId] = useState('');
  const [purchaseId, setPurchaseId] = useState('');
  const [reason, setReason] = useState('');

  const [items, setItems] = useState<ReturnLineItem[]>([]);
  const [newProductId, setNewProductId] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newCost, setNewCost] = useState(0);

  useEffect(() => {
    if (!storeId) return;
    getSuppliers(storeId)
      .then(setSuppliers)
      .catch(() => setSuppliers([]));
    getProducts(storeId)
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [storeId]);

  const handleSelectSupplier = async (id: string) => {
    setSupplierId(id);
    setPurchaseId('');
    setItems([]);

    if (!id) {
      setSupplierPurchases([]);
      return;
    }

    const response = await getPurchases({
      storeId,
      supplierId: id,
      status: 'completed',
      limit: 100,
    });
    setSupplierPurchases(response ? response.purchases : []);
  };

  const handleLoadPurchaseItems = () => {
    const purchase = supplierPurchases.find((p) => p.id === purchaseId);
    if (!purchase || !purchase.items) return;

    setItems(
      purchase.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        costUsd: item.referenceCost,
        purchaseItemId: item.id,
      }))
    );
  };

  const handleSelectProduct = (productId: string) => {
    setNewProductId(productId);
    const product = products.find((p) => p.id === productId);
    setNewCost(product?.cost || 0);
  };

  const handleAddItem = () => {
    if (!newProductId) {
      toast.error('Selecciona un producto');
      return;
    }
    if (newQuantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    const product = products.find((p) => p.id === newProductId);
    if (!product) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === newProductId);
      if (existing) {
        return prev.map((i) =>
          i.productId === newProductId
            ? { ...i, quantity: i.quantity + newQuantity }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: newQuantity,
          costUsd: newCost,
        },
      ];
    });

    setNewProductId('');
    setNewQuantity(1);
    setNewCost(0);
  };

  const handleRemoveItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const totalReference = items.reduce(
    (sum, item) => sum + item.costUsd * item.quantity,
    0
  );
  const totalLocal = totalReference * exchangeRate;

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      toast.error('Describe el motivo de la devolución');
      return;
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un producto a devolver');
      return;
    }

    setLoading(true);
    try {
      const data: CreatePurchaseReturnData = {
        storeId,
        supplierId,
        purchaseId: purchaseId || undefined,
        reason: reason.trim(),
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          cost: item.costUsd * exchangeRate,
          subtotal: item.costUsd * exchangeRate * item.quantity,
          purchaseItemId: item.purchaseItemId,
        })),
        subtotal: totalLocal,
        total: totalLocal,
        currency: 'VES',
        localCurrency: 'VES',
        referenceCurrency: 'USD',
        exchangeRate,
        totalReference,
      };

      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Proveedor *</label>
          <select
            value={supplierId}
            onChange={(e) => handleSelectSupplier(e.target.value)}
            className={inputClass}
          >
            <option value="">Seleccionar proveedor</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Compra Relacionada (opcional)</label>
          <div className="flex gap-2">
            <select
              value={purchaseId}
              onChange={(e) => setPurchaseId(e.target.value)}
              disabled={!supplierId}
              className={inputClass}
            >
              <option value="">Devolución sin compra específica</option>
              {supplierPurchases.map((purchase) => (
                <option key={purchase.id} value={purchase.id}>
                  {purchase.purchaseNumber}
                  {purchase.invoiceNumber ? ` - Fact. ${purchase.invoiceNumber}` : ''}
                </option>
              ))}
            </select>
            {purchaseId && (
              <button
                type="button"
                onClick={handleLoadPurchaseItems}
                className="hover:border-tsuma-primary hover:text-tsuma-primary rounded-xl border border-gray-200 px-3 text-xs font-medium whitespace-nowrap text-gray-600 dark:border-slate-700 dark:text-slate-300"
              >
                Cargar items
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <Label>Motivo de la Devolución *</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: Producto en mal estado, no corresponde al pedido..."
          rows={2}
          className="mt-1.5"
        />
      </div>

      {/* Agregar productos */}
      <div className="rounded-xl border border-gray-200 p-4 dark:border-slate-800">
        <p className={labelClass}>Agregar Producto a Devolver</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_100px_120px_auto]">
          <select
            value={newProductId}
            onChange={(e) => handleSelectProduct(e.target.value)}
            className={inputClass}
          >
            <option value="">Seleccionar producto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.code} - {product.name} (Stock: {product.stock})
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            step="1"
            value={newQuantity}
            onChange={(e) => setNewQuantity(Number(e.target.value))}
            className={inputClass}
            placeholder="Cant."
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={newCost}
            onChange={(e) => setNewCost(Number(e.target.value))}
            className={inputClass}
            placeholder="Costo USD"
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="bg-brand-primary hover:bg-brand-primary-dark flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        </div>
      </div>

      {/* Lista de items */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-950">
            <tr>
              <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase dark:text-slate-500">
                Producto
              </th>
              <th className="p-3 text-center text-xs font-semibold text-gray-500 uppercase dark:text-slate-500">
                Cant.
              </th>
              <th className="p-3 text-right text-xs font-semibold text-gray-500 uppercase dark:text-slate-500">
                Costo Unit. (USD)
              </th>
              <th className="p-3 text-right text-xs font-semibold text-gray-500 uppercase dark:text-slate-500">
                Subtotal
              </th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-sm text-gray-400 dark:text-slate-500"
                >
                  <Undo2 className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-slate-700" />
                  Aún no has agregado productos
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.productId}>
                  <td className="p-3 text-sm font-medium text-gray-900 dark:text-slate-100">
                    {item.productName}
                  </td>
                  <td className="p-3 text-center text-sm">{item.quantity}</td>
                  <td className="p-3 text-right text-sm">
                    {formatCurrency(item.costUsd, 'USD')}
                  </td>
                  <td className="p-3 text-right">
                    <DualCurrency
                      ves={item.costUsd * exchangeRate * item.quantity}
                      usd={item.costUsd * item.quantity}
                      size="sm"
                      align="right"
                    />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.productId)}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {items.length > 0 && (
        <div className="flex justify-end rounded-xl bg-gray-50 p-4 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-gray-800 dark:text-slate-200">
              Total a Devolver:
            </span>
            <DualCurrency
              ves={totalLocal}
              usd={totalReference}
              size="lg"
              align="right"
            />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-brand-primary hover:bg-brand-primary-dark"
        >
          {loading ? 'Registrando...' : 'Registrar Devolución'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
