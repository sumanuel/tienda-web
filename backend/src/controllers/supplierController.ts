import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

/**
 * Listar proveedores
 * GET /api/suppliers
 */
export const listSuppliers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { storeId, search, page = '1', limit = '50' } = req.query;

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

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
        { taxId: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          _count: {
            select: {
              transactions: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        skip,
        take,
      }),
      prisma.supplier.count({ where }),
    ]);

    // Calcular balance de cada proveedor
    const suppliersWithBalance = await Promise.all(
      suppliers.map(async (supplier) => {
        const balance = await prisma.supplierTransaction.aggregate({
          where: { supplierId: supplier.id },
          _sum: { amount: true },
        });

        return {
          ...supplier,
          balance: balance._sum.amount || 0,
        };
      })
    );

    res.json({
      suppliers: suppliersWithBalance,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('List suppliers error:', error);
    res.status(500).json({ error: 'Error al listar proveedores' });
  }
};

/**
 * Obtener proveedor por ID
 * GET /api/suppliers/:id
 */
export const getSupplier = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
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
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Calcular balance
    const balance = await prisma.supplierTransaction.aggregate({
      where: { supplierId: id },
      _sum: { amount: true },
    });

    res.json({
      supplier: {
        ...supplier,
        balance: balance._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Error al obtener proveedor' });
  }
};

/**
 * Crear proveedor
 * POST /api/suppliers
 */
export const createSupplier = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { storeId, name, email, phone, taxId, address } = req.body;

    // Validaciones
    if (!storeId || !name) {
      return res.status(400).json({ error: 'storeId y name son requeridos' });
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

    // Verificar email único en la tienda (si se proporciona)
    if (email) {
      const existingSupplier = await prisma.supplier.findFirst({
        where: {
          storeId,
          email,
        },
      });

      if (existingSupplier) {
        return res
          .status(400)
          .json({
            error: 'Ya existe un proveedor con ese email en esta tienda',
          });
      }
    }

    const supplier = await prisma.supplier.create({
      data: {
        storeId,
        name,
        email: email || null,
        phone: phone || null,
        taxId: taxId || null,
        address: address || null,
      },
    });

    res.status(201).json({
      message: 'Proveedor creado exitosamente',
      supplier: {
        ...supplier,
        balance: 0,
      },
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
};

/**
 * Actualizar proveedor
 * PUT /api/suppliers/:id
 */
export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name, email, phone, taxId, address } = req.body;

    // Verificar que el proveedor existe y el usuario tiene acceso
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        id,
        store: {
          userId,
        },
      },
    });

    if (!existingSupplier) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Verificar email único (si se está cambiando)
    if (email && email !== existingSupplier.email) {
      const duplicateEmail = await prisma.supplier.findFirst({
        where: {
          storeId: existingSupplier.storeId,
          email,
          id: { not: id },
        },
      });

      if (duplicateEmail) {
        return res
          .status(400)
          .json({
            error: 'Ya existe un proveedor con ese email en esta tienda',
          });
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingSupplier.name,
        email: email !== undefined ? email || null : existingSupplier.email,
        phone: phone !== undefined ? phone || null : existingSupplier.phone,
        taxId: taxId !== undefined ? taxId || null : existingSupplier.taxId,
        address:
          address !== undefined ? address || null : existingSupplier.address,
      },
    });

    res.json({
      message: 'Proveedor actualizado exitosamente',
      supplier,
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
};

/**
 * Eliminar proveedor
 * DELETE /api/suppliers/:id
 */
export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    // Verificar que el proveedor existe y el usuario tiene acceso
    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        store: {
          userId,
        },
      },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Verificar si tiene transacciones
    if (supplier._count.transactions > 0) {
      return res.status(400).json({
        error:
          'No se puede eliminar el proveedor porque tiene transacciones asociadas',
      });
    }

    await prisma.supplier.delete({
      where: { id },
    });

    res.json({ message: 'Proveedor eliminado exitosamente' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
};

/**
 * Obtener transacciones de un proveedor
 * GET /api/suppliers/:id/transactions
 */
export const getSupplierTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { limit = '20' } = req.query;

    // Verificar acceso
    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        store: {
          userId,
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const transactions = await prisma.supplierTransaction.findMany({
      where: { supplierId: id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    // Calcular balance
    const balance = await prisma.supplierTransaction.aggregate({
      where: { supplierId: id },
      _sum: { amount: true },
    });

    res.json({
      transactions,
      balance: balance._sum.amount || 0,
    });
  } catch (error) {
    console.error('Get supplier transactions error:', error);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
};

/**
 * Crear transacción de proveedor
 * POST /api/suppliers/:id/transactions
 */
export const createSupplierTransaction = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { type, amount, description } = req.body;

    // Validaciones
    if (!type || amount === undefined) {
      return res.status(400).json({ error: 'type y amount son requeridos' });
    }

    if (!['purchase', 'payment'].includes(type)) {
      return res
        .status(400)
        .json({ error: 'type debe ser purchase o payment' });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum === 0) {
      return res
        .status(400)
        .json({ error: 'amount debe ser un número diferente de 0' });
    }

    // Verificar acceso
    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        store: {
          userId,
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Ajustar el monto según el tipo
    // purchase: aumenta la deuda a proveedor (positivo)
    // payment: reduce la deuda (negativo)
    const adjustedAmount =
      type === 'purchase' ? Math.abs(amountNum) : -Math.abs(amountNum);

    // Calcular el nuevo balance
    const currentBalance = await prisma.supplierTransaction.aggregate({
      where: { supplierId: id },
      _sum: { amount: true },
    });

    const newBalance = (currentBalance._sum.amount || 0) + adjustedAmount;

    const transaction = await prisma.supplierTransaction.create({
      data: {
        supplierId: id,
        type,
        amount: adjustedAmount,
        balance: newBalance,
        notes: description || null,
      },
    });

    res.status(201).json({
      message: 'Transacción creada exitosamente',
      transaction,
      balance: newBalance,
    });
  } catch (error) {
    console.error('Create supplier transaction error:', error);
    res.status(500).json({ error: 'Error al crear transacción' });
  }
};
