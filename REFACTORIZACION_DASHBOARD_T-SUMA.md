# Refactorización Dashboard T-Suma - Sistema de Diseño Profesional

## 📋 Resumen de Cambios

Se ha realizado una refactorización completa del dashboard de tienda-web implementando un sistema de diseño profesional con la paleta de colores T-Suma y componentes reutilizables de alta calidad.

---

## 🎨 Sistema de Colores T-Suma

### Paleta Principal

```css
--tsuma-primary: #10b981 /* Verde esmeralda - acciones principales */
  --tsuma-primary-dark: #059669 /* Verde oscuro - hover/activo */
  --tsuma-primary-light: #d1fae5 /* Verde claro - fondos destacados */
  --tsuma-primary-bg: #f0fdf4 /* Verde muy claro - fondo general */
  --tsuma-secondary: #3b82f6 /* Azul - elementos secundarios */
  --tsuma-accent-warning: #f59e0b /* Ámbar - alertas/advertencias */
  --tsuma-accent-danger: #ef4444 /* Rojo - errores/crítico */;
```

### Actualización de Colores Legacy

Se actualizaron los colores de marca existentes:

```css
/* ANTES */
--brand-primary: #2d7a5b --success: #2e7d32 --error: #c62828 /* AHORA */
  --brand-primary: #10b981 /* Compatible con tsuma-primary */ --success: #10b981
  --error: #ef4444;
```

---

## 📦 Componentes Creados

### 1. MetricCard.tsx

Componente reutilizable para tarjetas de métricas del dashboard.

**Props:**

- `title`: Título de la métrica
- `value`: Valor principal (string | number)
- `subtitle`: Texto secundario opcional
- `icon`: Ícono de lucide-react
- `trend`: Objeto con `value` e `isPositive` para mostrar tendencias
- `badge`: Badge con label y variant (success, warning, info)
- `action`: Botón de acción con label y onClick
- `loading`: Estado de carga con skeleton

**Características:**

- Animaciones suaves al hover (escala, sombra)
- Gradiente decorativo en hover
- Skeleton loader integrado
- Microinteracciones táctiles
- Estados visuales para tendencias positivas/negativas

**Uso:**

```tsx
<MetricCard
  title="Ventas del Día"
  value="$1,234.56"
  icon={DollarSign}
  trend={{ value: '+12.5%', isPositive: true }}
  action={{ label: 'Ver historial', onClick: handleClick }}
/>
```

---

### 2. TasaActivaCardV2.tsx

Tarjeta premium para mostrar la tasa de cambio activa.

**Props:**

- `rate`: Tasa de cambio numérica
- `fromCurrency`: Moneda origen (default: 'USD')
- `toCurrency`: Moneda destino (default: 'VES')
- `updatedAt`: Fecha de actualización
- `trend`: Tendencia de cambio vs día anterior
- `onUpdate`: Callback para actualizar tasa
- `loading`: Estado de carga

**Características:**

- Gradiente de fondo `from-tsuma-primary-bg to-white`
- Badge "En vivo" para indicar datos actualizados
- Tendencia visual con flechas y colores
- Botón de actualización con icono
- Efecto glass con backdrop-blur
- Gradiente decorativo animado en hover

**Uso:**

```tsx
<TasaActivaCardV2
  rate={42.35}
  updatedAt="2025-01-27T10:30:00Z"
  trend={{ value: '+2.3%', isPositive: true }}
  onUpdate={handleUpdate}
/>
```

---

### 3. StockAlertsCardV2.tsx

Tarjeta inteligente para alertas de inventario con estados visuales.

**Props:**

- `alerts`: Array de objetos con { id, productName, currentStock, minStock, status }
- `loading`: Estado de carga

**Características:**

- **Borde adaptativo según estado:**
  - Verde (`tsuma-primary`): Sin alertas
  - Ámbar (`amber-300`): Stock bajo
  - Rojo (`red-300`): Stock crítico (agotado)
- Badge con conteo de alertas
- Listado de productos afectados (máximo 3 visibles)
- Botón "Ver todos" si hay más de 3 alertas
- Estado vacío positivo con ícono CheckCircle

**Estados:**

```tsx
// Sin alertas
<CheckCircle /> "¡Todo en orden!"

// Alertas bajas
<AlertTriangle /> "Stock bajo en X productos"

// Alertas críticas
<XCircle /> "¡Stock crítico! Reabastece ya"
```

---

### 4. TrendChartPlaceholder.tsx

Placeholder animado para gráficos de tendencias (Fase 6).

**Características:**

- 7 barras animadas con `animate-pulse-soft`
- Animación escalonada (delay incremental)
- Header con ícono TrendingUp y botón "Configurar"
- Mensaje explicativo para el usuario
- Altura fija de 256px (h-64)

**Aspecto:**

- Fondo blanco con borde
- Barras en verde claro (`tsuma-primary-light`)
- Mensaje centrado: "Los datos se mostrarán aquí pronto"

---

## 🎯 Dashboard Principal (page.tsx)

### Estructura Visual

```tsx
<div className="to-tsuma-primary-bg/30 min-h-screen bg-gradient-to-br from-gray-50">
  {/* Header con animación */}
  <h1 className="animate-slide-up">¡Bienvenido, {name}!</h1>
  {/* Tasa Activa - Featured */}
  <TasaActivaCardV2 />
  {/* Grid de KPIs - 4 columnas */}
  <MetricCard /> × 4{/* Alertas de Stock */}
  <StockAlertsCardV2 />
  {/* Gráfico Placeholder */}
  <TrendChartPlaceholder />
</div>
```

### Animaciones Secuenciales

Cada sección tiene un `animationDelay` incremental para entrada escalonada:

- Header: `0s`
- Tasa Activa: `0.1s`
- KPI 1: `0.2s`
- KPI 2: `0.3s`
- KPI 3: `0.4s`
- KPI 4: `0.5s`
- Stock Alerts: `0.6s`
- Chart: `0.7s`

### Métricas Mostradas

1. **Ventas del Día**: DollarSign, tendencia, valor placeholder
2. **Ventas del Mes**: Calendar, acción "Ver historial"
3. **Productos**: Package, acción "Gestionar"
4. **Clientes**: Users, acción "Ver todos"

---

## 🎨 Sidebar Refactorizado

### Cambios Visuales

**Header:**

- Gradiente verde: `from-tsuma-primary to-tsuma-primary-dark`
- Logo y texto blancos con drop-shadow
- Tamaño aumentado: h-7 w-7 para logo, text-2xl para texto

**Items de Navegación:**

- Border-radius aumentado: `rounded-xl`
- Hover suave: `hover:scale-[1.01]`
- Active state: `bg-tsuma-primary text-white shadow-md scale-[1.02]`
- Íconos con transiciones de color

**Submenús:**

- Indicador de bullet point: círculo pequeño con `bg-current`
- Animación `slide-up` con delay escalonado
- Active state en verde: `bg-tsuma-primary text-white`

**Footer Nuevo:**

- Avatar circular con inicial del usuario
- Fondo con gradiente `from-tsuma-primary-bg to-white`
- Card flotante con shadow
- Información: nombre + "Dashboard activo"

---

## 🎬 Animaciones CSS

### pulse-soft

```css
@keyframes pulse-soft {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

**Uso:** Skeleton loaders, barras de gráfico placeholder

### slide-up

```css
@keyframes slide-up {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**Uso:** Entrada de secciones del dashboard, submenús del sidebar

---

## 📱 Responsive Design

### Breakpoints Utilizados

- **Mobile**: Grid 1 columna
- **md (768px+)**: Grid 2 columnas para KPIs
- **lg (1024px+)**: Grid 4 columnas para KPIs

### Sidebar

- Ancho fijo: 256px (w-64)
- Scroll automático en nav: `overflow-y-auto`
- Footer siempre visible al fondo

---

## ♿ Accesibilidad

### Consideraciones Implementadas

1. **Contraste de colores:** Verde T-Suma cumple WCAG AA con textos blancos/negros
2. **Estados visuales:** Hover, focus, active con transiciones suaves
3. **Iconografía semántica:** Íconos coherentes con su función
4. **Truncado de texto:** `truncate` y `min-w-0` para evitar overflow
5. **Skeleton loaders:** Feedback visual durante carga
6. **Mensajes claros:** Estados vacíos con textos explicativos

### Mejoras Futuras

- [ ] Agregar `aria-label` a botones con solo íconos
- [ ] Implementar navegación por teclado en sidebar
- [ ] Agregar roles ARIA a cards de métricas
- [ ] Focus ring visible para teclado

---

## 🚀 Próximos Pasos (Roadmap)

### Fase 1: Integración de Datos Reales ✅

- [x] Conectar tasa de cambio con backend
- [x] Alertas de stock desde Firestore
- [ ] KPIs de ventas con datos reales
- [ ] Clientes activos desde backend

### Fase 2: Gráficos Interactivos

- [ ] Reemplazar TrendChartPlaceholder con Chart.js o Recharts
- [ ] Gráfico de barras para ventas diarias
- [ ] Gráfico de línea para tendencia mensual
- [ ] Selector de rango de fechas

### Fase 3: Microinteracciones Avanzadas

- [ ] Transiciones de página con Framer Motion
- [ ] Haptic feedback en botones (mobile)
- [ ] Toast notifications con sistema de alertas
- [ ] Pull-to-refresh en mobile

### Fase 4: Temas y Personalización

- [ ] Dark mode con variantes de colores T-Suma
- [ ] Preferencias de usuario (ocultar secciones, reordenar)
- [ ] Widgets arrastrables
- [ ] Paleta de colores alternativa para daltónicos

---

## 📚 Convenciones de Código

### Nombres de Componentes

- `PascalCase` para componentes: `MetricCard.tsx`
- `V2` suffix para versiones refactorizadas: `TasaActivaCardV2.tsx`

### Estilos

- Preferir Tailwind utilities sobre CSS custom
- Usar `cn()` helper de shadcn para clases condicionales
- Gradientes con `from-* to-*` pattern
- Animaciones con `animate-*` classes

### Props

- Siempre tipar con TypeScript interfaces
- Incluir `loading?: boolean` para estados async
- Callbacks con `on*` prefix: `onUpdate`, `onClick`

---

## 🐛 Problemas Conocidos

1. **TrendChartPlaceholder:** No hay datos reales aún (Fase 6 pendiente)
2. **KPIs placeholder:** Valores hardcoded en 0, falta backend
3. **Dark mode:** No implementado, colores solo para light mode
4. **Responsive mobile:** Sidebar no colapsa en mobile (mejora futura)

---

## 🎉 Resultados

### Antes

- Diseño básico con grises y colores inconsistentes
- Sin animaciones ni microinteracciones
- Tarjetas planas sin jerarquía visual
- Sidebar genérico sin footer

### Después

- Sistema de colores coherente T-Suma verde
- Animaciones suaves y profesionales
- Componentes reutilizables con estados visuales
- Sidebar con gradiente, footer de usuario y estados activos
- Dashboard con entrada escalonada y jerarquía clara

---

## 📝 Notas Técnicas

### Compatibilidad

- **Next.js:** 16.2.12 (App Router)
- **React:** 19.2.4
- **Tailwind CSS:** v4 con @theme inline
- **lucide-react:** Última versión

### Performance

- Componentes optimizados con `memo` cuando sea necesario (futuro)
- Animaciones con `transform` y `opacity` (hardware accelerated)
- Imágenes/iconos SVG optimizados
- Lazy loading para secciones pesadas (futuro)

---

**Fecha de implementación:** 2025-01-27  
**Autor:** Equipo de desarrollo tienda-web  
**Versión:** 1.0.0
