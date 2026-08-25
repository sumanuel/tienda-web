import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../types/auth';
import { calculateProductPrices } from '../utils/priceCalculator';

/**
 * GET /api/exchange-rates
 * Obtiene tasas de cambio activas de una tienda
 */
export async function getExchangeRates(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { storeId } = req.query;

    if (!storeId || typeof storeId !== 'string') {
      return res.status(400).json({ error: 'storeId es requerido' });
    }

    // Verificar que la tienda pertenece al usuario
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId: req.user.userId,
      },
    });

    if (!store) {
      return res.status(403).json({ error: 'No tienes acceso a esta tienda' });
    }

    const rates = await prisma.exchangeRate.findMany({
      where: {
        storeId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Construir objeto activeRate con las tasas principales
    const activeRate = {
      usdToVes:
        rates.find((r) => r.fromCurrency === 'USD' && r.toCurrency === 'VES')
          ?.rate || 0,
      eurToVes:
        rates.find((r) => r.fromCurrency === 'EUR' && r.toCurrency === 'VES')
          ?.rate || 0,
      updatedAt: rates[0]?.createdAt || null,
    };

    res.json({ rates, activeRate });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ error: 'Error al obtener tasas de cambio' });
  }
}

/**
 * POST /api/exchange-rates
 * Crea/actualiza tasa de cambio (solo OWNER/ADMIN)
 */
export async function updateExchangeRate(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { storeId, fromCurrency, toCurrency, rate, source } = req.body;

    // Validaciones
    if (!storeId || !fromCurrency || !toCurrency || rate == null) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (typeof rate !== 'number' || rate <= 0) {
      return res
        .status(400)
        .json({ error: 'La tasa debe ser un número mayor a 0' });
    }

    if (
      !['VES', 'USD', 'EUR'].includes(fromCurrency) ||
      !['VES', 'USD', 'EUR'].includes(toCurrency)
    ) {
      return res.status(400).json({ error: 'Monedas válidas: USD, VES, EUR' });
    }

    if (fromCurrency === toCurrency) {
      return res
        .status(400)
        .json({ error: 'Las monedas deben ser diferentes' });
    }

    // Verificar que la tienda pertenece al usuario
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId: req.user.userId,
      },
    });

    if (!store) {
      return res.status(403).json({ error: 'No tienes acceso a esta tienda' });
    }

    // Transacción: desactivar tasa anterior + crear nueva + recalcular productos
    const result = await prisma.$transaction(async (tx) => {
      // 1. Desactivar tasas anteriores del mismo par
      await tx.exchangeRate.updateMany({
        where: {
          storeId,
          fromCurrency,
          toCurrency,
          isActive: true,
        },
        data: { isActive: false },
      });

      // 2. Crear nueva tasa activa
      const newRate = await tx.exchangeRate.create({
        data: {
          storeId,
          fromCurrency,
          toCurrency,
          rate: parseFloat(rate.toString()),
          source: source || 'MANUAL',
          isActive: true,
          createdBy: req.user?.userId,
        },
      });

      // 3. Obtener todas las tasas activas actualizadas
      const allRates = await tx.exchangeRate.findMany({
        where: { storeId, isActive: true },
      });

      const exchangeRates = {
        usdToVes: Number(
          allRates.find(
            (r) => r.fromCurrency === 'USD' && r.toCurrency === 'VES'
          )?.rate || 0
        ),
        eurToVes: Number(
          allRates.find(
            (r) => r.fromCurrency === 'EUR' && r.toCurrency === 'VES'
          )?.rate || 0
        ),
      };

      // 4. Recalcular precios de todos los productos con margen definido
      const products = await tx.product.findMany({
        where: {
          storeId,
          margin: { not: null },
        },
      });

      let productsUpdated = 0;

      for (const product of products) {
        try {
          const updatedPrices = calculateProductPrices({
            cost: Number(product.cost || 0),
            additionalCost: Number(product.additionalCost || 0),
            costCurrency:
              (product.costCurrency as 'VES' | 'USD' | 'EUR') || 'USD',
            margin: Number(product.margin || 30),
            iva: Number(product.iva || 0),
            exchangeRates,
          });

          await tx.product.update({
            where: { id: product.id },
            data: {
              priceVES: updatedPrices.priceVES,
              priceUSD: updatedPrices.priceUSD,
              priceEUR: updatedPrices.priceEUR,
            },
          });

          productsUpdated++;
        } catch (calcError) {
          console.warn(`Error recalculando producto ${product.id}:`, calcError);
          // Continuar con el siguiente producto
        }
      }

      return { newRate, productsUpdated };
    });

    res.json({
      message: 'Tasa actualizada exitosamente',
      rate: result.newRate,
      productsUpdated: result.productsUpdated,
    });
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    res.status(500).json({ error: 'Error al actualizar tasa de cambio' });
  }
}

/**
 * GET /api/exchange-rates/history
 * Obtiene historial de tasas de cambio (incluyendo inactivas)
 */
export async function getExchangeRatesHistory(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { storeId } = req.query;

    if (!storeId || typeof storeId !== 'string') {
      return res.status(400).json({ error: 'storeId es requerido' });
    }

    // Verificar que la tienda pertenece al usuario
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId: req.user.userId,
      },
    });

    if (!store) {
      return res.status(403).json({ error: 'No tienes acceso a esta tienda' });
    }

    const rates = await prisma.exchangeRate.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({ rates });
  } catch (error) {
    console.error('Error fetching exchange rates history:', error);
    res.status(500).json({ error: 'Error al obtener historial de tasas' });
  }
}
