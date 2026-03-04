import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Eye, EyeOff, Coffee, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useThemeStore } from '../stores/themeStore';

export default function ResetPasswordPage() {
  const { isDark } = useThemeStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Enlace inválido. Solicitá uno nuevo.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'El enlace es inválido o ya expiró');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-cream-100 to-cream-200'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cafe-700 mb-3 shadow-lg">
            <Coffee size={32} className="text-gold-300" />
          </div>
          <h1 className="text-2xl font-display font-bold text-cafe-700 dark:text-white">M&M Café</h1>
          <p className="text-cafe-400 dark:text-gray-400 text-sm">Sistema POS</p>
        </div>

        <div className="card p-6">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-cafe-700 dark:text-white mb-2">¡Contraseña restablecida!</h2>
              <p className="text-sm text-cafe-500 dark:text-gray-400 mb-2">
                Ya podés iniciar sesión con tu nueva contraseña.
              </p>
              <p className="text-xs text-cafe-300 dark:text-gray-600 mb-5">Redirigiendo en 3 segundos...</p>
              <Link to="/login" className="btn-primary block text-center py-2.5 text-sm">
                Ir al login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-cafe-700 dark:text-white mb-1">Nueva contraseña</h2>
              <p className="text-sm text-cafe-400 dark:text-gray-400 mb-5">
                Ingresá tu nueva contraseña para recuperar el acceso.
              </p>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-cafe-700 dark:text-gray-300 mb-1">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-300" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-9 pr-10"
                      placeholder="••••••••"
                      disabled={!token}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cafe-300"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cafe-700 dark:text-gray-300 mb-1">
                    Confirmá la contraseña
                  </label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-300" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field pl-9"
                      placeholder="••••••••"
                      disabled={!token}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound size={18} />
                      Restablecer contraseña
                    </>
                  )}
                </button>
              </form>

              <Link to="/forgot-password" className="block text-center mt-4 text-sm text-cafe-400 hover:text-cafe-700 dark:hover:text-white transition-colors">
                Solicitar nuevo enlace
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
