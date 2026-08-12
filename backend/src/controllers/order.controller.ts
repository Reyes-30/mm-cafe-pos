import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { orderSchema, completeOrderSchema, voidOrderSchema } from '../validators/schemas';
import { AuthRequest } from '../middleware/auth';

const generateOrderNumber = (): string => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${date}-${random}`;
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { items, paymentMethod, cashReceived, note, serviceType } = parsed.data;

    // Validate products and calculate total
    let total = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res.status(400).json({ error: `Producto con ID ${item.productId} no encontrado` });
      }

      if (!product.isAvailable) {
        return res.status(400).json({ error: `${product.name} no está disponible` });
      }

      const subtotal = product.price * item.quantity;
      total += subtotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal,
        note: item.note || null,
      });
    }

    // Determine status: if payment info provided, complete immediately; otherwise pending
    let status = 'PENDIENTE';
    let change = null;

    if (paymentMethod) {
      // Immediate completion with payment (venta directa sin cocina)
      if (paymentMethod === 'EFECTIVO') {
        if (!cashReceived || cashReceived < total) {
          return res.status(400).json({
            error: 'El efectivo recibido debe ser mayor o igual al total',
          });
        }
        change = cashReceived - total;
      }
      status = 'COMPLETADA';
    }

    const now = paymentMethod ? new Date() : null;

    // Create unique order number
    let orderNumber = generateOrderNumber();
    let exists = await prisma.order.findUnique({ where: { orderNumber } });
    while (exists) {
      orderNumber = generateOrderNumber();
      exists = await prisma.order.findUnique({ where: { orderNumber } });
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        total,
        paymentMethod: (paymentMethod as any) || 'EFECTIVO',
        cashReceived: cashReceived || null,
        change,
        note: note || null,
        serviceType: serviceType as any || null,
        status: status as any,
        paidAt: now,
        userId: req.user!.id,
        items: { create: orderItems },
      },
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
        user: { select: { name: true } },
      },
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ error: 'Error al crear la orden' });
  }
};

export const completeOrder = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = completeOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id as string) },
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (!['PENDIENTE', 'EN_PREPARACION', 'LISTA'].includes(order.status)) {
      return res.status(400).json({ error: 'Esta orden no se puede cobrar' });
    }

    if (order.paidAt) {
      return res.status(400).json({ error: 'Esta orden ya fue cobrada' });
    }

    const { paymentMethod, cashReceived } = parsed.data;

    let change = null;
    if (paymentMethod === 'EFECTIVO') {
      if (!cashReceived || cashReceived < order.total) {
        return res.status(400).json({
          error: 'El efectivo recibido debe ser mayor o igual al total',
        });
      }
      change = cashReceived - order.total;
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: paymentMethod as any,
        cashReceived: cashReceived || null,
        change,
        paidAt: new Date(),
      },
      include: {
        items: { include: { product: { select: { name: true } } } },
        user: { select: { name: true } },
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Error al cobrar la orden' });
  }
};

export const markOrderDelivered = async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id as string) },
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (order.status !== 'LISTA') {
      return res.status(400).json({ error: 'Solo se pueden entregar órdenes marcadas como listas' });
    }

    if (!order.paidAt) {
      return res.status(400).json({ error: 'Debe cobrar la orden antes de marcarla como entregada' });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'COMPLETADA' },
      include: {
        items: { include: { product: { select: { name: true } } } },
        user: { select: { name: true } },
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Error al marcar la orden como entregada' });
  }
};

export const getPendingOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { 
        status: {
          in: ['PENDIENTE', 'EN_PREPARACION', 'LISTA']
        }
      },
      include: {
        items: {
          include: { product: { select: { name: true, imageUrl: true } } },
        },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener pedidos pendientes' });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      startDate,
      endDate,
      userId,
      paymentMethod,
      status,
      minTotal,
      maxTotal,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(new Date(endDate as string).setHours(23, 59, 59, 999)),
      };
    } else if (startDate) {
      where.createdAt = { gte: new Date(startDate as string) };
    } else if (endDate) {
      where.createdAt = { lte: new Date(new Date(endDate as string).setHours(23, 59, 59, 999)) };
    }

    if (userId) where.userId = parseInt(userId as string);
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (status) where.status = status;
    if (minTotal || maxTotal) {
      where.total = {};
      if (minTotal) where.total.gte = parseFloat(minTotal as string);
      if (maxTotal) where.total.lte = parseFloat(maxTotal as string);
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: { product: { select: { name: true } } },
          },
          user: { select: { name: true, id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    return res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener órdenes' });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id as string) },
      include: {
        items: {
          include: { product: { select: { name: true, imageUrl: true } } },
        },
        user: { select: { name: true, email: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener la orden' });
  }
};

export const voidOrder = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = voidOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id as string) },
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (order.status === 'ANULADA') {
      return res.status(400).json({ error: 'Esta orden ya fue anulada' });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'ANULADA',
        voidReason: parsed.data.reason,
      },
      include: {
        items: { include: { product: { select: { name: true } } } },
        user: { select: { name: true } },
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Error al anular la orden' });
  }
};

// Kitchen functions
export const startPreparingOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id as string) },
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (order.status !== 'PENDIENTE') {
      return res.status(400).json({ error: 'Solo se pueden preparar órdenes pendientes' });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'EN_PREPARACION' },
      include: {
        items: {
          include: { product: { select: { name: true, imageUrl: true } } },
        },
        user: { select: { name: true } },
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Error al cambiar estado de la orden' });
  }
};

export const markOrderReady = async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id as string) },
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (order.status !== 'EN_PREPARACION') {
      return res.status(400).json({ error: 'Solo se pueden marcar como listas órdenes en preparación' });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'LISTA' },
      include: {
        items: {
          include: { product: { select: { name: true, imageUrl: true } } },
        },
        user: { select: { name: true } },
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Error al cambiar estado de la orden' });
  }
};
