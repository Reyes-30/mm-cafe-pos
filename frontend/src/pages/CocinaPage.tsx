import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Clock,
  Check,
  RefreshCw,
  User,
  MessageSquare,
  Package,
  Store,
  Volume2,
  VolumeX,
} from 'lucide-react';
import api from '../lib/api';
import { formatLempiras } from '../lib/utils';
import {
  unlockKitchenAudio,
  isKitchenAudioReady,
  playNewOrderAlert,
  playTestBeep,
} from '../lib/kitchenAlert';
import type { Order } from '../types';
import toast from 'react-hot-toast';

const SOUND_PREF_KEY = 'kitchen-sound-enabled';

export default function CocinaPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem(SOUND_PREF_KEY) !== 'false'
  );
  const [audioReady, setAudioReady] = useState(false);

  const knownOrderIdsRef = useRef<Set<number>>(new Set());
  const isInitialLoadRef = useRef(true);

  const enableAudio = useCallback(() => {
    if (unlockKitchenAudio()) {
      setAudioReady(true);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/pending');
      const incoming: Order[] = res.data;

      if (!isInitialLoadRef.current && soundEnabled && audioReady) {
        const newOrders = incoming.filter(
          (o) => o.status === 'PENDIENTE' && !knownOrderIdsRef.current.has(o.id)
        );
        if (newOrders.length > 0) {
          playNewOrderAlert();
          const label =
            newOrders.length === 1
              ? `Pedido #${newOrders[0].orderNumber.split('-').pop()}`
              : `${newOrders.length} pedidos nuevos`;
          toast.success(`¡${label}!`, { icon: '🔔', duration: 4000 });
        }
      }

      knownOrderIdsRef.current = new Set(incoming.map((o) => o.id));
      isInitialLoadRef.current = false;
      setOrders(incoming);
    } catch (error) {
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [soundEnabled, audioReady]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  useEffect(() => {
    enableAudio();
    const onInteraction = () => enableAudio();
    document.addEventListener('click', onInteraction);
    document.addEventListener('keydown', onInteraction);
    return () => {
      document.removeEventListener('click', onInteraction);
      document.removeEventListener('keydown', onInteraction);
    };
  }, [enableAudio]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem(SOUND_PREF_KEY, next ? 'true' : 'false');
    if (next) {
      enableAudio();
      if (isKitchenAudioReady()) playTestBeep();
    }
  };

  const handleStartPreparing = async (orderId: number) => {
    setProcessing(orderId);
    try {
      await api.patch(`/orders/${orderId}/start-preparing`);
      toast.success('¡Orden en preparación!');
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar orden');
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkReady = async (orderId: number) => {
    setProcessing(orderId);
    try {
      await api.patch(`/orders/${orderId}/mark-ready`);
      toast.success('¡Orden lista para entregar!');
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar orden');
    } finally {
      setProcessing(null);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PENDIENTE':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
            ⏳ Pendiente
          </span>
        );
      case 'EN_PREPARACION':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
            👨‍🍳 En Preparación
          </span>
        );
      case 'LISTA':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
            ✅ Lista
          </span>
        );
      default:
        return null;
    }
  };

  const getServiceTypeIcon = (serviceType: Order['serviceType']) => {
    if (serviceType === 'PARA_LLEVAR') {
      return (
        <div className="flex items-center gap-1 text-xs text-cafe-600 dark:text-cream-300">
          <Package size={14} />
          Para Llevar
        </div>
      );
    }
    if (serviceType === 'COMER_AQUI') {
      return (
        <div className="flex items-center gap-1 text-xs text-cafe-600 dark:text-cream-300">
          <Store size={14} />
          Comer Aquí
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-cafe-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 pb-28 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-cafe-700 dark:text-white flex items-center gap-2">
            <ChefHat size={32} />
            Cocina
          </h1>
          <p className="text-cafe-400 text-sm mt-1">
            {orders.length} pedido{orders.length !== 1 ? 's' : ''} activo{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className={`btn-outline flex items-center gap-2 ${
              soundEnabled ? 'border-cafe-700 text-cafe-700 dark:text-cream-200' : 'opacity-60'
            }`}
            title={soundEnabled ? 'Alertas de sonido activadas' : 'Alertas de sonido desactivadas'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sonido ON' : 'Sonido OFF'}</span>
          </button>
          <button
            onClick={() => loadOrders()}
            disabled={loading}
            className="btn-outline flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {!audioReady && soundEnabled && (
        <button
          onClick={enableAudio}
          className="w-full mb-4 py-3 px-4 rounded-xl bg-gold-100 dark:bg-gold-900/30 border border-gold-300 dark:border-gold-700 text-gold-800 dark:text-gold-300 text-sm font-medium text-center hover:bg-gold-200 dark:hover:bg-gold-900/50 transition-colors"
        >
          🔔 Toca aquí para activar las alertas de sonido
        </button>
      )}

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="text-center py-20 text-cafe-300">
          <Check size={64} className="mx-auto mb-4 opacity-50" />
          <p className="text-xl font-medium">¡Todo listo!</p>
          <p className="text-sm mt-2">No hay pedidos pendientes en este momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`card space-y-4 ${
                  order.status === 'PENDIENTE'
                    ? 'border-l-4 border-l-red-500'
                    : order.status === 'EN_PREPARACION'
                    ? 'border-l-4 border-l-yellow-500'
                    : 'border-l-4 border-l-green-500'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-cafe-700 dark:text-white">
                        #{order.orderNumber.split('-').pop()}
                      </h3>
                      {getStatusBadge(order.status)}
                      {order.paidAt && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          💰 Pagado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-cafe-500 dark:text-cream-400">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {timeAgo(order.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        {order.user?.name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Type & General Note */}
                {(order.serviceType || order.note) && (
                  <div className="space-y-2 bg-cream-50 dark:bg-gray-800/50 rounded-lg p-3 border border-cream-200 dark:border-gray-700">
                    {order.serviceType && getServiceTypeIcon(order.serviceType)}
                    {order.note && (
                      <div className="flex items-start gap-2">
                        <MessageSquare size={14} className="text-cafe-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-cafe-600 dark:text-cream-300 italic">
                          "{order.note}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 p-2 bg-cream-50 dark:bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-bold text-cafe-700 dark:text-white flex-shrink-0">
                            {item.quantity}x
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-cafe-700 dark:text-white">
                              {item.product?.name}
                            </p>
                            {item.note && (
                              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 italic flex items-start gap-1">
                                <MessageSquare size={12} className="mt-0.5 flex-shrink-0" />
                                {item.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-cafe-600 dark:text-cream-300 flex-shrink-0">
                        {formatLempiras(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-cream-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-cafe-500 dark:text-cream-400">
                    Total
                  </span>
                  <span className="text-xl font-bold text-cafe-700 dark:text-white">
                    {formatLempiras(order.total)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {order.status === 'PENDIENTE' && (
                    <button
                      onClick={() => handleStartPreparing(order.id)}
                      disabled={processing === order.id}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      {processing === order.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ChefHat size={18} />
                          Iniciar Preparación
                        </>
                      )}
                    </button>
                  )}
                  {order.status === 'EN_PREPARACION' && (
                    <button
                      onClick={() => handleMarkReady(order.id)}
                      disabled={processing === order.id}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 min-h-[44px]"
                    >
                      {processing === order.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check size={18} />
                          Marcar como Lista
                        </>
                      )}
                    </button>
                  )}
                  {order.status === 'LISTA' && (
                    <div className="flex-1 text-center py-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl font-medium border border-green-200 dark:border-green-800">
                      {order.paidAt ? '✅ Pagado · Esperando entrega' : '✅ Lista · Esperando cobro'}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
