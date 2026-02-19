import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['ADMIN', 'CAJERO']),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'CAJERO']).optional(),
  isActive: z.boolean().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  price: z.number().positive('El precio debe ser positivo'),
  categoryId: z.number().int().positive(),
  isAvailable: z.boolean().optional(),
});

export const updateProductSchema = productSchema.partial();

export const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
    note: z.string().optional(),
  })).min(1, 'La orden debe tener al menos un item'),
  paymentMethod: z.enum(['EFECTIVO', 'TARJETA']).optional(),
  cashReceived: z.number().positive().optional(),
  note: z.string().optional(),
});

export const completeOrderSchema = z.object({
  paymentMethod: z.enum(['EFECTIVO', 'TARJETA']),
  cashReceived: z.number().positive().optional(),
});

export const voidOrderSchema = z.object({
  reason: z.string().min(5, 'El motivo debe tener al menos 5 caracteres'),
});
