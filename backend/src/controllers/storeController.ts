import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../types/auth';

// GET /api/stores
export async function listStores(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const stores = await prisma.store.findMany({
      where: { userId: req.user.userId },
      select: {
        id: true,
        name: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ stores });
  } catch (error) {
    console.error('List stores error:', error);
    res.status(500).json({ error: 'Error al listar tiendas' });
  }
}

// GET /api/stores/:id
export async function getStore(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params;

    const store = await prisma.store.findFirst({
      where: {
        id,
        userId: req.user.userId, // Solo puede ver sus propias tiendas
      },
      select: {
        id: true,
        name: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!store) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    res.json({ store });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Error al obtener tienda' });
  }
}

// POST /api/stores
export async function createStore(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { name, address } = req.body;

    // Validaciones
    if (!name || name.trim().length === 0) {
      return res
        .status(400)
        .json({ error: 'El nombre de la tienda es requerido' });
    }

    if (name.trim().length > 100) {
      return res
        .status(400)
        .json({
          error: 'El nombre de la tienda no puede exceder 100 caracteres',
        });
    }

    const store = await prisma.store.create({
      data: {
        name: name.trim(),
        address: address ? address.trim() : null,
        userId: req.user.userId,
      },
      select: {
        id: true,
        name: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({ store });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ error: 'Error al crear tienda' });
  }
}

// PUT /api/stores/:id
export async function updateStore(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params;
    const { name, address } = req.body;

    // Verificar que la tienda existe y pertenece al usuario
    const existingStore = await prisma.store.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!existingStore) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    // Validaciones
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res
          .status(400)
          .json({ error: 'El nombre de la tienda es requerido' });
      }

      if (name.trim().length > 100) {
        return res
          .status(400)
          .json({
            error: 'El nombre de la tienda no puede exceder 100 caracteres',
          });
      }
    }

    const store = await prisma.store.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(address !== undefined && {
          address: address ? address.trim() : null,
        }),
      },
      select: {
        id: true,
        name: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ store });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ error: 'Error al actualizar tienda' });
  }
}

// DELETE /api/stores/:id
export async function deleteStore(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params;

    // Verificar que la tienda existe y pertenece al usuario
    const existingStore = await prisma.store.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
      include: {
        _count: {
          select: {
            products: true,
            sales: true,
            customers: true,
            suppliers: true,
          },
        },
      },
    });

    if (!existingStore) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    // Verificar que no tenga datos relacionados
    if (
      existingStore._count.products > 0 ||
      existingStore._count.sales > 0 ||
      existingStore._count.customers > 0 ||
      existingStore._count.suppliers > 0
    ) {
      return res.status(400).json({
        error: 'No se puede eliminar la tienda porque tiene datos relacionados',
        details: {
          products: existingStore._count.products,
          sales: existingStore._count.sales,
          customers: existingStore._count.customers,
          suppliers: existingStore._count.suppliers,
        },
      });
    }

    await prisma.store.delete({
      where: { id },
    });

    res.json({ message: 'Tienda eliminada exitosamente' });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({ error: 'Error al eliminar tienda' });
  }
}
