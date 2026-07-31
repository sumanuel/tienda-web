# PLAN-002: tienda-web - Fase 2 (POS y Productos)

**Fecha**: 2026-07-31  
**Planificador**: planificador agent  
**Basado en**: FEATURE-001-tienda-web.md  
**Fase**: 2 de 7 - Módulo POS y Productos  
**Duración Estimada**: 2 semanas (80 horas)

---

## 📋 Resumen de la Fase

**Objetivos**:

- CRUD completo de productos con multi-moneda
- Pantalla POS funcional con búsqueda rápida
- Sistema de carrito de compra
- Procesamiento de ventas con actualización de inventario
- Generación de recibos en PDF
- Integración con Firebase Firestore para persistencia

**Entregables**:

- [ ] Tipos TypeScript para Product, Sale, SaleItem
- [ ] Servicios Firebase (productos, ventas)
- [ ] Store Zustand para productos y carrito
- [ ] CRUD de Productos (tabla + formulario + imágenes)
- [ ] Pantalla POS con búsqueda y carrito
- [ ] Procesamiento de venta completo
- [ ] Generación de recibos PDF
- [ ] Actualización automática de inventario

---

## 🏗️ Arquitectura de la Fase 2

```
tienda-web/
├── app/
│   └── dashboard/
│       ├── products/
│       │   ├── page.tsx              # Lista de productos
│       │   ├── new/
│       │   │   └── page.tsx          # Crear producto
│       │   └── [id]/
│       │       └── edit/
│       │           └── page.tsx      # Editar producto
│       ├── pos/
│       │   └── page.tsx              # Punto de venta
│       └── sales/
│           ├── page.tsx              # Historial de ventas
│           └── [id]/
│               └── page.tsx          # Detalle de venta
│
├── components/
│   ├── products/
│   │   ├── ProductTable.tsx          # Tabla con TanStack Table
│   │   ├── ProductForm.tsx           # Formulario crear/editar
│   │   ├── ProductCard.tsx           # Card de producto
│   │   ├── ProductSearch.tsx         # Búsqueda con autocompletado
│   │   └── ImageUpload.tsx           # Subida de imágenes
│   ├── pos/
│   │   ├── POSSearchBar.tsx          # Barra de búsqueda
│   │   ├── ProductGrid.tsx           # Grid de productos populares
│   │   ├── ShoppingCart.tsx          # Carrito de compra
│   │   ├── CartItem.tsx              # Item del carrito
│   │   └── PaymentModal.tsx          # Modal de pago
│   └── sales/
│       ├── SalesTable.tsx            # Tabla de ventas
│       ├── SaleDetail.tsx            # Detalle de venta
│       └── ReceiptPDF.tsx            # Componente de recibo
│
├── lib/
│   ├── products.ts                   # CRUD de productos
│   ├── sales.ts                      # CRUD de ventas
│   ├── inventory.ts                  # Actualización de inventario
│   ├── receipt.ts                    # Generación de PDF
│   └── storage.ts                    # Firebase Storage helpers
│
├── hooks/
│   ├── useProducts.ts                # Hook de productos
│   ├── useSales.ts                   # Hook de ventas
│   └── useCart.ts                    # Hook del carrito
│
├── store/
│   ├── productsStore.ts              # Zustand store productos
│   └── cartStore.ts                  # Zustand store carrito
│
└── types/
    ├── product.ts                    # Interfaces de productos
    └── sale.ts                       # Interfaces de ventas
```

---

## 📦 Dependencias Adicionales

```json
{
  "dependencies": {
    "@tanstack/react-table": "^8.13.0",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "react-dropzone": "^14.2.3"
  }
}
```

**Instalación**:

```bash
npm install @tanstack/react-table jspdf jspdf-autotable react-dropzone
```

---

## 🎯 Plan de Implementación Detallado

### Tarea 1: Tipos TypeScript y Modelo de Datos (3 horas)

**Objetivo**: Definir interfaces TypeScript para Product, Sale, SaleItem y configurar colecciones Firestore

**Archivos a crear**:

- `types/product.ts`
- `types/sale.ts`

**Código**:

**types/product.ts**:

```typescript
export interface Product {
  id: string;
  storeId: string;
  code: string; // Código único del producto
  barcode?: string; // Código de barras
  name: string;
  description?: string;
  category: string; // Categoría (Electrónica, Alimentos, etc.)

  // Precios multi-moneda
  prices: {
    VES?: number;
    USD?: number;
    EUR?: number;
  };

  cost: number; // Costo de adquisición
  costCurrency: string; // Moneda del costo

  stock: number; // Stock actual
  stockMin: number; // Stock mínimo (alerta)
  trackInventory: boolean; // ¿Controlar inventario?

  supplierId?: string; // ID del proveedor
  imageUrl?: string; // URL de la imagen en Firebase Storage

  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  code: string;
  barcode?: string;
  name: string;
  description?: string;
  category: string;
  priceVES?: number;
  priceUSD?: number;
  priceEUR?: number;
  cost: number;
  costCurrency: string;
  stock: number;
  stockMin: number;
  trackInventory: boolean;
  supplierId?: string;
  image?: File;
}
```

**types/sale.ts**:

```typescript
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
```

**Validación**:

- [ ] Compilación TypeScript sin errores
- [ ] Interfaces completas y documentadas

---

### Tarea 2: Servicios Firebase - Productos (6 horas)

**Objetivo**: Crear funciones CRUD para productos en Firestore

**Archivo a crear**: `lib/products.ts`

**Código**:

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, ProductFormData } from '@/types/product';
import { uploadImage, deleteImage } from './storage';

const PRODUCTS_COLLECTION = 'products';

/**
 * Convierte Firestore Timestamp a Date
 */
function convertTimestamps(data: any): any {
  const converted = { ...data };
  if (converted.createdAt instanceof Timestamp) {
    converted.createdAt = converted.createdAt.toDate();
  }
  if (converted.updatedAt instanceof Timestamp) {
    converted.updatedAt = converted.updatedAt.toDate();
  }
  return converted;
}

/**
 * Genera código único de producto
 */
async function generateProductCode(storeId: string): Promise<string> {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  const q = query(
    productsRef,
    where('storeId', '==', storeId),
    orderBy('code', 'desc')
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return 'PROD-0001';
  }

  const lastCode = snapshot.docs[0].data().code as string;
  const numberPart = parseInt(lastCode.split('-')[1], 10);
  const newNumber = numberPart + 1;

  return `PROD-${newNumber.toString().padStart(4, '0')}`;
}

/**
 * Crear producto
 */
export async function createProduct(
  storeId: string,
  data: ProductFormData
): Promise<Product> {
  try {
    // Generar código si no se proporcionó
    const code = data.code || (await generateProductCode(storeId));

    // Subir imagen si existe
    let imageUrl: string | undefined;
    if (data.image) {
      imageUrl = await uploadImage(data.image, `products/${storeId}/${code}`);
    }

    const productData = {
      storeId,
      code,
      barcode: data.barcode || null,
      name: data.name,
      description: data.description || null,
      category: data.category,
      prices: {
        VES: data.priceVES || null,
        USD: data.priceUSD || null,
        EUR: data.priceEUR || null,
      },
      cost: data.cost,
      costCurrency: data.costCurrency,
      stock: data.stock,
      stockMin: data.stockMin,
      trackInventory: data.trackInventory,
      supplierId: data.supplierId || null,
      imageUrl: imageUrl || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, PRODUCTS_COLLECTION),
      productData
    );

    const newProduct = {
      id: docRef.id,
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Product;

    return newProduct;
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error('Error al crear producto');
  }
}

/**
 * Obtener todos los productos de una tienda
 */
export async function getProducts(storeId: string): Promise<Product[]> {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(
      productsRef,
      where('storeId', '==', storeId),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertTimestamps(data),
      } as Product;
    });
  } catch (error) {
    console.error('Error getting products:', error);
    throw new Error('Error al obtener productos');
  }
}

/**
 * Obtener producto por ID
 */
export async function getProductById(
  productId: string
): Promise<Product | null> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...convertTimestamps(data),
    } as Product;
  } catch (error) {
    console.error('Error getting product:', error);
    throw new Error('Error al obtener producto');
  }
}

/**
 * Actualizar producto
 */
export async function updateProduct(
  productId: string,
  data: Partial<ProductFormData>
): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);

    // Si hay una nueva imagen, subirla
    let imageUrl: string | undefined;
    if (data.image) {
      // Obtener producto actual para eliminar imagen anterior
      const currentProduct = await getProductById(productId);
      if (currentProduct?.imageUrl) {
        await deleteImage(currentProduct.imageUrl);
      }

      imageUrl = await uploadImage(
        data.image,
        `products/${currentProduct?.storeId}/${data.code || currentProduct?.code}`
      );
    }

    const updateData: any = {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category && { category: data.category }),
      ...(data.barcode !== undefined && { barcode: data.barcode }),
      ...(data.cost !== undefined && { cost: data.cost }),
      ...(data.costCurrency && { costCurrency: data.costCurrency }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.stockMin !== undefined && { stockMin: data.stockMin }),
      ...(data.trackInventory !== undefined && {
        trackInventory: data.trackInventory,
      }),
      ...(data.supplierId !== undefined && { supplierId: data.supplierId }),
      ...(imageUrl && { imageUrl }),
      updatedAt: serverTimestamp(),
    };

    // Actualizar precios si se proporcionaron
    if (
      data.priceVES !== undefined ||
      data.priceUSD !== undefined ||
      data.priceEUR !== undefined
    ) {
      updateData.prices = {
        VES: data.priceVES || null,
        USD: data.priceUSD || null,
        EUR: data.priceEUR || null,
      };
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Error al actualizar producto');
  }
}

/**
 * Eliminar producto
 */
export async function deleteProduct(productId: string): Promise<void> {
  try {
    // Obtener producto para eliminar imagen
    const product = await getProductById(productId);

    if (product?.imageUrl) {
      await deleteImage(product.imageUrl);
    }

    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new Error('Error al eliminar producto');
  }
}

/**
 * Buscar productos por nombre o código
 */
export async function searchProducts(
  storeId: string,
  searchTerm: string
): Promise<Product[]> {
  const allProducts = await getProducts(storeId);
  const term = searchTerm.toLowerCase();

  return allProducts.filter((product) => {
    return (
      product.name.toLowerCase().includes(term) ||
      product.code.toLowerCase().includes(term) ||
      product.barcode?.toLowerCase().includes(term)
    );
  });
}

/**
 * Actualizar stock de producto
 */
export async function updateProductStock(
  productId: string,
  newStock: number
): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(docRef, {
      stock: newStock,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    throw new Error('Error al actualizar stock');
  }
}
```

**Validación**:

- [ ] Funciones CRUD funcionan correctamente
- [ ] Imágenes se suben a Firebase Storage
- [ ] Generación de código automático funciona
- [ ] Búsqueda de productos funciona

---

### Tarea 3: Servicios Firebase - Storage (2 horas)

**Objetivo**: Funciones helper para subir/eliminar imágenes en Firebase Storage

**Archivo a crear**: `lib/storage.ts`

**Código**:

```typescript
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './firebase';

/**
 * Subir imagen a Firebase Storage
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  try {
    // Crear referencia con extensión del archivo
    const extension = file.name.split('.').pop();
    const storageRef = ref(storage, `${path}.${extension}`);

    // Subir archivo
    const snapshot = await uploadBytes(storageRef, file);

    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Error al subir imagen');
  }
}

/**
 * Eliminar imagen de Firebase Storage
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extraer path de la URL
    const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
    if (!imageUrl.startsWith(baseUrl)) {
      throw new Error('URL inválida');
    }

    const path = imageUrl.replace(baseUrl, '').split('/o/')[1].split('?')[0];

    const decodedPath = decodeURIComponent(path);

    const storageRef = ref(storage, decodedPath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // No lanzar error, solo logear (la imagen puede no existir)
  }
}
```

---

### Tarea 4: Store Zustand - Productos (2 horas)

**Objetivo**: Crear store global para productos

**Archivo a crear**: `store/productsStore.ts`

**Código**:

```typescript
import { create } from 'zustand';
import { Product } from '@/types/product';

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;

  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useProductsStore = create<ProductsState>((set) => ({
  products: [],
  loading: false,
  error: null,

  setProducts: (products) => set({ products, error: null }),

  addProduct: (product) =>
    set((state) => ({
      products: [...state.products, product],
    })),

  updateProduct: (id, updatedProduct) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updatedProduct } : p
      ),
    })),

  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  reset: () => set({ products: [], loading: false, error: null }),
}));
```

---

### Tarea 5: Store Zustand - Carrito (3 horas)

**Objetivo**: Crear store global para el carrito de compra

**Archivo a crear**: `store/cartStore.ts`

**Código**:

```typescript
import { create } from 'zustand';
import { CartItem } from '@/types/sale';

interface CartState {
  items: CartItem[];
  currency: string;

  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;
  setCurrency: (currency: string) => void;

  // Computed values
  getSubtotal: () => number;
  getDiscount: () => number;
  getTax: (taxRate: number) => number;
  getTotal: (taxRate: number) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  currency: 'VES',

  addItem: (item) =>
    set((state) => {
      // Verificar si el producto ya está en el carrito
      const existingIndex = state.items.findIndex(
        (i) => i.productId === item.productId
      );

      if (existingIndex >= 0) {
        // Si existe, incrementar cantidad
        const newItems = [...state.items];
        const existingItem = newItems[existingIndex];

        newItems[existingIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + item.quantity,
          subtotal:
            (existingItem.quantity + item.quantity) *
            existingItem.price *
            (1 - existingItem.discount / 100),
        };

        return { items: newItems };
      } else {
        // Si no existe, agregar
        return { items: [...state.items, item] };
      }
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.price * (1 - item.discount / 100),
            }
          : item
      ),
    })),

  updateDiscount: (productId, discount) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              discount,
              subtotal: item.quantity * item.price * (1 - discount / 100),
            }
          : item
      ),
    })),

  clearCart: () => set({ items: [] }),

  setCurrency: (currency) => set({ currency }),

  getSubtotal: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getDiscount: () => {
    const state = get();
    return state.items.reduce((sum, item) => {
      const discountAmount = item.quantity * item.price * (item.discount / 100);
      return sum + discountAmount;
    }, 0);
  },

  getTax: (taxRate) => {
    const subtotal = get().getSubtotal();
    return subtotal * (taxRate / 100);
  },

  getTotal: (taxRate) => {
    const subtotal = get().getSubtotal();
    const tax = get().getTax(taxRate);
    return subtotal + tax;
  },
}));
```

---

### Tarea 6: Componente ProductTable (4 horas)

**Objetivo**: Tabla de productos con TanStack Table, búsqueda y acciones

**Archivo a crear**: `components/products/ProductTable.tsx`

**Código**:

```typescript
'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Product } from '@/types/product';
import { Pencil, Trash2, Search } from 'lucide-react';
import Link from 'next/link';

interface ProductTableProps {
  products: Product[];
  onDelete: (productId: string) => void;
}

export default function ProductTable({ products, onDelete }: ProductTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Código',
        cell: (info) => (
          <span className="font-mono text-sm">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: (info) => (
          <div className="flex items-center gap-2">
            {info.row.original.imageUrl && (
              <img
                src={info.row.original.imageUrl}
                alt={info.getValue() as string}
                className="h-10 w-10 rounded object-cover"
              />
            )}
            <span className="font-medium">{info.getValue() as string}</span>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Categoría',
      },
      {
        header: 'Precio (USD)',
        accessorFn: (row) => row.prices.USD,
        cell: (info) => {
          const price = info.getValue() as number | null;
          return price ? `$${price.toFixed(2)}` : '—';
        },
      },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: (info) => {
          const stock = info.getValue() as number;
          const min = info.row.original.stockMin;
          const isLow = stock <= min;

          return (
            <span
              className={`rounded px-2 py-1 text-sm font-medium ${
                isLow
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {stock}
              {isLow && ' ⚠️'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: (info) => (
          <div className="flex gap-2">
            <Link
              href={`/dashboard/products/${info.row.original.id}/edit`}
              className="rounded p-1 text-blue-600 hover:bg-blue-50"
            >
              <Pencil size={18} />
            </Link>
            <button
              onClick={() => {
                if (
                  confirm(
                    `¿Eliminar producto "${info.row.original.name}"?`
                  )
                ) {
                  onDelete(info.row.original.id);
                }
              }}
              className="rounded p-1 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      },
    ],
    [onDelete]
  );

  const table = useReactTable({
    data: products,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-gray-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Mostrando {table.getRowModel().rows.length} de {products.length}{' '}
          productos
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:bg-gray-300"
          >
            Anterior
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:bg-gray-300"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Tarea 7: Componente ProductForm (5 horas)

**Objetivo**: Formulario de crear/editar producto con validación

**Archivo a crear**: `components/products/ProductForm.tsx`

**Código**:

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProductFormData } from '@/types/product';
import { useState } from 'react';
import { Upload } from 'lucide-react';
import Image from 'next/image';

const productSchema = z.object({
  code: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(1, 'Nombre es requerido'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoría es requerida'),
  priceVES: z.number().optional(),
  priceUSD: z.number().min(0, 'Precio debe ser positivo').optional(),
  priceEUR: z.number().optional(),
  cost: z.number().min(0, 'Costo debe ser positivo'),
  costCurrency: z.enum(['VES', 'USD', 'EUR']),
  stock: z.number().min(0, 'Stock debe ser positivo'),
  stockMin: z.number().min(0, 'Stock mínimo debe ser positivo'),
  trackInventory: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ProductForm({
  initialData,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: initialData?.code || '',
      barcode: initialData?.barcode || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      priceUSD: initialData?.priceUSD || 0,
      cost: initialData?.cost || 0,
      costCurrency: initialData?.costCurrency || 'USD',
      stock: initialData?.stock || 0,
      stockMin: initialData?.stockMin || 5,
      trackInventory: initialData?.trackInventory ?? true,
    },
  });

  const trackInventory = watch('trackInventory');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (data: ProductFormValues) => {
    setLoading(true);
    try {
      const formData: ProductFormData = {
        ...data,
        image: imageFile || undefined,
      };
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Imagen */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Imagen del Producto
        </label>
        <div className="flex items-center gap-4">
          {imagePreview && (
            <div className="relative h-24 w-24">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="rounded object-cover"
              />
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
            <Upload size={20} />
            <span className="text-sm">Subir Imagen</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Información Básica */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Código (auto-generado si vacío)
          </label>
          <input
            {...register('code')}
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Código de Barras
          </label>
          <input
            {...register('barcode')}
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Nombre *
        </label>
        <input
          {...register('name')}
          type="text"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Categoría *
        </label>
        <select
          {...register('category')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Seleccionar categoría</option>
          <option value="Electrónica">Electrónica</option>
          <option value="Alimentos">Alimentos</option>
          <option value="Ropa">Ropa</option>
          <option value="Hogar">Hogar</option>
          <option value="Otros">Otros</option>
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
        )}
      </div>

      {/* Precios */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="mb-4 font-semibold text-gray-700">Precios de Venta</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Precio USD *
            </label>
            <input
              {...register('priceUSD', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Costo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Costo *
          </label>
          <input
            {...register('cost', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.cost && (
            <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Moneda del Costo
          </label>
          <select
            {...register('costCurrency')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="USD">USD</option>
            <option value="VES">VES</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      {/* Inventario */}
      <div className="rounded-lg border border-gray-200 p-4">
        <div className="mb-4 flex items-center gap-2">
          <input
            {...register('trackInventory')}
            type="checkbox"
            id="trackInventory"
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <label htmlFor="trackInventory" className="text-sm font-medium text-gray-700">
            Controlar inventario
          </label>
        </div>

        {trackInventory && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Stock Actual *
              </label>
              <input
                {...register('stock', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Stock Mínimo *
              </label>
              <input
                {...register('stockMin', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.stockMin && (
                <p className="mt-1 text-sm text-red-600">{errors.stockMin.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear Producto'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
```

---

### Tarea 8: Servicios Firebase - Ventas (6 horas)

**Objetivo**: Crear funciones CRUD para ventas y actualización de inventario

**Archivo a crear**: `lib/sales.ts`

**Código**:

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { Sale, SaleItem } from '@/types/sale';
import { updateProductStock } from './products';

const SALES_COLLECTION = 'sales';

/**
 * Generar número de venta correlativo
 */
async function generateSaleNumber(storeId: string): Promise<string> {
  const salesRef = collection(db, SALES_COLLECTION);
  const q = query(
    salesRef,
    where('storeId', '==', storeId),
    orderBy('saleNumber', 'desc')
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return '000001';
  }

  const lastNumber = snapshot.docs[0].data().saleNumber as string;
  const nextNumber = parseInt(lastNumber, 10) + 1;

  return nextNumber.toString().padStart(6, '0');
}

/**
 * Procesar venta (con actualización de inventario)
 */
export async function processSale(
  storeId: string,
  cashierId: string,
  cashierName: string,
  items: SaleItem[],
  currency: string,
  paymentMethod: 'cash' | 'card' | 'transfer' | 'credit',
  amountReceived?: number,
  customerId?: string,
  customerName?: string
): Promise<Sale> {
  try {
    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = items.reduce((sum, item) => {
      const itemDiscount = item.quantity * item.price * (item.discount / 100);
      return sum + itemDiscount;
    }, 0);
    const tax = subtotal * 0.16; // IVA 16% (ajustar según país)
    const total = subtotal + tax;

    // Calcular cambio si es efectivo
    const change =
      paymentMethod === 'cash' && amountReceived ? amountReceived - total : 0;

    // Generar número de venta
    const saleNumber = await generateSaleNumber(storeId);

    // Crear venta
    const saleData = {
      storeId,
      saleNumber,
      customerId: customerId || null,
      customerName: customerName || null,
      cashierId,
      cashierName,
      items,
      subtotal,
      discount,
      tax,
      total,
      currency,
      exchangeRateSnapshot: {}, // TODO: implementar tasas de cambio
      paymentMethod,
      paymentStatus: 'paid' as const,
      amountReceived: amountReceived || total,
      change,
      status: 'completed' as const,
      createdAt: serverTimestamp(),
    };

    // Usar transacción para asegurar consistencia
    const saleId = await runTransaction(db, async (transaction) => {
      // 1. Crear venta
      const saleRef = doc(collection(db, SALES_COLLECTION));
      transaction.set(saleRef, saleData);

      // 2. Actualizar stock de productos
      for (const item of items) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await transaction.get(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();
          const newStock = productData.stock - item.quantity;

          if (newStock < 0) {
            throw new Error(
              `Stock insuficiente para producto: ${item.productName}`
            );
          }

          transaction.update(productRef, {
            stock: newStock,
            updatedAt: serverTimestamp(),
          });
        }
      }

      return saleRef.id;
    });

    // Devolver venta creada
    const newSale: Sale = {
      id: saleId,
      ...saleData,
      createdAt: new Date(),
    } as Sale;

    return newSale;
  } catch (error) {
    console.error('Error processing sale:', error);
    throw new Error('Error al procesar venta');
  }
}

/**
 * Obtener ventas de una tienda
 */
export async function getSales(storeId: string): Promise<Sale[]> {
  try {
    const salesRef = collection(db, SALES_COLLECTION);
    const q = query(
      salesRef,
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
      } as Sale;
    });
  } catch (error) {
    console.error('Error getting sales:', error);
    throw new Error('Error al obtener ventas');
  }
}

/**
 * Obtener venta por ID
 */
export async function getSaleById(saleId: string): Promise<Sale | null> {
  try {
    const docRef = doc(db, SALES_COLLECTION, saleId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: (data.createdAt as Timestamp).toDate(),
    } as Sale;
  } catch (error) {
    console.error('Error getting sale:', error);
    throw new Error('Error al obtener venta');
  }
}

/**
 * Anular venta (solo admin/owner)
 */
export async function cancelSale(
  saleId: string,
  userId: string,
  reason: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const saleRef = doc(db, SALES_COLLECTION, saleId);
      const saleSnap = await transaction.get(saleRef);

      if (!saleSnap.exists()) {
        throw new Error('Venta no encontrada');
      }

      const saleData = saleSnap.data() as Sale;

      // Revertir stock de productos
      for (const item of saleData.items) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await transaction.get(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();
          const newStock = productData.stock + item.quantity;

          transaction.update(productRef, {
            stock: newStock,
            updatedAt: serverTimestamp(),
          });
        }
      }

      // Marcar venta como cancelada
      transaction.update(saleRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: userId,
        cancelReason: reason,
      });
    });
  } catch (error) {
    console.error('Error cancelling sale:', error);
    throw new Error('Error al anular venta');
  }
}
```

---

### Tarea 9: Componente POS (8 horas)

**Objetivo**: Pantalla completa de punto de venta

**Archivo a crear**: `app/dashboard/pos/page.tsx`

**Código**:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useProductsStore } from '@/store/productsStore';
import { useAuth } from '@/hooks/useAuth';
import { getProducts, searchProducts } from '@/lib/products';
import { processSale } from '@/lib/sales';
import { Product } from '@/types/product';
import { CartItem } from '@/types/sale';
import { Search, ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function POSPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { products, setProducts } = useProductsStore();
  const {
    items,
    currency,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTax,
    getTotal,
  } = useCartStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Cargar productos al montar
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      if (!profile?.storeId) return;
      const data = await getProducts(profile.storeId);
      setProducts(data);
    } catch (error) {
      toast.error('Error al cargar productos');
    }
  };

  // Búsqueda de productos
  const handleSearch = async (term: string) => {
    setSearchTerm(term);

    if (term.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      if (!profile?.storeId) return;
      const results = await searchProducts(profile.storeId, term);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  // Agregar producto al carrito
  const handleAddProduct = (product: Product) => {
    const price = product.prices[currency as keyof typeof product.prices] || 0;

    if (price === 0) {
      toast.error(`Producto no tiene precio en ${currency}`);
      return;
    }

    const cartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      quantity: 1,
      price,
      discount: 0,
      subtotal: price,
      productImage: product.imageUrl,
    };

    addItem(cartItem);
    setSearchTerm('');
    setSearchResults([]);
    toast.success(`${product.name} agregado al carrito`);
  };

  // Procesar pago
  const handleProcessSale = async () => {
    if (items.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (!profile) {
      toast.error('Usuario no autenticado');
      return;
    }

    setLoading(true);
    try {
      const sale = await processSale(
        profile.storeId,
        profile.id,
        profile.name,
        items,
        currency,
        'cash'
      );

      toast.success(`Venta #${sale.saleNumber} procesada`);
      clearCart();
      setShowPaymentModal(false);

      // Redireccionar a detalle de venta
      router.push(`/dashboard/sales/${sale.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar venta');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getSubtotal();
  const tax = getTax(16);
  const total = getTotal(16);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* Panel Izquierdo: Búsqueda y Productos */}
      <div className="flex-1 overflow-auto">
        <div className="mb-4">
          <h1 className="mb-4 text-2xl font-bold">Punto de Venta</h1>

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar producto por nombre o código..."
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  className="flex w-full items-center gap-3 border-b p-3 hover:bg-gray-50"
                >
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-blue-600">
                      {currency}{' '}
                      {product.prices[currency as keyof typeof product.prices]?.toFixed(
                        2
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Stock: {product.stock}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Productos Populares (Grid) */}
        <div className="grid grid-cols-3 gap-4">
          {products.slice(0, 9).map((product) => (
            <button
              key={product.id}
              onClick={() => handleAddProduct(product)}
              className="rounded-lg border border-gray-200 p-4 text-left hover:border-blue-500 hover:shadow-md"
            >
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="mb-2 h-32 w-full rounded object-cover"
                />
              )}
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-gray-500">{product.code}</div>
              <div className="mt-2 font-semibold text-blue-600">
                {currency}{' '}
                {product.prices[currency as keyof typeof product.prices]?.toFixed(2)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Panel Derecho: Carrito */}
      <div className="w-96 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <ShoppingCart />
          <h2 className="text-xl font-bold">Carrito</h2>
          <span className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-700">
            {items.length}
          </span>
        </div>

        {/* Items del carrito */}
        <div className="mb-4 max-h-96 overflow-auto space-y-2">
          {items.map((item) => (
            <div
              key={item.productId}
              className="rounded-lg border border-gray-200 p-3"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-gray-500">{item.productCode}</div>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm">Cant:</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.productId, parseInt(e.target.value, 10))
                  }
                  className="w-20 rounded border border-gray-300 px-2 py-1 text-center"
                />
                <span className="ml-auto font-semibold">
                  {currency} {item.subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              Carrito vacío
            </div>
          )}
        </div>

        {/* Totales */}
        {items.length > 0 && (
          <>
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA (16%):</span>
                <span>
                  {currency} {tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL:</span>
                <span>
                  {currency} {total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Botones */}
            <div className="mt-4 space-y-2">
              <button
                onClick={handleProcessSale}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Procesando...' : 'Procesar Venta (F4)'}
              </button>
              <button
                onClick={() => clearCart()}
                className="w-full rounded-lg border border-gray-300 py-2 hover:bg-gray-50"
              >
                Limpiar Carrito
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

---

### Tarea 10: Generación de Recibo PDF (4 horas)

**Objetivo**: Generar PDF de recibo de venta

**Archivo a crear**: `lib/receipt.ts`

**Código**:

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale } from '@/types/sale';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function generateReceiptPDF(sale: Sale, storeName: string): void {
  const doc = new jsPDF();

  // Encabezado
  doc.setFontSize(18);
  doc.text(storeName, 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text('RECIBO DE VENTA', 105, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Nº ${sale.saleNumber}`, 105, 37, { align: 'center' });

  // Información de venta
  doc.setFontSize(9);
  const startY = 50;

  doc.text(
    `Fecha: ${format(sale.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })}`,
    20,
    startY
  );
  doc.text(`Cajero: ${sale.cashierName}`, 20, startY + 5);
  if (sale.customerName) {
    doc.text(`Cliente: ${sale.customerName}`, 20, startY + 10);
  }
  doc.text(
    `Método de pago: ${sale.paymentMethod.toUpperCase()}`,
    20,
    startY + 15
  );

  // Tabla de productos
  const tableData = sale.items.map((item) => [
    item.productCode,
    item.productName,
    item.quantity.toString(),
    `${sale.currency} ${item.price.toFixed(2)}`,
    item.discount > 0 ? `${item.discount}%` : '-',
    `${sale.currency} ${item.subtotal.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: startY + 25,
    head: [['Código', 'Producto', 'Cant.', 'Precio', 'Desc.', 'Subtotal']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
  });

  // Totales
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.text(
    `Subtotal: ${sale.currency} ${sale.subtotal.toFixed(2)}`,
    140,
    finalY,
    {
      align: 'right',
    }
  );
  doc.text(
    `IVA (16%): ${sale.currency} ${sale.tax.toFixed(2)}`,
    140,
    finalY + 5,
    {
      align: 'right',
    }
  );

  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(
    `TOTAL: ${sale.currency} ${sale.total.toFixed(2)}`,
    140,
    finalY + 12,
    {
      align: 'right',
    }
  );

  if (sale.paymentMethod === 'cash' && sale.amountReceived) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(
      `Recibido: ${sale.currency} ${sale.amountReceived.toFixed(2)}`,
      140,
      finalY + 18,
      {
        align: 'right',
      }
    );
    doc.text(
      `Cambio: ${sale.currency} ${(sale.change || 0).toFixed(2)}`,
      140,
      finalY + 23,
      {
        align: 'right',
      }
    );
  }

  // Pie de página
  doc.setFontSize(8);
  doc.text('¡Gracias por su compra!', 105, 280, { align: 'center' });

  // Descargar PDF
  doc.save(`recibo-${sale.saleNumber}.pdf`);
}
```

---

### Tarea 11: Páginas de Productos (3 horas)

**Objetivo**: Crear páginas de lista, crear y editar productos

**Archivos a crear**:

- `app/dashboard/products/page.tsx`
- `app/dashboard/products/new/page.tsx`

**Código de `app/dashboard/products/page.tsx`**:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useProductsStore } from '@/store/productsStore';
import { useAuth } from '@/hooks/useAuth';
import { getProducts, deleteProduct } from '@/lib/products';
import ProductTable from '@/components/products/ProductTable';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const { profile } = useAuth();
  const { products, setProducts, removeProduct } = useProductsStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      if (!profile?.storeId) return;
      setLoading(true);
      const data = await getProducts(profile.storeId);
      setProducts(data);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      removeProduct(productId);
      toast.success('Producto eliminado');
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  if (loading) {
    return <div className="p-6">Cargando productos...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-gray-600">{products.length} productos registrados</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus size={20} />
          Nuevo Producto
        </Link>
      </div>

      <ProductTable products={products} onDelete={handleDelete} />
    </div>
  );
}
```

**Código de `app/dashboard/products/new/page.tsx`**:

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createProduct } from '@/lib/products';
import { ProductFormData } from '@/types/product';
import ProductForm from '@/components/products/ProductForm';
import toast from 'react-hot-toast';

export default function NewProductPage() {
  const router = useRouter();
  const { profile } = useAuth();

  const handleSubmit = async (data: ProductFormData) => {
    try {
      if (!profile?.storeId) {
        toast.error('No se encontró la tienda');
        return;
      }

      await createProduct(profile.storeId, data);
      toast.success('Producto creado exitosamente');
      router.push('/dashboard/products');
    } catch (error: any) {
      toast.error(error.message || 'Error al crear producto');
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/products');
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Nuevo Producto</h1>
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6">
        <ProductForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
```

---

### Tarea 12: Actualizar Navegación (1 hora)

**Objetivo**: Agregar links de Products y POS al Sidebar

**Archivo a modificar**: `components/layout/Sidebar.tsx`

**Cambio**:

Actualizar el array `menuItems` para incluir Products y POS:

```typescript
const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'POS', href: '/dashboard/pos', icon: ShoppingCart },
  { name: 'Productos', href: '/dashboard/products', icon: Package },
  { name: 'Ventas', href: '/dashboard/sales', icon: Receipt },
  { name: 'Clientes', href: '/dashboard/customers', icon: Users },
  { name: 'Proveedores', href: '/dashboard/suppliers', icon: Truck },
  { name: 'Reportes', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
];
```

---

## 📊 Estimación de Tiempo

| Tarea     | Descripción                    | Tiempo Estimado |
| --------- | ------------------------------ | --------------- |
| 1         | Tipos TypeScript               | 3 horas         |
| 2         | Servicios Firebase - Productos | 6 horas         |
| 3         | Servicios Firebase - Storage   | 2 horas         |
| 4         | Store Zustand - Productos      | 2 horas         |
| 5         | Store Zustand - Carrito        | 3 horas         |
| 6         | Componente ProductTable        | 4 horas         |
| 7         | Componente ProductForm         | 5 horas         |
| 8         | Servicios Firebase - Ventas    | 6 horas         |
| 9         | Componente POS                 | 8 horas         |
| 10        | Generación de Recibo PDF       | 4 horas         |
| 11        | Páginas de Productos           | 3 horas         |
| 12        | Actualizar Navegación          | 1 hora          |
| **TOTAL** |                                | **47 horas**    |

**Buffer de contingencia**: 33 horas  
**Total con buffer**: **80 horas** (2 semanas)

---

## ✅ Checklist de Validación

### Compilación y Build

- [ ] `npm run build` exitoso sin errores TypeScript
- [ ] No hay warnings críticos en consola
- [ ] Todas las importaciones se resuelven correctamente

### Funcionalidad de Productos

- [ ] Crear producto funciona (con y sin imagen)
- [ ] Editar producto funciona
- [ ] Eliminar producto funciona
- [ ] Tabla de productos muestra todos los productos
- [ ] Búsqueda en tabla funciona
- [ ] Paginación funciona
- [ ] Stock bajo se resalta correctamente
- [ ] Código auto-generado funciona si se deja vacío

### Funcionalidad POS

- [ ] Búsqueda de productos funciona
- [ ] Agregar producto al carrito funciona
- [ ] Modificar cantidad en carrito funciona
- [ ] Eliminar producto del carrito funciona
- [ ] Totales se calculan correctamente (subtotal, IVA, total)
- [ ] Procesar venta funciona
- [ ] Inventario se actualiza al procesar venta
- [ ] No permite vender si stock insuficiente

### Funcionalidad de Ventas

- [ ] Venta se registra en Firestore
- [ ] Número de venta es correlativo
- [ ] Recibo PDF se genera correctamente
- [ ] Recibo contiene todos los datos (productos, totales, fecha, etc.)
- [ ] Lista de ventas muestra todas las ventas
- [ ] Detalle de venta muestra información completa

### UI/UX

- [ ] Navegación funciona (Products, POS en sidebar)
- [ ] Diseño responsive en desktop
- [ ] Formularios muestran errores de validación
- [ ] Toast notifications funcionan
- [ ] Loading states se muestran correctamente
- [ ] Imágenes de productos se cargan correctamente

### Integración Firebase

- [ ] Productos se guardan en Firestore
- [ ] Ventas se guardan en Firestore
- [ ] Imágenes se suben a Firebase Storage
- [ ] Transacciones aseguran consistencia de datos
- [ ] Listeners en tiempo real (opcional, para Fase 7)

---

## 🚀 Siguientes Pasos (Post-Fase 2)

Después de completar esta fase, el usuario podrá:

1. ✅ Gestionar productos completos
2. ✅ Procesar ventas desde POS web
3. ✅ Ver historial de ventas
4. ✅ Generar recibos en PDF

**Para Fase 3**, se implementará:

- Gestión detallada de inventario (entradas, salidas, kardex)
- Alertas de stock bajo
- Reportes de valorización

---

## 📝 Notas de Implementación

### Decisiones Técnicas

**1. TanStack Table vs Componente Custom**

- **Decisión**: TanStack Table
- **Razón**: Mayor funcionalidad out-of-the-box (filtros, ordenamiento, paginación)

**2. jsPDF vs react-pdf**

- **Decisión**: jsPDF con jspdf-autotable
- **Razón**: Más simple para documentos básicos como recibos

**3. Búsqueda: Client-side vs Firestore Query**

- **Decisión**: Client-side (cargar todos y filtrar en memoria)
- **Razón**: Firestore no soporta full-text search nativo. Para Fase 7 se puede migrar a Algolia.

**4. Carrito: Zustand vs useState local**

- **Decisión**: Zustand
- **Razón**: Permite persistir carrito si usuario navega fuera del POS (para Fase 7: ventas pausadas)

### Riesgos Identificados

1. **Imágenes grandes pueden tardar en subir**
   - Mitigación: Comprimir imágenes antes de subir (implementar en Fase 3)

2. **Firestore tiene límite de 1 operación por segundo por documento**
   - Mitigación: Usar batch writes y transacciones

3. **Búsqueda client-side puede ser lenta con 10,000+ productos**
   - Mitigación: Implementar paginación virtual (react-window) en Fase 6

---

**Fin del Plan - Fase 2**

**Aprobado por**: planificador agent  
**Fecha**: 2026-07-31  
**Versión**: 1.0
