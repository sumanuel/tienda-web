export type TransactionType = 'charge' | 'payment';
export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface CustomerTransaction {
  id: string;
  storeId: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentMethod?: PaymentMethod;
  saleId?: string;
  dueDate?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface CustomerTransactionFormData {
  type: TransactionType;
  amount: number;
  paymentMethod?: PaymentMethod;
  saleId?: string;
  dueDate?: Date;
  notes?: string;
}

export interface SupplierTransaction {
  id: string;
  storeId: string;
  supplierId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentMethod?: PaymentMethod;
  purchaseOrderId?: string;
  dueDate?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface SupplierTransactionFormData {
  type: TransactionType;
  amount: number;
  paymentMethod?: PaymentMethod;
  purchaseOrderId?: string;
  dueDate?: Date;
  notes?: string;
}

export interface AccountStatus {
  customerId?: string;
  supplierId?: string;
  name: string;
  document?: string;
  rif?: string;
  currentBalance: number;
  transactions: (CustomerTransaction | SupplierTransaction)[];
  totalCharges: number;
  totalPayments: number;
  overdueAmount: number;
  overdueCount: number;
}

export interface AgingData {
  current: number; // 0-30 días
  days30: number; // 31-60 días
  days60: number; // 61-90 días
  days90: number; // 90+ días
}
