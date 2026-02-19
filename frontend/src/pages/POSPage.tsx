import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  X,
  Check,
  MessageSquare,
  Search,
  Clock,
  ChefHat,
  RefreshCw,
  UtensilsCrossed,
} from 'lucide-react';
import api from '../lib/api';
import { formatLempiras } from '../lib/utils';
import { useCartStore } from '../stores/cartStore';
import type { Product, Category } from '../types';
import toast from 'react-hot-toast';

interface PendingOrder {
  id: number;
  orderNumber: string;
  total: number;
  note: string | null;
  createdAt: string;
  user: { name: string };
  items: {
    id: number;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    note: string | null;
    product: { name: string; imageUrl: string | null };
  }[];
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pending orders
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'cart' | 'pending'>('cart');
  const [loadingPending, setLoadingPending] = useState(false);

  // Payment modal for completing pending orders
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPendingOrder, setSelectedPendingOrder] = useState<PendingOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');
  const [cashReceived, setCashReceived] = useState('');

  // Receipt modal
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);

  // Sent confirmation modal
  const [showSentConfirm, setShowSentConfirm] = useState(false);
  const [sentOrderNumber, setSentOrderNumber] = useState('');

  // Mobile view tab: 'menu' or 'cart'
  const [mobileView, setMobileView] = useState<'menu' | 'cart'>('menu');

  const {
    items: cartItems,
    addItem,
    removeItem,
    updateQuantity,
    updateNote,
    clearCart,
    getTotal,
    getItemCount,
  } = useCartStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products?available=true'),
        api.get('/categories'),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingOrders = useCallback(async () => {
    setLoadingPending(true);
    try {
      const res = await api.get('/orders/pending');
      setPendingOrders(res.data);
    } catch (error) {
      toast.error('Error al cargar pedidos pendientes');
    } finally {
      setLoadingPending(false);
    }
  }, []);

  useEffect(() => {
    if (sidebarTab === 'pending') {
      loadPendingOrders();
    }
  }, [sidebarTab, loadPendingOrders]);

  useEffect(() => {
    if (sidebarTab !== 'pending') return;
    const interval = setInterval(loadPendingOrders, 15000);
    return () => clearInterval(interval);
  }, [sidebarTab, loadPendingOrders]);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const total = getTotal();

  const handleSendToKitchen = async () => {
    if (cartItems.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    setProcessing(true);
    try {
      const orderData = {
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          note: item.note || undefined,
        })),
        note: orderNote || undefined,
      };

      const response = await api.post('/orders', orderData);
      clearCart();
      setOrderNote('');
      setSentOrderNumber(response.data.orderNumber);
      setShowSentConfirm(true);
      toast.success('¡Pedido enviado a cocina!');

      if (sidebarTab === 'pending') {
        loadPendingOrders();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear el pedido');
    } finally {
      setProcessing(false);
    }
  };

  const openPaymentModal = (order: PendingOrder) => {
    setSelectedPendingOrder(order);
    setPaymentMethod('EFECTIVO');
    setCashReceived('');
    setShowPaymentModal(true);
  };

  const handleCompleteOrder = async () => {
    if (!selectedPendingOrder) return;

    const orderTotal = selectedPendingOrder.total;

    if (paymentMethod === 'EFECTIVO' && (!cashReceived || parseFloat(cashReceived) < orderTotal)) {
      toast.error('El efectivo recibido no es suficiente');
      return;
    }

    setProcessing(true);
    try {
      const data: any = { paymentMethod };
      if (paymentMethod === 'EFECTIVO') {
        data.cashReceived = parseFloat(cashReceived);
      }

      const response = await api.patch(`/orders/${selectedPendingOrder.id}/complete`, data);
      setLastOrder(response.data);
      setShowPaymentModal(false);
      setSelectedPendingOrder(null);
      setShowReceipt(true);
      toast.success('¡Orden cobrada exitosamente!');
      loadPendingOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al completar la orden');
    } finally {
      setProcessing(false);
    }
  };

  const paymentTotal = selectedPendingOrder?.total || 0;
  const paymentChange =
    paymentMethod === 'EFECTIVO' && cashReceived
      ? parseFloat(cashReceived) - paymentTotal
      : 0;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-cafe-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ==================== RENDER PRODUCTS SECTION ====================
  const renderProducts = () => (
    <div className="md:flex-1 flex flex-col md:min-h-0 w-full md:min-w-0 md:overflow-hidden" style={{ maxWidth: '100%', overflow: 'hidden' }}>
      {/* Search */}
      <div className="md:flex-shrink-0 mb-2 sm:mb-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-400"
          />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>
      {/* Categories - horizontal scrollable */}
      <div
        className="categories-scroll flex flex-nowrap gap-2 px-2 py-1 mb-2 sm:mb-3 w-full overflow-x-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 cursor-pointer select-none ${
            !selectedCategory
              ? 'bg-cafe-700 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-cafe-600 border border-cream-200 dark:border-gray-700'
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 cursor-pointer select-none ${
              selectedCategory === cat.id
                ? 'bg-cafe-700 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-cafe-600 border border-cream-200 dark:border-gray-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
      {/* Product Grid - scrollable area */}
      <div
        className="md:flex-1 md:overflow-y-auto md:overflow-x-hidden w-full md:min-w-0"
        style={{ WebkitOverflowScrolling: 'touch', maxWidth: '100%', overflow: 'hidden auto' }}
      >
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.5rem', padding: '0.5rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
        >
          {filteredProducts.map((product) => {
            const handleAddProduct = () => {
              addItem(product);
              if (window.innerWidth < 768) {
                toast.success(`${product.name} agregado`, { duration: 800 });
              }
            };

            return (
            <div
              key={product.id}
              onClick={handleAddProduct}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-cream-200 dark:border-gray-700 overflow-hidden flex flex-col cursor-pointer active:scale-[0.97] transition-transform"
              style={{ minWidth: 0, maxWidth: '100%' }}
            >
              {/* IMAGEN - altura fija pequeña */}
              <div
                className="w-full bg-cream-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden"
                style={{ height: '100px' }}
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    style={{ display: 'block', width: '100%', height: '100%' }}
                  />
                ) : (
                  <span style={{ fontSize: '2rem' }}>
                    {product.category?.name === 'Hamburguesas' ? '🍔' :
                     product.category?.name === 'Alitas' ? '🍗' :
                     product.category?.name === 'Pollo Frito' ? '🍗' :
                     product.category?.name === 'Cenas' ? '🍽️' :
                     product.category?.name === 'Barbacoas' ? '🥩' :
                     product.category?.name === 'Pupusas' ? '🫓' :
                     product.category?.name === 'Tacos' ? '🌮' :
                     product.category?.name === 'Antojitos' ? '🍟' : '☕'}
                  </span>
                )}
              </div>

              {/* CONTENIDO TEXTO */}
              <div className="p-2 flex flex-col flex-1">
                <p
                  className="text-cafe-800 dark:text-white font-medium leading-tight mb-1"
                  style={{
                    fontSize: '11px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {product.name}
                </p>
                <p
                  className="font-bold text-gold-700 mb-2"
                  style={{ fontSize: '13px' }}
                >
                  {formatLempiras(product.price)}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddProduct();
                  }}
                  className="w-full bg-cafe-800 text-white rounded-lg font-medium active:scale-95 transition-transform"
                  style={{ fontSize: '11px', paddingTop: '6px', paddingBottom: '6px' }}
                >
                  + Agregar
                </button>
              </div>
            </div>
          )})}
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-cafe-300">
            <UtensilsCrossed size={40} className="mx-auto mb-2 opacity-50" />
            <p className="text-lg">No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  );

  // ==================== RENDER SIDEBAR (Cart + Pending) ====================
  const renderSidebar = (isMobile = false) => (
    <div className={`${
      isMobile
        ? 'flex flex-col flex-1 min-h-0'
        : 'w-full lg:w-[370px] xl:w-96 card flex flex-col min-w-0 min-h-0 flex-1'
    }`}>
      {/* Tabs */}
      <div className="flex border-b border-cream-200 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={() => setSidebarTab('cart')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all border-b-2 min-h-[44px] cursor-pointer select-none ${
            sidebarTab === 'cart'
              ? 'border-cafe-700 text-cafe-700 dark:text-white'
              : 'border-transparent text-cafe-400 hover:text-cafe-600'
          }`}
        >
          <ShoppingCart size={18} />
          Carrito
          {getItemCount() > 0 && (
            <span className="bg-gold-400 text-white text-xs px-2 py-0.5 rounded-full">
              {getItemCount()}
            </span>
          )}
        </button>
        <button
          onClick={() => setSidebarTab('pending')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all border-b-2 min-h-[44px] cursor-pointer select-none ${
            sidebarTab === 'pending'
              ? 'border-cafe-700 text-cafe-700 dark:text-white'
              : 'border-transparent text-cafe-400 hover:text-cafe-600'
          }`}
        >
          <Clock size={18} />
          Pendientes
          {pendingOrders.length > 0 && (
            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
              {pendingOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* ====== CART TAB ====== */}
      {sidebarTab === 'cart' && (
        <>
          {/* Cart Items */}
          <div className={`flex-1 min-h-0 overflow-y-auto p-3 pr-4 space-y-2 ${
            isMobile ? '' : 'max-h-[calc(100vh-280px)]'
          }`}>
            <AnimatePresence>
              {cartItems.length === 0 ? (
                <div className="text-center py-12 text-cafe-300">
                  <ShoppingCart size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Carrito vacío</p>
                  <p className="text-xs mt-1">Selecciona un producto para empezar</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-cream-50 dark:bg-gray-800 rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-cafe-700 dark:text-white truncate pr-1">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-cafe-400">
                          {formatLempiras(item.product.price)} c/u
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-red-400 hover:text-red-600 p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2 gap-2">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="w-10 h-10 rounded-lg bg-cafe-700 text-white flex items-center justify-center hover:bg-cafe-600 active:scale-90 transition-transform cursor-pointer select-none"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-sm font-bold text-cafe-700 dark:text-white w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="w-10 h-10 rounded-lg bg-cafe-700 text-white flex items-center justify-center hover:bg-cafe-600 active:scale-90 transition-transform cursor-pointer select-none"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-gold-400 text-right flex-shrink-0 whitespace-nowrap pr-1">
                        {formatLempiras(item.product.price * item.quantity)}
                      </p>
                    </div>

                    {/* Note */}
                    <div className="mt-2">
                      <div className="relative">
                        <MessageSquare
                          size={12}
                          className="absolute left-2 top-1/2 -translate-y-1/2 text-cafe-300"
                        />
                        <input
                          type="text"
                          placeholder="Nota..."
                          value={item.note}
                          onChange={(e) =>
                            updateNote(item.product.id, e.target.value)
                          }
                          className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-cream-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-cafe-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-cafe-400"
                          style={{ fontSize: '16px' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Cart Footer */}
          {cartItems.length > 0 && (
            <div className="p-3 sm:p-4 border-t border-cream-200 dark:border-gray-700 space-y-2 sm:space-y-3 flex-shrink-0">
              {/* Order note */}
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                className="input-field text-sm py-2"
                placeholder="Nota del pedido (mesa, para llevar...)"
              />

              <div className="flex justify-between items-center gap-2 pr-1">
                <span className="text-cafe-500 dark:text-cream-300 font-medium text-sm">
                  Total
                </span>
                <span className="text-lg sm:text-xl font-bold text-cafe-700 dark:text-white whitespace-nowrap">
                  {formatLempiras(total)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  className="px-3 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors text-sm font-medium flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={handleSendToKitchen}
                  disabled={processing}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 text-sm min-w-0 w-full min-h-[44px] cursor-pointer select-none"
                >
                  {processing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ChefHat size={20} />
                      <span className="whitespace-nowrap">Enviar a Cocina</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ====== PENDING ORDERS TAB ====== */}
      {sidebarTab === 'pending' && (
        <>
          <div className="px-3 pt-3 pb-1 flex items-center justify-between flex-shrink-0">
            <p className="text-xs text-cafe-400">
              {pendingOrders.length} pedido{pendingOrders.length !== 1 ? 's' : ''} en cocina
            </p>
            <button
              onClick={loadPendingOrders}
              disabled={loadingPending}
              className="text-cafe-400 hover:text-cafe-700 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
            >
              <RefreshCw size={16} className={loadingPending ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className={`flex-1 min-h-0 overflow-y-auto p-3 pr-4 space-y-3 ${
            isMobile ? '' : ''
          }`}>
            {loadingPending && pendingOrders.length === 0 ? (
              <div className="text-center py-12 text-cafe-300">
                <div className="w-8 h-8 border-2 border-cafe-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">Cargando...</p>
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="text-center py-12 text-cafe-300">
                <Check size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sin pedidos pendientes</p>
                <p className="text-xs mt-1">Todos los pedidos han sido completados</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-cafe-700 dark:text-white">
                        {order.orderNumber}
                      </h4>
                      <p className="text-xs text-cafe-400 flex items-center gap-1">
                        <Clock size={10} />
                        {timeAgo(order.createdAt)} · {order.user.name}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-gold-400 whitespace-nowrap">
                      {formatLempiras(order.total)}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-xs text-cafe-600 dark:text-cream-300"
                      >
                        <span>
                          {item.quantity}x {item.product.name}
                          {item.note && (
                            <span className="text-cafe-300 ml-1">({item.note})</span>
                          )}
                        </span>
                        <span className="font-medium whitespace-nowrap ml-2">{formatLempiras(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  {order.note && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 rounded-lg px-2 py-1 mb-2">
                      {order.note}
                    </p>
                  )}

                  <button
                    onClick={() => openPaymentModal(order)}
                    className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors min-h-[44px] cursor-pointer select-none"
                  >
                    <CreditCard size={16} />
                    Cobrar Pedido
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* ============ DESKTOP / TABLET LAYOUT (md+) ============ */}
      <div className="hidden md:flex flex-col flex-1 min-h-0 h-full overflow-hidden">
        <div className="flex flex-row gap-4 flex-1 min-h-0">
          {/* Products - 60% on tablet, flex-1 on desktop */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {renderProducts()}
          </div>

          {/* Sidebar - 40% on tablet */}
          <div className="w-[40%] lg:w-[370px] xl:w-96">
            {renderSidebar(false)}
          </div>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT (< md) — simple como las demás páginas ============ */}
      <div className="md:hidden" style={{ maxWidth: '100%', overflow: 'hidden' }}>
        {/* Mobile Top Tabs - Menú / Carrito */}
        <div className="grid grid-cols-2 mb-2 rounded-xl overflow-hidden border-2 border-cafe-300 dark:border-gray-600">
          <button
            onClick={() => setMobileView('menu')}
            className={`py-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
              mobileView === 'menu'
                ? 'bg-cafe-700 text-white'
                : 'bg-cream-50 dark:bg-gray-800 text-cafe-600'
            }`}
          >
            <UtensilsCrossed size={16} />
            Menú
          </button>
          <button
            onClick={() => setMobileView('cart')}
            className={`py-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
              mobileView === 'cart'
                ? 'bg-cafe-700 text-white'
                : 'bg-cream-50 dark:bg-gray-800 text-cafe-600'
            }`}
          >
            <ShoppingCart size={16} />
            Carrito
            {getItemCount() > 0 && (
              <span className="bg-gold-400 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                {getItemCount()}
              </span>
            )}
          </button>
        </div>

        {mobileView === 'menu' && (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              width: '100%',
              maxWidth: '100vw',
              boxSizing: 'border-box',
            }}
          >
            {/* Buscador */}
            <div style={{ padding: '8px 8px 4px 8px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a0856b' }} />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '34px', fontSize: '14px', height: '40px' }}
                />
              </div>
            </div>

            {/* Carrusel categorías */}
            <div
              className="categories-scroll"
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                overflowX: 'scroll',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x',
                gap: '6px',
                padding: '6px 8px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                boxSizing: 'border-box',
              }}
            >
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  padding: '5px 14px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: !selectedCategory ? 'none' : '1px solid #d6b896',
                  backgroundColor: !selectedCategory ? '#6B3A2A' : 'white',
                  color: !selectedCategory ? 'white' : '#6B3A2A',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    padding: '5px 14px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 500,
                    border: selectedCategory === cat.id ? 'none' : '1px solid #d6b896',
                    backgroundColor: selectedCategory === cat.id ? '#6B3A2A' : 'white',
                    color: selectedCategory === cat.id ? 'white' : '#6B3A2A',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Grid de productos */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                padding: '4px 8px 80px 8px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => { addItem(product); toast.success(`${product.name} agregado`, { duration: 800 }); }}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  {/* Imagen */}
                  <div style={{ width: '100%', height: '90px', backgroundColor: '#f5ede6', overflow: 'hidden', flexShrink: 0 }}>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                        {product.category?.name === 'Hamburguesas' ? '🍔' :
                         product.category?.name === 'Alitas' ? '🍗' :
                         product.category?.name === 'Tacos' ? '🌮' :
                         product.category?.name === 'Pupusas' ? '🫓' :
                         product.category?.name === 'Antojitos' ? '🍟' : '🍽️'}
                      </div>
                    )}
                  </div>

                  {/* Texto */}
                  <div style={{ padding: '6px 8px 8px 8px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <p style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#3d1f0f',
                      marginBottom: '2px',
                      lineHeight: '1.3',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as any,
                      overflow: 'hidden',
                    }}>
                      {product.name}
                    </p>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#b8860b', marginBottom: '6px' }}>
                      {formatLempiras(product.price)}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); addItem(product); toast.success(`${product.name} agregado`, { duration: 800 }); }}
                      style={{
                        width: '100%',
                        backgroundColor: '#6B3A2A',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '5px 0',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: 'auto',
                      }}
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#a0856b' }}>
                  <p>No se encontraron productos</p>
                </div>
              )}
            </div>
          </div>
        )}

        {mobileView === 'cart' && renderSidebar(true)}

        {/* Botón flotante para ver carrito en móvil cuando hay productos */}
        {mobileView === 'menu' && getItemCount() > 0 && (
          <div className="fixed left-4 right-4 bottom-16 z-40 pointer-events-none">
            <button
              onClick={() => setMobileView('cart')}
              className="w-full bg-cafe-700 text-white py-2.5 rounded-full font-semibold shadow-lg flex items-center justify-center gap-2 pointer-events-auto"
            >
              <ShoppingCart size={18} />
              <span>Ver carrito ({getItemCount()})</span>
            </button>
          </div>
        )}
      </div>

      {/* ============ MODALS (shared) ============ */}

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedPendingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-display font-bold text-cafe-700 dark:text-white">
                    Cobrar Pedido
                  </h2>
                  <p className="text-sm text-cafe-400">{selectedPendingOrder.orderNumber}</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-cafe-400 hover:text-cafe-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-1 border-b border-cream-200 dark:border-gray-700 pb-3 mb-4 max-h-32 overflow-y-auto overscroll-contain">
                {selectedPendingOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-cafe-600 dark:text-cream-300">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="font-medium text-cafe-700 dark:text-white whitespace-nowrap ml-2">
                      {formatLempiras(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-center mb-6 bg-cream-50 dark:bg-gray-700 rounded-xl py-4">
                <p className="text-sm text-cafe-400 dark:text-cream-300">Total a cobrar</p>
                <p className="text-3xl sm:text-4xl font-bold text-cafe-700 dark:text-white mt-1 whitespace-nowrap">
                  {formatLempiras(paymentTotal)}
                </p>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-cafe-700 dark:text-white mb-2 block">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('EFECTIVO')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all min-h-[44px] cursor-pointer select-none ${
                      paymentMethod === 'EFECTIVO'
                        ? 'border-cafe-700 bg-cafe-700 text-white'
                        : 'border-cream-200 text-cafe-600 hover:border-cafe-400'
                    }`}
                  >
                    <Banknote size={20} />
                    Efectivo
                  </button>
                  <button
                    onClick={() => setPaymentMethod('TARJETA')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all min-h-[44px] cursor-pointer select-none ${
                      paymentMethod === 'TARJETA'
                        ? 'border-cafe-700 bg-cafe-700 text-white'
                        : 'border-cream-200 text-cafe-600 hover:border-cafe-400'
                    }`}
                  >
                    <CreditCard size={20} />
                    Tarjeta
                  </button>
                </div>
              </div>

              {paymentMethod === 'EFECTIVO' && (
                <div className="mb-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-cafe-700 dark:text-white mb-2 block">
                      Efectivo Recibido
                    </label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="input-field text-center text-2xl font-bold"
                      placeholder="0.00"
                      min={paymentTotal}
                      step="0.01"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {[50, 100, 200, 500].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setCashReceived(amount.toString())}
                        className="py-2 rounded-lg bg-cream-200 dark:bg-gray-700 text-cafe-700 dark:text-white text-sm font-medium hover:bg-cream-300 transition-colors min-h-[44px] cursor-pointer select-none"
                      >
                        L.{amount}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCashReceived(paymentTotal.toString())}
                    className="w-full py-2 rounded-lg bg-gold-400 text-white text-sm font-medium hover:bg-gold-500 transition-colors min-h-[44px] cursor-pointer select-none"
                  >
                    Monto exacto ({formatLempiras(paymentTotal)})
                  </button>

                  {cashReceived && parseFloat(cashReceived) >= paymentTotal && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-center">
                      <p className="text-sm text-green-600 dark:text-green-400">Cambio</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300 whitespace-nowrap">
                        {formatLempiras(paymentChange)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleCompleteOrder}
                disabled={
                  processing ||
                  (paymentMethod === 'EFECTIVO' &&
                    (!cashReceived || parseFloat(cashReceived) < paymentTotal))
                }
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer select-none"
              >
                {processing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={20} />
                    Confirmar Cobro
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sent to Kitchen Confirmation Modal */}
      <AnimatePresence>
        {showSentConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSentConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-6 text-center"
            >
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <ChefHat size={32} className="text-orange-600" />
              </div>
              <h2 className="text-xl font-display font-bold text-cafe-700 dark:text-white">
                ¡Pedido Enviado!
              </h2>
              <p className="text-sm text-cafe-400 mt-1 mb-1">
                {sentOrderNumber}
              </p>
              <p className="text-xs text-cafe-300 mb-4">
                El pedido se está preparando en cocina. Cóbralo desde la pestaña "Pendientes" cuando esté listo.
              </p>
              <button
                onClick={() => setShowSentConfirm(false)}
                className="btn-primary w-full min-h-[44px] cursor-pointer select-none"
              >
                Aceptar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && lastOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowReceipt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-6"
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check size={32} className="text-green-600" />
                </div>
                <h2 className="text-xl font-display font-bold text-cafe-700 dark:text-white">
                  ¡Orden Completada!
                </h2>
                <p className="text-sm text-cafe-400 mt-1">
                  {lastOrder.orderNumber}
                </p>
              </div>

              <div className="space-y-2 border-t border-b border-cream-200 dark:border-gray-700 py-3 mb-3">
                {lastOrder.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-cafe-600 dark:text-cream-300">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="font-medium text-cafe-700 dark:text-white whitespace-nowrap ml-2">
                      {formatLempiras(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 mb-4">
                <div className="flex justify-between font-bold text-cafe-700 dark:text-white">
                  <span>Total</span>
                  <span className="whitespace-nowrap">{formatLempiras(lastOrder.total)}</span>
                </div>
                {lastOrder.paymentMethod === 'EFECTIVO' && lastOrder.cashReceived && (
                  <>
                    <div className="flex justify-between text-sm text-cafe-400">
                      <span>Efectivo</span>
                      <span className="whitespace-nowrap">{formatLempiras(lastOrder.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Cambio</span>
                      <span className="whitespace-nowrap">{formatLempiras(lastOrder.change)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-xs text-cafe-300">
                  <span>Método</span>
                  <span>{lastOrder.paymentMethod}</span>
                </div>
              </div>

              <button
                onClick={() => setShowReceipt(false)}
                className="btn-primary w-full min-h-[44px] cursor-pointer select-none"
              >
                Aceptar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
