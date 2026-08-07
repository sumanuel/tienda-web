'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useProductsStore } from '@/store/productsStore';
import { useCustomersStore } from '@/store/customersStore';
import { useAuth } from '@/hooks/useAuth';
import { getProducts, searchProducts } from '@/lib/products';
import { getCustomers } from '@/lib/customers';
import { processSale } from '@/lib/sales';
import { generateReceiptPDF } from '@/lib/receipt';
import { Product } from '@/types/product';
import { Customer } from '@/types/customer';
import { CartItem } from '@/types/sale';
import { Search, ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function POSPage() {
  const { profile } = useAuth();
  const { products, setProducts } = useProductsStore();
  const { customers, setCustomers } = useCustomersStore();
  const {
    items,
    currency,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTax,
    getTotal,
  } = useCartStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados para venta a crédito (NUEVO - Fase 5)
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'card' | 'transfer' | 'credit'
  >('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [creditDueDate, setCreditDueDate] = useState<string>('');

  // Cargar productos y clientes al montar
  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    try {
      if (!profile?.storeId) return;
      const data = await getProducts(profile.storeId);
      setProducts(data);
    } catch (error) {
      toast.error('Error al cargar productos');
    }
  };

  const loadCustomers = async () => {
    try {
      if (!profile?.storeId) return;
      const data = await getCustomers(profile.storeId);
      setCustomers(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  // Búsqueda de productos
  const handleSearch = async (term: string) => {
    setSearchTerm(term);

    if (term.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      if (!profile?.storeId) return;
      const results = await searchProducts(profile.storeId, term);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  // Agregar producto al carrito
  const handleAddProduct = (product: Product) => {
    const price = product.prices[currency as keyof typeof product.prices] || 0;

    if (price === 0) {
      toast.error(`Producto no tiene precio en ${currency}`);
      return;
    }

    // ✅ VALIDAR STOCK DISPONIBLE
    if (product.trackInventory && product.stock < 1) {
      toast.error(`${product.name} sin stock disponible`);
      return;
    }

    // ✅ VALIDAR CANTIDAD EN CARRITO
    const existingItem = items.find((i) => i.productId === product.id);
    const totalInCart = (existingItem?.quantity || 0) + 1;

    if (product.trackInventory && totalInCart > product.stock) {
      toast.error(`Stock máximo disponible: ${product.stock}`);
      return;
    }

    const cartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      quantity: 1,
      price,
      discount: 0,
      subtotal: price,
      productImage: product.imageUrl,
    };

    addItem(cartItem);
    setSearchTerm('');
    setSearchResults([]);
    toast.success(`${product.name} agregado al carrito`);
  };

  // Procesar pago
  const handleProcessSale = async () => {
    if (items.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (!profile) {
      toast.error('Usuario no autenticado');
      return;
    }

    // Validar venta a crédito
    if (paymentMethod === 'credit') {
      if (!selectedCustomerId) {
        toast.error('Debe seleccionar un cliente para ventas a crédito');
        return;
      }
      if (!creditDueDate) {
        toast.error('Debe especificar fecha de vencimiento');
        return;
      }
    }

    setLoading(true);
    try {
      const selectedCustomer = customers.find(
        (c) => c.id === selectedCustomerId
      );

      const sale = await processSale(
        profile.storeId,
        profile.id,
        profile.name,
        items,
        currency,
        paymentMethod,
        undefined, // amountReceived
        selectedCustomerId || undefined,
        selectedCustomer?.name || undefined,
        creditDueDate ? new Date(creditDueDate) : undefined
      );

      toast.success(`Venta #${sale.saleNumber} procesada`);

      // Generar PDF solo si no es crédito
      if (paymentMethod !== 'credit') {
        generateReceiptPDF(sale, 'TiendaWeb');
      }

      clearCart();
      setPaymentMethod('cash');
      setSelectedCustomerId('');
      setCreditDueDate('');

      // Recargar productos para actualizar stock
      await loadProducts();
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar venta');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getSubtotal();
  const tax = getTax(16);
  const total = getTotal(16);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* Panel Izquierdo: Búsqueda y Productos */}
      <div className="flex-1 overflow-auto">
        <div className="mb-4">
          <h1 className="mb-4 text-2xl font-bold">Punto de Venta</h1>

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar producto por nombre o código..."
              className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  className="flex w-full items-center gap-3 border-b p-3 hover:bg-gray-50"
                >
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-blue-600">
                      {currency}{' '}
                      {product.prices[
                        currency as keyof typeof product.prices
                      ]?.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Stock: {product.stock}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Productos Populares (Grid) */}
        <div className="grid grid-cols-3 gap-4">
          {products.slice(0, 9).map((product) => (
            <button
              key={product.id}
              onClick={() => handleAddProduct(product)}
              className="rounded-lg border border-gray-200 p-4 text-left hover:border-blue-500 hover:shadow-md"
            >
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="mb-2 h-32 w-full rounded object-cover"
                />
              )}
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-gray-500">{product.code}</div>
              <div className="mt-2 font-semibold text-blue-600">
                {currency}{' '}
                {product.prices[
                  currency as keyof typeof product.prices
                ]?.toFixed(2)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Panel Derecho: Carrito */}
      <div className="w-96 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <ShoppingCart />
          <h2 className="text-xl font-bold">Carrito</h2>
          <span className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-700">
            {items.length}
          </span>
        </div>

        {/* Items del carrito */}
        <div className="mb-4 max-h-96 space-y-2 overflow-auto">
          {items.map((item) => (
            <div
              key={item.productId}
              className="rounded-lg border border-gray-200 p-3"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-gray-500">
                    {item.productCode}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm">Cant:</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.productId, parseInt(e.target.value, 10))
                  }
                  className="w-20 rounded border border-gray-300 px-2 py-1 text-center"
                />
                <span className="ml-auto font-semibold">
                  {currency} {item.subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="py-8 text-center text-gray-500">Carrito vacío</div>
          )}
        </div>

        {/* Método de Pago */}
        {items.length > 0 && (
          <>
            <div className="space-y-3 border-t pt-4">
              <label className="block text-sm font-medium">
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded border p-2"
              >
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
                <option value="credit">Crédito</option>
              </select>

              {/* Campos adicionales si es venta a crédito */}
              {paymentMethod === 'credit' && (
                <div className="space-y-3 rounded-lg border border-yellow-300 bg-yellow-50 p-3">
                  <p className="text-xs font-medium text-yellow-800">
                    ⚠️ Venta a Crédito
                  </p>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Cliente *
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full rounded border p-2"
                    >
                      <option value="">Seleccionar cliente...</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} ({customer.document})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Fecha de Vencimiento *
                    </label>
                    <input
                      type="date"
                      value={creditDueDate}
                      onChange={(e) => setCreditDueDate(e.target.value)}
                      className="w-full rounded border p-2"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Totales */}
            <div className="mt-4 space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA (16%):</span>
                <span>
                  {currency} {tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL:</span>
                <span>
                  {currency} {total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Botones */}
            <div className="mt-4 space-y-2">
              <button
                onClick={handleProcessSale}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Procesando...' : 'Procesar Venta (F4)'}
              </button>
              <button
                onClick={() => clearCart()}
                className="w-full rounded-lg border border-gray-300 py-2 hover:bg-gray-50"
              >
                Limpiar Carrito
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
