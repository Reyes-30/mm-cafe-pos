import { useEffect, useState } from 'react';
import { Calculator, RefreshCw, CheckCircle, ShoppingBag } from 'lucide-react';
import api from '../lib/api';
import { formatLempiras } from '../lib/utils';

interface Stats {
  todaySales: number;
  todayOrders: number;
}

export default function CierreCajaPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/stats');
      setStats({
        todaySales: res.data.todaySales,
        todayOrders: res.data.todayOrders,
      });
      setLastUpdate(new Date());
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const today = new Date().toLocaleDateString('es-HN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="p-4 sm:p-6 max-w-sm mx-auto">
      {/* Encabezado */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cafe-700 mb-3">
          <Calculator size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-display font-bold text-cafe-700 dark:text-white">
          Cierre de Caja
        </h1>
        <p className="text-sm text-cafe-400 dark:text-gray-400 capitalize mt-1">{today}</p>
      </div>

      {/* Tarjeta principal — Total del día */}
      <div className="card p-6 text-center mb-4">
        <p className="text-sm font-medium text-cafe-400 dark:text-gray-400 uppercase tracking-wide mb-2">
          Total cobrado hoy
        </p>
        {loading ? (
          <div className="h-14 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-cafe-300 border-t-cafe-700 rounded-full animate-spin" />
          </div>
        ) : (
          <p className="text-5xl font-bold text-cafe-700 dark:text-white">
            {formatLempiras(stats?.todaySales ?? 0)}
          </p>
        )}
      </div>

      {/* Órdenes del día */}
      <div className="card p-4 flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gold-100 dark:bg-gold-900/20 flex items-center justify-center flex-shrink-0">
          <ShoppingBag size={20} className="text-gold-500" />
        </div>
        <div>
          <p className="text-xs text-cafe-400 dark:text-gray-400">Órdenes completadas hoy</p>
          {loading ? (
            <div className="h-6 w-12 bg-cafe-100 dark:bg-gray-700 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-xl font-bold text-cafe-700 dark:text-white">
              {stats?.todayOrders ?? 0}
            </p>
          )}
        </div>
      </div>

      {/* Instrucción */}
      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-xl p-4 flex gap-3 mb-6">
        <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-green-700 dark:text-green-400">
          Conta el dinero de la caja y verificá que coincida con el total de arriba.
        </p>
      </div>

      {/* Botón actualizar */}
      <button
        onClick={loadStats}
        disabled={loading}
        className="w-full btn-primary flex items-center justify-center gap-2 py-3"
      >
        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        Actualizar
      </button>

      <p className="text-center text-xs text-cafe-300 dark:text-gray-600 mt-4">
        Última actualización: {lastUpdate.toLocaleTimeString('es-HN')}
      </p>
    </div>
  );
}
