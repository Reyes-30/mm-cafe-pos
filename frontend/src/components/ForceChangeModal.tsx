import { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Mail, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import type { User } from '../types';

export default function ForceChangeModal() {
  const { user, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!user?.mustChangePassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/change-credentials', { email, password });
      const { user: updatedUser, accessToken, refreshToken } = res.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(updatedUser as User);
      setDone(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al actualizar credenciales');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-cafe-700 p-6 text-white text-center">
          <Shield size={36} className="mx-auto mb-2" />
          <h2 className="text-xl font-bold">Configurá tu cuenta</h2>
          <p className="text-sm text-cafe-200 mt-1">
            Hola <strong>{user.name}</strong>, el admin creó tu cuenta con credenciales temporales.
            Necesitás actualizarlas antes de continuar.
          </p>
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-cafe-700 dark:text-white mb-2">
                ¡Listo!
              </h3>
              <p className="text-sm text-cafe-500 dark:text-gray-400 mb-4">
                Te enviamos un correo a <strong>{email}</strong> para verificar tu cuenta.
                Revisá tu bandeja de entrada.
              </p>
              <button
                onClick={() => setUser({ ...user, mustChangePassword: false })}
                className="btn-primary w-full py-2.5"
              >
                Continuar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-cafe-700 dark:text-gray-300 mb-1">
                  Tu correo electrónico real
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

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-cafe-700 dark:text-gray-300 mb-1">
                  Nueva contraseña (mín. 6 caracteres)
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

              {/* Confirm Password */}
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
                  />
                </div>
              </div>

              <p className="text-xs text-cafe-400 dark:text-gray-500">
                Después de guardar te enviaremos un correo para verificar tu dirección.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield size={18} />
                    Guardar y asegurar cuenta
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
