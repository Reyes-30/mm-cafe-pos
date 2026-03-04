import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { createUserSchema, updateUserSchema } from '../validators/schemas';

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id as string) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { orders: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Calculate total processed
    const totalProcessed = await prisma.order.aggregate({
      where: { userId: user.id, status: 'COMPLETADA' },
      _sum: { total: true },
    });

    return res.json({
      ...user,
      totalProcessed: totalProcessed._sum.total || 0,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role as any, mustChangePassword: true, emailVerified: false },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Error al crear usuario' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const data: any = { ...parsed.data };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id as string) },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id as string) },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Error al cambiar estado del usuario' });
  }
};
