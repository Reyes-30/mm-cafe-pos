import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  Star,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../lib/api';
import { formatLempiras, formatDateTime } from '../lib/utils';
import { useThemeStore } from '../stores/themeStore';
import type { DashboardStats, SalesChartData, CategorySalesData, Order } from '../types';

const COLORS_LIGHT = ['#6B3A2A', '#C8973A', '#a5513a', '#87491a', '#d4896a', '#5a3125', '#e8bc66', '#4a2920'];
const COLORS_DARK = ['#d4896a', '#e8bc66', '#C8973A', '#a5513a', '#E0CDB0', '#87491a', '#f0d48a', '#c97a5a'];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

export default function DashboardPage() {
  const { isDark } = useThemeStore();
  const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesChart, setSalesChart] = useState<SalesChartData[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySalesData[]>([]);
  const [recentActivity, setRecentActivity] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, chartRes, catRes, activityRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/sales-chart'),
        api.get('/dashboard/category-sales'),
        api.get('/dashboard/recent-activity'),
      ]);
      setStats(statsRes.data);
      setSalesChart(chartRes.data);
      setCategorySales(catRes.data);
      setRecentActivity(activityRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-cafe-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Ventas del Día',
      value: formatLempiras(stats?.todaySales || 0),
      subtitle: `${stats?.todayOrders || 0} órdenes`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Ventas de la Semana',
      value: formatLempiras(stats?.weekSales || 0),
      subtitle: `${stats?.weekOrders || 0} órdenes`,
      icon: TrendingUp,
      color: 'bg-blue-500',
    },
    {
      title: 'Producto Más Vendido',
      value: stats?.topProduct?.name || 'Sin datos',
      subtitle: stats?.topProduct ? `${stats.topProduct.totalSold} vendidos` : '',
      icon: Star,
      color: 'bg-gold-400',
    },
    {
      title: 'Órdenes Pendientes',
      value: stats?.pendingOrders?.toString() || '0',
      subtitle: 'Pendientes de completar',
      icon: Clock,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-bold text-cafe-700 dark:text-white">
          Dashboard
        </h1>
        <p className="text-cafe-400 dark:text-cream-400 mt-0.5 sm:mt-1 text-xs sm:text-sm">
          Resumen general de M&M Café y Más...
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.title}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="card p-3 sm:p-5"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-sm text-cafe-400 dark:text-cream-400 font-medium leading-tight">
                  {card.title}
                </p>
                <p className="text-base sm:text-2xl font-bold text-cafe-700 dark:text-white mt-0.5 sm:mt-1 truncate">
                  {card.value}
                </p>
                <p className="text-[10px] sm:text-xs text-cafe-300 dark:text-cream-400 mt-0.5 sm:mt-1 truncate">
                  {card.subtitle}
                </p>
              </div>
              <div className={`${card.color} p-1.5 sm:p-3 rounded-lg sm:rounded-xl text-white flex-shrink-0 ml-1`}>
                <card.icon size={16} className="sm:w-[22px] sm:h-[22px]" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-3 sm:p-5 lg:col-span-2"
        >
          <h3 className="font-semibold text-cafe-700 dark:text-white mb-2 sm:mb-4 text-sm sm:text-base">
            Ventas Últimos 7 Días
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesChart}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E0CDB0'} />
              <XAxis dataKey="date" stroke={isDark ? '#9ca3af' : '#6B3A2A'} fontSize={10} tick={{ fontSize: 10 }} />
              <YAxis stroke={isDark ? '#9ca3af' : '#6B3A2A'} fontSize={10} tick={{ fontSize: 10 }} width={45} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#FAF5EE',
                  border: isDark ? '1px solid #374151' : '1px solid #E0CDB0',
                  borderRadius: '12px',
                  color: isDark ? '#e5e7eb' : undefined,
                }}
                formatter={(value: number) => [formatLempiras(value), 'Ventas']}
              />
              <Bar dataKey="total" fill={isDark ? '#d4896a' : '#6B3A2A'} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-3 sm:p-5"
        >
          <h3 className="font-semibold text-cafe-700 dark:text-white mb-2 sm:mb-4 text-sm sm:text-base">
            Categorías Más Vendidas
          </h3>
          {categorySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categorySales}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categorySales.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#FAF5EE',
                    border: isDark ? '1px solid #374151' : '1px solid #E0CDB0',
                    borderRadius: '12px',
                    color: isDark ? '#e5e7eb' : undefined,
                  }}
                  formatter={(value: number) => formatLempiras(value)}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value: string) => (
                    <span className="text-cafe-600 dark:text-cream-300">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-cafe-300 text-sm">
              Sin datos de ventas aún
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card p-3 sm:p-5"
      >
        <h3 className="font-semibold text-cafe-700 dark:text-white mb-2 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
          <ShoppingBag size={18} />
          Actividad Reciente
        </h3>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-cream-50 dark:bg-gray-800 hover:bg-cream-200 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      order.status === 'COMPLETADA'
                        ? 'bg-green-500'
                        : order.status === 'ANULADA'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-cafe-700 dark:text-white">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-cafe-400 dark:text-cream-400">
                      {order.user?.name} · {order.items.length} items
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-cafe-700 dark:text-white">
                    {formatLempiras(order.total)}
                  </p>
                  <p className="text-[10px] text-cafe-400 dark:text-cream-400">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-cafe-300">
            <ShoppingBag size={40} className="mx-auto mb-2 opacity-50" />
            <p>No hay ventas recientes</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
