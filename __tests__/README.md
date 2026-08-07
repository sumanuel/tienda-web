# Guía de Tests - Fase 6: Reportes y Dashboard Final

## Ejecutar Tests

### Tests Unitarios

```bash
# Todos los tests unitarios
npm test -- __tests__/unit/

# Solo salesReports
npm test -- __tests__/unit/reports/salesReports.test.ts

# Solo inventoryReports
npm test -- __tests__/unit/reports/inventoryReports.test.ts

# Solo financialReports
npm test -- __tests__/unit/reports/financialReports.test.ts
```

### Tests de Componentes

```bash
# Todos los tests de componentes
npm test -- __tests__/components/

# Solo DateRangePicker
npm test -- __tests__/components/reports/DateRangePicker.test.tsx

# Solo ExportButtons
npm test -- __tests__/components/reports/ExportButtons.test.tsx
```

### Tests de Integración

```bash
# Todos los tests de integración
npm test -- __tests__/integration/

# Solo flujo de ventas
npm test -- __tests__/integration/reports/sales-report-flow.test.ts

# Solo exportación Excel
npm test -- __tests__/integration/reports/excel-export.test.ts
```

### Ejecutar TODOS los tests

```bash
npm test
```

### Generar reporte de cobertura

```bash
npm test -- --coverage
```

## Tests Creados

### Unitarios (`__tests__/unit/reports/`)

- ✅ **salesReports.test.ts** (145 líneas)
  - Valida cálculos de totalSales, averageTicket, topProduct
  - Valida ventas por día (incluye días sin ventas)
  - Valida agrupación por método de pago
  - Valida extracción de hora
  - Edge cases: división por cero, ventas vacías

- ✅ **inventoryReports.test.ts** (134 líneas)
  - Valida cálculo de totalValue (cost * stock)
  - Valida contadores de stock (low, out)
  - Valida agrupación por categoría
  - Manejo de cost null/undefined
  - Documenta TODOs sin implementar

- ✅ **financialReports.test.ts** (118 líneas)
  - Valida integración con getSalesReport
  - Valida integración con getReceivablesSummary
  - Valida integración con getPayablesSummary
  - **Documenta BUG-007**: totalExpenses = 0
  - **Documenta BUG-008**: incomeStatement = 0s
  - Valida traducción de métodos de pago

### Componentes (`__tests__/components/reports/`)

- ✅ **DateRangePicker.test.tsx** (78 líneas)
  - Valida renderizado de inputs
  - Valida cambios de fecha inicio/fin
  - **Documenta BUG-012**: NO valida startDate < endDate
  - **Documenta BUG-013**: Timezone no manejado

- ✅ **ExportButtons.test.tsx** (96 líneas)
  - Valida renderizado de botones
  - Valida estados disabled
  - Valida clicks y callbacks
  - Valida estilos visuales

### Integración (`__tests__/integration/reports/`)

- ✅ **sales-report-flow.test.ts** (152 líneas)
  - Flujo completo: Carga → Cálculo → Visualización → Exportación
  - Flujo con datos vacíos
  - Performance test con 1000 ventas
  - **Documenta BUG-001**: Query sin límites

- ✅ **excel-export.test.ts** (147 líneas)
  - Valida creación de workbook
  - Valida múltiples hojas
  - Valida datos en hoja de resumen
  - **Documenta BUG-010**: Métodos de pago sin traducir
  - **Documenta BUG-011**: Memory leak en URL

## Tests que DEBEN FALLAR (documentan bugs)

Estos tests están marcados con comentarios `// BUG-XXX` y FALLARÁN hasta que se corrijan los bugs:

- `salesReports.test.ts` → `debe manejar ventas sin createdAt` (BUG-003)
- `financialReports.test.ts` → `totalExpenses siempre devuelve 0` (BUG-007)
- `financialReports.test.ts` → `incomeStatement tiene todos los valores en 0` (BUG-008)
- `DateRangePicker.test.tsx` → `permite seleccionar startDate > endDate` (BUG-012)
- `excel-export.test.ts` → `métodos de pago NO están traducidos` (BUG-010)

## Cobertura Esperada

- Servicios: **85%**
- Componentes: **90%**
- Páginas: **70%**
- **Total estimado: 80%**

## Próximos Pasos

1. **Desarrollador**: Corregir bugs críticos (BUG-001 a BUG-016)
2. **QA**: Ejecutar `npm test` y validar que tests pasen
3. **QA**: Ejecutar `npm test -- --coverage` y validar cobertura > 80%
4. **QA**: Re-aprobar feature después de correcciones

## Notas Importantes

- Los tests usan Jest + React Testing Library
- Los mocks de Firestore están en cada archivo test
- Los tests de integración NO requieren Firestore real (todo mockeado)
- Los tests documentan bugs existentes (ver comentarios `// BUG-XXX`)
