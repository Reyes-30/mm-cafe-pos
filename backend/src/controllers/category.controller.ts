import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { categorySchema } from '../validators/schemas';

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { id: 'asc' },
    });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const existing = await prisma.category.findFirst({
      where: { name: parsed.data.name },
    });

    if (existing) {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }

    const category = await prisma.category.create({
      data: parsed.data,
      include: { _count: { select: { products: true } } },
    });

    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ error: 'Error al crear categoría' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const id = parseInt(req.params.id as string);
    const existing = await prisma.category.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const duplicate = await prisma.category.findFirst({
      where: { 
        name: parsed.data.name,
        NOT: { id }
      },
    });

    if (duplicate) {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }

    const category = await prisma.category.update({
      where: { id },
      data: parsed.data,
      include: { _count: { select: { products: true } } },
    });

    return res.json(category);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    if (category._count.products > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar una categoría con productos asociados' 
      });
    }

    await prisma.category.delete({ where: { id } });
    return res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};
