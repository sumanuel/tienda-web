/**
 * Validaciones para el módulo de compras
 */

export interface PurchaseItem {
  productId: string;
  quantity: number;
  cost: number;
  localCost: number;
  referenceCost: number;
  subtotal: number;
  subtotalLocal: number;
  subtotalReference: number;
}

export interface PurchaseData {
  storeId: string;
  supplierId: string;
  invoiceNumber?: string;
  items: PurchaseItem[];
  paymentMethod: string;
  dueDate?: string;
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

const validPaymentMethods = ['efectivo', 'transferencia', 'credito'];

/**
 * Valida los datos de una compra antes de crearla
 */
export function validatePurchaseData(data: PurchaseData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.storeId) {
    errors.push({ field: 'storeId', message: 'El ID de tienda es requerido' });
  }

  if (!data.supplierId) {
    errors.push({
      field: 'supplierId',
      message: 'El proveedor es requerido',
    });
  }

  if (!data.items || data.items.length === 0) {
    errors.push({
      field: 'items',
      message: 'La compra debe contener al menos un producto',
    });
  }

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
      if (item.cost === undefined || item.cost < 0) {
        errors.push({
          field: `items[${index}].cost`,
          message: 'El costo es inválido',
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

  if (!validPaymentMethods.includes(data.paymentMethod)) {
    errors.push({
      field: 'paymentMethod',
      message: `Método de pago inválido. Debe ser uno de: ${validPaymentMethods.join(', ')}`,
    });
  }

  if (data.paymentMethod === 'credito' && !data.dueDate) {
    errors.push({
      field: 'dueDate',
      message: 'La fecha de vencimiento es requerida para compras a crédito',
    });
  }

  if (data.subtotal === undefined || data.subtotal < 0) {
    errors.push({ field: 'subtotal', message: 'El subtotal es inválido' });
  }
  if (data.tax === undefined || data.tax < 0) {
    errors.push({ field: 'tax', message: 'El impuesto es inválido' });
  }
  if (data.total === undefined || data.total <= 0) {
    errors.push({ field: 'total', message: 'El total debe ser mayor a 0' });
  }

  const tolerance = 0.01;
  const calculatedTotal = data.subtotal + data.tax;
  if (Math.abs(calculatedTotal - data.total) > tolerance) {
    errors.push({
      field: 'total',
      message: `El total (${data.total}) no coincide con subtotal + impuesto (${calculatedTotal})`,
    });
  }

  if (data.items && data.items.length > 0) {
    const itemsSubtotal = data.items.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    if (Math.abs(itemsSubtotal - data.subtotal) > tolerance) {
      errors.push({
        field: 'subtotal',
        message: `El subtotal de la compra (${data.subtotal}) no coincide con la suma de los items (${itemsSubtotal})`,
      });
    }
  }

  return errors;
}

/**
 * Valida los datos para cancelar una compra
 */
export function validateCancelPurchase(
  purchaseId: string,
  reason?: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!purchaseId) {
    errors.push({
      field: 'purchaseId',
      message: 'El ID de la compra es requerido',
    });
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
 * Valida parámetros de búsqueda de compras
 */
export function validatePurchasesQuery(params: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!params.storeId) {
    errors.push({ field: 'storeId', message: 'El ID de tienda es requerido' });
  }

  if (params.startDate && isNaN(Date.parse(params.startDate))) {
    errors.push({ field: 'startDate', message: 'Fecha de inicio inválida' });
  }

  if (params.endDate && isNaN(Date.parse(params.endDate))) {
    errors.push({ field: 'endDate', message: 'Fecha de fin inválida' });
  }

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

export interface PurchaseReturnItem {
  productId: string;
  quantity: number;
  cost: number;
  subtotal: number;
  purchaseItemId?: string;
}

export interface PurchaseReturnData {
  storeId: string;
  supplierId: string;
  purchaseId?: string;
  reason: string;
  items: PurchaseReturnItem[];
  subtotal: number;
  total: number;
}

/**
 * Valida los datos de una devolución de compra
 */
export function validatePurchaseReturnData(
  data: PurchaseReturnData
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.storeId) {
    errors.push({ field: 'storeId', message: 'El ID de tienda es requerido' });
  }

  if (!data.supplierId) {
    errors.push({
      field: 'supplierId',
      message: 'El proveedor es requerido',
    });
  }

  if (!data.reason || data.reason.trim().length === 0) {
    errors.push({
      field: 'reason',
      message: 'El motivo de la devolución es requerido',
    });
  }

  if (!data.items || data.items.length === 0) {
    errors.push({
      field: 'items',
      message: 'La devolución debe contener al menos un producto',
    });
  }

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
    });
  }

  if (data.total === undefined || data.total <= 0) {
    errors.push({ field: 'total', message: 'El total debe ser mayor a 0' });
  }

  return errors;
}
