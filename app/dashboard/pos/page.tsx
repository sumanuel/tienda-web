'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ProductCatalog } from '@/components/sales/ProductCatalog';
import { Cart } from '@/components/sales/Cart';
import { CustomerSelector } from '@/components/sales/CustomerSelector';
import { PaymentMethodSelector } from '@/components/sales/PaymentMethodSelector';
import { useCart } from '@/hooks/useCart';
import { useSales } from '@/hooks/useSales';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import {
  ShoppingCart,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Currency } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category: string;
  price: number;
  priceVES?: number;
  priceUSD?: number;
  stock: number;
  minStock: number;
  image?: string;
  trackInventory?: boolean;
}

interface Customer {
  id: string;
  name: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
}

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'pago_movil' | 'por_cobrar';

export default function POSPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [currency, setCurrency] = useState<Currency>('VES');
  const [storeId, setStoreId] = useState<string>('');

  // Productos
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Carrito
  const cart = useCart({ storeId, currency });

  // Ventas
  const sales = useSales();

  // Cliente y pago
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Cargar storeId del perfil
  useEffect(() => {
    if (profile?.storeId) {
      setStoreId(profile.storeId);
    }
  }, [profile]);

  // Cargar productos
  useEffect(() => {
    if (!storeId) return;

    async function loadProducts() {
      setLoadingProducts(true);
      try {
        const response = await apiClient.get<{
          products: Product[];
        }>(`/products?storeId=${storeId}&limit=100`);

        setProducts(response.products || []);
      } catch (error) {
        console.error('Error cargando productos:', error);
        toast.error('Error al cargar productos');
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, [storeId]);

  // Manejar agregar producto al carrito
  const handleAddProduct = useCallback(
    (product: Product) => {
      // Validar stock
      if (product.trackInventory && product.stock <= 0) {
        toast.error(`${product.name} está agotado`);
        return;
      }

      // Verificar cantidad en carrito
      const existingItem = cart.items.find((i) => i.productId === product.id);
      const totalInCart = (existingItem?.quantity || 0) + 1;

      if (product.trackInventory && totalInCart > product.stock) {
        toast.error(`Stock máximo disponible: ${product.stock}`);
        return;
      }

      cart.addItem(product, 1);
      toast.success(`${product.name} agregado al carrito`);
    },
    [cart]
  );

  // Manejar creación de cliente
  const handleCreateCustomer = useCallback(
    async (data: {
      name: string;
      documentNumber: string;
      phone?: string;
      address?: string;
    }) => {
      try {
        const response = await apiClient.post<{ customer: Customer }>(
          '/customers',
          {
            ...data,
            storeId,
          }
        );

        toast.success('Cliente creado exitosamente');
        return response.customer;
      } catch (error: any) {
        throw new Error(
          error.response?.data?.error || 'Error al crear cliente'
        );
      }
    },
    [storeId]
  );

  // Validar venta antes de procesar
  const validateSale = useCallback(() => {
    const errors: string[] = [];

    // Validar carrito no vacío
    if (cart.isEmpty) {
      errors.push('El carrito está vacío');
    }

    // Validar cliente seleccionado
    if (!selectedCustomer) {
      errors.push('Debe seleccionar un cliente');
    }

    // Validar cliente genérico vs por_cobrar
    if (
      paymentMethod === 'por_cobrar' &&
      selectedCustomer?.documentNumber === '1'
    ) {
      errors.push('No se puede usar "Por Cobrar" con el cliente genérico');
    }

    // Validar número de referencia
    if (
      ['card', 'transfer', 'pago_movil'].includes(paymentMethod) &&
      !referenceNumber.trim()
    ) {
      errors.push('Debe especificar el número de referencia');
    }

    return errors;
  }, [cart.isEmpty, selectedCustomer, paymentMethod, referenceNumber]);

  // Procesar venta
  const handleProcessSale = async () => {
    setShowValidationErrors(true);

    const errors = validateSale();
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setProcessing(true);

    try {
      const cartData = cart.getCartData();

      const saleData = {
        storeId,
        customerId:
          selectedCustomer?.documentNumber !== '1'
            ? selectedCustomer?.id
            : undefined,
        customerDocument: selectedCustomer?.documentNumber || '1',
        items: cartData.items,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        subtotal: cartData.subtotal,
        tax: cartData.tax,
        total: cartData.total,
        currency,
        localCurrency: cartData.localCurrency,
        referenceCurrency: cartData.referenceCurrency,
        exchangeRate: cartData.exchangeRate,
        totalReference: cartData.totalReference,
        paid: cartData.total,
        change: 0,
        notes: `Cliente: ${selectedCustomer?.name || 'Genérico'}${
          referenceNumber ? ` - Ref: ${referenceNumber}` : ''
        }`,
      };

      const sale = await sales.createSale(saleData);

      if (sale) {
        toast.success(`Venta #${sale.saleNumber} procesada exitosamente`);

        // Limpiar formulario
        cart.clearCart();
        setSelectedCustomer(null);
        setPaymentMethod('cash');
        setReferenceNumber('');
        setShowValidationErrors(false);

        // Recargar productos para actualizar stock
        const response = await apiClient.get<{ products: Product[] }>(
          `/products?storeId=${storeId}&limit=100`
        );
        setProducts(response.products || []);

        // Mostrar notificación de éxito con opción de ver venta
        toast.success(
          <div>
            <p className="font-semibold">Venta completada</p>
            <button
              onClick={() => router.push(`/dashboard/sales`)}
              className="mt-1 text-sm underline"
            >
              Ver historial de ventas
            </button>
          </div>,
          { duration: 5000 }
        );
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la venta');
    } finally {
      setProcessing(false);
    }
  };

  // Atajos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F9: Procesar venta
      if (e.key === 'F9') {
        e.preventDefault();
        handleProcessSale();
      }
      // Escape: Limpiar carrito
      if (e.key === 'Escape') {
        e.preventDefault();
        if (cart.items.length > 0 && confirm('¿Limpiar el carrito?')) {
          cart.clearCart();
          setSelectedCustomer(null);
          setPaymentMethod('cash');
          setReferenceNumber('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart, handleProcessSale]);

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 bg-gray-50 p-4">
      {/* Panel izquierdo: Catálogo de productos (50%) */}
      <div className="flex-1 overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="flex h-full flex-col">
          <div className="border-b bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-[#2D7A5B]" />
                <h1 className="text-2xl font-bold">Punto de Venta</h1>
              </div>

              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as Currency)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VES">Bs. (VES)</SelectItem>
                  <SelectItem value="USD">$ (USD)</SelectItem>
                  <SelectItem value="EUR">€ (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ProductCatalog
            products={products}
            currency={currency}
            onAddProduct={handleAddProduct}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      </div>

      {/* Panel derecho: Carrito y checkout (50%) */}
      <div className="flex flex-1 flex-col gap-4">
        {/* Carrito */}
        <Card className="flex flex-1 flex-col overflow-hidden shadow-lg">
          <Cart
            items={cart.items}
            summary={cart.summary}
            currency={currency}
            onIncrement={cart.incrementItem}
            onDecrement={cart.decrementItem}
            onRemove={cart.removeItem}
          />
        </Card>

        {/* Panel de checkout */}
        <Card className="space-y-4 p-4 shadow-lg">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <DollarSign className="h-5 w-5 text-[#2D7A5B]" />
            Checkout
          </h3>

          <Separator />

          {/* Selector de cliente */}
          <CustomerSelector
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setSelectedCustomer}
            onCreateCustomer={handleCreateCustomer}
            storeId={storeId}
          />

          {/* Selector de método de pago */}
          <PaymentMethodSelector
            paymentMethod={paymentMethod}
            onPaymentMethodChange={(method) =>
              setPaymentMethod(method as PaymentMethod)
            }
            referenceNumber={referenceNumber}
            onReferenceNumberChange={setReferenceNumber}
            customerDocument={selectedCustomer?.documentNumber}
            showError={showValidationErrors}
          />

          <Separator />

          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (cart.items.length > 0 && confirm('¿Limpiar el carrito?')) {
                  cart.clearCart();
                  setSelectedCustomer(null);
                  setPaymentMethod('cash');
                  setReferenceNumber('');
                  setShowValidationErrors(false);
                }
              }}
              disabled={cart.isEmpty || processing}
            >
              Limpiar (ESC)
            </Button>

            <Button
              className="flex-1 bg-[#2D7A5B] hover:bg-[#236449]"
              onClick={handleProcessSale}
              disabled={cart.isEmpty || processing}
            >
              {processing ? (
                <>
                  <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Procesar Venta (F9)
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
