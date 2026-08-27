# ✅ Checklist de Validación - Dashboard T-Suma

## 📋 Pre-vuelo (Antes de arrancar)

### Archivos Creados

- [x] `components/dashboard/MetricCard.tsx`
- [x] `components/dashboard/TasaActivaCardV2.tsx`
- [x] `components/dashboard/StockAlertsCardV2.tsx`
- [x] `components/dashboard/TrendChartPlaceholder.tsx`
- [x] `tailwind.config.ts` (sistema de colores T-Suma)
- [x] `REFACTORIZACION_DASHBOARD_T-SUMA.md`

### Archivos Modificados

- [x] `app/dashboard/page.tsx` (dashboard refactorizado)
- [x] `app/globals.css` (colores T-Suma + animaciones)
- [x] `components/layout/Sidebar.tsx` (diseño T-Suma)

---

## 🎨 Validación Visual

### Dashboard Principal

- [ ] Header "¡Bienvenido, {name}!" se muestra correctamente
- [ ] Tasa Activa usa diseño V2 con gradiente verde
- [ ] 4 tarjetas de KPIs en grid responsive:
  - [ ] Ventas del Día (DollarSign)
  - [ ] Ventas del Mes (Calendar)
  - [ ] Productos (Package)
  - [ ] Clientes (Users)
- [ ] Stock Alerts Card muestra estado correcto:
  - [ ] Verde si no hay alertas
  - [ ] Ámbar/Rojo si hay alertas
- [ ] Gráfico placeholder con barras animadas

### Sidebar

- [ ] Header verde con degradado
- [ ] Logo y texto blancos con sombra
- [ ] Items normales con hover suave
- [ ] Item activo verde con escala
- [ ] Submenús con animación slide-up
- [ ] Footer con avatar circular y datos de usuario

### Colores T-Suma

- [ ] Verde primario: `#10B981`
- [ ] Verde oscuro hover: `#059669`
- [ ] Verde claro fondos: `#D1FAE5`
- [ ] Ámbar alertas: `#F59E0B`
- [ ] Rojo crítico: `#EF4444`

---

## 🎬 Animaciones

### Dashboard

- [ ] Header entra con slide-up (0s delay)
- [ ] Tasa Activa entra (0.1s delay)
- [ ] KPIs entran escalonados (0.2s - 0.5s)
- [ ] Stock Alerts entra (0.6s delay)
- [ ] Chart entra (0.7s delay)

### Interacciones

- [ ] Cards hacen hover:scale en mouse over
- [ ] Gradiente decorativo aparece en hover
- [ ] Botones de acción cambian de color suavemente
- [ ] Items de sidebar hacen escala al activarse

### Loaders

- [ ] Skeleton loaders tienen pulse-soft
- [ ] Barras de gráfico tienen pulse-soft escalonado

---

## 🖱️ Interacciones

### Tasa Activa Card

- [ ] Botón "Actualizar tasa" redirige a `/dashboard/exchange-rates`
- [ ] Badge "En vivo" visible
- [ ] Tendencia muestra flecha correcta (↑/↓)

### Metric Cards

- [ ] Botón "Ver historial" → `/dashboard/sales`
- [ ] Botón "Gestionar" → `/dashboard/products`
- [ ] Botón "Ver todos" → `/dashboard/customers`
- [ ] Trends muestran color correcto (verde/rojo)

### Stock Alerts

- [ ] Muestra CheckCircle si no hay alertas
- [ ] Muestra AlertTriangle para stock bajo
- [ ] Muestra XCircle para stock crítico
- [ ] Badge con conteo de alertas visible
- [ ] "Ver todos" aparece si > 3 alertas

### Sidebar

- [ ] Click en item navega correctamente
- [ ] Click en sección expandible abre/cierra
- [ ] Chevron rota al expandir/contraer
- [ ] Avatar muestra inicial del usuario

---

## 📱 Responsive

### Mobile (<768px)

- [ ] Grid de KPIs: 1 columna
- [ ] Cards se adaptan al ancho
- [ ] Sidebar visible (mejora futura: hamburger)
- [ ] Textos no se cortan

### Tablet (768px - 1024px)

- [ ] Grid de KPIs: 2 columnas
- [ ] Espaciado correcto
- [ ] Sidebar + contenido visibles

### Desktop (>1024px)

- [ ] Grid de KPIs: 4 columnas
- [ ] Layout completo óptimo
- [ ] Sin scroll horizontal

---

## 🧪 Tests Funcionales

### Carga Inicial

- [ ] Dashboard carga sin errores de consola
- [ ] Tasa de cambio se obtiene del backend
- [ ] Alertas de stock se cargan correctamente
- [ ] Profile name se muestra en header

### Estados de Carga

- [ ] Skeleton loaders se muestran mientras carga
- [ ] Skeletons desaparecen al obtener datos
- [ ] No hay flash de contenido sin estilo

### Errores Manejados

- [ ] Si no hay tasa activa, card no se muestra
- [ ] Si hay error en alertas, se maneja gracefully
- [ ] Console limpia (sin errores rojos)

---

## 🚀 Comandos de Verificación

### Frontend

```bash
cd "d:\Mis proyectos\tienda-web"
npm run dev
# Abrir http://localhost:3000/dashboard
```

### Backend (si no está corriendo)

```bash
cd "d:\Mis proyectos\tienda-web\backend"
npm run dev
# Backend en http://localhost:4000
```

### Verificar Build

```bash
npm run build
# No debe haber errores de TypeScript/ESLint
```

---

## 🎯 Criterios de Aceptación

### Obligatorios (Bloqueantes)

- [ ] Dashboard carga sin errores
- [ ] Todos los componentes se renderizan
- [ ] Colores T-Suma aplicados correctamente
- [ ] Navegación del sidebar funciona
- [ ] Responsive funciona en mobile/tablet/desktop

### Deseables (No bloqueantes)

- [ ] Animaciones suaves sin lag
- [ ] Tasa de cambio muestra datos reales
- [ ] Stock alerts con datos reales
- [ ] Dark mode preparado (futuro)

---

## 🐛 Problemas a Buscar

### Comunes

- [ ] Clases Tailwind que no existen (`tsuma-*` sin definir)
- [ ] Imports faltantes de componentes
- [ ] Tipos TypeScript incorrectos
- [ ] Animaciones que no funcionan en producción
- [ ] Colores que no coinciden con diseño

### Edge Cases

- [ ] Usuario sin nombre (fallback a "Usuario")
- [ ] Tasa de cambio = 0 o null
- [ ] Array de alertas vacío
- [ ] Navegación a rutas inexistentes

---

## 📊 Métricas de Éxito

### Performance

- [ ] First Contentful Paint < 1s
- [ ] Time to Interactive < 2s
- [ ] No layout shifts durante animaciones

### Accesibilidad

- [ ] Contraste de colores WCAG AA
- [ ] Navegación por teclado funciona
- [ ] Lectores de pantalla leen correctamente

### UX

- [ ] Usuario entiende cada sección
- [ ] Estados vacíos son claros
- [ ] Feedback visual en cada acción

---

## ✅ Aprobación Final

- [ ] Todos los checks obligatorios pasados
- [ ] Screenshots tomados para documentación
- [ ] Commit con mensaje descriptivo
- [ ] Push a repositorio

---

**Validado por:** _____________  
**Fecha:** _____________  
**Notas adicionales:**

---

---

---
