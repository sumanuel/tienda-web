export interface PriceCalculationInput {
  cost: number;
  additionalCost?: number;
  costCurrency: 'VES' | 'USD' | 'EUR';
  margin: number;
  iva?: number;
  exchangeRates: {
    usdToVes?: number;
    eurToVes?: number;
  };
}

export interface CalculatedPrices {
  priceUSD: number;
  priceVES: number;
  priceEUR: number;
}

/**
 * Calcula precios de venta en múltiples monedas basándose en costo, margen e IVA
 * Fórmula: Precio = (Costo + Adicional) × (1 + Margen/100) × (1 + IVA/100)
 */
export function calculateProductPrices(
  input: PriceCalculationInput
): CalculatedPrices {
  const {
    cost,
    additionalCost = 0,
    costCurrency,
    margin,
    iva = 0,
    exchangeRates,
  } = input;

  // Validaciones
  if (cost <= 0) {
    throw new Error('El costo debe ser mayor a 0');
  }
  if (margin < 0 || margin > 1000) {
    throw new Error('El margen debe estar entre 0% y 1000%');
  }
  if (iva < 0 || iva > 100) {
    throw new Error('El IVA debe estar entre 0% y 100%');
  }

  // Costo total = costo base + costos adicionales
  const totalCost = cost + additionalCost;

  // Convertir costo a USD (moneda referencia)
  let costInUSD = totalCost;

  if (costCurrency === 'VES' && exchangeRates.usdToVes) {
    costInUSD = totalCost / exchangeRates.usdToVes;
  } else if (
    costCurrency === 'EUR' &&
    exchangeRates.eurToVes &&
    exchangeRates.usdToVes
  ) {
    // EUR → VES → USD
    const costInVES =
      totalCost * (exchangeRates.eurToVes / exchangeRates.usdToVes);
    costInUSD = costInVES / exchangeRates.usdToVes;
  }

  // Aplicar margen: Precio = Costo × (1 + Margen/100)
  const basePriceUSD = costInUSD * (1 + margin / 100);

  // Aplicar IVA: Precio final = Precio base × (1 + IVA/100)
  const finalPriceUSD = basePriceUSD * (1 + iva / 100);

  // Calcular precios en otras monedas
  const priceVES = exchangeRates.usdToVes
    ? finalPriceUSD * exchangeRates.usdToVes
    : finalPriceUSD;

  const priceEUR =
    exchangeRates.eurToVes && exchangeRates.usdToVes
      ? (finalPriceUSD * exchangeRates.usdToVes) / exchangeRates.eurToVes
      : finalPriceUSD;

  return {
    priceUSD: Math.round(finalPriceUSD * 100) / 100,
    priceVES: Math.round(priceVES * 100) / 100,
    priceEUR: Math.round(priceEUR * 100) / 100,
  };
}

/**
 * Obtiene las tasas de cambio activas de una tienda
 */
export async function getActiveExchangeRates(storeId: string, prisma: any) {
  const rates = await prisma.exchangeRate.findMany({
    where: {
      storeId,
      isActive: true,
    },
  });

  const usdToVes =
    rates.find((r: any) => r.fromCurrency === 'USD' && r.toCurrency === 'VES')
      ?.rate || 0;

  const eurToVes =
    rates.find((r: any) => r.fromCurrency === 'EUR' && r.toCurrency === 'VES')
      ?.rate || 0;

  return {
    usdToVes: Number(usdToVes),
    eurToVes: Number(eurToVes),
  };
}
