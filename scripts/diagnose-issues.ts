/**
 * Script para diagnosticar problemas en tiempo real
 * Ejecutar con: npx tsx scripts/diagnose-issues.ts
 */

interface DiagnosticResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message?: string;
  error?: string;
}

async function main() {
  console.log('🔍 Diagnosticando problemas del sistema...\n');
  console.log('='.repeat(60));

  const results: DiagnosticResult[] = [];

  async function addResult(
    category: string,
    test: string,
    status: DiagnosticResult['status'],
    message?: string,
    error?: string
  ) {
    results.push({ category, test, status, message, error });

    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} [${category}] ${test}`);
    if (message) console.log(`   ${message}`);
    if (error) console.log(`   Error: ${error}`);
  }

  // 1. Verificar conectividad del backend
  console.log('\n📡 1. VERIFICANDO CONECTIVIDAD DEL BACKEND\n');

  try {
    const healthResponse = await fetch('http://localhost:4000/health');
    if (healthResponse.ok) {
      await addResult(
        'Backend',
        'Health Check',
        'PASS',
        'Backend respondiendo correctamente'
      );
    } else {
      await addResult(
        'Backend',
        'Health Check',
        'FAIL',
        `Status: ${healthResponse.status}`
      );
    }
  } catch (error: any) {
    await addResult(
      'Backend',
      'Health Check',
      'FAIL',
      'Backend no accesible',
      error.message
    );
  }

  // 2. Verificar imports de lib/
  console.log('\n📚 2. VERIFICANDO FUNCIONES DE BIBLIOTECA\n');

  const libModules = [
    {
      name: 'inventory',
      functions: [
        'calculateInventoryValuation',
        'registerInventoryMovement',
        'getInventoryMovements',
      ],
    },
    {
      name: 'accountsReceivable',
      functions: ['getReceivablesSummary', 'getPayablesSummary'],
    },
    { name: 'customers', functions: ['getCustomersWithBalance'] },
    { name: 'suppliers', functions: ['getSuppliersWithBalance'] },
    {
      name: 'customerTransactions',
      functions: ['getOverdueCustomers', 'getCustomerAccountStatus'],
    },
    {
      name: 'supplierTransactions',
      functions: ['getUpcomingPayables', 'getSupplierAccountStatus'],
    },
    { name: 'api', functions: ['apiClient'] },
    {
      name: 'currency',
      functions: ['formatCurrency', 'calculatePrice', 'convertCurrency'],
    },
  ];

  for (const module of libModules) {
    try {
      const imported = await import(`../lib/${module.name}.ts`);

      for (const funcName of module.functions) {
        if (imported[funcName]) {
          await addResult('Library', `${module.name}.${funcName}`, 'PASS');
        } else {
          await addResult(
            'Library',
            `${module.name}.${funcName}`,
            'FAIL',
            'Función no exportada'
          );
        }
      }
    } catch (error: any) {
      await addResult(
        'Library',
        module.name,
        'FAIL',
        'Módulo no importable',
        error.message
      );
    }
  }

  // 3. Verificar hooks
  console.log('\n🎣 3. VERIFICANDO HOOKS\n');

  const hooks = ['useAuth', 'useCart', 'useSales'];

  for (const hookName of hooks) {
    try {
      const imported = await import(`../hooks/${hookName}.ts`);
      if (imported[hookName]) {
        await addResult('Hooks', hookName, 'PASS');
      } else {
        await addResult('Hooks', hookName, 'FAIL', 'Hook no exportado');
      }
    } catch (error: any) {
      await addResult(
        'Hooks',
        hookName,
        'FAIL',
        'Hook no importable',
        error.message
      );
    }
  }

  // 4. Verificar componentes UI base
  console.log('\n🎨 4. VERIFICANDO COMPONENTES UI BASE\n');

  const uiComponents = [
    'alert',
    'badge',
    'button',
    'card',
    'dialog',
    'input',
    'label',
    'scroll-area',
    'select',
    'separator',
    'table',
    'textarea',
  ];

  for (const component of uiComponents) {
    try {
      await import(`../components/ui/${component}.tsx`);
      await addResult('UI Components', component, 'PASS');
    } catch (error: any) {
      await addResult(
        'UI Components',
        component,
        'FAIL',
        'Componente faltante',
        error.message
      );
    }
  }

  // 5. Verificar componentes de ventas
  console.log('\n🛒 5. VERIFICANDO COMPONENTES DE VENTAS\n');

  const salesComponents = [
    'Cart',
    'CancelSaleButton',
    'CustomerSelector',
    'PaymentMethodSelector',
    'ProductCard',
    'ProductCatalog',
    'SaleDetailModal',
    'SalesFilters',
    'SalesTable',
  ];

  for (const component of salesComponents) {
    try {
      await import(`../components/sales/${component}.tsx`);
      await addResult('Sales Components', component, 'PASS');
    } catch (error: any) {
      await addResult(
        'Sales Components',
        component,
        'FAIL',
        'Componente faltante',
        error.message
      );
    }
  }

  // 6. Verificar páginas críticas
  console.log('\n📄 6. VERIFICANDO PÁGINAS CRÍTICAS\n');

  const pages = [
    { path: 'dashboard/pos/page.tsx', name: 'POS' },
    { path: 'dashboard/sales/page.tsx', name: 'Sales History' },
    { path: 'dashboard/inventory/valuation/page.tsx', name: 'Valuation' },
    {
      path: 'dashboard/accounts-receivable/page.tsx',
      name: 'Accounts Receivable',
    },
    { path: 'dashboard/accounts-payable/page.tsx', name: 'Accounts Payable' },
  ];

  for (const page of pages) {
    try {
      await import(`../app/${page.path}`);
      await addResult('Pages', page.name, 'PASS');
    } catch (error: any) {
      await addResult(
        'Pages',
        page.name,
        'FAIL',
        'Página no importable',
        error.message
      );
    }
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN FINAL\n');

  const summary = {
    passed: results.filter((r) => r.status === 'PASS').length,
    failed: results.filter((r) => r.status === 'FAIL').length,
    warnings: results.filter((r) => r.status === 'WARN').length,
  };

  console.log(`✅ Pasadas: ${summary.passed}`);
  console.log(`❌ Fallidas: ${summary.failed}`);
  console.log(`⚠️  Advertencias: ${summary.warnings}`);
  console.log(`📝 Total: ${results.length} pruebas`);

  // Listar errores críticos
  const criticalErrors = results.filter(
    (r) =>
      r.status === 'FAIL' &&
      (r.category === 'Backend' ||
        r.category === 'Library' ||
        r.category === 'Hooks')
  );

  if (criticalErrors.length > 0) {
    console.log('\n🔴 ERRORES CRÍTICOS QUE DEBEN CORREGIRSE:\n');
    criticalErrors.forEach((error, index) => {
      console.log(`${index + 1}. [${error.category}] ${error.test}`);
      if (error.message) console.log(`   ${error.message}`);
      if (error.error) console.log(`   ${error.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
