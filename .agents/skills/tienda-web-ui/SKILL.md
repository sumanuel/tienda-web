---
name: tienda-web-ui
description: 'Professional web UI guidance for tienda-web. Use when redesigning or creating Next.js pages, layouts, dashboard views, POS flows, forms, tables, and reusable components for products, sales, inventory, customers, suppliers, exchange rates, and settings.'
license: MIT
---

# tienda-web UI Skill

Project-specific guidance for raising the visual quality of tienda-web to a professional, modern standard while keeping every screen fast and operationally clear.

## When to Apply

Use this skill when:

- redesigning an existing page or layout in tienda-web
- creating a new screen, dialog, or reusable component
- improving the dashboard, POS, inventory, forms, or table views
- extracting repeated visual patterns into shared components
- evaluating whether a new UI fits the product's visual identity

---

## Tech Stack Anchors

- **Framework**: Next.js 16 App Router — use Server Components when no interactivity is needed; `'use client'` only when hooks or events are required.
- **Styling**: Tailwind CSS v4 — all colors and tokens live in `app/globals.css` under `@theme inline`. Do **not** create a `tailwind.config.ts` for color overrides; add them to the CSS file.
- **Components**: shadcn/ui primitives (`components/ui/`) for inputs, selects, dialogs, badges, tooltips, and tables. Prefer these over writing raw HTML.
- **Icons**: `lucide-react` exclusively. No other icon library.
- **Color system**: T-Suma brand tokens already defined in `globals.css`:
  - `--brand-primary: #10B981` (emerald) — primary actions, active states, highlights
  - `--brand-primary-dark: #059669` — hover and pressed states
  - `--brand-primary-light: #D1FAE5` — selected backgrounds, subtle fills
  - `--success`, `--warning`, `--error` — semantic status only, not decoration
- **Responsive utilities**: standard Tailwind breakpoints (`md:`, `lg:`, `xl:`). Mobile-first.
- **Fonts**: inherit from existing layout; do not add new font imports.

---

## Core Visual Direction

1. **Clarity first.** A store owner scanning the dashboard or a cashier processing a sale must understand the screen in one look. Hierarchy beats decoration.
2. **Professional, not flashy.** Use clean whitespace, consistent card elevation, and brand green as an accent. Avoid gradients on data-heavy pages.
3. **Density is acceptable.** Tables and forms can be compact, but must use clear section separators, visible labels, and consistent row/cell sizing.
4. **Color encodes meaning.** Green = success/active, amber = warning/low stock, red = error/critical, gray = neutral/disabled. Never use these colors purely for aesthetics.
5. **Empty and loading states always communicate intent.** An empty state should tell the user what to do next. A skeleton must match the shape of the real content.

---

## Layout System

### Page Shell

```
<main class="min-h-screen bg-gray-50 p-6 space-y-6">
  <PageHeader title="..." action={<Button>} />
  <SectionCard> ... </SectionCard>
</main>
```

- Page background: `bg-gray-50` or `bg-slate-50`
- Cards: `bg-white rounded-2xl border border-gray-200 shadow-sm p-6`
- Section spacing: `space-y-6` between major blocks

### Sidebar (already implemented)

- Active item: `bg-brand-primary text-white rounded-xl`
- Hover: `hover:bg-gray-100 rounded-xl`
- Submenus: indent with left border accent, not nested background fill

### Typography Scale

| Use               | Class                                                         |
| ----------------- | ------------------------------------------------------------- |
| Page title        | `text-2xl font-bold text-gray-900`                            |
| Section title     | `text-lg font-semibold text-gray-800`                         |
| Card label        | `text-xs font-semibold uppercase tracking-wide text-gray-500` |
| Body              | `text-sm text-gray-700`                                       |
| Muted / secondary | `text-sm text-gray-400`                                       |
| Metric value      | `text-3xl font-bold text-gray-900`                            |

---

## Component Patterns

### Metric Card (KPI)

```tsx
<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
  <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
    LABEL
  </p>
  <p className="mt-1 text-3xl font-bold text-gray-900">$0.00</p>
  <p className="mt-1 text-sm text-gray-400">Descriptive note</p>
</div>
```

- Trend indicator: green `↑ +X%` or red `↓ -X%` inline after the value.
- Icon: top-right corner, `h-5 w-5 text-gray-400`, or brand-colored when active.

### Data Table

- Use `components/ui/table` from shadcn/ui.
- Header: `bg-gray-50 text-xs font-semibold uppercase text-gray-500`.
- Rows: `hover:bg-gray-50 transition-colors border-b border-gray-100`.
- Actions column: always last, right-aligned, icon buttons with tooltip.
- Pagination: bottom-right, show current page and total.
- Empty state: centered illustration + message + CTA button inside the table container.

### Form Pages (Create / Edit)

- Two-column grid (`grid grid-cols-1 md:grid-cols-2 gap-6`) for most fields.
- Group related fields inside a labeled section card:
  ```
  <fieldset class="rounded-xl border border-gray-200 p-4 space-y-4">
    <legend class="text-sm font-semibold text-gray-700 px-1">Precios</legend>
    ...
  </fieldset>
  ```
- Required fields: asterisk `*` in label, no inline red unless the field has been touched.
- Submit button: always `bg-brand-primary text-white` at the bottom-right, with a cancel link.

### Status Badges

```tsx
// Use inline, never in a separate chip row
<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span>
<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Pendiente</span>
<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Agotado</span>
```

### Page Header

```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Título</h1>
    <p className="text-sm text-gray-500">Subtítulo o descripción corta</p>
  </div>
  <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white">
    <Plus className="mr-2 h-4 w-4" /> Acción principal
  </Button>
</div>
```

### Skeleton Loader

- Match the shape and size of the real content.
- Use `animate-pulse bg-gray-200 rounded` on placeholder blocks.
- Never show a spinner alone for a full page; show skeleton layout instead.

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="mb-4 h-12 w-12 text-gray-300" />
  <p className="text-lg font-medium text-gray-700">No hay registros aún</p>
  <p className="mb-6 text-sm text-gray-400">
    Explica brevemente qué hacer a continuación
  </p>
  <Button variant="outline">Agregar primero</Button>
</div>
```

---

## Screen-Specific Guidelines

### Dashboard

- Lead with the tasa de cambio as a featured card (brand green background) and the 4 KPIs (ventas día/mes, productos, clientes) in a responsive 4-column grid.
- Stock alerts: color-coded border (green/amber/red). Never a red page banner unless critical.
- Sales trend: skeleton bars until the chart is wired. Never text that just says "próximamente".

### POS (Punto de Venta)

- Two-panel layout: product list on the left (≥60% width), cart + checkout on the right.
- Product rows: horizontal layout — icon/image (48px), name + SKU, category badge, stock, price, add button.
- Cart: sticky on the right, shows item count badge on the cart icon.
- Payment section: large, clear totals; payment method tabs; confirm button visually dominant.

### Product & Inventory Lists

- Use a table with sortable columns: name, SKU, category, stock badge, price, actions.
- Stock badge: green (ok), amber (low), red (agotado).
- Filters: horizontal bar above the table — search input, category select, stock status select. Do not use a sidebar for filters.

### Customers / Suppliers

- Table with: name, document, phone, balance badge, transaction count, actions.
- Balance badge: green (al día), red (debe).
- Detail view: two-column layout — contact info left, financial summary right, transaction history below.

### Accounts Receivable / Payable (Finanzas)

- Summary cards at the top: total owed, overdue amount, number of accounts.
- Table: customer/supplier, last transaction, balance, days overdue (if applicable), action buttons.

### Forms (Producto, Cliente, Proveedor)

- Group: Información General, Precios, Inventario, Notas.
- Auto-calculated fields: visually distinct (`bg-brand-primary-light border-brand-primary/30`).
- Validation errors: `text-red-500 text-xs mt-1` below the field, never above.

---

## Interaction and Motion

- Button hover: `transition-colors duration-150` only. No scale transforms on form buttons.
- Card hover (if clickable): `hover:shadow-md transition-shadow`.
- Modal/dialog: use shadcn/ui `Dialog` with a clean white panel, max-w-lg or max-w-2xl.
- Toasts: use `react-hot-toast` already configured. Green for success, red for error.
- Table row selection: `bg-brand-primary-light` on selected row.

---

## Anti-Patterns to Avoid

- ❌ Gradient backgrounds on data-heavy pages (dashboard body, tables, forms).
- ❌ Multiple different shadow levels in the same view.
- ❌ Colored section headers that compete with status badges.
- ❌ Padding/margin values not from Tailwind's scale.
- ❌ Inline `style={}` for spacing or color.
- ❌ Custom CSS outside `globals.css` unless absolutely necessary.
- ❌ Importing icons from libraries other than `lucide-react`.
- ❌ Skipping empty and loading states.
- ❌ `tailwind.config.ts` for color additions — use `@theme inline` in `globals.css`.

---

## Copy and Tone

- UI copy in Spanish, second person informal ("tu tienda", "tus productos").
- Labels: concise, noun-first ("Fecha de venta", not "Fecha en que se realizó la venta").
- Buttons: imperative verbs ("Guardar", "Agregar producto", "Cancelar").
- Empty state messages: action-oriented ("Agrega tu primer producto").
- Error messages: plain language ("No se pudo guardar. Intenta de nuevo.").

---

## Checklist Before Shipping a Screen

- [ ] Page header present with title, subtitle, and primary action button.
- [ ] Loading state uses skeleton, not spinner-only.
- [ ] Empty state has icon, message, and next-step CTA.
- [ ] All tables have hover row state and actions column.
- [ ] Forms grouped into labeled sections; required fields marked.
- [ ] Status values use standard badge colors.
- [ ] No hardcoded colors or inline styles.
- [ ] Responsive: works at 768px (tablet) and 1280px (desktop).
- [ ] No new dependencies introduced without necessity.
