/**
 * Validaciones para el módulo de ventas
 */

export interface SaleItem {
  productId: string;
  quantity: number;
  price: number;
  localPrice: number;
  referencePrice: number;
  subtotal: number;
  subtotalLocal: number;
  subtotalReference: number;
  iva?: number;
}

export interface SaleData {
  storeId: string;
  customerId?: string;
  customerDocument?: string;
  items: SaleItem[];
  paymentMethod: string;
  referenceNumber?: string;
  subtotal: number;
  tax: number;
  total: number;
  paid?: number;
  notes?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Valida los datos de una venta antes de crearla
 */
export function validateSaleData(data: SaleData): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Validar tienda
  if (!data.storeId) {
    errors.push({ field: 'storeId', message: 'El ID de tienda es requerido' });
  }

  // 2. Validar items (debe haber al menos uno)
  if (!data.items || data.items.length === 0) {
    errors.push({
      field: 'items',
      message: 'La venta debe contener al menos un producto',
    });
  }

  // 3. Validar cada item
  if (data.items && data.items.length > 0) {
    data.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push({
          field: `items[${index}].productId`,
          message: 'El ID del producto es requerido',
        });
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push({
          field: `items[${index}].quantity`,
          message: 'La cantidad debe ser mayor a 0',
        });
      }
      if (item.price === undefined || item.price < 0) {
        errors.push({
          field: `items[${index}].price`,
          message: 'El precio es inválido',
        });
      }
      if (item.subtotal === undefined || item.subtotal < 0) {
        errors.push({
          field: `items[${index}].subtotal`,
          message: 'El subtotal es inválido',
        });
      }
    });
  }

  // 4. Validar método de pago
  const validPaymentMethods = [
    'efectivo',
    'tarjeta',
    'transferencia',
    'pago_movil',
    'por_cobrar',
  ];
  if (!validPaymentMethods.includes(data.paymentMethod)) {
    errors.push({
      field: 'paymentMethod',
      message: `Método de pago inválido. Debe ser uno de: ${validPaymentMethods.join(', ')}`,
    });
  }

  // 5. Validar referencia para métodos que la requieren
  const methodsRequiringReference = ['tarjeta', 'transferencia', 'pago_movil'];
  if (
    methodsRequiringReference.includes(data.paymentMethod) &&
    !data.referenceNumber
  ) {
    errors.push({
      field: 'referenceNumber',
      message: `El método de pago "${data.paymentMethod}" requiere un número de referencia`,
    });
  }

  // 6. Validar que cliente genérico no use "por_cobrar"
  if (data.paymentMethod === 'por_cobrar' && data.customerDocument === '1') {
    errors.push({
      field: 'paymentMethod',
      message:
        'No se permite el método "Por Cobrar" para el cliente genérico (código 1)',
    });
  }

  // 7. Validar totales
  if (data.subtotal === undefined || data.subtotal < 0) {
    errors.push({ field: 'subtotal', message: 'El subtotal es inválido' });
  }
  if (data.tax === undefined || data.tax < 0) {
    errors.push({ field: 'tax', message: 'El impuesto es inválido' });
  }
  if (data.total === undefined || data.total <= 0) {
    errors.push({ field: 'total', message: 'El total debe ser mayor a 0' });
  }

  // 8. Validar coherencia de totales (subtotal + tax = total, con tolerancia de 0.01)
  const calculatedTotal = data.subtotal + data.tax;
  const tolerance = 0.01;
  if (Math.abs(calculatedTotal - data.total) > tolerance) {
    errors.push({
      field: 'total',
      message: `El total (${data.total}) no coincide con subtotal + impuesto (${calculatedTotal})`,
    });
  }

  // 9. Validar suma de items vs subtotal
  if (data.items && data.items.length > 0) {
    const itemsSubtotal = data.items.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    if (Math.abs(itemsSubtotal - data.subtotal) > tolerance) {
      errors.push({
        field: 'subtotal',
        message: `El subtotal de la venta (${data.subtotal}) no coincide con la suma de los items (${itemsSubtotal})`,
      });
    }
  }

  return errors;
}

/**
 * Valida los datos para cancelar una venta
 */
export function validateCancelSale(
  saleId: string,
  reason?: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!saleId) {
    errors.push({ field: 'saleId', message: 'El ID de la venta es requerido' });
  }

  if (!reason || reason.trim().length === 0) {
    errors.push({
      field: 'reason',
      message: 'La razón de cancelación es requerida',
    });
  }

  if (reason && reason.length < 10) {
    errors.push({
      field: 'reason',
      message: 'La razón debe tener al menos 10 caracteres',
    });
  }

  return errors;
}

/**
 * Valida parámetros de búsqueda de ventas
 */
export function validateSalesQuery(params: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!params.storeId) {
    errors.push({ field: 'storeId', message: 'El ID de tienda es requerido' });
  }

  // Validar fechas si se proporcionan
  if (params.startDate && isNaN(Date.parse(params.startDate))) {
    errors.push({ field: 'startDate', message: 'Fecha de inicio inválida' });
  }

  if (params.endDate && isNaN(Date.parse(params.endDate))) {
    errors.push({ field: 'endDate', message: 'Fecha de fin inválida' });
  }

  // Validar que startDate sea anterior a endDate
  if (params.startDate && params.endDate) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    if (start > end) {
      errors.push({
        field: 'startDate',
        message: 'La fecha de inicio debe ser anterior a la fecha de fin',
      });
    }
  }

  return errors;
}
