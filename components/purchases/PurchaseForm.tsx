'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DualCurrency } from '@/components/common/DualCurrency';
import { formatCurrency } from '@/lib/currency';
import { getSuppliers } from '@/lib/suppliers';
import { getProducts } from '@/lib/products';
import type { Supplier } from '@/types/supplier';
import type { Product } from '@/types/product';
import type { CreatePurchaseData } from '@/hooks/usePurchases';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  PackagePlus,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface PurchaseLineItem {
  productId: string;
  productName: string;
  quantity: number;
  costUsd: number;
}

interface PurchaseFormProps {
  storeId: string;
  exchangeRate: number;
  onSubmit: (data: CreatePurchaseData) => Promise<void>;
  onCancel: () => void;
}

const inputClass =
  'focus:border-brand-primary focus:ring-brand-primary w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900';

const labelClass =
  'mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300';

export default function PurchaseForm({
  storeId,
  exchangeRate,
  onSubmit,
  onCancel,
}: PurchaseFormProps) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<
    'efectivo' | 'transferencia' | 'credito'
  >('efectivo');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueDatePickerOpen, setDueDatePickerOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<PurchaseLineItem[]>([]);
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
    if (newCost < 0) {
      toast.error('El costo no puede ser negativo');
      return;
    }

    const product = products.find((p) => p.id === newProductId);
    if (!product) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === newProductId);
      if (existing) {
        return prev.map((i) =>
          i.productId === newProductId
            ? { ...i, quantity: i.quantity + newQuantity, costUsd: newCost }
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

  const subtotalReference = items.reduce(
    (sum, item) => sum + item.costUsd * item.quantity,
    0
  );
  const subtotalLocal = subtotalReference * exchangeRate;
  const totalLocal = subtotalLocal;
  const totalReference = subtotalReference;

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }
    if (paymentMethod === 'credito' && !dueDate) {
      toast.error('Especifica la fecha de vencimiento para compras a crédito');
      return;
    }

    setLoading(true);
    try {
      const data: CreatePurchaseData = {
        storeId,
        supplierId,
        invoiceNumber: invoiceNumber.trim() || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          cost: item.costUsd * exchangeRate,
          localCost: item.costUsd * exchangeRate,
          referenceCost: item.costUsd,
          subtotal: item.costUsd * exchangeRate * item.quantity,
          subtotalLocal: item.costUsd * exchangeRate * item.quantity,
          subtotalReference: item.costUsd * item.quantity,
        })),
        paymentMethod,
        dueDate:
          paymentMethod === 'credito' && dueDate
            ? format(dueDate, 'yyyy-MM-dd')
            : undefined,
        subtotal: subtotalLocal,
        tax: 0,
        discount: 0,
        total: totalLocal,
        currency: 'VES',
        localCurrency: 'VES',
        referenceCurrency: 'USD',
        exchangeRate,
        totalReference,
        paid: paymentMethod === 'credito' ? 0 : totalLocal,
        notes: notes.trim() || undefined,
      };

      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Proveedor y factura */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Proveedor *</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
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
          <label className={labelClass}>Número de Factura</label>
          <Input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="Ej: 00012345"
          />
        </div>
      </div>

      {/* Método de pago y vencimiento */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Método de Pago *</label>
          <Select
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
              <SelectItem value="credito">Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paymentMethod === 'credito' && (
          <div>
            <Label>Fecha de Vencimiento *</Label>
            <Popover open={dueDatePickerOpen} onOpenChange={setDueDatePickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="focus:border-brand-primary focus:ring-brand-primary mt-1.5 flex w-full items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                  <span className="font-mono">
                    {dueDate
                      ? format(dueDate, 'dd MMM yyyy', { locale: es })
                      : 'Seleccionar fecha'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  defaultMonth={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setDueDatePickerOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Agregar productos */}
      <div className="rounded-xl border border-gray-200 p-4 dark:border-slate-800">
        <p className={labelClass}>Agregar Producto</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_100px_120px_auto]">
          <select
            value={newProductId}
            onChange={(e) => handleSelectProduct(e.target.value)}
            className={inputClass}
          >
            <option value="">Seleccionar producto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.code} - {product.name}
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
                  <PackagePlus className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-slate-700" />
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

      {/* Totales */}
      {items.length > 0 && (
        <div className="flex justify-end rounded-xl bg-gray-50 p-4 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-gray-800 dark:text-slate-200">
              Total:
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

      {/* Notas */}
      <div>
        <label className={labelClass}>Notas</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-brand-primary hover:bg-brand-primary-dark"
        >
          {loading ? 'Registrando...' : 'Registrar Compra'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
