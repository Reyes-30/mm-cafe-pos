import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Edit2,
  Shield,
  ShieldOff,
  Search,
  X,
  ShoppingBag,
} from 'lucide-react';
import api from '../lib/api';
import { formatLempiras, formatDateTime } from '../lib/utils';
import type { User } from '../types';
import toast from 'react-hot-toast';

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CAJERO' as 'ADMIN' | 'CAJERO',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setFormData({ name: '', email: '', password: '', role: 'CAJERO' });
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditing(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload: any = { name: formData.name, email: formData.email, role: formData.role };
        if (formData.password) payload.password = formData.password;
        await api.put(`/users/${editing.id}`, payload);
        toast.success('Usuario actualizado');
      } else {
        await api.post('/users', formData);
        toast.success('Usuario creado');
      }
      setShowModal(false);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (userId: number) => {
    try {
      await api.patch(`/users/${userId}/toggle-status`);
      toast.success('Estado actualizado');
      loadUsers();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-cafe-700 dark:text-white">
            Gestión de Usuarios
          </h1>
          <p className="text-cafe-400 text-xs sm:text-sm mt-1">
            Administra los usuarios del sistema
          </p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2 text-sm sm:text-base min-h-[44px] cursor-pointer select-none">
          <UserPlus size={18} />
          Nuevo Usuario
        </button>
      </div>

      {/* Search */}
      <div className="card p-3 sm:p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-cafe-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card p-3 sm:p-5 relative overflow-hidden ${
                !u.isActive ? 'opacity-60' : ''
              }`}
            >
              {/* Role Badge */}
              <div className="absolute top-3 right-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    u.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  {u.role}
                </span>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-base sm:text-lg font-bold ${
                    u.role === 'ADMIN'
                      ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                      : 'bg-gradient-to-br from-cafe-500 to-cafe-700'
                  }`}
                >
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-cafe-700 dark:text-white">{u.name}</h3>
                  <p className="text-xs text-cafe-400">{u.email}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-cream-100 dark:bg-gray-700 rounded-lg p-2 sm:p-3 text-center">
                  <ShoppingBag size={16} className="mx-auto mb-1 text-cafe-400" />
                  <p className="text-lg font-bold text-cafe-700 dark:text-white">
                    {(u as any).totalProcessed ?? '—'}
                  </p>
                  <p className="text-[10px] text-cafe-400">Órdenes</p>
                </div>
                <div className="bg-cream-100 dark:bg-gray-700 rounded-lg p-2 sm:p-3 text-center">
                  <div
                    className={`inline-block w-2 h-2 rounded-full mb-1 ${
                      u.isActive ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <p className="text-sm font-bold text-cafe-700 dark:text-white">
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </p>
                  <p className="text-[10px] text-cafe-400">Estado</p>
                </div>
              </div>

              {/* Info */}
              <div className="text-xs text-cafe-400 space-y-1 mb-3 sm:mb-4">
                <p>
                  Creado: {formatDateTime(u.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleEdit(u)}
                  className="btn-outline text-xs py-1.5 sm:py-2 flex-1 flex items-center justify-center gap-1 min-h-[44px] cursor-pointer select-none"
                >
                  <Edit2 size={13} />
                  Editar
                </button>
                <button
                  onClick={() => toggleStatus(u.id)}
                  className={`text-xs py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl font-medium transition-colors flex items-center gap-1 min-h-[44px] cursor-pointer select-none ${
                    u.isActive
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40'
                      : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40'
                  }`}
                >
                  {u.isActive ? <ShieldOff size={13} /> : <Shield size={13} />}
                  {u.isActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16 text-cafe-300">
          <Users size={40} className="mx-auto mb-2 opacity-50" />
          <p>No se encontraron usuarios</p>
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-display font-bold text-cafe-700 dark:text-white">
                  {editing ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-cafe-400 hover:text-cafe-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-cafe-700 dark:text-cream-300 mb-1 block">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                    minLength={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-cafe-700 dark:text-cream-300 mb-1 block">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-cafe-700 dark:text-cream-300 mb-1 block">
                    Contraseña {editing ? '(dejar vacío para no cambiar)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field"
                    {...(!editing && { required: true })}
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-cafe-700 dark:text-cream-300 mb-1 block">
                    Rol *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'CAJERO' })}
                    className="input-field"
                  >
                    <option value="CAJERO">Cajero</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1 min-h-[44px] cursor-pointer select-none">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 min-h-[44px] cursor-pointer select-none">
                    {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
