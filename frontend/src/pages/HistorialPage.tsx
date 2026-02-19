import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Search,
  Eye,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from 'lucide-react';
import api from '../lib/api';
import { formatLempiras, formatDateTime } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';
import type { Order, PaginatedResponse, User } from '../types';
import toast from 'react-hot-toast';

export default function HistorialPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidOrderId, setVoidOrderId] = useState<number | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  useEffect(() => {
    loadOrders();
    if (user?.role === 'ADMIN') {
      loadUsers();
    }
  }, [pagination.page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '20',
      });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (filterUserId) params.set('userId', filterUserId);
      if (filterPayment) params.set('paymentMethod', filterPayment);
      if (filterStatus) params.set('status', filterStatus);

      const res = await api.get<PaginatedResponse<Order>>(`/orders?${params}`);
      setOrders(res.data.orders);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch {}
  };

  const handleFilter = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    loadOrders();
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilterUserId('');
    setFilterPayment('');
    setFilterStatus('');
    setPagination((p) => ({ ...p, page: 1 }));
    setTimeout(loadOrders, 0);
  };

  const viewOrder = async (orderId: number) => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data);
    } catch {
      toast.error('Error al cargar orden');
    }
  };

  const handleVoid = async () => {
    if (!voidOrderId || !voidReason) return;
    setVoiding(true);
    try {
      await api.patch(`/orders/${voidOrderId}/void`, { reason: voidReason });
      toast.success('Orden anulada exitosamente');
      setShowVoidModal(false);
      setVoidReason('');
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al anular orden');
    } finally {
      setVoiding(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      COMPLETADA: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      ANULADA: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      PENDIENTE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return styles[status as keyof typeof styles] || '';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-bold text-cafe-700 dark:text-white">
          Historial de Ventas
        </h1>
        <p className="text-cafe-400 text-xs sm:text-sm mt-1">
          Consulta y gestiona todas las ventas realizadas
        </p>
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-cafe-600 dark:text-cream-300 mb-1 block">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field text-sm py-2"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-cafe-600 dark:text-cream-300 mb-1 block">
              Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field text-sm py-2"
            />
          </div>
          {user?.role === 'ADMIN' && (
            <div>
              <label className="text-xs font-medium text-cafe-600 dark:text-cream-300 mb-1 block">
                Cajero
              </label>
              <select
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="input-field text-sm py-2"
              >
                <option value="">Todos</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-cafe-600 dark:text-cream-300 mb-1 block">
              Estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field text-sm py-2"
            >
              <option value="">Todos</option>
              <option value="COMPLETADA">Completada</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1 flex gap-2">
            <button onClick={handleFilter} className="btn-primary text-xs sm:text-sm py-2 flex-1 flex items-center justify-center gap-1 min-h-[44px] cursor-pointer select-none">
              <Search size={14} />
              Filtrar
            </button>
            <button onClick={clearFilters} className="btn-outline text-xs sm:text-sm py-2 px-3 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-cafe-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto overscroll-contain">
              <table className="w-full table-zebra">
                <thead>
                  <tr className="bg-cream-200 dark:bg-gray-700">
                    <th className="text-left p-2 sm:p-3 text-[10px] sm:text-xs font-semibold text-cafe-600"># Orden</th>
                    <th className="text-left p-2 sm:p-3 text-[10px] sm:text-xs font-semibold text-cafe-600">Fecha</th>
                    <th className="text-left p-2 sm:p-3 text-[10px] sm:text-xs font-semibold text-cafe-600 hidden md:table-cell">Cajero</th>
                    <th className="text-center p-2 sm:p-3 text-[10px] sm:text-xs font-semibold text-cafe-600">Pago</th>
                    <th className="text-center p-2 sm:p-3 text-[10px] sm:text-xs font-semibold text-cafe-600">Estado</th>
                    <th className="text-right p-2 sm:p-3 text-[10px] sm:text-xs font-semibold text-cafe-600">Total</th>
                    <th className="text-center p-2 sm:p-3 text-[10px] sm:text-xs font-semibold text-cafe-600">Acc.</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-cream-100 dark:border-gray-700">
                      <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium text-cafe-700 dark:text-white">
                        {order.orderNumber}
                      </td>
                      <td className="p-2 sm:p-3 text-[10px] sm:text-xs text-cafe-500 dark:text-cream-400">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm text-cafe-600 dark:text-cream-300 hidden md:table-cell">
                        {order.user?.name}
                      </td>
                      <td className="p-2 sm:p-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.paymentMethod === 'EFECTIVO'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 text-center">
                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm text-right font-bold text-gold-400 whitespace-nowrap">
                        {formatLempiras(order.total)}
                      </td>
                      <td className="p-2 sm:p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => viewOrder(order.id)}
                            className="p-2 rounded-lg hover:bg-cream-200 dark:hover:bg-gray-700 text-cafe-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
                            title="Ver detalle"
                          >
                            <Eye size={16} />
                          </button>
                          {user?.role === 'ADMIN' && order.status !== 'ANULADA' && (
                            <button
                              onClick={() => {
                                setVoidOrderId(order.id);
                                setShowVoidModal(true);
                              }}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
                              title="Anular orden"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-2 p-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-cream-50 dark:bg-gray-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-cafe-700 dark:text-white">{order.orderNumber}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div>
                      <span className="text-cafe-400">Fecha: </span>
                      <span className="text-cafe-600 dark:text-cream-300">{formatDateTime(order.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-cafe-400">Pago: </span>
                      <span className="text-cafe-600 dark:text-cream-300">{order.paymentMethod || 'Pendiente'}</span>
                    </div>
                    {order.user?.name && (
                      <div>
                        <span className="text-cafe-400">Cajero: </span>
                        <span className="text-cafe-600 dark:text-cream-300">{order.user.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-cream-200 dark:border-gray-700">
                    <span className="text-sm font-bold text-gold-400 whitespace-nowrap">{formatLempiras(order.total)}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => viewOrder(order.id)}
                        className="p-2 rounded-lg bg-cream-200 dark:bg-gray-700 text-cafe-500 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
                      >
                        <Eye size={16} />
                      </button>
                      {user?.role === 'ADMIN' && order.status !== 'ANULADA' && (
                        <button
                          onClick={() => {
                            setVoidOrderId(order.id);
                            setShowVoidModal(true);
                          }}
                          className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {orders.length === 0 && (
              <div className="text-center py-16 text-cafe-300">
                <History size={40} className="mx-auto mb-2 opacity-50" />
                <p>No se encontraron órdenes</p>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 border-t border-cream-200 dark:border-gray-700 gap-2">
                <p className="text-[10px] sm:text-xs text-cafe-400">
                  Mostrando {orders.length} de {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg hover:bg-cream-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm text-cafe-600 dark:text-cream-300">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 rounded-lg hover:bg-cream-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[85dvh] overflow-y-auto p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-bold text-cafe-700 dark:text-white">
                  Orden {selectedOrder.orderNumber}
                </h2>
                <button onClick={() => setSelectedOrder(null)} className="text-cafe-400 hover:text-cafe-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none">
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-cafe-400">Fecha:</span>
                  <span className="text-cafe-700 dark:text-white font-medium">
                    {formatDateTime(selectedOrder.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cafe-400">Cajero:</span>
                  <span className="text-cafe-700 dark:text-white">{selectedOrder.user?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cafe-400">Método:</span>
                  <span className="text-cafe-700 dark:text-white">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cafe-400">Estado:</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                {selectedOrder.voidReason && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-sm">
                    <p className="text-red-600 font-medium">Motivo de anulación:</p>
                    <p className="text-red-500">{selectedOrder.voidReason}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-b border-cream-200 dark:border-gray-700 py-3 space-y-2 mb-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span className="text-cafe-700 dark:text-white">
                        {item.quantity}x {item.product?.name}
                      </span>
                      {item.note && (
                        <p className="text-xs text-cafe-400 italic">📝 {item.note}</p>
                      )}
                    </div>
                    <span className="font-medium text-cafe-700 dark:text-white">
                      {formatLempiras(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold text-cafe-700 dark:text-white">
                  <span>Total</span>
                  <span>{formatLempiras(selectedOrder.total)}</span>
                </div>
                {selectedOrder.cashReceived && (
                  <>
                    <div className="flex justify-between text-sm text-cafe-400">
                      <span>Efectivo</span>
                      <span>{formatLempiras(selectedOrder.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Cambio</span>
                      <span>{formatLempiras(selectedOrder.change || 0)}</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Void Order Modal */}
      <AnimatePresence>
        {showVoidModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowVoidModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6"
            >
              <div className="text-center mb-4">
                <AlertTriangle size={40} className="text-red-500 mx-auto mb-2" />
                <h2 className="text-lg font-bold text-cafe-700 dark:text-white">
                  Anular Orden
                </h2>
                <p className="text-sm text-cafe-400 mt-1">
                  Esta acción no se puede deshacer
                </p>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-cafe-700 dark:text-white mb-2 block">
                  Motivo de Anulación *
                </label>
                <textarea
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Escribe el motivo..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowVoidModal(false);
                    setVoidReason('');
                  }}
                  className="btn-outline flex-1 text-sm min-h-[44px] cursor-pointer select-none"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleVoid}
                  disabled={voiding || voidReason.length < 5}
                  className="btn-danger flex-1 text-sm min-h-[44px] cursor-pointer select-none"
                >
                  {voiding ? 'Anulando...' : 'Anular Orden'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
