import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Coffee, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import { useThemeStore } from '../stores/themeStore';

export default function ForgotPasswordPage() {
  const { isDark } = useThemeStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar el correo');
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
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-cafe-700 dark:text-white mb-2">Correo enviado</h2>
              <p className="text-sm text-cafe-500 dark:text-gray-400 mb-6">
                Si <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña. Revisá también tu carpeta de spam.
              </p>
              <Link to="/login" className="btn-primary block text-center py-2.5 text-sm">
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-cafe-700 dark:text-white mb-1">¿Olvidaste tu contraseña?</h2>
              <p className="text-sm text-cafe-400 dark:text-gray-400 mb-5">
                Ingresá tu correo y te enviaremos un enlace para restablecerla.
              </p>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-cafe-700 dark:text-gray-300 mb-1">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-300" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-9"
                      placeholder="tucorreo@gmail.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Mail size={18} />
                      Enviar enlace
                    </>
                  )}
                </button>
              </form>

              <Link to="/login" className="flex items-center justify-center gap-1 mt-4 text-sm text-cafe-400 hover:text-cafe-700 dark:hover:text-white transition-colors">
                <ArrowLeft size={14} />
                Volver al login
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
