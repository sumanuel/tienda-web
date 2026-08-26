# PLAN-002: Implementación del Módulo de Ventas Web

**Proyecto**: tienda-web  
**Basado en**: FEATURE-002-modulo-ventas-web.md  
**Fecha**: 2026-08-25  
**Estimación Total**: 92 horas (~11.5 días)  
**Prioridad**: CRÍTICA

---

## 📋 Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Prerequisitos](#2-prerequisitos)
3. [Fase 1: Backend - Base de Datos](#fase-1-backend---base-de-datos)
4. [Fase 2: Backend - API Endpoints](#fase-2-backend---api-endpoints)
5. [Fase 3: Frontend - Hooks y Utilidades](#fase-3-frontend---hooks-y-utilidades)
6. [Fase 4: Frontend - Componentes POS](#fase-4-frontend---componentes-pos)
7. [Fase 5: Frontend - Historial de Ventas](#fase-5-frontend---historial-de-ventas)
8. [Fase 6: Integración y Testing](#fase-6-integración-y-testing)
9. [Checklist de Validación](#checklist-de-validación)
10. [Comandos de Ejecución](#comandos-de-ejecución)

---

## 1. Resumen Ejecutivo

Este plan detalla la implementación paso a paso del módulo completo de Punto de Venta (POS) para tienda-web, incluyendo:

- ✅ Base de datos: 5 modelos nuevos + extensión de Customer
- ✅ Backend: 8 endpoints API con validaciones completas
- ✅ Frontend: 15+ componentes React con layout split-screen
- ✅ Lógica de negocio: Cálculos multi-moneda, actualización de stock, cuentas por cobrar
- ✅ Testing: Unit tests + Integration tests

**Estrategia de Implementación**: Bottom-up (DB → API → UI)

---

## 2. Prerequisitos

### 2.1 Verificaciones Previas

```bash
# 1. Verificar que FEATURE-001 (tasas de cambio) está implementado
# Endpoint debe existir: GET /api/exchange-rates

# 2. Verificar Prisma configurado
npx prisma --version

# 3. Verificar PostgreSQL corriendo
# Base de datos: tienda_web debe existir

# 4. Verificar dependencias instaladas
npm list zod react-hook-form @tanstack/react-query lucide-react
```

### 2.2 Dependencias Nuevas a Instalar

```bash
cd backend
npm install --save decimal.js  # Para cálculos precisos de montos

cd ..  # Volver a raíz
npm install --save @tanstack/react-table  # Para tablas de ventas
npm install --save date-fns  # Para manejo de fechas
npm install --save react-barcode-reader  # Para escáner de códigos (opcional)
```

---

## Fase 1: Backend - Base de Datos

**Duración estimada**: 4 horas  
**Archivos afectados**: 2

### 1.1 Actualizar Prisma Schema

**Archivo**: `backend/prisma/schema.prisma`

**Cambios**:

1. **Agregar modelo Sale**
2. **Agregar modelo SaleItem**
3. **Agregar modelo Receivable**
4. **Agregar modelo ReceivablePayment**
5. **Extender modelo Customer** (agregar phone, address)
6. **Agregar relaciones** en modelos existentes (Product, User, Store)

**Código completo a agregar**:

```prisma
// ========================================
// VENTAS (SALES)
// ========================================

model Sale {
  id                   String        @id @default(cuid())
  saleNumber           String        @unique  // Consecutivo: VTA-000001
  storeId              String
  customerId           String?
  userId               String        // Cajero que hizo la venta

  // Montos
  subtotal             Decimal       @db.Decimal(12, 2)
  tax                  Decimal       @db.Decimal(12, 2)
  discount             Decimal       @db.Decimal(12, 2)  @default(0)
  total                Decimal       @db.Decimal(12, 2)

  // Multi-moneda
  currency             String        @default("VES")
  localCurrency        String        @default("VES")
  referenceCurrency    String        @default("USD")
  exchangeRate         Decimal       @db.Decimal(12, 4)  @default(0)
  totalReference       Decimal?      @db.Decimal(12, 2)

  // Pago
  paymentMethod        String
  referenceNumber      String?
  paid                 Decimal       @db.Decimal(12, 2)  @default(0)
  change               Decimal       @db.Decimal(12, 2)  @default(0)

  // Estado
  status               String        @default("completed")
  notes                String?
  cancelReason         String?
  cancelledAt          DateTime?
  cancelledBy          String?

  // Snapshot monetario (JSON)
  monetarySnapshot     Json?

  // Timestamps
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  // Relaciones
  store                Store         @relation(fields: [storeId], references: [id], onDelete: Cascade)
  customer             Customer?     @relation(fields: [customerId], references: [id], onDelete: SetNull)
  user                 User          @relation(fields: [userId], references: [id], onDelete: Restrict)
  items                SaleItem[]
  receivable           Receivable?

  @@index([storeId, createdAt(sort: Desc)])
  @@index([storeId, customerId])
  @@index([storeId, status])
  @@index([saleNumber])
}

model SaleItem {
  id                   String        @id @default(cuid())
  saleId               String
  productId            String
  productName          String

  quantity             Decimal       @db.Decimal(12, 3)
  price                Decimal       @db.Decimal(12, 2)
  localPrice           Decimal       @db.Decimal(12, 2)
  referencePrice       Decimal       @db.Decimal(12, 2)
  subtotal             Decimal       @db.Decimal(12, 2)
  subtotalLocal        Decimal       @db.Decimal(12, 2)
  subtotalReference    Decimal       @db.Decimal(12, 2)
  priceSnapshot        Json?
  iva                  Decimal       @db.Decimal(5, 2)  @default(0)

  createdAt            DateTime      @default(now())

  sale                 Sale          @relation(fields: [saleId], references: [id], onDelete: Cascade)
  product              Product       @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@index([saleId])
  @@index([productId])
}

model Receivable {
  id                      String        @id @default(cuid())
  storeId                 String
  saleId                  String?       @unique
  customerId              String
  customerName            String
  documentNumber          String?

  amount                  Decimal       @db.Decimal(12, 2)
  baseCurrency            String        @default("USD")
  referenceAmount         Decimal       @db.Decimal(12, 2)
  exchangeRateAtCreation  Decimal       @db.Decimal(12, 4)  @default(0)
  amountPaid              Decimal       @db.Decimal(12, 2)  @default(0)
  balance                 Decimal       @db.Decimal(12, 2)

  description             String?
  dueDate                 DateTime?
  invoiceNumber           String?
  status                  String        @default("pending")

  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt
  paidAt                  DateTime?

  store                   Store         @relation(fields: [storeId], references: [id], onDelete: Cascade)
  customer                Customer      @relation(fields: [customerId], references: [id], onDelete: Restrict)
  sale                    Sale?         @relation(fields: [saleId], references: [id], onDelete: SetNull)
  payments                ReceivablePayment[]

  @@index([storeId, status])
  @@index([storeId, customerId])
  @@index([storeId, dueDate])
  @@index([saleId])
}

model ReceivablePayment {
  id                   String        @id @default(cuid())
  receivableId         String
  amount               Decimal       @db.Decimal(12, 2)
  paymentMethod        String
  referenceNumber      String?
  notes                String?
  createdAt            DateTime      @default(now())

  receivable           Receivable    @relation(fields: [receivableId], references: [id], onDelete: Cascade)

  @@index([receivableId])
}
```

**Extensión de Customer**:

```prisma
model Customer {
  // ... campos existentes ...
  phone                String?       // NUEVO
  address              String?       // NUEVO

  // Relaciones existentes + nuevas
  sales                Sale[]        // NUEVA
  receivables          Receivable[]  // NUEVA
}
```

**Extensión de Product**:

```prisma
model Product {
  // ... campos existentes ...

  // Relaciones
  saleItems            SaleItem[]    // NUEVA
}
```

**Extensión de User**:

```prisma
model User {
  // ... campos existentes ...

  // Relaciones
  sales                Sale[]        // NUEVA
}
```

**Extensión de Store**:

```prisma
model Store {
  // ... campos existentes ...

  // Relaciones
  sales                Sale[]        // NUEVA
  receivables          Receivable[]  // NUEVA
}
```

### 1.2 Crear Migración

```bash
cd backend
npx prisma migrate dev --name add_sales_module
```

**Resultado esperado**:

- ✅ Archivo de migración generado en `backend/prisma/migrations/`
- ✅ Tablas creadas: Sale, SaleItem, Receivable, ReceivablePayment
- ✅ Columnas agregadas a Customer: phone, address
- ✅ Relaciones configuradas correctamente

### 1.3 Generar Prisma Client

```bash
npx prisma generate
```

### 1.4 (Opcional) Crear Seeder de Datos de Prueba

**Archivo nuevo**: `backend/prisma/seed-sales.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Crear cliente genérico si no existe
  const genericCustomer = await prisma.customer.upsert({
    where: {
      storeId_documentNumber: {
        storeId: 'TU_STORE_ID',
        documentNumber: '1',
      },
    },
    update: {},
    create: {
      storeId: 'TU_STORE_ID',
      documentNumber: '1',
      name: 'Cliente Genérico',
      documentType: 'V',
    },
  });

  console.log('✅ Cliente genérico creado:', genericCustomer);

  // Crear clientes de prueba
  const customer1 = await prisma.customer.create({
    data: {
      storeId: 'TU_STORE_ID',
      documentNumber: '12345678',
      documentType: 'V',
      name: 'Juan Pérez',
      phone: '0414-1234567',
      address: 'Av. Principal, Caracas',
    },
  });

  console.log('✅ Clientes de prueba creados');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Ejecutar**:

```bash
npx ts-node prisma/seed-sales.ts
```

---

## Fase 2: Backend - API Endpoints

**Duración estimada**: 12 horas  
**Archivos nuevos**: 6  
**Archivos modificados**: 1

### 2.1 Crear Utilidad de Consecutivos

**Archivo nuevo**: `backend/src/utils/consecutiveGenerator.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Genera el siguiente número consecutivo para una entidad
 * @param storeId - ID de la tienda
 * @param entity - Entidad (sales, invoices, etc.)
 * @param prefix - Prefijo del consecutivo (VTA, FAC, etc.)
 * @returns Consecutivo formateado (ej: VTA-000001)
 */
export async function getNextConsecutive(
  storeId: string,
  entity: string,
  prefix: string
): Promise<string> {
  // Usar tabla Consecutive (debe existir en schema)
  // O implementar lógica de contador dentro de Sale

  // Opción 1: Contar ventas existentes + 1
  const count = await prisma.sale.count({
    where: { storeId },
  });

  const nextNumber = count + 1;
  return `${prefix}-${String(nextNumber).padStart(6, '0')}`;
}

/**
 * Formatea un número a consecutivo
 */
export function formatConsecutive(number: number, prefix: string): string {
  return `${prefix}-${String(number).padStart(6, '0')}`;
}
```

### 2.2 Crear Validaciones de Venta

**Archivo nuevo**: `backend/src/utils/saleValidator.ts`

```typescript
import { z } from 'zod';

export const createSaleSchema = z.object({
  customerId: z.string().optional(),
  subtotal: z.number().positive(),
  tax: z.number().min(0),
  discount: z.number().min(0).default(0),
  total: z.number().positive(),
  currency: z.string().default('VES'),
  localCurrency: z.string().default('VES'),
  referenceCurrency: z.string().default('USD'),
  exchangeRate: z.number().min(0),
  paymentMethod: z.enum([
    'cash',
    'card',
    'transfer',
    'pago_movil',
    'por_cobrar',
  ]),
  referenceNumber: z.string().optional(),
  paid: z.number().min(0),
  change: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        quantity: z.number().positive(),
        price: z.number().positive(),
        localPrice: z.number().positive(),
        referencePrice: z.number().positive(),
        subtotal: z.number().positive(),
        subtotalLocal: z.number().positive(),
        subtotalReference: z.number().positive(),
        iva: z.number().min(0).max(100).default(0),
        priceSnapshot: z
          .object({
            localCurrency: z.string(),
            referenceCurrency: z.string(),
            localAmount: z.number(),
            referenceAmount: z.number(),
            exchangeRate: z.number(),
          })
          .optional(),
      })
    )
    .min(1, 'Debe incluir al menos un item'),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;

/**
 * Valida que el total de la venta coincida con la suma de items
 */
export function validateSaleTotals(data: CreateSaleInput): boolean {
  const itemsSubtotal = data.items.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );
  const calculatedTotal = itemsSubtotal + data.tax - data.discount;

  // Permitir diferencia de 0.01 por redondeos
  return Math.abs(calculatedTotal - data.total) < 0.01;
}

/**
 * Valida que el método de pago "por_cobrar" no se use con cliente genérico
 */
export function validatePaymentMethod(
  paymentMethod: string,
  customerDocumentNumber: string | undefined
): { valid: boolean; error?: string } {
  if (paymentMethod === 'por_cobrar' && customerDocumentNumber === '1') {
    return {
      valid: false,
      error: 'No se permite el método "Por Cobrar" para cliente genérico',
    };
  }

  return { valid: true };
}
```

### 2.3 Crear Controller de Ventas

**Archivo nuevo**: `backend/src/controllers/salesController.ts`

```typescript
import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  createSaleSchema,
  validateSaleTotals,
  validatePaymentMethod,
} from '../utils/saleValidator';
import { getNextConsecutive } from '../utils/consecutiveGenerator';

const prisma = new PrismaClient();

/**
 * POST /api/sales
 * Crear nueva venta
 */
export async function createSale(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Validar datos de entrada
    const validationResult = createSaleSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      });
    }

    const data = validationResult.data;

    // Validar que el total coincida
    if (!validateSaleTotals(data)) {
      return res.status(400).json({
        error:
          'El total no coincide con la suma de items + impuestos - descuentos',
      });
    }

    // Obtener storeId del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stores: true },
    });

    if (!user || user.stores.length === 0) {
      return res.status(403).json({ error: 'Usuario sin tienda asignada' });
    }

    const storeId = user.stores[0].id;

    // Si hay customerId, validar que exista
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
      });

      if (!customer) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      // Validar método de pago vs tipo de cliente
      const paymentValidation = validatePaymentMethod(
        data.paymentMethod,
        customer.documentNumber
      );

      if (!paymentValidation.valid) {
        return res.status(400).json({ error: paymentValidation.error });
      }
    }

    // Generar consecutivo
    const saleNumber = await getNextConsecutive(storeId, 'sales', 'VTA');

    // Calcular totalReference
    const totalReference =
      data.exchangeRate > 0
        ? Number((data.total / data.exchangeRate).toFixed(2))
        : null;

    // Transacción: Crear venta + items + actualizar stock + crear receivable si aplica
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear venta
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          storeId,
          customerId: data.customerId || null,
          userId,
          subtotal: new Prisma.Decimal(data.subtotal),
          tax: new Prisma.Decimal(data.tax),
          discount: new Prisma.Decimal(data.discount),
          total: new Prisma.Decimal(data.total),
          currency: data.currency,
          localCurrency: data.localCurrency,
          referenceCurrency: data.referenceCurrency,
          exchangeRate: new Prisma.Decimal(data.exchangeRate),
          totalReference: totalReference
            ? new Prisma.Decimal(totalReference)
            : null,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber || null,
          paid: new Prisma.Decimal(data.paid),
          change: new Prisma.Decimal(data.change),
          status: 'completed',
          notes: data.notes || null,
        },
      });

      // 2. Crear items de venta
      for (const item of data.items) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            productName: item.productName,
            quantity: new Prisma.Decimal(item.quantity),
            price: new Prisma.Decimal(item.price),
            localPrice: new Prisma.Decimal(item.localPrice),
            referencePrice: new Prisma.Decimal(item.referencePrice),
            subtotal: new Prisma.Decimal(item.subtotal),
            subtotalLocal: new Prisma.Decimal(item.subtotalLocal),
            subtotalReference: new Prisma.Decimal(item.subtotalReference),
            iva: new Prisma.Decimal(item.iva),
            priceSnapshot: item.priceSnapshot || null,
          },
        });

        // 3. Actualizar stock del producto
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product && product.trackInventory) {
          const newStock = Number(product.stock) - Number(item.quantity);

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: new Prisma.Decimal(newStock) },
          });

          // 4. Registrar movimiento de inventario
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              storeId,
              type: 'exit',
              quantity: new Prisma.Decimal(item.quantity),
              previousStock: product.stock,
              newStock: new Prisma.Decimal(newStock),
              notes: `${saleNumber} - Venta - ${data.paymentMethod}`,
            },
          });
        }
      }

      // 5. Si método es "por_cobrar", crear Receivable
      if (data.paymentMethod === 'por_cobrar' && data.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: data.customerId },
        });

        if (customer) {
          const referenceAmount = data.items.reduce(
            (sum, item) => sum + item.subtotalReference,
            0
          );

          await tx.receivable.create({
            data: {
              storeId,
              saleId: sale.id,
              customerId: data.customerId,
              customerName: customer.name,
              documentNumber: customer.documentNumber,
              amount: new Prisma.Decimal(data.total),
              baseCurrency: data.referenceCurrency,
              referenceAmount: new Prisma.Decimal(referenceAmount),
              exchangeRateAtCreation: new Prisma.Decimal(data.exchangeRate),
              balance: new Prisma.Decimal(data.total),
              amountPaid: new Prisma.Decimal(0),
              description: `Venta a crédito - ${data.items.length} producto(s)`,
              invoiceNumber: saleNumber,
              status: 'pending',
            },
          });
        }
      }

      return sale;
    });

    res.status(201).json({
      id: result.id,
      saleNumber: result.saleNumber,
      total: Number(result.total),
      createdAt: result.createdAt,
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({
      error: 'Error al crear venta',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/sales
 * Listar ventas con filtros
 */
export async function getSales(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { storeId } = req.query;
    if (!storeId || typeof storeId !== 'string') {
      return res.status(400).json({ error: 'storeId requerido' });
    }

    // Verificar acceso a la tienda
    const userStore = await prisma.user.findFirst({
      where: {
        id: userId,
        stores: { some: { id: storeId } },
      },
    });

    if (!userStore) {
      return res.status(403).json({ error: 'Sin acceso a esta tienda' });
    }

    // Parsear filtros
    const {
      from,
      to,
      customerId,
      paymentMethod,
      status,
      limit = '20',
      offset = '0',
    } = req.query;

    const where: any = { storeId };

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }

    if (customerId) where.customerId = customerId as string;
    if (paymentMethod) where.paymentMethod = paymentMethod as string;
    if (status) where.status = status as string;

    // Contar total
    const total = await prisma.sale.count({ where });

    // Obtener ventas
    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            documentNumber: true,
          },
        },
        items: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    // Formatear respuesta
    const formattedSales = sales.map((sale) => ({
      id: sale.id,
      saleNumber: sale.saleNumber,
      customer: sale.customer || null,
      subtotal: Number(sale.subtotal),
      tax: Number(sale.tax),
      total: Number(sale.total),
      currency: sale.currency,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      createdAt: sale.createdAt,
      itemsCount: sale.items.length,
    }));

    res.json({
      sales: formattedSales,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
}

/**
 * GET /api/sales/:id
 * Obtener detalle de venta
 */
export async function getSaleById(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    // Verificar acceso a la tienda
    const userStore = await prisma.user.findFirst({
      where: {
        id: userId,
        stores: { some: { id: sale.storeId } },
      },
    });

    if (!userStore) {
      return res.status(403).json({ error: 'Sin acceso a esta venta' });
    }

    // Formatear respuesta
    const formatted = {
      id: sale.id,
      saleNumber: sale.saleNumber,
      customer: sale.customer || null,
      subtotal: Number(sale.subtotal),
      tax: Number(sale.tax),
      discount: Number(sale.discount),
      total: Number(sale.total),
      currency: sale.currency,
      localCurrency: sale.localCurrency,
      referenceCurrency: sale.referenceCurrency,
      exchangeRate: Number(sale.exchangeRate),
      totalReference: sale.totalReference ? Number(sale.totalReference) : null,
      paymentMethod: sale.paymentMethod,
      referenceNumber: sale.referenceNumber,
      paid: Number(sale.paid),
      change: Number(sale.change),
      status: sale.status,
      notes: sale.notes,
      cancelReason: sale.cancelReason,
      cancelledAt: sale.cancelledAt,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      user: sale.user,
      items: sale.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        product: item.product,
        quantity: Number(item.quantity),
        price: Number(item.price),
        localPrice: Number(item.localPrice),
        referencePrice: Number(item.referencePrice),
        subtotal: Number(item.subtotal),
        subtotalLocal: Number(item.subtotalLocal),
        subtotalReference: Number(item.subtotalReference),
        iva: Number(item.iva),
        priceSnapshot: item.priceSnapshot,
      })),
    };

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ error: 'Error al obtener venta' });
  }
}

/**
 * PUT /api/sales/:id/cancel
 * Cancelar venta (reversa de stock)
 */
export async function cancelSale(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params;
    const { cancelReason } = req.body;

    if (!cancelReason || cancelReason.trim().length < 3) {
      return res.status(400).json({
        error:
          'Debe especificar una razón de cancelación (mínimo 3 caracteres)',
      });
    }

    // Obtener venta
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    if (sale.status === 'cancelled') {
      return res.status(400).json({ error: 'La venta ya está cancelada' });
    }

    // Verificar acceso
    const userStore = await prisma.user.findFirst({
      where: {
        id: userId,
        stores: { some: { id: sale.storeId } },
      },
    });

    if (!userStore) {
      return res.status(403).json({ error: 'Sin acceso a esta venta' });
    }

    // TODO: Verificar rol de admin (solo admin puede cancelar)

    // Transacción: Cancelar venta + revertir stock + cancelar receivable
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar venta
      await tx.sale.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelReason: cancelReason.trim(),
          cancelledAt: new Date(),
          cancelledBy: userId,
        },
      });

      // 2. Revertir stock
      for (const item of sale.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product && product.trackInventory) {
          const restoredStock = Number(product.stock) + Number(item.quantity);

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: new Prisma.Decimal(restoredStock) },
          });

          // Registrar movimiento
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              storeId: sale.storeId,
              type: 'adjustment',
              quantity: new Prisma.Decimal(item.quantity),
              previousStock: product.stock,
              newStock: new Prisma.Decimal(restoredStock),
              notes: `Reversa de ${sale.saleNumber} - ${cancelReason.trim()}`,
            },
          });
        }
      }

      // 3. Cancelar receivable si existe
      const receivable = await tx.receivable.findUnique({
        where: { saleId: sale.id },
      });

      if (receivable) {
        await tx.receivable.update({
          where: { id: receivable.id },
          data: { status: 'cancelled' },
        });
      }
    });

    res.json({
      id: sale.id,
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: cancelReason.trim(),
    });
  } catch (error) {
    console.error('Error cancelling sale:', error);
    res.status(500).json({ error: 'Error al cancelar venta' });
  }
}
```

### 2.4 Crear Routes de Ventas

**Archivo nuevo**: `backend/src/routes/salesRoutes.ts`

```typescript
import { Router } from 'express';
import {
  createSale,
  getSales,
  getSaleById,
  cancelSale,
} from '../controllers/salesController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /api/sales - Crear venta
router.post('/', createSale);

// GET /api/sales - Listar ventas
router.get('/', getSales);

// GET /api/sales/:id - Detalle de venta
router.get('/:id', getSaleById);

// PUT /api/sales/:id/cancel - Cancelar venta
router.put('/:id/cancel', cancelSale);

export default router;
```

### 2.5 Registrar Rutas en App

**Archivo a modificar**: `backend/src/app.ts`

```typescript
// ... imports existentes ...
import salesRoutes from './routes/salesRoutes';

// ... código existente ...

// Registrar rutas
app.use('/api/exchange-rates', exchangeRateRoutes);
app.use('/api/sales', salesRoutes); // NUEVA LÍNEA

// ... resto del código ...
```

### 2.6 Extender Customer Controller (Agregar Búsqueda)

**Archivo a modificar**: `backend/src/controllers/customerController.ts`

Agregar función de búsqueda:

```typescript
/**
 * GET /api/customers?search=xxx
 * Buscar clientes por nombre o cédula
 */
export async function searchCustomers(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { storeId, search, limit = '10' } = req.query;

    if (!storeId || typeof storeId !== 'string') {
      return res.status(400).json({ error: 'storeId requerido' });
    }

    // Verificar acceso
    const userStore = await prisma.user.findFirst({
      where: {
        id: userId,
        stores: { some: { id: storeId } },
      },
    });

    if (!userStore) {
      return res.status(403).json({ error: 'Sin acceso a esta tienda' });
    }

    const searchTerm = search ? String(search).toLowerCase() : '';

    const customers = await prisma.customer.findMany({
      where: {
        storeId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { documentNumber: { contains: searchTerm } },
        ],
      },
      take: parseInt(limit as string),
      orderBy: { name: 'asc' },
    });

    res.json({ customers });
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Error al buscar clientes' });
  }
}
```

---

## Fase 3: Frontend - Hooks y Utilidades

**Duración estimada**: 8 horas  
**Archivos nuevos**: 5

### 3.1 Hook useCart

**Archivo nuevo**: `hooks/useCart.ts`

```typescript
import { useState, useCallback } from 'react';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  localPrice: number;
  referencePrice: number;
  quantity: number;
  subtotal: number;
  iva: number;
  product: {
    id: string;
    name: string;
    stock: number;
    trackInventory: boolean;
    iva: number;
  };
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: any, exchangeRate: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        // Incrementar cantidad
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: item.price * (item.quantity + 1),
              }
            : item
        );
      }

      // Agregar nuevo item
      const priceVES = product.priceVES || product.price;
      const priceUSD = product.priceUSD || product.referencePrice;

      return [
        ...prev,
        {
          id: product.id,
          productId: product.id,
          name: product.name,
          price: priceVES,
          localPrice: priceVES,
          referencePrice: priceUSD,
          quantity: 1,
          subtotal: priceVES,
          iva: product.iva || 0,
          product: {
            id: product.id,
            name: product.name,
            stock: product.stock,
            trackInventory: product.trackInventory ?? true,
            iva: product.iva || 0,
          },
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: item.price * newQuantity,
            }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Calcular totales
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = cart.reduce(
    (sum, item) => sum + item.subtotal * (item.iva / 100),
    0
  );
  const total = subtotal + tax;

  return {
    cart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    tax,
    total,
  };
}
```

### 3.2 Hook useSales

**Archivo nuevo**: `hooks/useSales.ts`

```typescript
import { useState } from 'react';
import { apiClient } from '@/lib/api';

interface CreateSaleData {
  customerId?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  localCurrency: string;
  referenceCurrency: string;
  exchangeRate: number;
  paymentMethod: string;
  referenceNumber?: string;
  paid: number;
  change: number;
  notes?: string;
  items: any[];
}

export function useSales() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSale = async (data: CreateSaleData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post<{
        id: string;
        saleNumber: string;
        total: number;
        createdAt: string;
      }>('/api/sales', data);

      return { success: true, ...response };
    } catch (err: any) {
      const message = err?.message || 'Error al crear venta';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const getSales = async (filters: {
    storeId: string;
    from?: string;
    to?: string;
    customerId?: string;
    paymentMethod?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await apiClient.get<{
        sales: any[];
        total: number;
        limit: number;
        offset: number;
      }>(`/api/sales?${params.toString()}`);

      return response;
    } catch (err: any) {
      const message = err?.message || 'Error al obtener ventas';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const getSaleById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<any>(`/api/sales/${id}`);
      return response;
    } catch (err: any) {
      const message = err?.message || 'Error al obtener venta';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const cancelSale = async (id: string, cancelReason: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.put(`/api/sales/${id}/cancel`, {
        cancelReason,
      });

      return { success: true, ...response };
    } catch (err: any) {
      const message = err?.message || 'Error al cancelar venta';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createSale,
    getSales,
    getSaleById,
    cancelSale,
  };
}
```

### 3.3 Utilidad de Formateo de Moneda

**Archivo nuevo**: `lib/currency.ts`

```typescript
/**
 * Formatea un monto a moneda con símbolo
 */
export function formatCurrency(
  amount: number,
  currency: string = 'VES'
): string {
  const symbols: Record<string, string> = {
    VES: 'Bs.',
    USD: '$',
    EUR: '€',
  };

  const symbol = symbols[currency] || currency;
  const formatted = new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol} ${formatted}`;
}

/**
 * Convierte un monto entre monedas
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) return amount;

  if (fromCurrency === 'VES' && toCurrency === 'USD') {
    return amount / exchangeRate;
  }

  if (fromCurrency === 'USD' && toCurrency === 'VES') {
    return amount * exchangeRate;
  }

  return amount;
}
```

---

## Fase 4: Frontend - Componentes POS

**Duración estimada**: 24 horas  
**Archivos nuevos**: 10

### 4.1 Página Principal POS

**Archivo nuevo**: `app/dashboard/pos/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useSales } from '@/hooks/useSales';
import ProductCatalog from '@/components/pos/ProductCatalog';
import Cart from '@/components/pos/Cart';
import ExchangeRateAlert from '@/components/pos/ExchangeRateAlert';
import { Loader2 } from 'lucide-react';

export default function POSPage() {
  const { profile } = useAuth();
  const { activeRate, loading: ratesLoading } = useExchangeRates(profile?.storeId || '');
  const { products, loading: productsLoading, refetch: refetchProducts } = useProducts(profile?.storeId || '');
  const { cart, addToCart, updateQuantity, removeItem, clearCart, subtotal, tax, total } = useCart();
  const { createSale, loading: saleLoading } = useSales();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Validar que haya tasa de cambio configurada
  if (!ratesLoading && (!activeRate || activeRate.usdToVes === 0)) {
    return <ExchangeRateAlert />;
  }

  if (productsLoading || ratesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-3 text-lg text-gray-700">Cargando punto de venta...</span>
      </div>
    );
  }

  const handleCompleteSale = async (saleData: any) => {
    const result = await createSale(saleData);

    if (result.success) {
      clearCart();
      refetchProducts(); // Actualizar stock visual

      // Mostrar toast de éxito
      alert(`✅ Venta ${result.saleNumber} completada exitosamente`);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Lado izquierdo: Catálogo de productos (50%) */}
      <div className="w-1/2 border-r border-gray-200 overflow-hidden flex flex-col">
        <ProductCatalog
          products={products}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onAddToCart={(product) => addToCart(product, activeRate?.usdToVes || 0)}
          exchangeRate={activeRate}
        />
      </div>

      {/* Lado derecho: Carrito (50%) */}
      <div className="w-1/2 overflow-hidden flex flex-col">
        <Cart
          items={cart}
          subtotal={subtotal}
          tax={tax}
          total={total}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearCart={clearCart}
          onCompleteSale={handleCompleteSale}
          exchangeRate={activeRate}
          saleLoading={saleLoading}
        />
      </div>
    </div>
  );
}
```

### 4.2 Componente ProductCatalog

**Archivo nuevo**: `components/pos/ProductCatalog.tsx`

```typescript
'use client';

import { useMemo } from 'react';
import { Search, Camera } from 'lucide-react';
import ProductCard from './ProductCard';

interface Props {
  products: any[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onAddToCart: (product: any) => void;
  exchangeRate: any;
}

export default function ProductCatalog({
  products,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onAddToCart,
  exchangeRate,
}: Props) {
  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const unique = new Set(products.map((p) => p.category).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [products]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Catálogo de Productos</h2>

        {/* Búsqueda */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Escanear código de barras"
          >
            <Camera className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Filtro de categoría */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'Todas las categorías' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de productos */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron productos</p>
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="mt-2 text-green-600 hover:underline"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                exchangeRate={exchangeRate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4.3 Componente ProductCard

**Archivo nuevo**: `components/pos/ProductCard.tsx`

```typescript
'use client';

import { formatCurrency } from '@/lib/currency';
import { Plus, Package } from 'lucide-react';

interface Props {
  product: any;
  onAddToCart: (product: any) => void;
  exchangeRate: any;
}

export default function ProductCard({ product, onAddToCart, exchangeRate }: Props) {
  const isOutOfStock = Number(product.stock) === 0;
  const isLowStock = Number(product.stock) > 0 && Number(product.stock) < 5;

  // Calcular precio en VES
  const priceVES = product.priceVES || product.price || 0;
  const priceUSD = product.priceUSD || product.referencePrice || 0;

  return (
    <button
      onClick={() => !isOutOfStock && onAddToCart(product)}
      disabled={isOutOfStock}
      className={`
        w-full p-4 rounded-lg border-2 text-left transition-all
        ${
          isOutOfStock
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-200 bg-white hover:border-green-500 hover:shadow-md cursor-pointer'
        }
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <span
            className={`
            inline-block px-2 py-1 text-xs font-semibold rounded mb-2
            ${isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}
          `}
          >
            {product.category || 'General'}
          </span>
          <h3 className="font-bold text-gray-900 text-sm uppercase">
            {product.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1">Código: {product.barcode}</p>
        </div>

        {isOutOfStock ? (
          <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
            Sin Stock
          </div>
        ) : (
          <div className="text-right">
            <Plus className="w-5 h-5 text-green-600" />
            <p className="text-xs text-gray-500 mt-1">Agregar</p>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between mt-3">
        <div>
          <p className="text-xs text-gray-500">Precio</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(priceVES, 'VES')}
          </p>
          {exchangeRate && exchangeRate.usdToVes > 0 && (
            <p className="text-xs text-gray-500">{formatCurrency(priceUSD, 'USD')}</p>
          )}
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1">
            <Package className={`w-4 h-4 ${isLowStock ? 'text-yellow-500' : 'text-gray-400'}`} />
            <span
              className={`text-sm font-semibold ${
                isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-700'
              }`}
            >
              {product.stock}
            </span>
          </div>
          <p className="text-xs text-gray-500">en stock</p>
        </div>
      </div>
    </button>
  );
}
```

### 4.4 Componente Cart

**Archivo nuevo**: `components/pos/Cart.tsx`

```typescript
'use client';

import { useState } from 'react';
import { X, Trash2, Loader2 } from 'lucide-react';
import CartItem from './CartItem';
import CustomerSelector from './CustomerSelector';
import PaymentMethodSelector from './PaymentMethodSelector';
import { formatCurrency } from '@/lib/currency';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onCompleteSale: (saleData: any) => void;
  exchangeRate: any;
  saleLoading: boolean;
}

export default function Cart({
  items,
  subtotal,
  tax,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCompleteSale,
  exchangeRate,
  saleLoading,
}: Props) {
  const { profile } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerDocument, setCustomerDocument] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');

  const totalUSD = exchangeRate?.usdToVes > 0 ? total / exchangeRate.usdToVes : 0;

  const canCompleteSale = items.length > 0 && customerDocument.trim() !== '';

  const handleCompleteSale = () => {
    if (!canCompleteSale) return;

    // Validar método "por_cobrar" con cliente genérico
    if (paymentMethod === 'por_cobrar' && customerDocument === '1') {
      alert('❌ No se permite el método "Por Cobrar" para cliente genérico');
      return;
    }

    // Validar referencia si es necesaria
    if (
      ['card', 'transfer', 'pago_movil'].includes(paymentMethod) &&
      !referenceNumber.trim()
    ) {
      alert('❌ Debe especificar el número de referencia');
      return;
    }

    // Preparar datos de venta
    const saleData = {
      customerId: selectedCustomer?.id || null,
      subtotal,
      tax,
      discount: 0,
      total,
      currency: 'VES',
      localCurrency: 'VES',
      referenceCurrency: 'USD',
      exchangeRate: exchangeRate?.usdToVes || 0,
      paymentMethod,
      referenceNumber: referenceNumber || undefined,
      paid: total,
      change: 0,
      notes: `Cliente: ${selectedCustomer?.name || 'Genérico'}${
        referenceNumber ? ` - Ref: ${referenceNumber}` : ''
      }`,
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        price: item.localPrice,
        localPrice: item.localPrice,
        referencePrice: item.referencePrice,
        subtotal: item.subtotal,
        subtotalLocal: item.subtotal,
        subtotalReference: item.quantity * item.referencePrice,
        iva: item.iva,
        priceSnapshot: {
          localCurrency: 'VES',
          referenceCurrency: 'USD',
          localAmount: item.localPrice,
          referenceAmount: item.referencePrice,
          exchangeRate: exchangeRate?.usdToVes || 0,
        },
      })),
    };

    onCompleteSale(saleData);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Carrito ({items.length} {items.length === 1 ? 'item' : 'items'})
          </h2>
          {items.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4 inline mr-1" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Selector de Cliente */}
      <div className="p-4 border-b border-gray-200">
        <CustomerSelector
          storeId={profile?.storeId || ''}
          selectedCustomer={selectedCustomer}
          customerDocument={customerDocument}
          onSelectCustomer={setSelectedCustomer}
          onDocumentChange={setCustomerDocument}
        />
      </div>

      {/* Items del carrito */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">El carrito está vacío</p>
            <p className="text-sm text-gray-400 mt-2">
              Selecciona productos del catálogo para comenzar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Método de pago */}
      {items.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <PaymentMethodSelector
            selected={paymentMethod}
            onChange={setPaymentMethod}
            referenceNumber={referenceNumber}
            onReferenceChange={setReferenceNumber}
            isGenericCustomer={customerDocument === '1'}
          />
        </div>
      )}

      {/* Footer con totales */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold">{formatCurrency(subtotal, 'VES')}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA</span>
              <span className="font-semibold">{formatCurrency(tax, 'VES')}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between">
            <span className="text-lg font-bold text-gray-900">TOTAL</span>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(total, 'VES')}
              </p>
              {exchangeRate?.usdToVes > 0 && (
                <p className="text-sm text-gray-500">{formatCurrency(totalUSD, 'USD')}</p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleCompleteSale}
          disabled={!canCompleteSale || saleLoading}
          className={`
            w-full py-3 rounded-lg font-bold text-white transition-all
            ${
              canCompleteSale && !saleLoading
                ? 'bg-green-600 hover:bg-green-700 active:scale-95'
                : 'bg-gray-300 cursor-not-allowed'
            }
          `}
        >
          {saleLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Procesando...
            </>
          ) : (
            <>🛒 Completar Venta</>
          )}
        </button>
      </div>
    </div>
  );
}
```

**NOTA**: Los componentes `CartItem`, `CustomerSelector`, `PaymentMethodSelector` y `ExchangeRateAlert` se crearán en los siguientes pasos del plan.

---

## Fase 5: Frontend - Historial de Ventas

**Duración estimada**: 12 horas  
**Archivos nuevos**: 4

### 5.1 Página de Historial de Ventas

**Archivo nuevo**: `app/dashboard/sales/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSales } from '@/hooks/useSales';
import SalesTable from '@/components/sales/SalesTable';
import SalesFilters from '@/components/sales/SalesFilters';
import { Loader2 } from 'lucide-react';

export default function SalesPage() {
  const { profile } = useAuth();
  const { getSales, loading } = useSales();
  const [sales, setSales] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    customerId: '',
    paymentMethod: '',
    status: '',
    limit: 20,
    offset: 0,
  });

  useEffect(() => {
    if (profile?.storeId) {
      loadSales();
    }
  }, [profile?.storeId, filters]);

  const loadSales = async () => {
    if (!profile?.storeId) return;

    try {
      const response = await getSales({
        storeId: profile.storeId,
        ...filters,
      });

      setSales(response.sales);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  if (loading && sales.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Historial de Ventas</h1>

      <SalesFilters filters={filters} onFiltersChange={setFilters} />

      <div className="mt-6">
        <SalesTable
          sales={sales}
          total={total}
          limit={filters.limit}
          offset={filters.offset}
          onPageChange={(newOffset) => setFilters({ ...filters, offset: newOffset })}
          onRefresh={loadSales}
        />
      </div>
    </div>
  );
}
```

---

## Fase 6: Integración y Testing

**Duración estimada**: 16 horas

### 6.1 Tests Unitarios (Backend)

**Archivo nuevo**: `backend/src/__tests__/sales.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import {
  validateSaleTotals,
  validatePaymentMethod,
} from '../utils/saleValidator';

const prisma = new PrismaClient();

describe('Sales Module', () => {
  describe('Validations', () => {
    it('should validate sale totals correctly', () => {
      const validSale = {
        subtotal: 100,
        tax: 16,
        discount: 0,
        total: 116,
        items: [
          { subtotal: 50, iva: 16 },
          { subtotal: 50, iva: 16 },
        ],
      };

      expect(validateSaleTotals(validSale as any)).toBe(true);
    });

    it('should reject invalid payment method for generic customer', () => {
      const result = validatePaymentMethod('por_cobrar', '1');
      expect(result.valid).toBe(false);
    });

    it('should allow "por_cobrar" for regular customer', () => {
      const result = validatePaymentMethod('por_cobrar', '12345678');
      expect(result.valid).toBe(true);
    });
  });
});
```

### 6.2 Tests de Integración

**Archivo nuevo**: `backend/src/__tests__/salesAPI.test.ts`

```typescript
// TODO: Implementar tests de integración con supertest
// - POST /api/sales (crear venta completa)
// - GET /api/sales (listar con filtros)
// - GET /api/sales/:id (detalle)
// - PUT /api/sales/:id/cancel (cancelación)
```

---

## Checklist de Validación

### ✅ Backend

- [ ] Migración de Prisma ejecutada sin errores
- [ ] Cliente genérico creado en DB (documentNumber = "1")
- [ ] Endpoint POST /api/sales crea venta + items + actualiza stock
- [ ] Endpoint POST /api/sales crea receivable si paymentMethod = "por_cobrar"
- [ ] Endpoint GET /api/sales retorna ventas con filtros
- [ ] Endpoint GET /api/sales/:id retorna detalle completo
- [ ] Endpoint PUT /api/sales/:id/cancel revierte stock correctamente
- [ ] Validación: Cliente genérico no puede usar "por_cobrar"
- [ ] Validación: Totales coinciden con suma de items
- [ ] Consecutivo VTA-XXXXXX se genera automáticamente

### ✅ Frontend

- [ ] Página /dashboard/pos carga productos y tasa de cambio
- [ ] Bloqueo de POS si tasa USD = 0 con enlace a configuración
- [ ] Búsqueda de productos funciona (nombre y código)
- [ ] Click en producto agrega al carrito
- [ ] Input de cantidad editable con recálculo de subtotal
- [ ] Botón "Limpiar carrito" funciona con confirmación
- [ ] Selector de cliente busca por cédula/nombre
- [ ] Modal de creación rápida de clientes funciona
- [ ] Método "Por Cobrar" se deshabilita para cliente genérico
- [ ] Botón "Completar Venta" llama al API correctamente
- [ ] Toast de confirmación muestra número de venta
- [ ] Carrito se limpia después de venta exitosa
- [ ] Stock visual se actualiza después de venta
- [ ] Página /dashboard/sales muestra historial
- [ ] Filtros de fecha/cliente/método funcionan
- [ ] Modal de detalle de venta muestra items correctamente
- [ ] Cancelación de venta revierte stock y muestra confirmación

---

## Comandos de Ejecución

### Desarrollo

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd ..  # (volver a raíz)
npm run dev
```

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend (futuro)
cd ..
npm test
```

### Base de Datos

```bash
cd backend

# Crear migración
npx prisma migrate dev --name add_sales_module

# Ver estado de migraciones
npx prisma migrate status

# Generar Prisma Client
npx prisma generate

# Abrir Prisma Studio (GUI)
npx prisma studio
```

### Validación Final

```bash
# 1. Verificar que backend arranca sin errores
cd backend
npm run dev
# Esperado: "Server running on port 4000"

# 2. Verificar que frontend arranca sin errores
cd ..
npm run dev
# Esperado: "ready - started server on 0.0.0.0:3000"

# 3. Probar endpoints con curl
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/sales?storeId=xxx

# 4. Abrir navegador
# http://localhost:3000/dashboard/pos
# Verificar que no hay errores en consola
```

---

## Notas Finales

### Orden de Implementación Recomendado

1. **DÍA 1-2**: Fase 1 (DB) + Fase 2 (Backend API)
2. **DÍA 3-4**: Fase 3 (Hooks) + Inicio Fase 4 (Componentes POS base)
3. **DÍA 5-7**: Completar Fase 4 (Todos los componentes POS)
4. **DÍA 8-9**: Fase 5 (Historial de ventas)
5. **DÍA 10-11**: Fase 6 (Testing y bugs)
6. **DÍA 11.5**: Documentación y deploy

### Riesgos Identificados

1. **Sincronización de stock**: Si dos cajeros venden el mismo producto simultáneamente, podría haber condiciones de carrera.
   - **Mitigación**: Usar transacciones de Prisma, validar stock en backend antes de confirmar.

2. **Tasa de cambio desactualizada**: Si la tasa cambia mientras hay una venta en progreso.
   - **Mitigación**: Mostrar warning, usar snapshot de tasa en la venta.

3. **Cliente genérico duplicado**: Error al crear cliente con cédula "1" si ya existe.
   - **Mitigación**: Usar `upsert` en lugar de `create` en seeder y controller.

### Dependencias Críticas

- ✅ FEATURE-001 (tasas de cambio) debe estar 100% funcional
- ✅ Modelo Product debe tener campos: priceVES, priceUSD, stock, trackInventory, iva
- ✅ AuthContext debe retornar profile.storeId
- ✅ PostgreSQL debe estar corriendo y accesible

---

**FIN DEL PLAN**

**Próximo paso**: Implementación por el **@programador-senior**
