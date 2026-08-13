# Backend - TiendaWeb API

API REST con Node.js, Express, PostgreSQL y Prisma para tienda-web.

## 📋 Prerequisitos

- Node.js 20+
- PostgreSQL 14+
- npm o yarn

## 🚀 Instalación

### 1. Instalar PostgreSQL

**Windows**:

```bash
winget install PostgreSQL.PostgreSQL.14
```

**Linux (Ubuntu)**:

```bash
sudo apt update
sudo apt install postgresql-14
```

### 2. Crear Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# En la consola de PostgreSQL:
CREATE DATABASE tienda_web;
CREATE USER tienda_admin WITH PASSWORD 'T13nd@W3b_S3cur3_2026!';
GRANT ALL PRIVILEGES ON DATABASE tienda_web TO tienda_admin;
\q
```

### 3. Instalar Dependencias

```bash
cd backend
npm install
```

### 4. Configurar Variables de Entorno

El archivo `.env` ya está creado. Verifica y ajusta si es necesario:

```env
DATABASE_URL="postgresql://tienda_admin:TU_PASSWORD@localhost:5432/tienda_web"
JWT_SECRET="tu_secreto_super_seguro_aqui"
PORT=4000
```

### 5. Ejecutar Migraciones de Prisma

```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev --name init

# Abrir Prisma Studio (opcional)
npx prisma studio
```

### 6. Iniciar Servidor

```bash
# Desarrollo (con hot-reload)
npm run dev

# Producción
npm run build
npm start
```

El servidor estará corriendo en `http://localhost:4000`

## 📚 Endpoints Disponibles

### Auth

- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual (requiere token)
- `POST /api/auth/refresh` - Refrescar token

### Health Check

- `GET /health` - Verificar estado del servidor

## 🧪 Probar API

### Registrar Usuario

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tienda.com",
    "password": "admin123",
    "name": "Admin",
    "storeName": "Mi Tienda"
  }'
```

### Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tienda.com",
    "password": "admin123"
  }'
```

### Obtener Usuario (con token)

```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

## 🗂️ Estructura del Proyecto

```
backend/
├── src/
│   ├── controllers/     # Lógica de negocio
│   ├── routes/          # Definición de rutas
│   ├── middleware/      # Middlewares (auth, error handler)
│   ├── utils/           # Utilidades (jwt, bcrypt)
│   ├── app.ts           # Configuración de Express
│   └── server.ts        # Punto de entrada
├── prisma/
│   └── schema.prisma    # Esquema de base de datos
├── uploads/             # Archivos subidos
├── .env                 # Variables de entorno
└── package.json         # Dependencias
```

## 📊 Base de Datos

El esquema incluye 11 tablas:

1. **users** - Usuarios del sistema
2. **stores** - Tiendas
3. **products** - Productos
4. **sales** - Ventas
5. **sale_items** - Items de venta
6. **customers** - Clientes
7. **suppliers** - Proveedores
8. **customer_transactions** - Transacciones de clientes
9. **supplier_transactions** - Transacciones de proveedores
10. **inventory_movements** - Movimientos de inventario
11. **exchange_rates** - Tasas de cambio

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- Autenticación JWT (access + refresh tokens)
- CORS configurado
- Validación de inputs

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Compilar TypeScript
npm start            # Ejecutar en producción
npm run prisma:generate  # Generar cliente de Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:studio    # Abrir Prisma Studio
```

## 📝 Próximos Pasos

1. ✅ Auth implementado (register, login, me, refresh)
2. ⏳ Implementar CRUD de Productos
3. ⏳ Implementar Ventas
4. ⏳ Implementar Inventario
5. ⏳ Implementar Clientes/Proveedores
6. ⏳ Implementar Reportes

## 🐛 Troubleshooting

### Error de conexión a PostgreSQL

Verifica que PostgreSQL esté corriendo:

```bash
# Windows
Get-Service postgresql*

# Linux
sudo systemctl status postgresql
```

### Error "Cannot find module '@prisma/client'"

Ejecuta:

```bash
npx prisma generate
```

### Error "P2002: Unique constraint failed"

Ya existe un registro con esos datos. Verifica que el email no esté duplicado.

## 📞 Soporte

Para más información, consulta:

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Express](https://expressjs.com/)
- [Plan de Migración](../docs/plans/PLAN-MIGRATION-001-firebase-to-postgresql.md)
