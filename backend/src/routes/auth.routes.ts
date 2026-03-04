import { Router } from 'express';
import {
  login, refreshToken, logout, getMe,
  changeCredentials, resendVerification, verifyEmail,
  forgotPassword, resetPassword,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
});

router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

// Email verification & password
router.post('/change-credentials', authenticate, changeCredentials);
router.post('/resend-verification', authenticate, resendVerification);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
