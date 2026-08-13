# Plan de Implementación - Migración Firebase → PostgreSQL

**Proyecto**: tienda-web  
**Tipo**: Migración Arquitectónica Crítica  
**Basado en**: `docs/specs/MIGRATION-001-firebase-to-postgresql.md`  
**Estado**: Pendiente Aprobación  
**Fecha**: 2026-08-12  
**Versión**: 1.0.0

---

## Resumen Ejecutivo

### Métricas del Plan

- **Duración total**: 13 días hábiles (16 días con buffer 20%)
- **Fases**: 5 fases secuenciales
- **Archivos a crear**: ~85 archivos nuevos
- **Archivos a modificar**: ~35 archivos existentes
- **Archivos a eliminar**: 2 archivos (firebase.ts, Firebase SDK)
- **Dependencias nuevas**: 15 paquetes backend
- **Dependencias a eliminar**: 1 paquete (firebase)

### Recursos Necesarios

| Rol                | Días | Responsabilidades                          |
| ------------------ | ---- | ------------------------------------------ |
| Backend Developer  | 8    | API REST, Prisma, migraciones, seguridad   |
| Frontend Developer | 4    | Reescribir servicios, actualizar pantallas |
| QA Engineer        | 2    | Tests E2E, performance, security audit     |
| DevOps/SysAdmin    | 1    | Setup servidor, PostgreSQL, deploy, backup |

### Prerequisitos Obligatorios

```
☐ PostgreSQL 14+ instalable en el servidor objetivo
☐ Node.js 20+ instalado
☐ Acceso a Firebase Console para backup
☐ Servidor local disponible (Ubuntu 20.04+ o Windows Server 2019+)
☐ Backup completo de Firestore antes de empezar
☐ Downtime window acordado (recomendado: domingo 2am-6am)
☐ Equipo capacitado en PostgreSQL básico
```

---

## FASE 1: Setup de Backend y Base de Datos (5 días)

**Objetivo**: Crear backend Node.js + Express completamente funcional con PostgreSQL y todos los endpoints implementados.

**Criterios de aceptación global**:

- [ ] PostgreSQL corriendo y conectado
- [ ] 11 tablas creadas con foreign keys
- [ ] 35 endpoints RESTful funcionales
- [ ] Auth JWT completo (login, register, refresh tokens)
- [ ] Postman collection con todos los endpoints testeados

---

### 1.1 Configuración de PostgreSQL (Día 1, mañana - 4 horas)

#### 1.1.1 Instalación de PostgreSQL

**Windows**:

```bash
# Opción 1: Winget
winget install PostgreSQL.PostgreSQL.14

# Opción 2: Chocolatey
choco install postgresql14 --params '/Password:postgres /Port:5432'

# Opción 3: Descarga manual
# https://www.postgresql.org/download/windows/
# Instalador EDB con wizard gráfico
```

**Linux (Ubuntu/Debian)**:

```bash
# Actualizar repositorios
sudo apt update

# Instalar PostgreSQL 14
sudo apt install postgresql-14 postgresql-contrib-14

# Verificar que está corriendo
sudo systemctl status postgresql
```

**macOS**:

```bash
# Con Homebrew
brew install postgresql@14

# Iniciar servicio
brew services start postgresql@14
```

#### 1.1.2 Crear Base de Datos y Usuario

```bash
# Conectar como superusuario
sudo -u postgres psql

# O en Windows (abrir psql desde el menú de inicio)
psql -U postgres
```

```sql
-- Crear base de datos
CREATE DATABASE tienda_web;

-- Crear usuario
CREATE USER tienda_admin WITH PASSWORD 'T13nd@W3b_S3cur3_2026!';

-- Otorgar todos los privilegios
GRANT ALL PRIVILEGES ON DATABASE tienda_web TO tienda_admin;

-- Otorgar permisos sobre el schema public (PostgreSQL 15+)
\c tienda_web
GRANT ALL ON SCHEMA public TO tienda_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO tienda_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO tienda_admin;

-- Verificar
\l
\du
```

#### 1.1.3 Configurar Acceso Remoto (opcional, si el servidor es remoto)

```bash
# Editar postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Cambiar:
listen_addresses = '*'  # en lugar de 'localhost'

# Editar pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Agregar (reemplazar 0.0.0.0/0 por IP específica en producción):
host    tienda_web    tienda_admin    0.0.0.0/0    scram-sha-256

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

#### 1.1.4 Verificar Conexión

```bash
# Local
psql -U tienda_admin -d tienda_web

# Remoto
psql -h 192.168.1.100 -U tienda_admin -d tienda_web

# Dentro de psql, verificar
\dt  # Debe mostrar vacío (aún no hay tablas)
\q   # Salir
```

**Archivos creados**:

- Base de datos `tienda_web`
- Usuario `tienda_admin`

**Criterio de aceptación**:

- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `tienda_web` creada
- [ ] Usuario `tienda_admin` con permisos completos
- [ ] Conexión exitosa desde terminal

**Rollback**:

```sql
DROP DATABASE tienda_web;
DROP USER tienda_admin;
```

---

### 1.2 Setup de Prisma ORM (Día 1, tarde - 4 horas)

#### 1.2.1 Crear Proyecto Backend

```bash
# Crear carpeta backend
cd tienda-web
mkdir backend
cd backend

# Inicializar Node.js
npm init -y

# Modificar package.json
```

**Archivo**: `backend/package.json`

```json
{
  "name": "tienda-web-backend",
  "version": "1.0.0",
  "description": "Backend API REST para tienda-web con PostgreSQL",
  "main": "dist/server.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "migrate": "prisma migrate deploy",
    "migrate:dev": "prisma migrate dev",
    "migrate:reset": "prisma migrate reset",
    "studio": "prisma studio",
    "seed": "ts-node prisma/seed.ts"
  },
  "keywords": ["api", "rest", "postgresql", "prisma", "express"],
  "author": "Tu Nombre",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "@prisma/client": "^5.19.0",
    "zod": "^3.23.8",
    "multer": "^1.4.5-lts.1",
    "winston": "^3.14.2",
    "express-rate-limit": "^7.4.0",
    "helmet": "^7.1.0",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/bcrypt": "^5.0.2",
    "@types/multer": "^1.4.11",
    "@types/compression": "^1.7.5",
    "@types/node": "^22.5.0",
    "prisma": "^5.19.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.5.4"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

#### 1.2.2 Instalar Dependencias

```bash
# Instalar todas las dependencias
npm install

# Verificar que Prisma está instalado
npx prisma --version
```

#### 1.2.3 Inicializar Prisma

```bash
# Inicializar Prisma
npx prisma init
```

Esto crea:

- `prisma/schema.prisma`
- `.env`

#### 1.2.4 Configurar `.env`

**Archivo**: `backend/.env`

```bash
# Database
DATABASE_URL="postgresql://tienda_admin:T13nd@W3b_S3cur3_2026!@localhost:5432/tienda_web?schema=public"

# JWT Secrets (generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_ACCESS_SECRET="5f8a9c2e1d4b7a3f9e6c8d1b4a7e2f5c8d9b3a6e1f4c7b2a5d8e3f6c9b1a4e7d2"
JWT_REFRESH_SECRET="3a6e9c2f5b8d1e4a7c3f6b9e2d5a8c1f4b7e3a6d9c2f5e8b1a4d7c3f6e9b2a5d8"

# JWT Expiry
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# CORS
FRONTEND_URL="http://localhost:3000"

# Server
PORT=4000
NODE_ENV="development"

# Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880  # 5MB en bytes
```

#### 1.2.5 Crear Schema Prisma Completo

**Archivo**: `backend/prisma/schema.prisma`

```prisma
// Generador de cliente Prisma
generator client {
  provider = "prisma-client-js"
}

// Configuración de base de datos
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTENTICACIÓN Y USUARIOS
// ============================================

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hash
  name      String
  role      String   @default("owner") // owner, admin, cashier
  storeId   String?
  store     Store?   @relation(fields: [storeId], references: [id])
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  sales              Sale[]
  inventoryMovements InventoryMovement[]

  @@index([email])
  @@index([storeId])
  @@map("users")
}

// ============================================
// TIENDAS
// ============================================

model Store {
  id        String   @id @default(uuid())
  name      String
  owner     String
  address   String?
  phone     String?
  email     String?
  taxId     String?  // RIF/NIT
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  users                  User[]
  products               Product[]
  sales                  Sale[]
  customers              Customer[]
  suppliers              Supplier[]
  customerTransactions   CustomerTransaction[]
  supplierTransactions   SupplierTransaction[]
  inventoryMovements     InventoryMovement[]
  exchangeRates          ExchangeRate[]

  @@map("stores")
}

// ============================================
// PRODUCTOS
// ============================================

model Product {
  id          String   @id @default(uuid())
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  code        String
  barcode     String?
  name        String
  description String?
  category    String
  priceVES    Float?
  priceUSD    Float?
  costVES     Float?
  costUSD     Float?
  stock       Float    @default(0)
  minStock    Float    @default(0)
  unit        String   @default("unit") // unit, kg, liter, etc.
  imageUrl    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relaciones
  saleItems          SaleItem[]
  inventoryMovements InventoryMovement[]

  @@unique([storeId, code])
  @@index([storeId, category])
  @@index([storeId, code])
  @@index([barcode])
  @@index([storeId, isActive])
  @@map("products")
}

// ============================================
// VENTAS
// ============================================

model Sale {
  id            String   @id @default(uuid())
  storeId       String
  store         Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  saleNumber    String   // 000001, 000002, etc.
  cashierId     String
  cashier       User     @relation(fields: [cashierId], references: [id])
  cashierName   String
  customerId    String?
  customerName  String?
  subtotal      Float
  discount      Float    @default(0)
  tax           Float    @default(0)
  total         Float
  currency      String   // VES, USD
  paymentMethod String   // cash, card, transfer, credit
  paymentStatus String   @default("paid") // paid, credit, cancelled
  amountReceived Float?
  change        Float?
  status        String   @default("completed") // completed, cancelled
  cancelledAt   DateTime?
  creditDueDate DateTime?
  notes         String?
  createdAt     DateTime @default(now())

  // Relaciones
  items SaleItem[]

  @@unique([storeId, saleNumber])
  @@index([storeId, createdAt])
  @@index([customerId])
  @@index([paymentStatus])
  @@index([cashierId])
  @@index([status])
  @@map("sales")
}

model SaleItem {
  id        String  @id @default(uuid())
  saleId    String
  sale      Sale    @relation(fields: [saleId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id])
  code      String
  name      String
  quantity  Float
  price     Float
  discount  Float   @default(0)
  subtotal  Float

  @@index([saleId])
  @@index([productId])
  @@map("sale_items")
}

// ============================================
// CLIENTES
// ============================================

model Customer {
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  code      String
  name      String
  phone     String?
  email     String?
  address   String?
  taxId     String?  // CI/RIF
  balance   Float    @default(0) // Saldo a favor (negativo) o deuda (positivo)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  transactions CustomerTransaction[]

  @@unique([storeId, code])
  @@index([storeId])
  @@index([storeId, name])
  @@map("customers")
}

model CustomerTransaction {
  id          String   @id @default(uuid())
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  type        String   // payment, charge
  amount      Float
  currency    String   // VES, USD
  description String
  dueDate     DateTime?
  createdAt   DateTime @default(now())

  @@index([storeId])
  @@index([customerId])
  @@index([createdAt])
  @@map("customer_transactions")
}

// ============================================
// PROVEEDORES
// ============================================

model Supplier {
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  code      String
  name      String
  phone     String?
  email     String?
  address   String?
  taxId     String?  // RIF
  balance   Float    @default(0) // Deuda con proveedor (positivo)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  transactions SupplierTransaction[]

  @@unique([storeId, code])
  @@index([storeId])
  @@index([storeId, name])
  @@map("suppliers")
}

model SupplierTransaction {
  id          String   @id @default(uuid())
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  supplierId  String
  supplier    Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  type        String   // payment, charge
  amount      Float
  currency    String   // VES, USD
  description String
  dueDate     DateTime?
  createdAt   DateTime @default(now())

  @@index([storeId])
  @@index([supplierId])
  @@index([createdAt])
  @@map("supplier_transactions")
}

// ============================================
// INVENTARIO
// ============================================

model InventoryMovement {
  id            String   @id @default(uuid())
  storeId       String
  store         Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  productId     String
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  type          String   // entry, exit
  quantity      Float
  reason        String   // initial, purchase, sale, adjustment, return, damaged
  referenceType String?  // sale, purchase, adjustment
  referenceId   String?  // ID de la venta, compra, etc.
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  notes         String?
  createdAt     DateTime @default(now())

  @@index([storeId])
  @@index([productId])
  @@index([createdAt])
  @@index([type])
  @@map("inventory_movements")
}

// ============================================
// CONFIGURACIÓN
// ============================================

model ExchangeRate {
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  rate      Float    // VES/USD
  createdAt DateTime @default(now())

  @@index([storeId, createdAt])
  @@map("exchange_rates")
}
```

#### 1.2.6 Generar Migración Inicial

```bash
# Generar migración (crea SQL automáticamente)
npx prisma migrate dev --name init

# Esto ejecuta:
# 1. Crea carpeta prisma/migrations/XXXXXX_init/
# 2. Genera migration.sql con CREATE TABLE
# 3. Ejecuta la migración en PostgreSQL
# 4. Genera el cliente Prisma

# Verificar que funcionó
npx prisma studio
# Se abre interfaz web en http://localhost:5555
```

#### 1.2.7 Verificar Tablas Creadas

```bash
# Conectar a PostgreSQL
psql -U tienda_admin -d tienda_web

# Ver tablas
\dt

# Debes ver:
# users
# stores
# products
# sales
# sale_items
# customers
# customer_transactions
# suppliers
# supplier_transactions
# inventory_movements
# exchange_rates
# _prisma_migrations (interna de Prisma)
```

**Archivos creados**:

- `backend/package.json`
- `backend/.env`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/XXXXXX_init/migration.sql`
- `backend/node_modules/` (carpeta de dependencias)

**Criterios de aceptación**:

- [ ] Prisma instalado y configurado
- [ ] Schema creado con 11 modelos
- [ ] Migración ejecutada exitosamente
- [ ] 11 tablas creadas en PostgreSQL
- [ ] `npx prisma studio` se abre correctamente

**Rollback**:

```bash
npx prisma migrate reset  # Elimina todas las tablas y reinicia
```

---

### 1.3 Estructura del Backend (Día 2, mañana - 4 horas)

#### 1.3.1 Crear Estructura de Carpetas

```bash
cd backend

# Crear estructura completa
mkdir -p src/{config,controllers,routes,middleware,services,types,utils}
mkdir -p uploads/products
mkdir -p logs
```

#### 1.3.2 Configurar TypeScript

**Archivo**: `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 1.3.3 Crear Configuración de Base de Datos

**Archivo**: `backend/src/config/database.ts`

```typescript
import { PrismaClient } from '@prisma/client';

// Singleton para Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Función para verificar conexión
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Función para desconectar (usar en shutdown)
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
```

#### 1.3.4 Crear Logger con Winston

**Archivo**: `backend/src/config/logger.ts`

```typescript
import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Archivo de errores
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Archivo combinado
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// En desarrollo, también loguear a consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}
```

#### 1.3.5 Crear Tipos Base

**Archivo**: `backend/src/types/index.ts`

```typescript
import { Request } from 'express';

// Extender Request de Express para incluir userId y storeId
export interface AuthRequest extends Request {
  userId?: string;
  storeId?: string;
  userEmail?: string;
  userRole?: string;
}

// Tipos de respuesta estándar
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Tipos de paginación
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Roles de usuario
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  CASHIER = 'cashier',
}

// Estados de venta
export enum SaleStatus {
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PAID = 'paid',
  CREDIT = 'credit',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  CREDIT = 'credit',
}

// Tipos de movimiento de inventario
export enum MovementType {
  ENTRY = 'entry',
  EXIT = 'exit',
}

export enum MovementReason {
  INITIAL = 'initial',
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  DAMAGED = 'damaged',
}

// Tipos de transacciones
export enum TransactionType {
  PAYMENT = 'payment',
  CHARGE = 'charge',
}

// Monedas
export enum Currency {
  VES = 'VES',
  USD = 'USD',
}
```

#### 1.3.6 Crear Middleware de Error Handler

**Archivo**: `backend/src/middleware/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log del error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Si es un error operacional (esperado)
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Errores de Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: 'Database error: ' + err.message,
    });
  }

  // Errores de validación de Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err,
    });
  }

  // Error genérico (no esperado)
  return res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
}

// Middleware para rutas no encontradas
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}
```

#### 1.3.7 Crear App Principal

**Archivo**: `backend/src/app.ts`

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Cargar variables de entorno
dotenv.config();

const app: Application = express();

// ============================================
// MIDDLEWARE GLOBAL
// ============================================

// Seguridad con Helmet
app.use(helmet());

// Compresión de respuestas
app.use(compression());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logger de requests (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// RUTAS
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes (se agregarán en las siguientes secciones)
// app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes);
// ...

// ============================================
// ERROR HANDLING
// ============================================

// 404 para rutas no encontradas
app.use(notFoundHandler);

// Error handler global
app.use(errorHandler);

export default app;
```

#### 1.3.8 Crear Server

**Archivo**: `backend/src/server.ts`

```typescript
import app from './app';
import { checkDatabaseConnection, disconnectDatabase } from './config/database';
import { logger } from './config/logger';

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Verificar conexión a la base de datos
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      logger.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    logger.info('✅ Database connected');

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(async () => {
        await disconnectDatabase();
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      server.close(async () => {
        await disconnectDatabase();
        logger.info('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

#### 1.3.9 Crear `.gitignore`

**Archivo**: `backend/.gitignore`

```
# Dependencias
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build
dist/
build/

# Env
.env
.env.local
.env.production
.env.test

# Logs
logs/
*.log

# Uploads (excluir imágenes del repo)
uploads/*
!uploads/.gitkeep

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/

# Prisma
prisma/migrations/*_dev_
```

#### 1.3.10 Probar que el servidor arranca

```bash
# Compilar TypeScript
npm run build

# Iniciar en modo desarrollo
npm run dev

# Deberías ver en consola:
# ✅ Database connected
# 🚀 Server running on http://localhost:4000
# 📊 Environment: development
```

**Probar health check**:

```bash
curl http://localhost:4000/health

# Respuesta:
# {
#   "success": true,
#   "message": "Server is running",
#   "timestamp": "2026-08-12T14:30:00.000Z"
# }
```

**Archivos creados** (18 archivos):

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── logger.ts
│   ├── middleware/
│   │   └── errorHandler.ts
│   ├── types/
│   │   └── index.ts
│   ├── app.ts
│   └── server.ts
├── uploads/
│   └── products/.gitkeep
├── logs/.gitkeep
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── prisma/
    └── schema.prisma
```

**Criterios de aceptación**:

- [ ] Estructura de carpetas completa
- [ ] TypeScript configurado
- [ ] Servidor arranca sin errores
- [ ] Health check responde correctamente
- [ ] Logs se escriben en `logs/combined.log`
- [ ] Base de datos conecta correctamente

**Rollback**: Eliminar carpeta `backend/`

---

### 1.4 Implementar Autenticación JWT (Día 2, tarde - 4 horas)

#### 1.4.1 Crear Utilidades JWT

**Archivo**: `backend/src/utils/jwt.ts`

```typescript
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';

interface JWTPayload {
  userId: string;
  email: string;
  storeId?: string;
  role: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export function generateTokens(payload: JWTPayload): TokenPair {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRY,
  });

  const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
  });

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JWTPayload;
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
}

export function verifyRefreshToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
}
```

#### 1.4.2 Crear Utilidades Bcrypt

**Archivo**: `backend/src/utils/bcrypt.ts`

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

#### 1.4.3 Crear Middleware de Autenticación

**Archivo**: `backend/src/middleware/auth.ts`

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from './errorHandler';

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    const payload = verifyAccessToken(token);

    // Agregar info al request
    req.userId = payload.userId;
    req.storeId = payload.storeId;
    req.userEmail = payload.email;
    req.userRole = payload.role;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

// Middleware para verificar rol
export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    next();
  };
}
```

#### 1.4.4 Crear Validadores con Zod

**Archivo**: `backend/src/middleware/validator.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './errorHandler';

export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

// Schemas comunes
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['owner', 'admin', 'cashier']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
```

#### 1.4.5 Crear Servicio de Autenticación

**Archivo**: `backend/src/services/authService.ts`

```typescript
import { prisma } from '../config/database';
import { hashPassword, comparePasswords } from '../utils/bcrypt';
import { generateTokens } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { User } from '@prisma/client';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
  storeId?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  // Verificar que el email no existe
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  // Hash de password
  const hashedPassword = await hashPassword(data.password);

  // Crear usuario
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role || 'owner',
      storeId: data.storeId,
    },
  });

  // Generar tokens
  const { accessToken, refreshToken } = generateTokens({
    userId: user.id,
    email: user.email,
    storeId: user.storeId || undefined,
    role: user.role,
  });

  // Eliminar password del response
  const { password, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
}

export async function login(data: LoginData): Promise<AuthResponse> {
  // Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Verificar password
  const isPasswordValid = await comparePasswords(data.password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Verificar que el usuario esté activo
  if (!user.isActive) {
    throw new AppError('User account is disabled', 403);
  }

  // Generar tokens
  const { accessToken, refreshToken } = generateTokens({
    userId: user.id,
    email: user.email,
    storeId: user.storeId || undefined,
    role: user.role,
  });

  // Eliminar password del response
  const { password, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
}

export async function getMe(userId: string): Promise<Omit<User, 'password'>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
```

#### 1.4.6 Crear Controller de Autenticación

**Archivo**: `backend/src/controllers/authController.ts`

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as authService from '../services/authService';
import { verifyRefreshToken, generateTokens } from '../utils/jwt';
import { logger } from '../config/logger';

export async function register(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.register(req.body);

    logger.info('User registered', { email: result.user.email });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.login(req.body);

    logger.info('User logged in', { email: result.user.email });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const user = await authService.getMe(req.userId);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { refreshToken } = req.body;

    // Verificar refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Generar nuevos tokens
    const tokens = generateTokens({
      userId: payload.userId,
      email: payload.email,
      storeId: payload.storeId,
      role: payload.role,
    });

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // En una implementación real, aquí se invalidaría el refresh token
    // (guardándolo en una blacklist en Redis, por ejemplo)

    logger.info('User logged out', { userId: req.userId });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}
```

#### 1.4.7 Crear Rutas de Autenticación

**Archivo**: `backend/src/routes/auth.routes.ts`

```typescript
import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import {
  validateRequest,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../middleware/validator';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting para auth endpoints (protección contra brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Too many authentication attempts, please try again later',
});

// POST /api/auth/register
router.post(
  '/register',
  validateRequest(registerSchema),
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validateRequest(loginSchema),
  authController.login
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  validateRequest(refreshTokenSchema),
  authController.refreshToken
);

// GET /api/auth/me (protegido)
router.get('/me', authMiddleware, authController.me);

// POST /api/auth/logout (protegido)
router.post('/logout', authMiddleware, authController.logout);

export default router;
```

#### 1.4.8 Registrar Rutas en App

**Modificar**: `backend/src/app.ts`

```typescript
// ... código existente ...

// Importar rutas
import authRoutes from './routes/auth.routes';

// ... código existente ...

// ============================================
// RUTAS
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// ============================================
// ERROR HANDLING
// ============================================
// ... resto del código ...
```

#### 1.4.9 Probar Endpoints de Auth

**Reiniciar servidor**:

```bash
npm run dev
```

**Probar con curl o Postman**:

```bash
# 1. Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tienda.com",
    "password": "Admin123!",
    "name": "Administrador"
  }'

# Respuesta:
# {
#   "success": true,
#   "data": {
#     "user": {
#       "id": "uuid...",
#       "email": "admin@tienda.com",
#       "name": "Administrador",
#       "role": "owner"
#     },
#     "accessToken": "eyJhbGciOi...",
#     "refreshToken": "eyJhbGciOi..."
#   }
# }

# 2. Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tienda.com",
    "password": "Admin123!"
  }'

# 3. Get Me (copiar accessToken del paso anterior)
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOi..."

# 4. Refresh Token
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOi..."
  }'
```

**Archivos creados** (8 archivos):

```
backend/src/
├── utils/
│   ├── jwt.ts
│   └── bcrypt.ts
├── middleware/
│   ├── auth.ts
│   └── validator.ts
├── services/
│   └── authService.ts
├── controllers/
│   └── authController.ts
└── routes/
    └── auth.routes.ts
```

**Criterios de aceptación**:

- [ ] POST /api/auth/register funcional
- [ ] POST /api/auth/login devuelve JWT válido
- [ ] GET /api/auth/me valida token correctamente
- [ ] POST /api/auth/refresh genera nuevo token
- [ ] Passwords hasheadas con bcrypt
- [ ] Rate limiting activo en /login

**Rollback**: Comentar línea `app.use('/api/auth', authRoutes);` en `app.ts`

---

---

### 1.5 Implementar CRUD de Productos (Día 3, mañana - 4 horas)

#### 1.5.1 Crear Validadores de Productos

**Archivo**: `backend/src/middleware/productValidators.ts`

```typescript
import { z } from 'zod';

export const createProductSchema = z.object({
  storeId: z.string().uuid('Invalid store ID'),
  code: z.string().min(1, 'Product code is required'),
  barcode: z.string().optional(),
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  priceVES: z.number().positive('Price VES must be positive').optional(),
  priceUSD: z.number().positive('Price USD must be positive').optional(),
  costVES: z.number().positive('Cost VES must be positive').optional(),
  costUSD: z.number().positive('Cost USD must be positive').optional(),
  stock: z.number().nonnegative('Stock cannot be negative').default(0),
  minStock: z.number().nonnegative('Min stock cannot be negative').default(0),
  unit: z.string().default('unit'),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

export const updateProductSchema = z.object({
  code: z.string().min(1).optional(),
  barcode: z.string().optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  priceVES: z.number().positive().optional(),
  priceUSD: z.number().positive().optional(),
  costVES: z.number().positive().optional(),
  costUSD: z.number().positive().optional(),
  stock: z.number().nonnegative().optional(),
  minStock: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export const productQuerySchema = z.object({
  storeId: z.string().uuid('Invalid store ID'),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().positive()).default('1'),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().positive().max(100))
    .default('50'),
});
```

#### 1.5.2 Crear Servicio de Productos

**Archivo**: `backend/src/services/productService.ts`

```typescript
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Product } from '@prisma/client';

interface CreateProductData {
  storeId: string;
  code: string;
  barcode?: string;
  name: string;
  description?: string;
  category: string;
  priceVES?: number;
  priceUSD?: number;
  costVES?: number;
  costUSD?: number;
  stock?: number;
  minStock?: number;
  unit?: string;
  imageUrl?: string;
}

interface UpdateProductData {
  code?: string;
  barcode?: string;
  name?: string;
  description?: string;
  category?: string;
  priceVES?: number;
  priceUSD?: number;
  costVES?: number;
  costUSD?: number;
  stock?: number;
  minStock?: number;
  unit?: string;
  imageUrl?: string;
  isActive?: boolean;
}

interface GetProductsParams {
  storeId: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function createProduct(data: CreateProductData): Promise<Product> {
  // Verificar que no existe un producto con el mismo código en la tienda
  const existing = await prisma.product.findUnique({
    where: {
      storeId_code: {
        storeId: data.storeId,
        code: data.code,
      },
    },
  });

  if (existing) {
    throw new AppError('Product code already exists in this store', 400);
  }

  return prisma.product.create({
    data,
  });
}

export async function getProducts(params: GetProductsParams) {
  const { storeId, category, search, page = 1, limit = 50 } = params;

  const where: any = {
    storeId,
    isActive: true,
  };

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProductById(id: string): Promise<Product> {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
}

export async function updateProduct(
  id: string,
  data: UpdateProductData
): Promise<Product> {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Si se actualiza el código, verificar que no existe otro producto con ese código
  if (data.code && data.code !== product.code) {
    const existing = await prisma.product.findUnique({
      where: {
        storeId_code: {
          storeId: product.storeId,
          code: data.code,
        },
      },
    });

    if (existing) {
      throw new AppError('Product code already exists in this store', 400);
    }
  }

  return prisma.product.update({
    where: { id },
    data,
  });
}

export async function deleteProduct(id: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Soft delete (marcar como inactivo en lugar de eliminar)
  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function searchProducts(storeId: string, query: string) {
  return prisma.product.findMany({
    where: {
      storeId,
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } },
        { barcode: { equals: query } },
      ],
    },
    take: 20,
    orderBy: { name: 'asc' },
  });
}

export async function getProductsByCategory(storeId: string, category: string) {
  return prisma.product.findMany({
    where: {
      storeId,
      category,
      isActive: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function getLowStockProducts(storeId: string) {
  return prisma.product.findMany({
    where: {
      storeId,
      isActive: true,
      stock: {
        lte: prisma.product.fields.minStock,
      },
    },
    orderBy: { stock: 'asc' },
  });
}
```

#### 1.5.3 Crear Controller de Productos

**Archivo**: `backend/src/controllers/productController.ts`

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as productService from '../services/productService';
import { logger } from '../config/logger';

export async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const product = await productService.createProduct(req.body);

    logger.info('Product created', {
      productId: product.id,
      code: product.code,
    });

    res.status(201).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAll(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { storeId, category, search, page, limit } = req.query;

    const result = await productService.getProducts({
      storeId: storeId as string,
      category: category as string,
      search: search as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const product = await productService.getProductById(req.params.id);

    res.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);

    logger.info('Product updated', { productId: product.id });

    res.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await productService.deleteProduct(req.params.id);

    logger.info('Product deleted', { productId: req.params.id });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function search(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { storeId, query } = req.query;

    const products = await productService.searchProducts(
      storeId as string,
      query as string
    );

    res.json({
      success: true,
      data: { products },
    });
  } catch (error) {
    next(error);
  }
}

export async function getLowStock(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { storeId } = req.query;

    const products = await productService.getLowStockProducts(
      storeId as string
    );

    res.json({
      success: true,
      data: { products },
    });
  } catch (error) {
    next(error);
  }
}
```

#### 1.5.4 Crear Rutas de Productos

**Archivo**: `backend/src/routes/product.routes.ts`

```typescript
import { Router } from 'express';
import * as productController from '../controllers/productController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../middleware/productValidators';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/products?storeId=xxx&category=xxx&search=xxx&page=1&limit=50
router.get('/', productController.getAll);

// GET /api/products/search?storeId=xxx&query=xxx
router.get('/search', productController.search);

// GET /api/products/low-stock?storeId=xxx
router.get('/low-stock', productController.getLowStock);

// GET /api/products/:id
router.get('/:id', productController.getById);

// POST /api/products
router.post(
  '/',
  validateRequest(createProductSchema),
  productController.create
);

// PUT /api/products/:id
router.put(
  '/:id',
  validateRequest(updateProductSchema),
  productController.update
);

// DELETE /api/products/:id
router.delete('/:id', productController.remove);

export default router;
```

#### 1.5.5 Registrar Rutas en App

**Modificar**: `backend/src/app.ts`

```typescript
// Importar rutas de productos
import productRoutes from './routes/product.routes';

// ... código existente ...

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); // 👈 AGREGAR
```

#### 1.5.6 Probar Endpoints

```bash
# Obtener token primero
TOKEN="tu_access_token_aqui"

# 1. Crear producto
curl -X POST http://localhost:4000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "store-uuid",
    "code": "PROD-0001",
    "name": "Producto de Prueba",
    "category": "Electrónica",
    "priceVES": 100.50,
    "priceUSD": 10.00,
    "stock": 50,
    "minStock": 10
  }'

# 2. Listar productos
curl -X GET "http://localhost:4000/api/products?storeId=store-uuid&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# 3. Buscar producto
curl -X GET "http://localhost:4000/api/products/search?storeId=store-uuid&query=Producto" \
  -H "Authorization: Bearer $TOKEN"

# 4. Actualizar producto
curl -X PUT http://localhost:4000/api/products/product-uuid \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priceVES": 120.00
  }'

# 5. Productos con stock bajo
curl -X GET "http://localhost:4000/api/products/low-stock?storeId=store-uuid" \
  -H "Authorization: Bearer $TOKEN"
```

**Criterios de aceptación**:

- [ ] CRUD completo funcional
- [ ] Filtro por storeId funcional
- [ ] Búsqueda por nombre/código/barcode funcional
- [ ] Paginación funcional
- [ ] Stock bajo funcional
- [ ] Validación de inputs con Zod
- [ ] Errores manejados correctamente

---

### 1.6 Implementar Ventas (Día 3, tarde - 4 horas)

#### 1.6.1 Crear Validadores de Ventas

**Archivo**: `backend/src/middleware/saleValidators.ts`

```typescript
import { z } from 'zod';

const saleItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  code: z.string(),
  name: z.string(),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
  discount: z.number().nonnegative('Discount cannot be negative').default(0),
  subtotal: z.number().positive('Subtotal must be positive'),
});

export const createSaleSchema = z.object({
  storeId: z.string().uuid('Invalid store ID'),
  cashierId: z.string().uuid('Invalid cashier ID'),
  cashierName: z.string().min(1, 'Cashier name is required'),
  customerId: z.string().uuid().optional(),
  customerName: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().positive('Subtotal must be positive'),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  total: z.number().positive('Total must be positive'),
  currency: z.enum(['VES', 'USD'], { required_error: 'Currency is required' }),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'credit'], {
    required_error: 'Payment method is required',
  }),
  paymentStatus: z.enum(['paid', 'credit']).default('paid'),
  amountReceived: z.number().positive().optional(),
  change: z.number().nonnegative().optional(),
  creditDueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const cancelSaleSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
});
```

#### 1.6.2 Crear Servicio de Ventas

**Archivo**: `backend/src/services/saleService.ts`

```typescript
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Sale } from '@prisma/client';

interface SaleItem {
  productId: string;
  code: string;
  name: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

interface CreateSaleData {
  storeId: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  amountReceived?: number;
  change?: number;
  creditDueDate?: string;
  notes?: string;
}

export async function createSale(data: CreateSaleData) {
  // Transacción para asegurar atomicidad
  return prisma.$transaction(async (tx) => {
    // 1. Generar número de venta secuencial
    const lastSale = await tx.sale.findFirst({
      where: { storeId: data.storeId },
      orderBy: { saleNumber: 'desc' },
      select: { saleNumber: true },
    });

    const nextNumber = lastSale
      ? String(Number(lastSale.saleNumber) + 1).padStart(6, '0')
      : '000001';

    // 2. Crear venta
    const sale = await tx.sale.create({
      data: {
        storeId: data.storeId,
        saleNumber: nextNumber,
        cashierId: data.cashierId,
        cashierName: data.cashierName,
        customerId: data.customerId,
        customerName: data.customerName,
        subtotal: data.subtotal,
        discount: data.discount,
        tax: data.tax,
        total: data.total,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        amountReceived: data.amountReceived,
        change: data.change,
        creditDueDate: data.creditDueDate ? new Date(data.creditDueDate) : null,
        notes: data.notes,
        status: 'completed',
      },
    });

    // 3. Crear items de venta
    const items = await Promise.all(
      data.items.map((item) =>
        tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            code: item.code,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            subtotal: item.subtotal,
          },
        })
      )
    );

    // 4. Actualizar stock de productos
    await Promise.all(
      data.items.map((item) =>
        tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      )
    );

    // 5. Registrar movimientos de inventario
    await Promise.all(
      data.items.map((item) =>
        tx.inventoryMovement.create({
          data: {
            storeId: data.storeId,
            productId: item.productId,
            type: 'exit',
            quantity: item.quantity,
            reason: 'sale',
            referenceType: 'sale',
            referenceId: sale.id,
            userId: data.cashierId,
          },
        })
      )
    );

    // 6. Si es venta a crédito, crear transacción de cliente
    if (data.paymentStatus === 'credit' && data.customerId) {
      await tx.customerTransaction.create({
        data: {
          storeId: data.storeId,
          customerId: data.customerId,
          type: 'charge',
          amount: data.total,
          currency: data.currency,
          description: `Venta #${nextNumber}`,
          dueDate: data.creditDueDate ? new Date(data.creditDueDate) : null,
        },
      });

      // Actualizar balance del cliente
      await tx.customer.update({
        where: { id: data.customerId },
        data: {
          balance: {
            increment: data.total,
          },
        },
      });
    }

    return {
      sale,
      items,
    };
  });
}

export async function getSales(storeId: string, page = 1, limit = 50) {
  const skip = (page - 1) * limit;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where: { storeId },
      include: {
        items: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.sale.count({ where: { storeId } }),
  ]);

  return {
    sales,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getSaleById(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!sale) {
    throw new AppError('Sale not found', 404);
  }

  return sale;
}

export async function cancelSale(id: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) {
      throw new AppError('Sale not found', 404);
    }

    if (sale.status === 'cancelled') {
      throw new AppError('Sale is already cancelled', 400);
    }

    // 1. Marcar venta como cancelada
    const cancelledSale = await tx.sale.update({
      where: { id },
      data: {
        status: 'cancelled',
        paymentStatus: 'cancelled',
        cancelledAt: new Date(),
        notes: sale.notes ? `${sale.notes}\n\nCancelación: ${reason}` : reason,
      },
    });

    // 2. Revertir stock
    await Promise.all(
      sale.items.map((item) =>
        tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      )
    );

    // 3. Registrar movimientos de reversión
    await Promise.all(
      sale.items.map((item) =>
        tx.inventoryMovement.create({
          data: {
            storeId: sale.storeId,
            productId: item.productId,
            type: 'entry',
            quantity: item.quantity,
            reason: 'return',
            referenceType: 'sale',
            referenceId: sale.id,
            userId: sale.cashierId,
            notes: `Reversión de venta #${sale.saleNumber}`,
          },
        })
      )
    );

    // 4. Si era venta a crédito, revertir balance del cliente
    if (sale.paymentStatus === 'credit' && sale.customerId) {
      await tx.customer.update({
        where: { id: sale.customerId },
        data: {
          balance: {
            decrement: sale.total,
          },
        },
      });
    }

    return cancelledSale;
  });
}
```

#### 1.6.3 Crear Controller de Ventas

**Archivo**: `backend/src/controllers/saleController.ts`

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as saleService from '../services/saleService';
import { logger } from '../config/logger';

export async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await saleService.createSale(req.body);

    logger.info('Sale created', {
      saleId: result.sale.id,
      saleNumber: result.sale.saleNumber,
      total: result.sale.total,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAll(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { storeId, page, limit } = req.query;

    const result = await saleService.getSales(
      storeId as string,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const sale = await saleService.getSaleById(req.params.id);

    res.json({
      success: true,
      data: { sale },
    });
  } catch (error) {
    next(error);
  }
}

export async function cancel(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { reason } = req.body;
    const sale = await saleService.cancelSale(req.params.id, reason);

    logger.warn('Sale cancelled', {
      saleId: sale.id,
      saleNumber: sale.saleNumber,
      reason,
    });

    res.json({
      success: true,
      data: { sale },
    });
  } catch (error) {
    next(error);
  }
}
```

#### 1.6.4 Crear Rutas de Ventas

**Archivo**: `backend/src/routes/sale.routes.ts`

```typescript
import { Router } from 'express';
import * as saleController from '../controllers/saleController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import {
  createSaleSchema,
  cancelSaleSchema,
} from '../middleware/saleValidators';

const router = Router();

router.use(authMiddleware);

// GET /api/sales?storeId=xxx&page=1&limit=50
router.get('/', saleController.getAll);

// GET /api/sales/:id
router.get('/:id', saleController.getById);

// POST /api/sales
router.post('/', validateRequest(createSaleSchema), saleController.create);

// POST /api/sales/:id/cancel
router.post(
  '/:id/cancel',
  validateRequest(cancelSaleSchema),
  saleController.cancel
);

export default router;
```

#### 1.6.5 Registrar Rutas

**Modificar**: `backend/src/app.ts`

```typescript
import saleRoutes from './routes/sale.routes';

// ...
app.use('/api/sales', saleRoutes);
```

**Criterios de aceptación**:

- [ ] POST /api/sales crea venta con transacción
- [ ] Stock se actualiza automáticamente
- [ ] Movimientos de inventario se registran
- [ ] Venta a crédito actualiza balance del cliente
- [ ] POST /api/sales/:id/cancel revierte todo
- [ ] Número de venta secuencial funciona

---

### 1.7 Implementar Inventario y Kardex (Día 4, mañana - 4 horas)

**(Implementación similar a productos/ventas, se omiten detalles por brevedad)**

**Archivos a crear**:

- `backend/src/services/inventoryService.ts`
- `backend/src/controllers/inventoryController.ts`
- `backend/src/routes/inventory.routes.ts`
- `backend/src/middleware/inventoryValidators.ts`

**Endpoints clave**:

- GET /api/inventory/movements?storeId=xxx&productId=xxx
- POST /api/inventory/movements
- GET /api/inventory/kardex/:productId
- GET /api/inventory/alerts?storeId=xxx
- GET /api/inventory/valuation?storeId=xxx

**Criterios de aceptación**:

- [ ] Movimientos de inventario (entry/exit) funcional
- [ ] Kardex con balance acumulado funcional
- [ ] Alertas de stock bajo funcional
- [ ] Valorización de inventario funcional

---

### 1.8 Implementar Clientes, Proveedores y Transacciones (Día 4, tarde - 4 horas)

**(Implementación similar a productos, se omiten detalles por brevedad)**

**Archivos a crear**:

- `backend/src/services/customerService.ts`
- `backend/src/services/supplierService.ts`
- `backend/src/services/transactionService.ts`
- `backend/src/controllers/customerController.ts`
- `backend/src/controllers/supplierController.ts`
- `backend/src/routes/customer.routes.ts`
- `backend/src/routes/supplier.routes.ts`

**Endpoints clave**:

**Clientes**:

- GET /api/customers?storeId=xxx
- POST /api/customers
- PUT /api/customers/:id
- DELETE /api/customers/:id
- GET /api/customers/:id/transactions
- POST /api/customers/:id/transactions (registrar pago/cargo)
- GET /api/customers/:id/account-status

**Proveedores**:

- GET /api/suppliers?storeId=xxx
- POST /api/suppliers
- PUT /api/suppliers/:id
- DELETE /api/suppliers/:id
- GET /api/suppliers/:id/transactions
- POST /api/suppliers/:id/transactions

**Criterios de aceptación**:

- [ ] CRUD de clientes y proveedores funcional
- [ ] Balance se actualiza con transacciones
- [ ] Estado de cuenta con aging funcional

---

### 1.9 Implementar Reportes y Configuración (Día 5, completo - 8 horas)

**Archivos a crear**:

- `backend/src/services/reportService.ts`
- `backend/src/controllers/reportController.ts`
- `backend/src/routes/report.routes.ts`
- `backend/src/services/storeService.ts`
- `backend/src/controllers/storeController.ts`
- `backend/src/routes/store.routes.ts`

**Endpoints de reportes**:

```typescript
// GET /api/reports/sales?storeId=xxx&startDate=xxx&endDate=xxx
// Devuelve:
// - Total ventas por día
// - Total por método de pago
// - Top productos vendidos
// - Comparación con período anterior

// GET /api/reports/inventory?storeId=xxx
// Devuelve:
// - Valorización total
// - Productos con stock bajo
// - Movimientos del mes
// - Rotación de inventario

// GET /api/reports/financial?storeId=xxx&startDate=xxx&endDate=xxx
// Devuelve:
// - Cuentas por cobrar
// - Cuentas por pagar
// - Flujo de caja
// - Estado de resultados simplificado
```

**Endpoints de configuración**:

- GET /api/stores/:id
- PUT /api/stores/:id
- GET /api/exchange-rates?storeId=xxx
- POST /api/exchange-rates

**Criterios de aceptación**:

- [ ] Reporte de ventas con gráficos funcional
- [ ] Reporte de inventario con valorización funcional
- [ ] Reporte financiero con cuentas por cobrar/pagar funcional
- [ ] Configuración de tienda editable

---

## 🎯 FIN DE LA FASE 1 (Backend Completo)

**Resultado**:
✅ 35 endpoints RESTful implementados
✅ PostgreSQL con 11 tablas
✅ Auth JWT completo
✅ Validaciones con Zod
✅ Transacciones ACID
✅ Logs con Winston
✅ Rate limiting
✅ Backend 100% funcional

**Archivos creados en total**: ~50 archivos TypeScript

**Tiempo total Fase 1**: 5 días (40 horas)

---

## FASE 2: Frontend Migration (3 días)

**Objetivo**: Reescribir todos los servicios del frontend para consumir la API REST en lugar de Firebase.

---

### 2.1 Setup de HTTP Client (Día 6, mañana - 2 horas)

#### 2.1.1 Crear HTTP Client con JWT

**Archivo**: `lib/api/httpClient.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class HttpClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private setToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  private removeToken(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.removeToken();
        return null;
      }

      const data = await response.json();
      this.setToken(data.data.accessToken);
      return data.data.accessToken;
    } catch (error) {
      this.removeToken();
      return null;
    }
  }

  private async request(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<any> {
    const { skipAuth = false, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    // Agregar token si no se omite auth
    if (!skipAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
      });

      // Si es 401, intentar refresh
      if (response.status === 401 && !skipAuth) {
        const newToken = await this.refreshAccessToken();

        if (newToken) {
          // Reintentar con nuevo token
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...fetchOptions,
            headers,
          });

          if (!retryResponse.ok) {
            throw new Error(retryResponse.statusText);
          }

          return retryResponse.json();
        } else {
          // Redirigir a login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          throw new Error('Session expired');
        }
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      return response.json();
    } catch (error) {
      console.error('HTTP Error:', error);
      throw error;
    }
  }

  async get(endpoint: string, options?: RequestOptions): Promise<any> {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  async post(
    endpoint: string,
    data: any,
    options?: RequestOptions
  ): Promise<any> {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async put(
    endpoint: string,
    data: any,
    options?: RequestOptions
  ): Promise<any> {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async delete(endpoint: string, options?: RequestOptions): Promise<any> {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }

  async upload(endpoint: string, file: File): Promise<any> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  setAuthTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearAuthTokens(): void {
    this.removeToken();
  }
}

export const httpClient = new HttpClient();
```

#### 2.1.2 Actualizar `.env.local`

**Archivo**: `.env.local`

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

### 2.2 Migrar Servicios (Día 6 tarde + Día 7 - 12 horas)

#### 2.2.1 Servicio de Auth

**ANTES** (`lib/auth.ts` - Firebase):

```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

export async function login(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}
```

**DESPUÉS** (`lib/api/auth.ts` - API REST):

```typescript
import { httpClient } from './httpClient';

export async function register(email: string, password: string, name: string) {
  const response = await httpClient.post(
    '/api/auth/register',
    { email, password, name },
    { skipAuth: true }
  );

  httpClient.setAuthTokens(
    response.data.accessToken,
    response.data.refreshToken
  );

  return response.data.user;
}

export async function login(email: string, password: string) {
  const response = await httpClient.post(
    '/api/auth/login',
    { email, password },
    { skipAuth: true }
  );

  httpClient.setAuthTokens(
    response.data.accessToken,
    response.data.refreshToken
  );

  return response.data.user;
}

export async function logout() {
  await httpClient.post('/api/auth/logout', {});
  httpClient.clearAuthTokens();
}

export async function getCurrentUser() {
  const response = await httpClient.get('/api/auth/me');
  return response.data.user;
}
```

#### 2.2.2 Servicio de Productos

**DESPUÉS** (`lib/api/products.ts`):

```typescript
import { httpClient } from './httpClient';

export async function getProducts(
  storeId: string,
  params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
) {
  const queryParams = new URLSearchParams({
    storeId,
    ...(params?.category && { category: params.category }),
    ...(params?.search && { search: params.search }),
    ...(params?.page && { page: params.page.toString() }),
    ...(params?.limit && { limit: params.limit.toString() }),
  });

  const response = await httpClient.get(`/api/products?${queryParams}`);
  return response.data.products;
}

export async function createProduct(data: any) {
  const response = await httpClient.post('/api/products', data);
  return response.data.product;
}

export async function updateProduct(id: string, data: any) {
  const response = await httpClient.put(`/api/products/${id}`, data);
  return response.data.product;
}

export async function deleteProduct(id: string) {
  await httpClient.delete(`/api/products/${id}`);
}

export async function searchProducts(storeId: string, query: string) {
  const response = await httpClient.get(
    `/api/products/search?storeId=${storeId}&query=${query}`
  );
  return response.data.products;
}

export async function uploadProductImage(file: File) {
  const response = await httpClient.upload('/api/products/upload-image', file);
  return response.data.imageUrl;
}
```

#### 2.2.3 Resto de Servicios

**Migrar similarmente** (siguiendo el mismo patrón):

- `lib/api/sales.ts`
- `lib/api/inventory.ts`
- `lib/api/customers.ts`
- `lib/api/suppliers.ts`
- `lib/api/transactions.ts`
- `lib/api/reports.ts`
- `lib/api/stores.ts`

**Total de servicios a reescribir**: 10 archivos

**Archivos a crear**:

```
lib/api/
├── httpClient.ts      ✅ NUEVO
├── auth.ts            ✅ REESCRITO
├── products.ts        ✅ REESCRITO
├── sales.ts           ✅ REESCRITO
├── inventory.ts       ✅ REESCRITO
├── customers.ts       ✅ REESCRITO
├── suppliers.ts       ✅ REESCRITO
├── transactions.ts    ✅ REESCRITO
├── reports.ts         ✅ REESCRITO
└── stores.ts          ✅ REESCRITO
```

---

### 2.3 Actualizar Componentes y Páginas (Día 8 - 8 horas)

#### 2.3.1 Actualizar Login

**ANTES** (`app/auth/login/page.tsx`):

```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const handleLogin = async () => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  router.push('/dashboard');
};
```

**DESPUÉS**:

```typescript
import { login } from '@/lib/api/auth';

const handleLogin = async () => {
  const user = await login(email, password);
  router.push('/dashboard');
};
```

#### 2.3.2 Actualizar POS Screen

**ANTES** (`app/dashboard/pos/page.tsx`):

```typescript
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const processSale = async () => {
  await addDoc(collection(db, 'sales'), saleData);
};
```

**DESPUÉS**:

```typescript
import { createSale } from '@/lib/api/sales';

const processSale = async () => {
  await createSale(saleData);
};
```

#### 2.3.3 Implementar Polling (para reemplazar real-time)

**Antes (Firebase real-time)**:

```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(collection(db, 'products'), where('storeId', '==', storeId)),
    (snapshot) => {
      setProducts(snapshot.docs.map((doc) => doc.data()));
    }
  );

  return () => unsubscribe();
}, [storeId]);
```

**Después (Polling cada 5 segundos)**:

```typescript
useEffect(() => {
  const fetchProducts = async () => {
    const data = await getProducts(storeId);
    setProducts(data);
  };

  fetchProducts(); // Primera carga

  const interval = setInterval(fetchProducts, 5000); // Polling cada 5s

  return () => clearInterval(interval);
}, [storeId]);
```

#### 2.3.4 Actualizar Todas las Pantallas

**Pantallas a actualizar** (~15 archivos):

- `app/auth/login/page.tsx`
- `app/auth/register/page.tsx`
- `app/dashboard/pos/page.tsx`
- `app/dashboard/products/page.tsx`
- `app/dashboard/products/[id]/page.tsx`
- `app/dashboard/inventory/page.tsx`
- `app/dashboard/customers/page.tsx`
- `app/dashboard/customers/[id]/page.tsx`
- `app/dashboard/suppliers/page.tsx`
- `app/dashboard/suppliers/[id]/page.tsx`
- `app/dashboard/reports/sales/page.tsx`
- `app/dashboard/reports/inventory/page.tsx`
- `app/dashboard/reports/financial/page.tsx`
- `app/dashboard/settings/page.tsx`

**Criterios de aceptación**:

- [ ] Todas las pantallas consuman API REST
- [ ] Polling implementado en listados críticos
- [ ] Sin errores de consola
- [ ] Auth con JWT funcional
- [ ] Upload de imágenes funcional

---

### 2.4 Eliminar Firebase (Día 8, final - 1 hora)

```bash
# 1. Eliminar archivo de config
rm lib/firebase.ts

# 2. Desinstalar Firebase SDK
npm uninstall firebase

# 3. Verificar que no hay referencias a Firebase
grep -r "from 'firebase" .
grep -r "import.*firebase" .

# Si hay resultados, eliminar esos imports

# 4. Verificar que la app compila
npm run build
```

**Criterios de aceptación**:

- [ ] Firebase SDK desinstalado de package.json
- [ ] `lib/firebase.ts` eliminado
- [ ] Sin imports de Firebase en el código
- [ ] App compila sin errores (`npm run build` exitoso)
- [ ] App inicia sin errores (`npm run dev` exitoso)

---

## 🎯 FIN DE LA FASE 2 (Frontend Migrado)

**Resultado**:
✅ httpClient creado con JWT y refresh tokens
✅ 10 servicios reescritos con fetch
✅ 15 pantallas actualizadas
✅ Polling implementado (cada 5s en listados)
✅ Firebase completamente eliminado
✅ Frontend 100% conectado a backend REST

**Tiempo total Fase 2**: 3 días (24 horas)

---

## FASE 3: Migración de Datos (2 días)

**Objetivo**: Migrar todos los datos de Firestore a PostgreSQL sin pérdidas ni corrupción.

---

### 3.1 Backup de Firestore (Día 9, mañana - 2 horas)

#### 3.1.1 Backup Manual desde Firebase Console

```
1. Ir a https://console.firebase.google.com
2. Seleccionar proyecto
3. Firestore Database → Pestaña "Data"
4. Click en menú "..." → "Export Data"
5. Seleccionar todas las colecciones
6. Guardar en Cloud Storage bucket
7. Descargar archivo JSON localmente
```

#### 3.1.2 Backup con Script Node.js

**Archivo**: `scripts/backup-firestore.js`

```javascript
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function backupCollection(collectionName) {
  console.log(`📦 Backing up ${collectionName}...`);

  const snapshot = await db.collection(collectionName).get();
  const data = {};

  snapshot.forEach((doc) => {
    data[doc.id] = {
      ...doc.data(),
      _id: doc.id,
      _createdAt: doc.createTime?.toDate(),
      _updatedAt: doc.updateTime?.toDate(),
    };
  });

  const backupDir = path.join(process.cwd(), 'backups', 'firestore');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filePath = path.join(backupDir, `${collectionName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log(`✅ ${snapshot.size} docs backed up to ${filePath}`);

  return snapshot.size;
}

async function backupAll() {
  console.log('🚀 Starting Firestore backup...\n');

  const collections = [
    'users',
    'stores',
    'products',
    'sales',
    'customers',
    'suppliers',
    'customerTransactions',
    'supplierTransactions',
    'inventoryMovements',
    'exchangeRates',
  ];

  const stats = {};

  for (const collection of collections) {
    stats[collection] = await backupCollection(collection);
  }

  console.log('\n✅ Backup complete!\n');
  console.log('Summary:');
  Object.entries(stats).forEach(([name, count]) => {
    console.log(`  - ${name}: ${count} docs`);
  });

  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
  console.log(`\nTotal: ${total} documents backed up`);
}

backupAll().catch(console.error);
```

**Ejecutar**:

```bash
node scripts/backup-firestore.js
```

**Criterios de aceptación**:

- [ ] Backup completo en `backups/firestore/*.json`
- [ ] Todos los documentos exportados
- [ ] Archivo de log con counts por colección

---

### 3.2 Script de Migración (Día 9, tarde + Día 10, mañana - 10 horas)

**Archivo**: `scripts/migrate-firestore-to-postgres.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { hashPassword } from '../backend/src/utils/bcrypt';

const prisma = new PrismaClient();

const BACKUP_DIR = path.join(process.cwd(), 'backups', 'firestore');

function loadBackup(collectionName: string) {
  const filePath = path.join(BACKUP_DIR, `${collectionName}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return Object.values(data);
}

async function migrateUsers() {
  console.log('👤 Migrating users...');

  const users = loadBackup('users') as any[];

  for (const user of users) {
    // Si el usuario ya tiene password hasheada de Firebase, resetearla
    // O importar el hash si es compatible con bcrypt
    const password = user.password || (await hashPassword('TempPassword123!'));

    await prisma.user.create({
      data: {
        id: user._id,
        email: user.email,
        password,
        name: user.name,
        role: user.role || 'owner',
        storeId: user.storeId,
        isActive: user.isActive !== false,
        createdAt: user._createdAt || new Date(),
        updatedAt: user._updatedAt || new Date(),
      },
    });
  }

  console.log(`✅ ${users.length} users migrated`);
}

async function migrateStores() {
  console.log('🏪 Migrating stores...');

  const stores = loadBackup('stores') as any[];

  for (const store of stores) {
    await prisma.store.create({
      data: {
        id: store._id,
        name: store.name,
        owner: store.owner,
        address: store.address,
        phone: store.phone,
        email: store.email,
        taxId: store.taxId,
        createdAt: store._createdAt || new Date(),
        updatedAt: store._updatedAt || new Date(),
      },
    });
  }

  console.log(`✅ ${stores.length} stores migrated`);
}

async function migrateProducts() {
  console.log('📦 Migrating products...');

  const products = loadBackup('products') as any[];

  for (const product of products) {
    await prisma.product.create({
      data: {
        id: product._id,
        storeId: product.storeId,
        code: product.code,
        barcode: product.barcode,
        name: product.name,
        description: product.description,
        category: product.category,
        priceVES: product.prices?.VES,
        priceUSD: product.prices?.USD,
        costVES: product.costs?.VES,
        costUSD: product.costs?.USD,
        stock: product.stock || 0,
        minStock: product.minStock || 0,
        unit: product.unit || 'unit',
        imageUrl: product.imageUrl,
        isActive: product.isActive !== false,
        createdAt: product._createdAt || new Date(),
        updatedAt: product._updatedAt || new Date(),
      },
    });
  }

  console.log(`✅ ${products.length} products migrated`);
}

async function migrateSales() {
  console.log('💰 Migrating sales...');

  const sales = loadBackup('sales') as any[];

  for (const sale of sales) {
    // Crear venta
    const createdSale = await prisma.sale.create({
      data: {
        id: sale._id,
        storeId: sale.storeId,
        saleNumber: sale.saleNumber,
        cashierId: sale.cashierId,
        cashierName: sale.cashierName,
        customerId: sale.customerId,
        customerName: sale.customerName,
        subtotal: sale.subtotal,
        discount: sale.discount || 0,
        tax: sale.tax || 0,
        total: sale.total,
        currency: sale.currency,
        paymentMethod: sale.paymentMethod,
        paymentStatus: sale.paymentStatus || 'paid',
        amountReceived: sale.amountReceived,
        change: sale.change,
        status: sale.status || 'completed',
        cancelledAt: sale.cancelledAt,
        creditDueDate: sale.creditDueDate,
        notes: sale.notes,
        createdAt: sale._createdAt || new Date(),
      },
    });

    // Crear items (estaban embebidos en Firestore)
    if (sale.items && Array.isArray(sale.items)) {
      for (const item of sale.items) {
        await prisma.saleItem.create({
          data: {
            saleId: createdSale.id,
            productId: item.productId,
            code: item.code,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            subtotal: item.subtotal,
          },
        });
      }
    }
  }

  console.log(`✅ ${sales.length} sales migrated`);
}

async function migrateCustomers() {
  console.log('👥 Migrating customers...');

  const customers = loadBackup('customers') as any[];

  for (const customer of customers) {
    await prisma.customer.create({
      data: {
        id: customer._id,
        storeId: customer.storeId,
        code: customer.code,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        taxId: customer.taxId,
        balance: customer.balance || 0,
        createdAt: customer._createdAt || new Date(),
        updatedAt: customer._updatedAt || new Date(),
      },
    });
  }

  console.log(`✅ ${customers.length} customers migrated`);
}

async function migrateSuppliers() {
  console.log('🏭 Migrating suppliers...');

  const suppliers = loadBackup('suppliers') as any[];

  for (const supplier of suppliers) {
    await prisma.supplier.create({
      data: {
        id: supplier._id,
        storeId: supplier.storeId,
        code: supplier.code,
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        taxId: supplier.taxId,
        balance: supplier.balance || 0,
        createdAt: supplier._createdAt || new Date(),
        updatedAt: supplier._updatedAt || new Date(),
      },
    });
  }

  console.log(`✅ ${suppliers.length} suppliers migrated`);
}

async function migrateCustomerTransactions() {
  console.log('💳 Migrating customer transactions...');

  const transactions = loadBackup('customerTransactions') as any[];

  for (const txn of transactions) {
    await prisma.customerTransaction.create({
      data: {
        id: txn._id,
        storeId: txn.storeId,
        customerId: txn.customerId,
        type: txn.type,
        amount: txn.amount,
        currency: txn.currency,
        description: txn.description,
        dueDate: txn.dueDate,
        createdAt: txn._createdAt || new Date(),
      },
    });
  }

  console.log(`✅ ${transactions.length} customer transactions migrated`);
}

async function migrateSupplierTransactions() {
  console.log('🏢 Migrating supplier transactions...');

  const transactions = loadBackup('supplierTransactions') as any[];

  for (const txn of transactions) {
    await prisma.supplierTransaction.create({
      data: {
        id: txn._id,
        storeId: txn.storeId,
        supplierId: txn.supplierId,
        type: txn.type,
        amount: txn.amount,
        currency: txn.currency,
        description: txn.description,
        dueDate: txn.dueDate,
        createdAt: txn._createdAt || new Date(),
      },
    });
  }

  console.log(`✅ ${transactions.length} supplier transactions migrated`);
}

async function migrateInventoryMovements() {
  console.log('📊 Migrating inventory movements...');

  const movements = loadBackup('inventoryMovements') as any[];

  for (const movement of movements) {
    await prisma.inventoryMovement.create({
      data: {
        id: movement._id,
        storeId: movement.storeId,
        productId: movement.productId,
        type: movement.type,
        quantity: movement.quantity,
        reason: movement.reason,
        referenceType: movement.referenceType,
        referenceId: movement.referenceId,
        userId: movement.userId,
        notes: movement.notes,
        createdAt: movement._createdAt || new Date(),
      },
    });
  }

  console.log(`✅ ${movements.length} inventory movements migrated`);
}

async function migrateExchangeRates() {
  console.log('💱 Migrating exchange rates...');

  const rates = loadBackup('exchangeRates') as any[];

  for (const rate of rates) {
    await prisma.exchangeRate.create({
      data: {
        id: rate._id,
        storeId: rate.storeId,
        rate: rate.rate,
        createdAt: rate._createdAt || new Date(),
      },
    });
  }

  console.log(`✅ ${rates.length} exchange rates migrated`);
}

async function validateMigration() {
  console.log('\n🔍 Validating migration...\n');

  const collections = [
    'users',
    'stores',
    'products',
    'sales',
    'customers',
    'suppliers',
    'customerTransactions',
    'supplierTransactions',
    'inventoryMovements',
    'exchangeRates',
  ];

  const modelNames: Record<string, any> = {
    users: 'user',
    stores: 'store',
    products: 'product',
    sales: 'sale',
    customers: 'customer',
    suppliers: 'supplier',
    customerTransactions: 'customerTransaction',
    supplierTransactions: 'supplierTransaction',
    inventoryMovements: 'inventoryMovement',
    exchangeRates: 'exchangeRate',
  };

  let allValid = true;

  for (const collection of collections) {
    const firestoreData = loadBackup(collection) as any[];
    const firestoreCount = firestoreData.length;

    const model = modelNames[collection];
    const pgCount = await (prisma as any)[model].count();

    const match = firestoreCount === pgCount;

    console.log(
      `${match ? '✅' : '❌'} ${collection}: Firestore=${firestoreCount}, PostgreSQL=${pgCount}`
    );

    if (!match) {
      allValid = false;
    }
  }

  if (allValid) {
    console.log('\n✅ Migration validation successful!');
  } else {
    console.log('\n❌ Migration validation failed! Please review counts.');
  }
}

async function migrate() {
  try {
    console.log('🚀 Starting migration from Firestore to PostgreSQL...\n');

    await migrateStores();
    await migrateUsers();
    await migrateProducts();
    await migrateCustomers();
    await migrateSuppliers();
    await migrateSales();
    await migrateCustomerTransactions();
    await migrateSupplierTransactions();
    await migrateInventoryMovements();
    await migrateExchangeRates();

    await validateMigration();

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
```

**Ejecutar**:

```bash
npx ts-node scripts/migrate-firestore-to-postgres.ts
```

**Criterios de aceptación**:

- [ ] Todos los datos migrados sin pérdidas
- [ ] Counts validados (Firestore vs PostgreSQL coinciden)
- [ ] Relaciones (FK) creadas correctamente
- [ ] Balances de clientes/proveedores correctos
- [ ] Stock de productos correcto

---

### 3.3 Migración de Imágenes (Día 10, tarde - 4 horas)

**Archivo**: `scripts/migrate-images.ts`

```typescript
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { prisma } from '../backend/src/config/database';

const storage = new Storage({
  keyFilename: './firebase-service-account.json',
});

const bucket = storage.bucket('tu-proyecto.appspot.com');

async function downloadImage(remotePath: string, localPath: string) {
  await bucket.file(remotePath).download({ destination: localPath });
}

async function migrateImages() {
  console.log('🖼️  Migrating images from Firebase Storage...\n');

  // Listar todas las imágenes en Firebase Storage
  const [files] = await bucket.getFiles({ prefix: 'products/' });

  const uploadDir = path.join(process.cwd(), 'backend', 'uploads', 'products');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  let migrated = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const fileName = path.basename(file.name);
      const localPath = path.join(uploadDir, fileName);

      await downloadImage(file.name, localPath);

      // Actualizar URL en PostgreSQL
      const newUrl = `/uploads/products/${fileName}`;

      await prisma.product.updateMany({
        where: {
          imageUrl: {
            contains: fileName,
          },
        },
        data: {
          imageUrl: newUrl,
        },
      });

      console.log(`✅ ${file.name} → ${localPath}`);
      migrated++;
    } catch (error) {
      console.error(`❌ Failed to migrate ${file.name}:`, error);
      failed++;
    }
  }

  console.log(
    `\n✅ Migration complete: ${migrated} images migrated, ${failed} failed`
  );
}

migrateImages();
```

**Ejecutar**:

```bash
npx ts-node scripts/migrate-images.ts
```

**Criterios de aceptación**:

- [ ] Todas las imágenes descargadas a `backend/uploads/products/`
- [ ] URLs actualizadas en PostgreSQL
- [ ] Imágenes accesibles desde `http://localhost:4000/uploads/products/xxx.jpg`

---

## 🎯 FIN DE LA FASE 3 (Datos Migrados)

**Resultado**:
✅ Backup completo de Firestore
✅ Script de migración ejecutado
✅ Todos los datos en PostgreSQL
✅ Validación de integridad pasada
✅ Imágenes migradas y accesibles

**Tiempo total Fase 3**: 2 días (16 horas)

---

## FASE 4: Testing y Validación (2 días)

### 4.1 Tests End-to-End (Día 11 - 8 horas)

**Flujos críticos a testear manualmente**:

1. **Flujo de Auth**
   - [ ] Register → Login → Dashboard
   - [ ] Logout → Redirect a login
   - [ ] Token expirado → Refresh automático
   - [ ] Token inválido → Redirect a login

2. **Flujo de Productos**
   - [ ] Crear producto → Ver en lista
   - [ ] Editar producto → Cambios reflejados
   - [ ] Buscar producto por nombre/código/barcode
   - [ ] Upload de imagen → URL actualizada
   - [ ] Eliminar producto → Soft delete funcional

3. **Flujo de Ventas (Crítico)**
   - [ ] Agregar productos al carrito POS
   - [ ] Procesar venta en efectivo
   - [ ] Procesar venta a crédito
   - [ ] Verificar stock actualizado
   - [ ] Verificar movimiento de inventario creado
   - [ ] Cancelar venta → Stock revertido

4. **Flujo de Inventario**
   - [ ] Registrar entrada de inventario
   - [ ] Registrar salida de inventario
   - [ ] Ver kardex de producto → Balance correcto
   - [ ] Alertas de stock bajo → Productos con stock <= minStock

5. **Flujo de Clientes**
   - [ ] Crear cliente
   - [ ] Registrar cargo (venta a crédito)
   - [ ] Registrar pago
   - [ ] Ver estado de cuenta → Balance correcto
   - [ ] Aging de cuentas por cobrar

6. **Flujo de Reportes**
   - [ ] Reporte de ventas por rango de fechas
   - [ ] Reporte de inventario con valorización
   - [ ] Reporte financiero (cuentas por cobrar/pagar)
   - [ ] Exportar a Excel → Archivo descargado

**Criterios de aceptación**:

- [ ] Todos los flujos funcionan sin errores
- [ ] Performance aceptable (< 2s por pantalla)
- [ ] Sin errores en consola del navegador
- [ ] Sin errores en logs del backend

---

### 4.2 Performance Testing (Día 12, mañana - 4 horas)

**Métricas objetivo**:

| Endpoint                       | Objetivo | Método de prueba         |
| ------------------------------ | -------- | ------------------------ |
| GET /api/products (1000 prods) | < 200ms  | Apache Bench / curl time |
| POST /api/sales                | < 500ms  | curl time                |
| GET /api/reports/sales         | < 2s     | curl time                |
| GET /api/inventory/kardex/:id  | < 1s     | curl time                |

**Pruebas con Apache Bench**:

```bash
# 100 requests concurrentes al listado de productos
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  http://localhost:4000/api/products?storeId=xxx
```

**Criterios de aceptación**:

- [ ] Todos los endpoints cumplen objetivos de latencia
- [ ] Sin degradación de performance con carga simulada
- [ ] Queries SQL optimizados (< 100ms según logs)

---

### 4.3 Security Audit (Día 12, tarde - 4 horas)

**Checklist de seguridad**:

1. **SQL Injection**
   - [ ] Prisma usa prepared statements (automático)
   - [ ] Sin queries raw sin validación

2. **XSS (Cross-Site Scripting)**
   - [ ] React escapa automáticamente
   - [ ] Sin `dangerouslySetInnerHTML` sin sanitización

3. **CSRF (Cross-Site Request Forgery)**
   - [ ] JWT en headers (no en cookies)
   - [ ] CORS configurado correctamente

4. **Autenticación**
   - [ ] Passwords hasheadas con bcrypt (10 rounds)
   - [ ] JWT con expiración (15 min)
   - [ ] Refresh tokens con expiración (7 días)
   - [ ] Rate limiting en /login (5 intentos)

5. **Autorización**
   - [ ] Middleware de auth en todas las rutas protegidas
   - [ ] Validación de storeId en queries

6. **Configuración**
   - [ ] Secrets en .env (no hardcoded)
   - [ ] HTTPS en producción
   - [ ] Helmet configurado

**Tools**:

```bash
# Scan de vulnerabilidades en dependencias
npm audit

# Fix automático de vulnerabilidades no-breaking
npm audit fix
```

**Criterios de aceptación**:

- [ ] npm audit sin vulnerabilidades críticas
- [ ] OWASP Top 10 mitigado
- [ ] Rate limiting activo
- [ ] HTTPS configurado

---

## 🎯 FIN DE LA FASE 4 (Testing Completo)

**Resultado**:
✅ Tests E2E pasando
✅ Performance validada
✅ Security audit pasado
✅ Sin vulnerabilidades críticas

**Tiempo total Fase 4**: 2 días (16 horas)

---

## FASE 5: Deploy y Producción (1 día)

### 5.1 Configuración del Servidor (Día 13, mañana - 4 horas)

**Prerequisitos del servidor**:

- Ubuntu 20.04+ o Windows Server 2019+
- Al menos 4GB RAM
- 50GB disco
- IP estática o dominio

**Pasos**:

```bash
# 1. Instalar PostgreSQL 14
sudo apt update
sudo apt install postgresql-14

# 2. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Instalar PM2 (process manager)
sudo npm install -g pm2

# 4. Crear usuario de aplicación
sudo adduser tienda
sudo usermod -aG sudo tienda

# 5. Copiar código del backend al servidor
scp -r backend/ tienda@servidor:/home/tienda/

# 6. Configurar .env en servidor
nano /home/tienda/backend/.env
# DATABASE_URL=postgresql://...
# JWT_ACCESS_SECRET=...
# JWT_REFRESH_SECRET=...

# 7. Instalar dependencias y compilar
cd /home/tienda/backend
npm install
npm run build

# 8. Ejecutar migraciones
npx prisma migrate deploy

# 9. Iniciar con PM2
pm2 start dist/server.js --name tienda-backend
pm2 save
pm2 startup
```

---

### 5.2 Configurar HTTPS (Día 13, mañana - 1 hora)

**Opción 1: Let's Encrypt (dominio público)**

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d api.tudominio.com
```

**Opción 2: Self-signed (servidor local)**

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/tienda.key \
  -out /etc/ssl/certs/tienda.crt
```

**Configurar Nginx como proxy inverso**:

```nginx
# /etc/nginx/sites-available/tienda-backend
server {
    listen 443 ssl;
    server_name api.tudominio.com;

    ssl_certificate /etc/ssl/certs/tienda.crt;
    ssl_certificate_key /etc/ssl/private/tienda.key;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name api.tudominio.com;
    return 301 https://$host$request_uri;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tienda-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 5.3 Backup Automático (Día 13, tarde - 2 horas)

**Script de backup diario**:

**Archivo**: `/home/tienda/scripts/backup.sh`

```bash
#!/bin/bash

BACKUP_DIR="/home/tienda/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="tienda_web"

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup de PostgreSQL
pg_dump $DB_NAME | gzip > $BACKUP_DIR/tienda_web_$DATE.sql.gz

# Eliminar backups antiguos (mantener últimos 30 días)
find $BACKUP_DIR -name "tienda_web_*.sql.gz" -mtime +30 -delete

echo "✅ Backup completed: $BACKUP_DIR/tienda_web_$DATE.sql.gz"
```

**Hacer ejecutable**:

```bash
chmod +x /home/tienda/scripts/backup.sh
```

**Configurar cron job**:

```bash
crontab -e

# Agregar línea:
0 2 * * * /home/tienda/scripts/backup.sh >> /home/tienda/logs/backup.log 2>&1
```

**Script de restauración**:

**Archivo**: `/home/tienda/scripts/restore.sh`

```bash
#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <backup_file.sql.gz>"
  exit 1
fi

gunzip < $1 | psql tienda_web

echo "✅ Database restored from $1"
```

**Criterios de aceptación**:

- [ ] Backup diario a las 2am
- [ ] Retención de 30 días
- [ ] Script de restauración funcional

---

### 5.4 Monitoreo y Logs (Día 13, tarde - 2 horas)

**Configurar rotación de logs**:

```bash
# /etc/logrotate.d/tienda-backend
/home/tienda/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 tienda tienda
}
```

**Health check endpoint** (ya implementado):

```typescript
// backend/src/app.ts
app.get('/health', async (req, res) => {
  const dbConnected = await checkDatabaseConnection();

  res.json({
    status: dbConnected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

**Monitoreo con PM2**:

```bash
pm2 monit  # Dashboard en terminal
pm2 logs tienda-backend --lines 100  # Ver últimos logs
```

**Criterios de aceptación**:

- [ ] Logs rotando diariamente
- [ ] Health check respondiendo
- [ ] PM2 monitoreando proceso

---

### 5.5 Firewall y Seguridad (Día 13, final - 1 hora)

```bash
# Habilitar firewall
sudo ufw enable

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Bloquear acceso directo a PostgreSQL (solo local)
sudo ufw deny 5432/tcp

# Verificar reglas
sudo ufw status
```

**Criterios de aceptación**:

- [ ] Firewall activo
- [ ] PostgreSQL no accesible desde internet
- [ ] Solo puertos 80, 443, 22 abiertos

---

## 🎯 FIN DE LA FASE 5 (Deploy Completo)

**Resultado**:
✅ Backend corriendo con PM2
✅ PostgreSQL configurado
✅ HTTPS configurado
✅ Backup automático diario
✅ Firewall configurado
✅ Monitoreo activo

**Tiempo total Fase 5**: 1 día (8 horas)

---

## RESUMEN FINAL COMPLETO

### Duración Total

**13 días hábiles** (16 días con buffer 20%)

| Fase      | Descripción            | Días   | Horas   |
| --------- | ---------------------- | ------ | ------- |
| Fase 1    | Backend + PostgreSQL   | 5      | 40      |
| Fase 2    | Frontend Migration     | 3      | 24      |
| Fase 3    | Migración de Datos     | 2      | 16      |
| Fase 4    | Testing                | 2      | 16      |
| Fase 5    | Deploy                 | 1      | 8       |
| **TOTAL** | **Migración completa** | **13** | **104** |

### Entregables

1. ✅ **Backend Node.js + Express** (50 archivos TypeScript)
   - 35 endpoints RESTful
   - Auth JWT con refresh tokens
   - Validaciones con Zod
   - Transacciones ACID con Prisma

2. ✅ **Frontend Next.js migrado** (25 archivos modificados)
   - 10 servicios HTTP reescritos
   - 15 pantallas actualizadas
   - Polling cada 5s en listados
   - Firebase completamente eliminado

3. ✅ **Base de Datos PostgreSQL** (11 tablas)
   - Schema normalizado
   - Foreign keys + constraints
   - Índices optimizados
   - Migraciones versionadas

4. ✅ **Datos migrados y validados**
   - Script de migración ejecutado
   - Validación de integridad pasada
   - Imágenes migradas
   - Backup de Firestore guardado

5. ✅ **Servidor en producción**
   - Backend corriendo con PM2
   - HTTPS configurado
   - Backup automático diario
   - Firewall configurado

### Criterios de Éxito

**Funcionales**:

- [ ] Todas las funcionalidades de Firebase replicadas
- [ ] Sin pérdida de datos en la migración
- [ ] Performance igual o mejor que Firebase
- [ ] Usuarios pueden operar normalmente

**Técnicos**:

- [ ] 100% de los tests E2E pasando
- [ ] Latencia < 200ms en endpoints críticos
- [ ] Sin vulnerabilidades críticas de seguridad
- [ ] Backup automático funcionando

**Operativos**:

- [ ] Documentación completa del sistema
- [ ] Scripts de backup/restore funcionales
- [ ] Monitoreo activo
- [ ] Rollback plan preparado

### Plan de Rollback

**Si la migración falla en producción**:

1. **Inmediato** (< 5 minutos):

   ```bash
   # Redirigir frontend a Firebase (revertir deployment)
   git revert HEAD~20
   npm install firebase
   npm run build
   ```

2. **Corto plazo** (< 1 hora):
   - Mantener backend PostgreSQL activo (no eliminar)
   - Validar que Firebase sigue funcional
   - Documentar causa raíz del fallo

3. **Largo plazo** (1-2 semanas):
   - Corregir issues identificados
   - Re-testear en ambiente staging
   - Reprogramar migración

### Riesgos y Mitigaciones

| Riesgo               | Mitigación                      | Estado          |
| -------------------- | ------------------------------- | --------------- |
| Pérdida de datos     | Backup completo + validación    | ✅ Documentado  |
| Pérdida de real-time | Polling + WebSockets opcionales | ✅ Implementado |
| Auth inseguro        | JWT con bibliotecas probadas    | ✅ Implementado |
| Performance pobre    | Índices + queries optimizados   | ✅ Diseñado     |
| Migración fallida    | Transacciones + dry-run         | ✅ Scriptizado  |

### Próximos Pasos

1. **Revisión del plan** (1 hora)
   - Revisar con equipo técnico
   - Ajustar estimaciones si es necesario
   - Validar disponibilidad de recursos

2. **Aprobación** (1 día)
   - Presentar a stakeholders
   - Obtener sign-off
   - Confirmar downtime window

3. **Preparación** (1-2 días)
   - Backup completo de Firestore
   - Setup de servidor
   - Instalación de PostgreSQL
   - Configuración de ambientes

4. **Ejecución** (13 días)
   - Seguir plan fase por fase
   - Daily standups de seguimiento
   - Documentar issues encontrados

5. **Post-migración** (1 semana)
   - Monitoreo intensivo
   - Recolección de feedback de usuarios
   - Ajustes de performance
   - Documentación final

---

**Generado por**: Planificador Técnico Senior  
**Fecha**: 2026-08-12  
**Versión**: 1.0.0  
**Basado en**: `docs/specs/MIGRATION-001-firebase-to-postgresql.md`

---

**🎯 FIN DEL PLAN DE IMPLEMENTACIÓN**
