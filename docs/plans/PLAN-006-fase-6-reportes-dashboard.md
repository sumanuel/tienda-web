# PLAN-006: Fase 6 - Reportes y Dashboard Final

**Fecha**: 2026-08-08  
**Planificador**: planificador agent  
**Especificación Base**: FEATURE-001-tienda-web.md (Fase 6)  
**Fase Anterior**: Fase 5 (Cuentas por Cobrar/Pagar) ✅ Completada

---

## 📋 Resumen Ejecutivo

Implementar sistema completo de **Reportes y Analytics** con dashboards interactivos, gráficos avanzados, KPIs en tiempo real y exportación a Excel/PDF. Convertir el dashboard básico actual en un centro de comando ejecutivo con insights de negocio.

---

## 🎯 Objetivos de la Fase

### Objetivos Principales

1. ✅ **Dashboard Ejecutivo Completo**: KPIs, gráficos, alertas en tiempo real
2. ✅ **Reportes de Ventas**: Análisis por período, producto, cliente, método de pago
3. ✅ **Reportes de Inventario**: Valorización, movimientos, alertas de stock
4. ✅ **Reportes Financieros**: Flujo de caja, rentabilidad, cuentas por cobrar/pagar
5. ✅ **Exportación**: Excel (xlsx) y PDF de todos los reportes

### Métricas de Éxito

- ✅ 5+ tipos de reportes implementados
- ✅ Exportación funcional a Excel y PDF
- ✅ Gráficos interactivos con Recharts
- ✅ Carga de datos < 1s
- ✅ Build sin errores TypeScript

---

## 🏗️ Arquitectura de Reportes

### Estructura de Carpetas

```
tienda-web/
├── app/
│   └── dashboard/
│       ├── page.tsx                     # ✅ Mejorar dashboard principal
│       └── reports/                     # 🆕 Módulo de reportes
│           ├── page.tsx                 # 🆕 Hub de reportes
│           ├── sales/
│           │   └── page.tsx             # 🆕 Reporte de ventas
│           ├── inventory/
│           │   └── page.tsx             # 🆕 Reporte de inventario
│           ├── financial/
│           │   └── page.tsx             # 🆕 Reporte financiero
│           └── cash-flow/
│               └── page.tsx             # 🆕 Flujo de caja
├── lib/
│   ├── reports/
│   │   ├── salesReports.ts              # 🆕 Lógica reportes de ventas
│   │   ├── inventoryReports.ts          # 🆕 Lógica reportes de inventario
│   │   ├── financialReports.ts          # 🆕 Lógica reportes financieros
│   │   └── cashFlowReports.ts           # 🆕 Lógica flujo de caja
│   └── export/
│       ├── excelExporter.ts             # 🆕 Exportación a Excel
│       └── pdfExporter.ts               # 🆕 Exportación a PDF mejorada
├── components/
│   ├── reports/
│   │   ├── ReportCard.tsx               # 🆕 Card de reporte
│   │   ├── SalesChart.tsx               # 🆕 Gráfico de ventas
│   │   ├── InventoryChart.tsx           # 🆕 Gráfico de inventario
│   │   ├── CashFlowChart.tsx            # 🆕 Gráfico de flujo de caja
│   │   ├── DateRangePicker.tsx          # 🆕 Selector de rango de fechas
│   │   └── ExportButtons.tsx            # 🆕 Botones de exportación
│   └── dashboard/
│       ├── KPICard.tsx                  # ✅ Mejorar componente existente
│       ├── QuickStats.tsx               # 🆕 Estadísticas rápidas
│       ├── AlertsPanel.tsx              # 🆕 Panel de alertas
│       └── RecentActivity.tsx           # 🆕 Actividad reciente
├── types/
│   └── reports.ts                       # 🆕 Types para reportes
└── store/
    └── reportsStore.ts                  # 🆕 Zustand store para reportes
```

---

## 📊 Reportes a Implementar

### 1. Dashboard Ejecutivo (Mejora)

**Ubicación**: `app/dashboard/page.tsx`

**KPIs Principales** (Grid 4 columnas):

- 💰 **Ventas del Día**: Total, cantidad, ticket promedio
- 📦 **Inventario**: Valor total, productos bajo stock, alertas
- 👥 **Clientes**: Cuentas por cobrar, vencidas, total clientes
- 💳 **Proveedores**: Cuentas por pagar, vencidas, total proveedores

**Gráficos**:

- 📈 **Ventas últimos 7 días**: LineChart (Recharts)
- 📊 **Top 5 productos**: BarChart horizontal
- 🥧 **Ventas por método de pago**: PieChart
- 📉 **Flujo de caja mensual**: AreaChart

**Alertas** (Panel lateral):

- 🔴 Stock crítico (< 5 unidades)
- 🟠 Cuentas vencidas
- 🟡 Stock bajo (< 10 unidades)
- 🔵 Recordatorios (pagos próximos)

**Actividad Reciente**:

- Últimas 10 ventas
- Últimos movimientos de inventario
- Últimos pagos recibidos/realizados

---

### 2. Reporte de Ventas

**Ubicación**: `app/dashboard/reports/sales/page.tsx`

**Filtros**:

- 📅 Rango de fechas (hoy, ayer, última semana, mes, año, personalizado)
- 👤 Cliente (todos, cliente específico)
- 💳 Método de pago (todos, efectivo, tarjeta, transferencia, crédito)
- 👔 Cajero (todos, cajero específico)

**Métricas**:

- Total de ventas ($)
- Cantidad de transacciones
- Ticket promedio
- Producto más vendido
- Día/hora pico

**Tablas**:

- Ventas por día
- Ventas por producto (con cantidad y total)
- Ventas por cliente
- Ventas por método de pago

**Gráficos**:

- 📈 Ventas diarias (LineChart)
- 📊 Ventas por producto (BarChart top 10)
- 🥧 Métodos de pago (PieChart)
- 📉 Ventas por hora del día (BarChart)

**Exportación**:

- Excel: Tabla completa de ventas + resumen
- PDF: Reporte formateado con gráficos

---

### 3. Reporte de Inventario

**Ubicación**: `app/dashboard/reports/inventory/page.tsx`

**Métricas**:

- 💰 Valor total de inventario (costo)
- 📦 Total de productos
- ⚠️ Productos bajo stock
- 🔴 Productos sin stock
- 📈 Rotación de inventario (últimos 30 días)

**Tablas**:

- Productos por categoría (cantidad, valor)
- Stock actual completo (producto, cantidad, costo unitario, valor total)
- Productos bajo stock (alerta)
- Movimientos recientes (últimos 50)

**Gráficos**:

- 📊 Valor por categoría (BarChart)
- 🥧 Distribución de stock (PieChart)
- 📈 Movimientos últimos 30 días (LineChart: entradas vs salidas)
- 📉 Top 10 productos con mayor rotación

**Exportación**:

- Excel: Valorización completa + movimientos
- PDF: Reporte resumido con alertas

---

### 4. Reporte Financiero

**Ubicación**: `app/dashboard/reports/financial/page.tsx`

**Filtros**:

- 📅 Rango de fechas (mes actual, mes anterior, trimestre, año, personalizado)

**Métricas**:

- 💰 Ingresos totales (ventas)
- 💸 Egresos totales (pagos a proveedores)
- 📈 Utilidad bruta
- 📊 Margen de utilidad (%)
- 💳 Cuentas por cobrar
- 💰 Cuentas por pagar

**Tablas**:

- Estado de resultados (ingresos, egresos, utilidad)
- Flujo de caja (entradas, salidas, saldo)
- Cuentas por cobrar (clientes con saldo)
- Cuentas por pagar (proveedores con saldo)

**Gráficos**:

- 📈 Ingresos vs Egresos (LineChart)
- 📊 Utilidad mensual (BarChart últimos 12 meses)
- 🥧 Distribución de ingresos (PieChart: efectivo, tarjeta, crédito)
- 📉 Evolución de cuentas por cobrar/pagar (AreaChart)

**Exportación**:

- Excel: Estado de resultados completo + detalles
- PDF: Reporte financiero ejecutivo

---

### 5. Reporte de Flujo de Caja

**Ubicación**: `app/dashboard/reports/cash-flow/page.tsx`

**Filtros**:

- 📅 Rango de fechas
- 💳 Tipo de movimiento (todos, ingresos, egresos)

**Métricas**:

- 💰 Saldo inicial
- ➕ Total ingresos
- ➖ Total egresos
- 💵 Saldo final
- 📈 Variación (%)

**Tablas**:

- Movimientos diarios (fecha, tipo, concepto, monto)
- Ingresos por fuente (ventas contado, abonos clientes)
- Egresos por tipo (pagos proveedores, gastos)

**Gráficos**:

- 📈 Saldo acumulado diario (AreaChart)
- 📊 Ingresos vs Egresos diarios (BarChart agrupado)
- 🥧 Fuentes de ingreso (PieChart)
- 📉 Categorías de egreso (PieChart)

**Exportación**:

- Excel: Detalle completo de movimientos
- PDF: Resumen de flujo de caja

---

## 🔧 Implementación Técnica

### Fase 6.1: Infraestructura (Base)

**Duración**: 2-3 horas

**Archivos a Crear**:

#### 1. `types/reports.ts`

```typescript
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface SalesReportData {
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
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

export type ReportType = 'sales' | 'inventory' | 'financial' | 'cash-flow';

export interface ReportExportOptions {
  format: 'excel' | 'pdf';
  reportType: ReportType;
  dateRange?: DateRange;
  filename?: string;
}
```

#### 2. `lib/export/excelExporter.ts`

```typescript
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function exportToExcel(data: any[], filename: string) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd_HHmm', { locale: es })}.xlsx`;
  link.click();

  window.URL.revokeObjectURL(url);
}

export async function exportSalesReportToExcel(
  reportData: any,
  dateRange: any
) {
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const summary = [
    ['REPORTE DE VENTAS'],
    [
      'Período',
      `${format(dateRange.startDate, 'dd/MM/yyyy')} - ${format(dateRange.endDate, 'dd/MM/yyyy')}`,
    ],
    [],
    ['Total Ventas', reportData.totalSales],
    ['Total Transacciones', reportData.totalTransactions],
    ['Ticket Promedio', reportData.averageTicket],
    [],
    ['Producto Más Vendido', reportData.topProduct?.name || 'N/A'],
    ['Cantidad Vendida', reportData.topProduct?.quantity || 0],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Hoja 2: Ventas por Día
  const dailySales = reportData.salesByDay.map((day: any) => ({
    Fecha: day.date,
    'Ventas ($)': day.total,
    Transacciones: day.transactions,
  }));

  const dailySheet = XLSX.utils.json_to_sheet(dailySales);
  XLSX.utils.book_append_sheet(workbook, dailySheet, 'Ventas por Día');

  // Hoja 3: Ventas por Producto
  const productSales = reportData.salesByProduct.map((product: any) => ({
    Producto: product.productName,
    Cantidad: product.quantity,
    'Total ($)': product.total,
  }));

  const productSheet = XLSX.utils.json_to_sheet(productSales);
  XLSX.utils.book_append_sheet(workbook, productSheet, 'Ventas por Producto');

  // Exportar
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-ventas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
  link.click();

  window.URL.revokeObjectURL(url);
}
```

#### 3. `store/reportsStore.ts`

```typescript
import { create } from 'zustand';
import { DateRange } from '@/types/reports';
import { startOfMonth, endOfDay } from 'date-fns';

interface ReportsStore {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  resetToCurrentMonth: () => void;
}

export const useReportsStore = create<ReportsStore>((set) => ({
  dateRange: {
    startDate: startOfMonth(new Date()),
    endDate: endOfDay(new Date()),
  },
  setDateRange: (range) => set({ dateRange: range }),
  resetToCurrentMonth: () =>
    set({
      dateRange: {
        startDate: startOfMonth(new Date()),
        endDate: endOfDay(new Date()),
      },
    }),
}));
```

**Dependencias Nuevas**:

```bash
npm install xlsx
npm install --save-dev @types/xlsx
```

---

### Fase 6.2: Servicios de Reportes (Lógica de Negocio)

**Duración**: 4-5 horas

#### 1. `lib/reports/salesReports.ts`

```typescript
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Sale } from '@/types/sale';
import { SalesReportData, DateRange } from '@/types/reports';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

const SALES_COLLECTION = 'sales';

export async function getSalesReport(
  storeId: string,
  dateRange: DateRange
): Promise<SalesReportData> {
  const salesQuery = query(
    collection(db, SALES_COLLECTION),
    where('storeId', '==', storeId),
    where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate)),
    where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate))
  );

  const snapshot = await getDocs(salesQuery);
  const sales: Sale[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as Sale[];

  // Calcular métricas
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = sales.length;
  const averageTicket =
    totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // Top producto
  const productSales = new Map<
    string,
    { name: string; quantity: number; total: number }
  >();

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const existing = productSales.get(item.productId) || {
        name: item.productName,
        quantity: 0,
        total: 0,
      };

      productSales.set(item.productId, {
        name: item.productName,
        quantity: existing.quantity + item.quantity,
        total: existing.total + item.price * item.quantity,
      });
    });
  });

  const topProduct =
    productSales.size > 0
      ? Array.from(productSales.entries()).sort(
          (a, b) => b[1].quantity - a[1].quantity
        )[0]
      : null;

  // Ventas por día
  const days = eachDayOfInterval({
    start: dateRange.startDate,
    end: dateRange.endDate,
  });

  const salesByDay = days.map((day) => {
    const daySales = sales.filter(
      (sale) =>
        format(sale.createdAt!, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );

    return {
      date: format(day, 'dd MMM', { locale: es }),
      total: daySales.reduce((sum, sale) => sum + sale.total, 0),
      transactions: daySales.length,
    };
  });

  // Ventas por producto
  const salesByProduct = Array.from(productSales.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      quantity: data.quantity,
      total: data.total,
    }))
    .sort((a, b) => b.total - a.total);

  // Ventas por método de pago
  const paymentMethodSales = new Map<
    string,
    { total: number; transactions: number }
  >();

  sales.forEach((sale) => {
    const method = sale.paymentMethod;
    const existing = paymentMethodSales.get(method) || {
      total: 0,
      transactions: 0,
    };

    paymentMethodSales.set(method, {
      total: existing.total + sale.total,
      transactions: existing.transactions + 1,
    });
  });

  const salesByPaymentMethod = Array.from(paymentMethodSales.entries()).map(
    ([method, data]) => ({
      method,
      total: data.total,
      transactions: data.transactions,
    })
  );

  // Ventas por hora
  const hourSales = Array.from({ length: 24 }, (_, hour) => {
    const hourSalesData = sales.filter(
      (sale) => sale.createdAt && sale.createdAt.getHours() === hour
    );

    return {
      hour,
      total: hourSalesData.reduce((sum, sale) => sum + sale.total, 0),
      transactions: hourSalesData.length,
    };
  }).filter((hour) => hour.transactions > 0);

  return {
    totalSales,
    totalTransactions,
    averageTicket,
    topProduct: topProduct
      ? {
          id: topProduct[0],
          name: topProduct[1].name,
          quantity: topProduct[1].quantity,
          total: topProduct[1].total,
        }
      : null,
    salesByDay,
    salesByProduct,
    salesByPaymentMethod,
    salesByHour: hourSales,
  };
}
```

#### 2. `lib/reports/inventoryReports.ts`

```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types/product';
import { InventoryReportData } from '@/types/reports';

const PRODUCTS_COLLECTION = 'products';

export async function getInventoryReport(
  storeId: string
): Promise<InventoryReportData> {
  const productsQuery = query(
    collection(db, PRODUCTS_COLLECTION),
    where('storeId', '==', storeId)
  );

  const snapshot = await getDocs(productsQuery);
  const products: Product[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];

  // Valor total
  const totalValue = products.reduce(
    (sum, p) => sum + (p.cost || 0) * p.stock,
    0
  );

  const totalProducts = products.length;
  const lowStockProducts = products.filter(
    (p) => p.stock < 10 && p.stock >= 5
  ).length;
  const outOfStockProducts = products.filter((p) => p.stock < 5).length;

  // Valor por categoría
  const categoryMap = new Map<string, { value: number; quantity: number }>();

  products.forEach((product) => {
    const category = product.category || 'Sin Categoría';
    const existing = categoryMap.get(category) || { value: 0, quantity: 0 };

    categoryMap.set(category, {
      value: existing.value + (product.cost || 0) * product.stock,
      quantity: existing.quantity + product.stock,
    });
  });

  const valueByCategory = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      value: data.value,
      quantity: data.quantity,
    }))
    .sort((a, b) => b.value - a.value);

  // Distribución de stock
  const stockDistribution = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.quantity,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalValue,
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    inventoryTurnover: 0, // TODO: Calcular con histórico de ventas
    valueByCategory,
    stockDistribution,
    recentMovements: [], // TODO: Implementar con histórico
    topRotation: [], // TODO: Implementar con histórico de ventas
  };
}
```

#### 3. `lib/reports/financialReports.ts`

```typescript
import { FinancialReportData, DateRange } from '@/types/reports';
import { getSalesReport } from './salesReports';
import {
  getReceivablesSummary,
  getPayablesSummary,
} from '@/lib/accountsReceivable';
import { eachMonthOfInterval, format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function getFinancialReport(
  storeId: string,
  dateRange: DateRange
): Promise<FinancialReportData> {
  // Obtener datos de ventas
  const salesData = await getSalesReport(storeId, dateRange);

  // Obtener cuentas por cobrar/pagar
  const receivablesSummary = await getReceivablesSummary(storeId);
  const payablesSummary = await getPayablesSummary(storeId);

  const totalRevenue = salesData.totalSales;
  const totalExpenses = 0; // TODO: Implementar con sistema de gastos
  const grossProfit = totalRevenue - totalExpenses;
  const profitMargin =
    totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Estado de resultados por mes
  const months = eachMonthOfInterval({
    start: dateRange.startDate,
    end: dateRange.endDate,
  });

  const incomeStatement = months.map((month) => ({
    month: format(month, 'MMM yyyy', { locale: es }),
    revenue: 0, // TODO: Calcular ventas del mes
    expenses: 0, // TODO: Calcular gastos del mes
    profit: 0,
  }));

  // Distribución de ingresos por método de pago
  const revenueDistribution = salesData.salesByPaymentMethod.map((pm) => ({
    source:
      pm.method === 'cash'
        ? 'Efectivo'
        : pm.method === 'card'
          ? 'Tarjeta'
          : 'Transferencia',
    amount: pm.total,
  }));

  return {
    totalRevenue,
    totalExpenses,
    grossProfit,
    profitMargin,
    accountsReceivable: receivablesSummary.totalReceivable,
    accountsPayable: payablesSummary.totalPayable,
    incomeStatement,
    revenueDistribution,
  };
}
```

---

### Fase 6.3: Componentes de UI

**Duración**: 3-4 horas

#### 1. `components/reports/DateRangePicker.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from '@/types/reports';

interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DateRangePicker({ dateRange, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-500" />
        <input
          type="date"
          value={format(dateRange.startDate, 'yyyy-MM-dd')}
          onChange={(e) =>
            onChange({
              ...dateRange,
              startDate: new Date(e.target.value),
            })
          }
          className="border rounded px-3 py-2"
        />
      </div>

      <span className="text-gray-500">hasta</span>

      <input
        type="date"
        value={format(dateRange.endDate, 'yyyy-MM-dd')}
        onChange={(e) =>
          onChange({
            ...dateRange,
            endDate: new Date(e.target.value),
          })
        }
        className="border rounded px-3 py-2"
      />
    </div>
  );
}
```

#### 2. `components/reports/ExportButtons.tsx`

```typescript
'use client';

import { FileSpreadsheet, FileText } from 'lucide-react';

interface ExportButtonsProps {
  onExportExcel: () => void;
  onExportPDF: () => void;
  disabled?: boolean;
}

export default function ExportButtons({
  onExportExcel,
  onExportPDF,
  disabled = false,
}: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onExportExcel}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Excel
      </button>

      <button
        onClick={onExportPDF}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileText className="h-4 w-4" />
        PDF
      </button>
    </div>
  );
}
```

---

### Fase 6.4: Páginas de Reportes

**Duración**: 5-6 horas

#### 1. `app/dashboard/reports/page.tsx` (Hub de Reportes)

```typescript
'use client';

import Link from 'next/link';
import { BarChart3, Package, DollarSign, TrendingUp } from 'lucide-react';

const reports = [
  {
    id: 'sales',
    title: 'Reporte de Ventas',
    description: 'Análisis detallado de ventas por período, producto y cliente',
    icon: BarChart3,
    href: '/dashboard/reports/sales',
    color: 'bg-blue-500',
  },
  {
    id: 'inventory',
    title: 'Reporte de Inventario',
    description: 'Valorización, stock y movimientos de inventario',
    icon: Package,
    href: '/dashboard/reports/inventory',
    color: 'bg-purple-500',
  },
  {
    id: 'financial',
    title: 'Reporte Financiero',
    description: 'Estado de resultados, rentabilidad y flujo de caja',
    icon: DollarSign,
    href: '/dashboard/reports/financial',
    color: 'bg-green-500',
  },
  {
    id: 'cash-flow',
    title: 'Flujo de Caja',
    description: 'Ingresos, egresos y saldo detallado',
    icon: TrendingUp,
    href: '/dashboard/reports/cash-flow',
    color: 'bg-orange-500',
  },
];

export default function ReportsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-2">
          Analiza el rendimiento de tu negocio con reportes detallados
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;

          return (
            <Link
              key={report.id}
              href={report.href}
              className="block p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className={`${report.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {report.title}
                  </h3>
                  <p className="text-gray-600">{report.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

#### 2. `app/dashboard/reports/sales/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useReportsStore } from '@/store/reportsStore';
import { getSalesReport } from '@/lib/reports/salesReports';
import { exportSalesReportToExcel } from '@/lib/export/excelExporter';
import { SalesReportData } from '@/types/reports';
import DateRangePicker from '@/components/reports/DateRangePicker';
import ExportButtons from '@/components/reports/ExportButtons';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, ShoppingCart, DollarSign, Award } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SalesReportPage() {
  const { profile } = useAuthStore();
  const { dateRange, setDateRange } = useReportsStore();
  const [reportData, setReportData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [dateRange]);

  async function loadReport() {
    if (!profile?.storeId) return;

    setLoading(true);
    try {
      const data = await getSalesReport(profile.storeId, dateRange);
      setReportData(data);
    } catch (error) {
      console.error('Error loading sales report:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleExportExcel() {
    if (!reportData) return;
    exportSalesReportToExcel(reportData, dateRange);
  }

  function handleExportPDF() {
    // TODO: Implementar PDF
    alert('Exportación a PDF en desarrollo');
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reporte de Ventas</h1>
        <div className="flex items-center justify-between">
          <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
          <ExportButtons
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            disabled={!reportData}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total Ventas</span>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${reportData?.totalSales.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Transacciones</span>
            <ShoppingCart className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {reportData?.totalTransactions || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Ticket Promedio</span>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${reportData?.averageTicket.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Top Producto</span>
            <Award className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">
            {reportData?.topProduct?.name || 'N/A'}
          </p>
          <p className="text-xs text-gray-600">
            {reportData?.topProduct?.quantity || 0} unidades
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Ventas por día */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Ventas por Día</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData?.salesByDay || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Ventas ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top productos */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Top 5 Productos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.salesByProduct.slice(0, 5) || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="productName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#10b981" name="Ventas ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Métodos de pago */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Métodos de Pago</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData?.salesByPaymentMethod || []}
                dataKey="total"
                nameKey="method"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {(reportData?.salesByPaymentMethod || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Ventas por hora */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Ventas por Hora</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.salesByHour || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="transactions" fill="#f59e0b" name="Transacciones" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Detalle por Producto</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Producto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total ($)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData?.salesByProduct.map((product) => (
                <tr key={product.productId}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {product.productName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {product.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    ${product.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## 📋 Resumen de Entregables

### Archivos a Crear (25 archivos)

**Types** (1):

- `types/reports.ts`

**Servicios** (4):

- `lib/reports/salesReports.ts`
- `lib/reports/inventoryReports.ts`
- `lib/reports/financialReports.ts`
- `lib/reports/cashFlowReports.ts`

**Exportación** (2):

- `lib/export/excelExporter.ts`
- `lib/export/pdfExporter.ts`

**Store** (1):

- `store/reportsStore.ts`

**Componentes** (6):

- `components/reports/DateRangePicker.tsx`
- `components/reports/ExportButtons.tsx`
- `components/reports/SalesChart.tsx`
- `components/reports/InventoryChart.tsx`
- `components/reports/CashFlowChart.tsx`
- `components/dashboard/QuickStats.tsx`

**Páginas** (5):

- `app/dashboard/reports/page.tsx`
- `app/dashboard/reports/sales/page.tsx`
- `app/dashboard/reports/inventory/page.tsx`
- `app/dashboard/reports/financial/page.tsx`
- `app/dashboard/reports/cash-flow/page.tsx`

**Documentación** (2):

- `docs/implementation-summary/FASE-6-IMPLEMENTATION.md`
- Actualizar `CHANGELOG.md`

### Archivos a Modificar (1)

- `app/dashboard/page.tsx` (mejorar dashboard principal)

---

## 📦 Dependencias

```bash
npm install xlsx
npm install --save-dev @types/xlsx
```

Recharts ya está instalado (usado en Fase 5).

---

## ⏱️ Estimación de Tiempo

| Fase      | Descripción                                  | Duración   |
| --------- | -------------------------------------------- | ---------- |
| 6.1       | Infraestructura (types, stores, exportación) | 2-3h       |
| 6.2       | Servicios de reportes (lógica de negocio)    | 4-5h       |
| 6.3       | Componentes de UI                            | 3-4h       |
| 6.4       | Páginas de reportes                          | 5-6h       |
| 6.5       | Validación y QA                              | 2h         |
| **TOTAL** |                                              | **16-20h** |

---

## ✅ Criterios de Aceptación

### Funcionales

- [ ] Hub de reportes con 4 tipos de reportes
- [ ] Reporte de ventas con gráficos y filtros
- [ ] Reporte de inventario con valorización
- [ ] Reporte financiero con estado de resultados
- [ ] Reporte de flujo de caja
- [ ] Exportación a Excel funcional
- [ ] Exportación a PDF funcional
- [ ] Dashboard principal mejorado con gráficos

### Técnicos

- [ ] Build sin errores TypeScript
- [ ] Carga de reportes < 1s
- [ ] Gráficos responsive
- [ ] Código limpio y documentado

---

## 🚀 Orden de Implementación

1. ✅ Crear types/reports.ts
2. ✅ Crear store/reportsStore.ts
3. ✅ Instalar dependencia xlsx
4. ✅ Crear lib/export/excelExporter.ts
5. ✅ Crear lib/reports/salesReports.ts
6. ✅ Crear lib/reports/inventoryReports.ts
7. ✅ Crear lib/reports/financialReports.ts
8. ✅ Crear components/reports/DateRangePicker.tsx
9. ✅ Crear components/reports/ExportButtons.tsx
10. ✅ Crear app/dashboard/reports/page.tsx
11. ✅ Crear app/dashboard/reports/sales/page.tsx
12. ✅ Crear app/dashboard/reports/inventory/page.tsx
13. ✅ Crear app/dashboard/reports/financial/page.tsx
14. ✅ Validar build
15. ✅ Documentar

---

**Autor**: planificador agent  
**Fecha**: 2026-08-08  
**Versión**: 1.0
