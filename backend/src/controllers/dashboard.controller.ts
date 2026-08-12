import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Week start (Monday)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));

    // Today's sales (cobradas)
    const todaySales = await prisma.order.aggregate({
      where: {
        paidAt: { gte: today, lt: tomorrow },
        status: { not: 'ANULADA' },
      },
      _sum: { total: true },
      _count: true,
    });

    // Week's sales (cobradas)
    const weekSales = await prisma.order.aggregate({
      where: {
        paidAt: { gte: weekStart },
        status: { not: 'ANULADA' },
      },
      _sum: { total: true },
      _count: true,
    });

    // Pending orders
    const pendingOrders = await prisma.order.count({
      where: { status: 'PENDIENTE' },
    });

    // Top product (this week)
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          paidAt: { gte: weekStart },
          status: { not: 'ANULADA' },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 1,
    });

    let topProduct = null;
    if (topProducts.length > 0) {
      topProduct = await prisma.product.findUnique({
        where: { id: topProducts[0].productId },
        select: { name: true, price: true },
      });
      if (topProduct) {
        (topProduct as any).totalSold = topProducts[0]._sum.quantity;
      }
    }

    return res.json({
      todaySales: todaySales._sum.total || 0,
      todayOrders: todaySales._count,
      weekSales: weekSales._sum.total || 0,
      weekOrders: weekSales._count,
      pendingOrders,
      topProduct,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

export const getSalesChart = async (_req: Request, res: Response) => {
  try {
    const days = 7;
    const result: { date: string; total: number; orders: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const sales = await prisma.order.aggregate({
        where: {
          paidAt: { gte: date, lt: nextDate },
          status: { not: 'ANULADA' },
        },
        _sum: { total: true },
        _count: true,
      });

      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

      result.push({
        date: dayNames[date.getDay()],
        total: sales._sum.total || 0,
        orders: sales._count,
      });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener datos de ventas' });
  }
};

export const getCategorySales = async (_req: Request, res: Response) => {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const categorySales = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          paidAt: { gte: weekStart },
          status: { not: 'ANULADA' },
        },
      },
      _sum: { subtotal: true, quantity: true },
    });

    // Map to categories
    const categoryMap: Record<string, number> = {};
    for (const item of categorySales) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { category: { select: { name: true } } },
      });
      if (product) {
        const catName = product.category.name;
        categoryMap[catName] = (categoryMap[catName] || 0) + (item._sum.subtotal || 0);
      }
    }

    const result = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener ventas por categoría' });
  }
};

export const getRecentActivity = async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        items: {
          include: { product: { select: { name: true } } },
        },
      },
    });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener actividad reciente' });
  }
};

export const getReportByDateRange = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Se requieren fechas de inicio y fin' });
    }

    const start = new Date(startDate as string);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        paidAt: { gte: start, lte: end },
        status: { not: 'ANULADA' },
      },
      include: {
        items: {
          include: { product: { select: { name: true, category: { select: { name: true } } } } },
        },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalSales = orders.reduce((sum: number, o: { total: number }) => sum + o.total, 0);

    // Products sold summary
    const productSummary: Record<string, { name: string; quantity: number; total: number }> = {};
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.productId.toString();
        if (!productSummary[key]) {
          productSummary[key] = { name: item.product.name, quantity: 0, total: 0 };
        }
        productSummary[key].quantity += item.quantity;
        productSummary[key].total += item.subtotal;
      }
    }

    const productsList = Object.values(productSummary).sort((a, b) => b.quantity - a.quantity);

    return res.json({
      startDate: start,
      endDate: end,
      totalOrders: orders.length,
      totalSales,
      orders,
      topProducts: productsList,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al generar reporte' });
  }
};
