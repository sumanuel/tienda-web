export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface SalesReportData {
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
  // Ventas sin monto en USD ni tasa: no entran en los totales
  unconvertedSales?: number;
  topProduct: {
    id: string;
    name: string;
    quantity: number;
    total: number;
  } | null;
  salesByDay: {
    date: string;
    total: number;
    transactions: number;
  }[];
  salesByProduct: {
    productId: string;
    productName: string;
    quantity: number;
    total: number;
  }[];
  salesByPaymentMethod: {
    method: string;
    total: number;
    transactions: number;
  }[];
  salesByHour: {
    hour: number;
    total: number;
    transactions: number;
  }[];
}

export interface PurchasesReportData {
  totalLocal: number;
  totalReference: number;
  purchasesCount: number;
  averageLocal: number;
  averageReference: number;
  taxLocal: number;
  creditLocal: number;
  creditReference: number;
  creditCount: number;
  returnsLocal: number;
  returnsReference: number;
  returnsCount: number;
  netLocal: number;
  netReference: number;
  byDay: {
    date: string;
    totalLocal: number;
    totalReference: number;
    count: number;
  }[];
  byPaymentMethod: {
    method: string;
    totalLocal: number;
    totalReference: number;
    count: number;
  }[];
  bySupplier: {
    supplierId: string;
    name: string;
    totalLocal: number;
    totalReference: number;
    count: number;
  }[];
  byProduct: {
    productId: string;
    productName: string;
    quantity: number;
    totalLocal: number;
    totalReference: number;
  }[];
}

export interface InventoryReportData {
  totalValue: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  inventoryTurnover: number;
  valueByCategory: {
    category: string;
    value: number;
    quantity: number;
  }[];
  stockDistribution: {
    category: string;
    count: number;
  }[];
  recentMovements: {
    date: Date;
    type: 'entry' | 'exit';
    quantity: number;
  }[];
  topRotation: {
    productId: string;
    productName: string;
    sales: number;
    stock: number;
  }[];
}

export interface FinancialReportData {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  profitMargin: number;
  accountsReceivable: number;
  accountsPayable: number;
  // Ventas sin monto en USD ni tasa: no entran en los ingresos
  unconvertedSales?: number;
  incomeStatement: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  revenueDistribution: {
    source: string;
    amount: number;
  }[];
}

export interface CashFlowReportData {
  openingBalance: number;
  totalInflows: number;
  totalOutflows: number;
  closingBalance: number;
  variation: number;
  dailyMovements: {
    date: string;
    inflows: number;
    outflows: number;
    balance: number;
  }[];
  inflowSources: {
    source: string;
    amount: number;
  }[];
  outflowCategories: {
    category: string;
    amount: number;
  }[];
}

export type ReportType =
  'sales' | 'purchases' | 'inventory' | 'financial' | 'cash-flow';

export interface ReportExportOptions {
  format: 'excel' | 'pdf';
  reportType: ReportType;
  dateRange?: DateRange;
  filename?: string;
}
