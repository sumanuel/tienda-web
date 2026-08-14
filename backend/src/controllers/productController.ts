import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../types/auth';

// GET /api/products
export async function listProducts(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { storeId, category, search, inStock } = req.query;

    // Validar que storeId pertenece al usuario
    if (storeId && typeof storeId === 'string') {
      const store = await prisma.store.findFirst({
        where: {
          id: storeId,
          userId: req.user.userId,
        },
      });

      if (!store) {
        return res
          .status(403)
          .json({ error: 'No tienes acceso a esta tienda' });
      }
    }

    const products = await prisma.product.findMany({
      where: {
        ...(storeId && typeof storeId === 'string' && { storeId }),
        ...(category && typeof category === 'string' && { category }),
        ...(search &&
          typeof search === 'string' && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { barcode: { contains: search, mode: 'insensitive' } },
            ],
          }),
        ...(inStock === 'true' && { stock: { gt: 0 } }),
        store: {
          userId: req.user.userId, // Solo productos de tiendas del usuario
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        category: true,
        price: true,
        priceVES: true,
        priceUSD: true,
        priceEUR: true,
        cost: true,
        stock: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ products });
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ error: 'Error al listar productos' });
  }
}

// GET /api/products/:id
export async function getProduct(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        id,
        store: {
          userId: req.user.userId, // Solo productos de tiendas del usuario
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        category: true,
        price: true,
        priceVES: true,
        priceUSD: true,
        priceEUR: true,
        cost: true,
        stock: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
}

// POST /api/products
export async function createProduct(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { name, sku, barcode, category, price, priceVES, priceUSD, priceEUR, cost, stock, storeId } =
      req.body;

    // Validaciones
    if (!name || name.trim().length === 0) {
      return res
        .status(400)
        .json({ error: 'El nombre del producto es requerido' });
    }

    if (!storeId) {
      return res.status(400).json({ error: 'El ID de la tienda es requerido' });
    }

    if (price === undefined || price < 0) {
      return res
        .status(400)
        .json({ error: 'El precio debe ser mayor o igual a 0' });
    }

    if (cost !== undefined && cost < 0) {
      return res
        .status(400)
        .json({ error: 'El costo debe ser mayor o igual a 0' });
    }

    if (stock !== undefined && stock < 0) {
      return res
        .status(400)
        .json({ error: 'El stock debe ser mayor o igual a 0' });
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

    // Verificar SKU único por tienda (si se proporciona)
    if (sku && sku.trim().length > 0) {
      const existingSku = await prisma.product.findFirst({
        where: {
          sku: sku.trim(),
          storeId,
        },
      });

      if (existingSku) {
        return res
          .status(400)
          .json({ error: 'El SKU ya existe en esta tienda' });
      }
    }

    // Verificar código de barras único por tienda (si se proporciona)
    if (barcode && barcode.trim().length > 0) {
      const existingBarcode = await prisma.product.findFirst({
        where: {
          barcode: barcode.trim(),
          storeId,
        },
      });

      if (existingBarcode) {
        return res
          .status(400)
          .json({ error: 'El código de barras ya existe en esta tienda' });
      }
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku ? sku.trim() : null,
        barcode: barcode ? barcode.trim() : null,
        category: category || 'General',
        price: parseFloat(price),
        priceVES: priceVES !== undefined ? parseFloat(priceVES) : 0,
        priceUSD: priceUSD !== undefined ? parseFloat(priceUSD) : 0,
        priceEUR: priceEUR !== undefined ? parseFloat(priceEUR) : 0,
        cost: cost !== undefined ? parseFloat(cost) : 0,
        stock: stock !== undefined ? parseInt(stock) : 0,
        storeId,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        category: true,
        price: true,
        priceVES: true,
        priceUSD: true,
        priceEUR: true,
        cost: true,
        stock: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
}

// PUT /api/products/:id
export async function updateProduct(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params;
    const { name, sku, barcode, category, price, priceVES, priceUSD, priceEUR, cost, stock } = req.body;

    // Verificar que el producto existe y pertenece al usuario
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        store: {
          userId: req.user.userId,
        },
      },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Validaciones
    if (name !== undefined && name.trim().length === 0) {
      return res
        .status(400)
        .json({ error: 'El nombre del producto no puede estar vacío' });
    }

    if (price !== undefined && price < 0) {
      return res
        .status(400)
        .json({ error: 'El precio debe ser mayor o igual a 0' });
    }

    if (cost !== undefined && cost < 0) {
      return res
        .status(400)
        .json({ error: 'El costo debe ser mayor o igual a 0' });
    }

    if (stock !== undefined && stock < 0) {
      return res
        .status(400)
        .json({ error: 'El stock debe ser mayor o igual a 0' });
    }

    // Verificar SKU único (si se está cambiando)
    if (sku !== undefined && sku !== existingProduct.sku) {
      if (sku && sku.trim().length > 0) {
        const existingSku = await prisma.product.findFirst({
          where: {
            sku: sku.trim(),
            storeId: existingProduct.storeId,
            id: { not: id },
          },
        });

        if (existingSku) {
          return res
            .status(400)
            .json({ error: 'El SKU ya existe en esta tienda' });
        }
      }
    }

    // Verificar código de barras único (si se está cambiando)
    if (barcode !== undefined && barcode !== existingProduct.barcode) {
      if (barcode && barcode.trim().length > 0) {
        const existingBarcode = await prisma.product.findFirst({
          where: {
            barcode: barcode.trim(),
            storeId: existingProduct.storeId,
            id: { not: id },
          },
        });

        if (existingBarcode) {
          return res
            .status(400)
            .json({ error: 'El código de barras ya existe en esta tienda' });
        }
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(sku !== undefined && { sku: sku ? sku.trim() : null }),
        ...(barcode !== undefined && {
          barcode: barcode ? barcode.trim() : null,
        }),
        ...(category !== undefined && { category }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(priceVES !== undefined && { priceVES: parseFloat(priceVES) }),
        ...(priceUSD !== undefined && { priceUSD: parseFloat(priceUSD) }),
        ...(priceEUR !== undefined && { priceEUR: parseFloat(priceEUR) }),
        ...(cost !== undefined && { cost: parseFloat(cost) }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
      },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        category: true,
        price: true,
        priceVES: true,
        priceUSD: true,
        priceEUR: true,
        cost: true,
        stock: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
}

// DELETE /api/products/:id
export async function deleteProduct(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params;

    // Verificar que el producto existe y pertenece al usuario
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        store: {
          userId: req.user.userId,
        },
      },
      include: {
        _count: {
          select: {
            saleItems: true,
            inventoryMovements: true,
          },
        },
      },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar que no tenga movimientos
    if (
      existingProduct._count.saleItems > 0 ||
      existingProduct._count.inventoryMovements > 0
    ) {
      return res.status(400).json({
        error:
          'No se puede eliminar el producto porque tiene movimientos registrados',
        details: {
          sales: existingProduct._count.saleItems,
          inventoryMovements: existingProduct._count.inventoryMovements,
        },
      });
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
}

// GET /api/products/categories
export async function getCategories(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { storeId } = req.query;

    // Obtener categorías únicas
    const products = await prisma.product.findMany({
      where: {
        ...(storeId && typeof storeId === 'string' && { storeId }),
        store: {
          userId: req.user.userId,
        },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    const categories = products.map((p) => p.category).filter((c) => c);

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
}
