/**
 * Script de prueba de endpoints para identificar problemas
 */

const API_BASE_URL = 'http://localhost:4000';

async function testEndpoint(name: string, url: string, options?: RequestInit) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(url, options);
    console.log(`   Status: ${response.status} ${response.statusText}`);

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log(
        `   Response:`,
        JSON.stringify(data, null, 2).substring(0, 500)
      );

      if (!response.ok) {
        console.log(
          `   ❌ FAILED: ${data.error || data.message || 'Unknown error'}`
        );
        return { success: false, error: data };
      }

      console.log(`   ✅ SUCCESS`);
      return { success: true, data };
    } else {
      const text = await response.text();
      console.log(`   Response (text):`, text.substring(0, 200));

      if (!response.ok) {
        console.log(`   ❌ FAILED`);
        return { success: false, error: text };
      }

      console.log(`   ✅ SUCCESS`);
      return { success: true, data: text };
    }
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Iniciando pruebas de endpoints...\n');
  console.log('='.repeat(60));

  const results = {
    passed: 0,
    failed: 0,
    errors: [] as string[],
  };

  // 1. Health check
  const health = await testEndpoint('Health Check', `${API_BASE_URL}/health`);
  health.success ? results.passed++ : results.failed++;
  if (!health.success) results.errors.push('Health check failed');

  // 2. Products endpoint (sin autenticación)
  const products = await testEndpoint(
    'Products List (No Auth)',
    `${API_BASE_URL}/api/products?limit=5`
  );
  products.success ? results.passed++ : results.failed++;
  if (!products.success)
    results.errors.push('Products endpoint failed (no auth)');

  // 3. Exchange rates
  const exchangeRates = await testEndpoint(
    'Exchange Rates',
    `${API_BASE_URL}/api/exchange-rates`
  );
  exchangeRates.success ? results.passed++ : results.failed++;
  if (!exchangeRates.success) results.errors.push('Exchange rates failed');

  // 4. Sales endpoint
  const sales = await testEndpoint(
    'Sales List (No Auth)',
    `${API_BASE_URL}/api/sales?limit=5`
  );
  sales.success ? results.passed++ : results.failed++;
  if (!sales.success) results.errors.push('Sales endpoint failed');

  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));
  console.log(`✅ Pasadas: ${results.passed}`);
  console.log(`❌ Fallidas: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n🔴 ERRORES ENCONTRADOS:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

// Ejecutar pruebas
runTests().catch(console.error);
