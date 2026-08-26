/**
 * Utilidades para manejo de divisas y conversiones
 */

export type Currency = 'VES' | 'USD' | 'EUR';

export interface ExchangeRates {
  usdToVes: number;
  eurToVes: number;
  updatedAt: Date;
}

export interface PriceCalculation {
  ves: number;
  usd: number;
  eur: number;
  current: number; // Precio en la moneda actual
}

/**
 * Calcular precio en todas las monedas
 */
export function calculatePrice(params: {
  basePrice: number;
  baseCurrency: Currency;
  exchangeRate: number;
  priceVES?: number;
  priceUSD?: number;
  priceEUR?: number;
}): PriceCalculation {
  const {
    basePrice,
    baseCurrency,
    exchangeRate,
    priceVES,
    priceUSD,
    priceEUR,
  } = params;

  // Si hay precios predefinidos, usarlos
  if (priceVES && priceUSD) {
    return {
      ves: priceVES,
      usd: priceUSD,
      eur: priceEUR || priceUSD * 0.92, // Aproximación EUR
      current:
        baseCurrency === 'VES'
          ? priceVES
          : baseCurrency === 'USD'
            ? priceUSD
            : priceEUR || priceUSD * 0.92,
    };
  }

  // Calcular desde la moneda base
  let ves: number;
  let usd: number;
  let eur: number;

  switch (baseCurrency) {
    case 'VES':
      ves = basePrice;
      usd = basePrice / exchangeRate;
      eur = usd * 0.92; // Aproximación
      break;
    case 'USD':
      usd = basePrice;
      ves = basePrice * exchangeRate;
      eur = usd * 0.92;
      break;
    case 'EUR':
      eur = basePrice;
      usd = basePrice / 0.92;
      ves = usd * exchangeRate;
      break;
  }

  return {
    ves: roundTo2Decimals(ves),
    usd: roundTo2Decimals(usd),
    eur: roundTo2Decimals(eur),
    current: basePrice,
  };
}

/**
 * Formatear precio según la moneda
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  locale: string = 'es-VE'
): string {
  const symbols: Record<Currency, string> = {
    VES: 'Bs.',
    USD: '$',
    EUR: '€',
  };

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbols[currency]} ${formatted}`;
}

/**
 * Formatear precio compacto (sin decimales si es número entero)
 */
export function formatCurrencyCompact(
  amount: number,
  currency: Currency
): string {
  const symbols: Record<Currency, string> = {
    VES: 'Bs.',
    USD: '$',
    EUR: '€',
  };

  const isInteger = amount % 1 === 0;
  const formatted = isInteger ? amount.toFixed(0) : amount.toFixed(2);

  return `${symbols[currency]} ${formatted}`;
}

/**
 * Convertir de una moneda a otra
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  exchangeRate: number
): number {
  if (from === to) return amount;

  // Primero convertir a USD como moneda base
  let amountInUSD: number;

  switch (from) {
    case 'VES':
      amountInUSD = amount / exchangeRate;
      break;
    case 'USD':
      amountInUSD = amount;
      break;
    case 'EUR':
      amountInUSD = amount / 0.92;
      break;
  }

  // Luego convertir de USD a la moneda destino
  let result: number;

  switch (to) {
    case 'VES':
      result = amountInUSD * exchangeRate;
      break;
    case 'USD':
      result = amountInUSD;
      break;
    case 'EUR':
      result = amountInUSD * 0.92;
      break;
  }

  return roundTo2Decimals(result);
}

/**
 * Calcular cambio (vuelto) de una venta
 */
export function calculateChange(total: number, paid: number): number {
  const change = paid - total;
  return roundTo2Decimals(Math.max(0, change));
}

/**
 * Validar que un monto de pago es suficiente
 */
export function isPaymentSufficient(total: number, paid: number): boolean {
  return paid >= total - 0.01; // Tolerancia de 1 centavo
}

/**
 * Redondear a 2 decimales
 */
export function roundTo2Decimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Obtener símbolo de moneda
 */
export function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    VES: 'Bs.',
    USD: '$',
    EUR: '€',
  };
  return symbols[currency];
}

/**
 * Obtener nombre completo de moneda
 */
export function getCurrencyName(currency: Currency): string {
  const names: Record<Currency, string> = {
    VES: 'Bolívares',
    USD: 'Dólares',
    EUR: 'Euros',
  };
  return names[currency];
}

/**
 * Parsear string de moneda a número
 */
export function parseCurrency(value: string): number {
  // Remover símbolos, espacios y caracteres no numéricos (excepto punto y coma)
  const cleaned = value.replace(/[^\d,.-]/g, '');
  // Reemplazar coma por punto
  const normalized = cleaned.replace(',', '.');
  return parseFloat(normalized) || 0;
}

/**
 * Validar si un string es un monto válido
 */
export function isValidAmount(value: string): boolean {
  const amount = parseCurrency(value);
  return !isNaN(amount) && amount >= 0;
}

/**
 * Formatear tasa de cambio
 */
export function formatExchangeRate(rate: number): string {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rate);
}

/**
 * Calcular precio con IVA
 */
export function calculateWithTax(
  subtotal: number,
  taxRate: number
): {
  subtotal: number;
  tax: number;
  total: number;
} {
  const tax = roundTo2Decimals(subtotal * (taxRate / 100));
  const total = roundTo2Decimals(subtotal + tax);

  return {
    subtotal: roundTo2Decimals(subtotal),
    tax,
    total,
  };
}

/**
 * Calcular descuento
 */
export function calculateDiscount(
  subtotal: number,
  discountPercentage: number
): {
  subtotal: number;
  discount: number;
  total: number;
} {
  const discount = roundTo2Decimals(subtotal * (discountPercentage / 100));
  const total = roundTo2Decimals(subtotal - discount);

  return {
    subtotal: roundTo2Decimals(subtotal),
    discount,
    total,
  };
}
