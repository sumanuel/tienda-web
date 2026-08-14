import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

/**
 * Listar movimientos de inventario
 * GET /api/inventory/movements
 */
export const listMovements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const {
      storeId,
      productId,
      type,
      startDate,
      endDate,
      page = '1',
      limit = '50',
    } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: 'storeId es requerido' });
    }

    // Verificar acceso a la tienda
    const store = await prisma.store.findFirst({
      where: {
        id: storeId as string,
        userId,
      },
    });

    if (!store) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    // Construir filtros
    const where: any = {
      storeId: storeId as string,
    };

    if (productId) {
      where.productId = productId as string;
    }

    if (type) {
      where.type = type as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              category: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    res.json({
      movements,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('List movements error:', error);
    res.status(500).json({ error: 'Error al listar movimientos' });
  }
};

/**
 * Crear ajuste de inventario
 * POST /api/inventory/adjustments
 */
export const createAdjustment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { storeId, productId, quantity, type, reason, notes } = req.body;

    // Validaciones
    if (!storeId || !productId || quantity === undefined || !type) {
      return res.status(400).json({
        error: 'storeId, productId, quantity y type son requeridos',
      });
    }

    if (!['adjustment', 'purchase', 'return', 'damage'].includes(type)) {
      return res.status(400).json({
        error: 'type debe ser: adjustment, purchase, return o damage',
      });
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum)) {
      return res.status(400).json({ error: 'quantity debe ser un número' });
    }

    // Verificar acceso a la tienda
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId,
      },
    });

    if (!store) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    // Verificar que el producto existe y pertenece a la tienda
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Validar que no resulte en stock negativo
    const newStock = product.stock + quantityNum;
    if (newStock < 0) {
      return res.status(400).json({
        error: `Stock insuficiente. Stock actual: ${product.stock}, ajuste: ${quantityNum}`,
      });
    }

    // Crear ajuste y actualizar stock en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Calcular stock antes y después
      const stockBefore = product.stock;
      const stockAfter = newStock;
      
      // Actualizar stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: newStock,
        },
      });

      // Obtener información del usuario
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      // Crear movimiento
      const movement = await tx.inventoryMovement.create({
        data: {
          productId,
          productName: product.name,
          productCode: product.sku || product.barcode || productId.slice(0, 8),
          storeId,
          type,
          quantity: quantityNum,
          stockBefore,
          stockAfter,
          unitCost: product.cost || 0,
          totalCost: (product.cost || 0) * Math.abs(quantityNum),
          userId,
          userName: user?.name || 'Usuario desconocido',
          reason: reason || null,
          notes: notes || null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              stock: true,
            },
          },
        },
      });

      return { movement, updatedProduct };
    });

    res.status(201).json({
      message: 'Ajuste de inventario creado exitosamente',
      movement: result.movement,
      newStock: result.updatedProduct.stock,
    });
  } catch (error) {
    console.error('Create adjustment error:', error);
    res.status(500).json({ error: 'Error al crear ajuste de inventario' });
  }
};

/**
 * Reporte de stock actual
 * GET /api/inventory/stock-report
 */
export const getStockReport = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { storeId, category, groupBy = 'category' } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: 'storeId es requerido' });
    }

    // Verificar acceso a la tienda
    const store = await prisma.store.findFirst({
      where: {
        id: storeId as string,
        userId,
      },
    });

    if (!store) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    // Construir filtros
    const where: any = {
      storeId: storeId as string,
    };

    if (category) {
      where.category = category as string;
    }

    // Obtener productos
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        stock: true,
        minStock: true,
        price: true,
        cost: true,
      },
      orderBy: {
        category: 'asc',
      },
    });

    // Calcular totales
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce(
      (sum, p) => sum + p.stock * (p.cost || 0),
      0
    );
    const totalRetailValue = products.reduce(
      (sum, p) => sum + p.stock * p.price,
      0
    );
    const lowStockCount = products.filter(
      (p) => p.stock < (p.minStock || 0)
    ).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;

    // Agrupar por categoría si se solicita
    let byCategory: any = null;
    if (groupBy === 'category') {
      const categoryMap = new Map<string, any>();

      products.forEach((product) => {
        const cat = product.category || 'Sin categoría';
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, {
            category: cat,
            productCount: 0,
            totalStock: 0,
            totalValue: 0,
            lowStockCount: 0,
          });
        }

        const catData = categoryMap.get(cat);
        catData.productCount++;
        catData.totalStock += product.stock;
        catData.totalValue += product.stock * (product.cost || 0);
        if (product.stock < (product.minStock || 0)) {
          catData.lowStockCount++;
        }
      });

      byCategory = Array.from(categoryMap.values());
    }

    res.json({
      summary: {
        totalProducts,
        totalStock,
        totalValue: parseFloat(totalValue.toFixed(2)),
        totalRetailValue: parseFloat(totalRetailValue.toFixed(2)),
        lowStockCount,
        outOfStockCount,
      },
      byCategory,
      products: groupBy === 'none' ? products : undefined,
    });
  } catch (error) {
    console.error('Stock report error:', error);
    res.status(500).json({ error: 'Error al generar reporte de stock' });
  }
};

/**
 * Productos con stock bajo
 * GET /api/inventory/low-stock
 */
export const getLowStock = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: 'storeId es requerido' });
    }

    // Verificar acceso a la tienda
    const store = await prisma.store.findFirst({
      where: {
        id: storeId as string,
        userId,
      },
    });

    if (!store) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    // Obtener productos con stock bajo o agotados
    const products = await prisma.$queryRaw<any[]>`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.barcode,
        p.category,
        p.stock,
        p."minStock",
        p.price,
        p.cost,
        CASE 
          WHEN p.stock = 0 THEN 'out_of_stock'
          WHEN p.stock < p."minStock" THEN 'low_stock'
          ELSE 'ok'
        END as status
      FROM products p
      WHERE p."storeId" = ${storeId as string}
        AND p.stock <= p."minStock"
      ORDER BY 
        CASE 
          WHEN p.stock = 0 THEN 0
          ELSE 1
        END,
        p.stock ASC
    `;

    const outOfStock = products.filter((p) => p.stock === 0);
    const lowStock = products.filter(
      (p) => p.stock > 0 && p.stock < p.minStock
    );

    res.json({
      summary: {
        total: products.length,
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
      },
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category,
        stock: p.stock,
        minStock: p.minStock,
        price: parseFloat(p.price),
        cost: p.cost ? parseFloat(p.cost) : 0,
        status: p.status,
        needed: Math.max(0, p.minStock - p.stock),
      })),
    });
  } catch (error) {
    console.error('Low stock error:', error);
    res
      .status(500)
      .json({ error: 'Error al obtener productos con stock bajo' });
  }
};

/**
 * Historial de movimientos de un producto
 * GET /api/inventory/product/:productId/movements
 */
export const getProductMovements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { productId } = req.params;
    const { limit = '20' } = req.query;

    // Verificar que el producto existe y el usuario tiene acceso
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        store: {
          userId,
        },
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Obtener movimientos del producto
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        productId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
    });

    // Calcular stock en cada punto
    let currentStock = product.stock;
    const movementsWithStock = movements.map((movement, index) => {
      const stockAtTime = currentStock;
      currentStock -= movement.quantity;

      return {
        ...movement,
        stockAfter: stockAtTime,
        stockBefore: currentStock,
      };
    });

    res.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: product.stock,
        minStock: product.minStock,
        store: product.store,
      },
      movements: movementsWithStock,
    });
  } catch (error) {
    console.error('Product movements error:', error);
    res
      .status(500)
      .json({ error: 'Error al obtener movimientos del producto' });
  }
};
