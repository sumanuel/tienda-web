import { useState, useCallback, useMemo } from 'react';
import { useExchangeRates } from './useExchangeRates';
import { calculatePrice, formatCurrency } from '@/lib/currency';

export interface CartItem {
  productId: string;
  productName: string;
  sku?: string;
  barcode?: string;
  quantity: number;
  price: number; // Precio en moneda actual
  localPrice: number; // Precio en VES
  referencePrice: number; // Precio en USD
  subtotal: number;
  subtotalLocal: number;
  subtotalReference: number;
  iva: number;
  priceSnapshot?: {
    localCurrency: string;
    referenceCurrency: string;
    localAmount: number;
    referenceAmount: number;
    exchangeRate: number;
    source: string;
  };
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
  subtotalLocal: number;
  subtotalReference: number;
  totalLocal: number;
  totalReference: number;
}

interface UseCartProps {
  storeId: string;
  currency?: 'VES' | 'USD' | 'EUR';
}

export function useCart({ storeId, currency = 'VES' }: UseCartProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { activeRate, loading: ratesLoading } = useExchangeRates(storeId);

  /**
   * Agregar producto al carrito
   */
  const addItem = useCallback(
    (
      product: {
        id: string;
        name: string;
        sku?: string;
        barcode?: string;
        price: number;
        priceVES?: number;
        priceUSD?: number;
        priceEUR?: number;
        iva?: number;
      },
      quantity: number = 1
    ) => {
      if (quantity <= 0) return;

      const exchangeRate = activeRate?.usdToVes || 1;

      // Calcular precios en todas las monedas
      const prices = calculatePrice({
        basePrice: product.price,
        baseCurrency: currency,
        exchangeRate,
        priceVES: product.priceVES,
        priceUSD: product.priceUSD,
        priceEUR: product.priceEUR,
      });

      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.productId === product.id
        );

        if (existingIndex >= 0) {
          // Incrementar cantidad si ya existe
          const updated = [...prev];
          const existing = updated[existingIndex];
          const newQuantity = existing.quantity + quantity;

          updated[existingIndex] = {
            ...existing,
            quantity: newQuantity,
            subtotal: prices.current * newQuantity,
            subtotalLocal: prices.ves * newQuantity,
            subtotalReference: prices.usd * newQuantity,
          };

          return updated;
        } else {
          // Agregar nuevo item
          const newItem: CartItem = {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            barcode: product.barcode,
            quantity,
            price: prices.current,
            localPrice: prices.ves,
            referencePrice: prices.usd,
            subtotal: prices.current * quantity,
            subtotalLocal: prices.ves * quantity,
            subtotalReference: prices.usd * quantity,
            iva: product.iva || 0,
            priceSnapshot: {
              localCurrency: 'VES',
              referenceCurrency: 'USD',
              localAmount: prices.ves,
              referenceAmount: prices.usd,
              exchangeRate,
              source: 'sale',
            },
          };

          return [...prev, newItem];
        }
      });
    },
    [currency, activeRate]
  );

  /**
   * Actualizar cantidad de un item
   */
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            quantity,
            subtotal: item.price * quantity,
            subtotalLocal: item.localPrice * quantity,
            subtotalReference: item.referencePrice * quantity,
          };
        }
        return item;
      })
    );
  }, []);

  /**
   * Incrementar cantidad
   */
  const incrementItem = useCallback((productId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newQuantity = item.quantity + 1;
          return {
            ...item,
            quantity: newQuantity,
            subtotal: item.price * newQuantity,
            subtotalLocal: item.localPrice * newQuantity,
            subtotalReference: item.referencePrice * newQuantity,
          };
        }
        return item;
      })
    );
  }, []);

  /**
   * Decrementar cantidad
   */
  const decrementItem = useCallback((productId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newQuantity = Math.max(1, item.quantity - 1);
          return {
            ...item,
            quantity: newQuantity,
            subtotal: item.price * newQuantity,
            subtotalLocal: item.localPrice * newQuantity,
            subtotalReference: item.referencePrice * newQuantity,
          };
        }
        return item;
      })
    );
  }, []);

  /**
   * Remover item del carrito
   */
  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  /**
   * Limpiar carrito completo
   */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /**
   * Resumen del carrito
   */
  const summary: CartSummary = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const subtotalLocal = items.reduce(
      (sum, item) => sum + item.subtotalLocal,
      0
    );
    const subtotalReference = items.reduce(
      (sum, item) => sum + item.subtotalReference,
      0
    );

    // Calcular IVA (actualmente 0, pero preparado para futuro)
    const tax = items.reduce((sum, item) => {
      return sum + item.subtotal * (item.iva / 100);
    }, 0);

    const total = subtotal + tax;
    const totalLocal = subtotalLocal + subtotalLocal * (tax / subtotal || 0);
    const totalReference =
      subtotalReference + subtotalReference * (tax / subtotal || 0);

    return {
      itemCount,
      subtotal,
      tax,
      total,
      subtotalLocal,
      subtotalReference,
      totalLocal,
      totalReference,
    };
  }, [items]);

  /**
   * Verificar si el carrito está vacío
   */
  const isEmpty = items.length === 0;

  /**
   * Obtener datos formateados para enviar al backend
   */
  const getCartData = useCallback(() => {
    return {
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        localPrice: item.localPrice,
        referencePrice: item.referencePrice,
        subtotal: item.subtotal,
        subtotalLocal: item.subtotalLocal,
        subtotalReference: item.subtotalReference,
        priceSnapshot: item.priceSnapshot,
        iva: item.iva,
      })),
      subtotal: summary.subtotal,
      tax: summary.tax,
      total: summary.total,
      currency,
      localCurrency: 'VES',
      referenceCurrency: 'USD',
      exchangeRate: activeRate?.usdToVes || 0,
      totalReference: summary.totalReference,
    };
  }, [items, summary, currency, activeRate]);

  return {
    items,
    summary,
    isEmpty,
    loading: ratesLoading,
    addItem,
    updateQuantity,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    getCartData,
  };
}
