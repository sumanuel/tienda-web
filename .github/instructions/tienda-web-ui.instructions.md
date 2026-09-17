---
applyTo: 'app/**/*.tsx,components/**/*.tsx,app/**/*.ts,components/**/*.ts'
---

# tienda-web UI Instructions

When designing or editing any page or component in tienda-web, follow the rules in the skill file at:
`d:\Mis proyectos\tienda-web\.agents\skills\tienda-web-ui\SKILL.md`

## Quick Reference

### Stack

- Next.js 16 App Router · Tailwind CSS v4 · shadcn/ui · lucide-react
- Colors in `app/globals.css` (`@theme inline`), **never** in `tailwind.config.ts`
- Brand green: `text-brand-primary` / `bg-brand-primary` (#10B981)

### Page Shell

```tsx
<main className="min-h-screen space-y-6 bg-gray-50 p-6">
  {/* PageHeader */}
  {/* SectionCards */}
</main>
```

### Card

```tsx
<div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
```

### Primary Button

```tsx
<Button className="bg-brand-primary hover:bg-brand-primary-dark text-white">
```

### Status Badges

- Green: `bg-green-100 text-green-800`
- Amber: `bg-amber-100 text-amber-800`
- Red: `bg-red-100 text-red-800`

### Typography

- Page title: `text-2xl font-bold text-gray-900`
- Section title: `text-lg font-semibold text-gray-800`
- Card label: `text-xs font-semibold uppercase tracking-wide text-gray-500`
- Metric: `text-3xl font-bold text-gray-900`

### Rules

- Every page needs: header with title + action, skeleton loader, empty state with CTA
- Tables: use shadcn/ui `Table`, sticky header, hover rows, actions last column
- Forms: grouped fieldsets, validation errors below each field
- No inline `style={}` for color or spacing
- Icons: only `lucide-react`
