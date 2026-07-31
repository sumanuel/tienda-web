export interface SaleItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  price: number; // Precio unitario en la moneda de venta
  discount: number; // Descuento en porcentaje (0-100)
  subtotal: number; // quantity * price * (1 - discount/100)
}

export interface Sale {
  id: string;
  storeId: string;
  saleNumber: string; // Número correlativo de venta

  customerId?: string; // ID del cliente (opcional)
  customerName?: string;
  cashierId: string; // ID del usuario que procesó la venta
  cashierName: string;

  items: SaleItem[];

  subtotal: number;
  discount: number; // Descuento total
  tax: number; // Impuesto (IVA)
  total: number; // Total a pagar

  currency: string; // Moneda de la venta (VES, USD, EUR)
  exchangeRateSnapshot: {
    [currency: string]: number;
  }; // Snapshot de tasas al momento de la venta

  paymentMethod: 'cash' | 'card' | 'transfer' | 'credit';
  paymentStatus: 'paid' | 'pending' | 'partial';

  // Detalles de pago en efectivo
  amountReceived?: number;
  change?: number;

  status: 'completed' | 'cancelled';

  createdAt: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancelReason?: string;
}

export interface CartItem extends SaleItem {
  productImage?: string;
}
