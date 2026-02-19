import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { productSchema, updateProductSchema } from '../validators/schemas';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { categoryId, available } = req.query;
    const where: any = {};
    if (categoryId) where.categoryId = parseInt(categoryId as string);
    if (available === 'true') where.isAvailable = true;
    if (available === 'false') where.isAvailable = false;

    const products = await prisma.product.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
    });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener productos' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id as string) },
      include: { category: true },
    });
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener producto' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const body = {
      ...req.body,
      price: parseFloat(req.body.price),
      categoryId: parseInt(req.body.categoryId),
      isAvailable: req.body.isAvailable === 'true' || req.body.isAvailable === true,
    };

    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const data: any = parsed.data;
    if (req.file) {
      data.imageUrl = `/uploads/${req.file.filename}`;
    }

    const product = await prisma.product.create({
      data,
      include: { category: { select: { name: true } } },
    });

    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ error: 'Error al crear producto' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const body: any = { ...req.body };
    if (body.price) body.price = parseFloat(body.price);
    if (body.categoryId) body.categoryId = parseInt(body.categoryId);
    if (body.isAvailable !== undefined) {
      body.isAvailable = body.isAvailable === 'true' || body.isAvailable === true;
    }

    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const data: any = parsed.data;
    if (req.file) {
      data.imageUrl = `/uploads/${req.file.filename}`;
    }

    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id as string) },
      data,
      include: { category: { select: { name: true } } },
    });

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

export const toggleProductAvailability = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id as string) },
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { isAvailable: !product.isAvailable },
      include: { category: { select: { name: true } } },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Error al cambiar disponibilidad' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    await prisma.product.delete({ where: { id: parseInt(req.params.id as string) } });
    return res.json({ message: 'Producto eliminado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar producto' });
  }
};
