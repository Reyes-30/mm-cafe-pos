import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import prisma from '../lib/prisma';
import { loginSchema } from '../validators/schemas';
import { AuthRequest } from '../middleware/auth';
import { sendVerificationEmail, sendResetPasswordEmail } from '../lib/email';

const generateTokens = (user: { id: number; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn as any }
  );

  return { accessToken, refreshToken };
};

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Cuenta desactivada. Contacta al administrador.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) {
      return res.status(401).json({ error: 'Refresh token requerido' });
    }

    const decoded = jwt.verify(token, config.jwt.refreshSecret) as { id: number };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Usuario no válido' });
    }

    const tokens = generateTokens(user);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    return res.status(401).json({ error: 'Refresh token inválido' });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return res.json({ message: 'Sesión cerrada exitosamente' });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, role: true,
        mustChangePassword: true, emailVerified: true, createdAt: true,
      },
    });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ==================== CAMBIO OBLIGATORIO (primer login) ====================
export const changeCredentials = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== req.user!.id) {
      return res.status(400).json({ error: 'Ese correo ya está en uso' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 12);

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { email, password: hashedPassword, mustChangePassword: false, emailVerified: false, verificationToken, verificationTokenExpires },
    });

    try { await sendVerificationEmail(email, updatedUser.name, verificationToken); } catch (e) { console.error('Email send error:', e); }

    const tokens = generateTokens(updatedUser);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return res.json({
      message: 'Credenciales actualizadas. Revisá tu correo para verificarlo.',
      user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, mustChangePassword: false, emailVerified: false },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error('Change credentials error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ==================== REENVIAR VERIFICACIÓN ====================
export const resendVerification = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.emailVerified) return res.status(400).json({ error: 'El correo ya está verificado' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({ where: { id: user.id }, data: { verificationToken, verificationTokenExpires } });
    await sendVerificationEmail(user.email, user.name, verificationToken);
    return res.json({ message: 'Correo de verificación reenviado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al enviar el correo' });
  }
};

// ==================== VERIFICAR EMAIL ====================
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query as { token: string };
    if (!token) return res.redirect(`${config.appUrl}/login?verified=error`);

    const user = await prisma.user.findFirst({
      where: { verificationToken: token, verificationTokenExpires: { gt: new Date() } },
    });
    if (!user) return res.redirect(`${config.appUrl}/login?verified=error`);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null, verificationTokenExpires: null },
    });
    return res.redirect(`${config.appUrl}/login?verified=ok`);
  } catch (error) {
    return res.redirect(`${config.appUrl}/login?verified=error`);
  }
};

// ==================== FORGOT PASSWORD ====================
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'El correo es requerido' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.json({ message: 'Si ese correo existe recibirás un enlace para restablecer tu contraseña.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetTokenExpires } });

    try {
      await sendResetPasswordEmail(user.email, user.name, resetToken);
    } catch (e) {
      console.error('Reset email error:', e);
      return res.status(500).json({ error: 'Error al enviar el correo. Verificá la configuración de email.' });
    }
    return res.json({ message: 'Si ese correo existe recibirás un enlace para restablecer tu contraseña.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ==================== RESET PASSWORD ====================
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token y contraseña son requeridos' });
    if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpires: { gt: new Date() } },
    });
    if (!user) return res.status(400).json({ error: 'El enlace es inválido o ya expiró' });

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExpires: null, mustChangePassword: false },
    });
    return res.json({ message: 'Contraseña restablecida exitosamente. Ya podés iniciar sesión.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
