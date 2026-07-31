export type MovementType = 'entry' | 'exit' | 'adjustment' | 'sale';

export interface InventoryMovement {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  productCode: string;
  type: MovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  unitCost?: number;
  totalCost?: number;
  reference?: string;
  supplierId?: string;
  supplierName?: string;
  reason?: string;
  notes?: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface StockAlert {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  productCode: string;
  currentStock: number;
  minStock: number;
  status: 'active' | 'resolved';
  resolvedAt?: Date;
  createdAt: Date;
}

export interface InventoryMovementFormData {
  productId: string;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  supplierId?: string;
  reason?: string;
  notes?: string;
}

export interface KardexEntry {
  date: Date;
  reference: string;
  type: string;
  quantityIn: number;
  quantityOut: number;
  balance: number;
  unitCost?: number;
  totalCost?: number;
}
