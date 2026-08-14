import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

/**
 * Listar clientes
 * GET /api/customers
 */
export const listCustomers = async (req: Request, res: Response) => {
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

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: {
              sales: true,
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
      prisma.customer.count({ where }),
    ]);

    // Calcular balance de cada cliente
    const customersWithBalance = await Promise.all(
      customers.map(async (customer) => {
        const balance = await prisma.customerTransaction.aggregate({
          where: { customerId: customer.id },
          _sum: { amount: true },
        });

        return {
          ...customer,
          balance: balance._sum.amount || 0,
        };
      })
    );

    res.json({
      customers: customersWithBalance,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('List customers error:', error);
    res.status(500).json({ error: 'Error al listar clientes' });
  }
};

/**
 * Obtener cliente por ID
 * GET /api/customers/:id
 */
export const getCustomer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
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
        sales: {
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            sales: true,
            transactions: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Calcular balance
    const balance = await prisma.customerTransaction.aggregate({
      where: { customerId: id },
      _sum: { amount: true },
    });

    res.json({
      customer: {
        ...customer,
        balance: balance._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
};

/**
 * Crear cliente
 * POST /api/customers
 */
export const createCustomer = async (req: Request, res: Response) => {
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
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          storeId,
          email,
        },
      });

      if (existingCustomer) {
        return res
          .status(400)
          .json({ error: 'Ya existe un cliente con ese email en esta tienda' });
      }
    }

    const customer = await prisma.customer.create({
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
      message: 'Cliente creado exitosamente',
      customer: {
        ...customer,
        balance: 0,
      },
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};

/**
 * Actualizar cliente
 * PUT /api/customers/:id
 */
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name, email, phone, taxId, address } = req.body;

    // Verificar que el cliente existe y el usuario tiene acceso
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        store: {
          userId,
        },
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Verificar email único (si se está cambiando)
    if (email && email !== existingCustomer.email) {
      const duplicateEmail = await prisma.customer.findFirst({
        where: {
          storeId: existingCustomer.storeId,
          email,
          id: { not: id },
        },
      });

      if (duplicateEmail) {
        return res
          .status(400)
          .json({ error: 'Ya existe un cliente con ese email en esta tienda' });
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingCustomer.name,
        email: email !== undefined ? email || null : existingCustomer.email,
        phone: phone !== undefined ? phone || null : existingCustomer.phone,
        taxId: taxId !== undefined ? taxId || null : existingCustomer.taxId,
        address:
          address !== undefined ? address || null : existingCustomer.address,
      },
    });

    res.json({
      message: 'Cliente actualizado exitosamente',
      customer,
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
};

/**
 * Eliminar cliente
 * DELETE /api/customers/:id
 */
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    // Verificar que el cliente existe y el usuario tiene acceso
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        store: {
          userId,
        },
      },
      include: {
        _count: {
          select: {
            sales: true,
            transactions: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Verificar si tiene ventas o transacciones
    if (customer._count.sales > 0 || customer._count.transactions > 0) {
      return res.status(400).json({
        error:
          'No se puede eliminar el cliente porque tiene ventas o transacciones asociadas',
      });
    }

    await prisma.customer.delete({
      where: { id },
    });

    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
};

/**
 * Obtener transacciones de un cliente
 * GET /api/customers/:id/transactions
 */
export const getCustomerTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { limit = '20' } = req.query;

    // Verificar acceso
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        store: {
          userId,
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const transactions = await prisma.customerTransaction.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    // Calcular balance
    const balance = await prisma.customerTransaction.aggregate({
      where: { customerId: id },
      _sum: { amount: true },
    });

    res.json({
      transactions,
      balance: balance._sum.amount || 0,
    });
  } catch (error) {
    console.error('Get customer transactions error:', error);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
};

/**
 * Crear transacción de cliente
 * POST /api/customers/:id/transactions
 */
export const createCustomerTransaction = async (
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

    if (!['credit', 'payment'].includes(type)) {
      return res.status(400).json({ error: 'type debe ser credit o payment' });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum === 0) {
      return res
        .status(400)
        .json({ error: 'amount debe ser un número diferente de 0' });
    }

    // Verificar acceso
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        store: {
          userId,
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Ajustar el monto según el tipo
    // credit: aumenta la deuda (positivo)
    // payment: reduce la deuda (negativo)
    const adjustedAmount =
      type === 'credit' ? Math.abs(amountNum) : -Math.abs(amountNum);

    // Calcular el nuevo balance
    const currentBalance = await prisma.customerTransaction.aggregate({
      where: { customerId: id },
      _sum: { amount: true },
    });

    const newBalance = (currentBalance._sum.amount || 0) + adjustedAmount;

    const transaction = await prisma.customerTransaction.create({
      data: {
        customerId: id,
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
    console.error('Create customer transaction error:', error);
    res.status(500).json({ error: 'Error al crear transacción' });
  }
};

/**
 * Obtener clientes con saldo vencido
 * GET /api/customers/overdue
 */
export const getOverdueCustomers = async (req: Request, res: Response) => {
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

    const today = new Date();

    // Obtener transacciones vencidas (con dueDate pasado)
    const overdueTransactions = await prisma.customerTransaction.findMany({
      where: {
        customer: {
          storeId: storeId as string,
        },
        dueDate: {
          lt: today,
        },
        amount: {
          gt: 0, // Solo créditos, no pagos
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Agrupar por cliente y calcular totales
    const overdueByCustomer = overdueTransactions.reduce(
      (acc, transaction) => {
        const customerId = transaction.customerId;
        if (!acc[customerId]) {
          acc[customerId] = {
            customer: transaction.customer,
            totalOverdue: 0,
            transactions: [],
            oldestDueDate: transaction.dueDate,
            daysOverdue: 0,
          };
        }
        acc[customerId].totalOverdue += transaction.amount;
        acc[customerId].transactions.push({
          id: transaction.id,
          amount: transaction.amount,
          dueDate: transaction.dueDate,
          notes: transaction.notes,
          createdAt: transaction.createdAt,
        });

        // Calcular días vencidos de la transacción más antigua
        if (
          transaction.dueDate &&
          (!acc[customerId].oldestDueDate ||
            transaction.dueDate < acc[customerId].oldestDueDate)
        ) {
          acc[customerId].oldestDueDate = transaction.dueDate;
          const diffTime =
            today.getTime() - new Date(transaction.dueDate).getTime();
          acc[customerId].daysOverdue = Math.floor(
            diffTime / (1000 * 60 * 60 * 24)
          );
        }

        return acc;
      },
      {} as Record<string, any>
    );

    const overdueCustomers = Object.values(overdueByCustomer);

    res.json({
      customers: overdueCustomers,
      total: overdueCustomers.reduce(
        (sum: number, c: any) => sum + c.totalOverdue,
        0
      ),
      count: overdueCustomers.length,
    });
  } catch (error) {
    console.error('Get overdue customers error:', error);
    res
      .status(500)
      .json({ error: 'Error al obtener clientes con saldo vencido' });
  }
};
