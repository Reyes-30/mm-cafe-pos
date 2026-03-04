import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'ok') toast.success('¡Correo verificado! Ya podés iniciar sesión.');
    if (verified === 'error') toast.error('Enlace inválido o expirado. Solicitá uno nuevo desde la app.');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('¡Bienvenido a M&M Café!');
      // Get user from store after login
      const user = useAuthStore.getState().user;
      navigate(user?.role === 'ADMIN' ? '/dashboard' : '/pos', { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] coffee-pattern flex items-center justify-center p-3 sm:p-4 safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 border border-cream-200 dark:border-gray-700">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col items-center mb-6 sm:mb-8"
          >
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-xl border-4 border-gold-400 mb-3 sm:mb-4">
              <img
                src="/assets/images/Logo.jpg"
                alt="M&M Café y Más"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '';
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-cafe-700">
              M&M Café y Más...
            </h1>
            <p className="text-cafe-400 text-sm mt-1">Sistema de Gestión</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-cafe-700 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="tu@email.com"
                required
              />
            </motion.div>

            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-cafe-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cafe-400 hover:text-cafe-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  Iniciar Sesión
                </>
              )}
            </motion.button>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-3"
            >
              <Link
                to="/forgot-password"
                className="text-sm text-cafe-400 hover:text-cafe-700 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-cafe-300">
              <Coffee size={16} />
              <span className="text-xs">Est. 2024 — M&M Café y Más...</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
