import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  FileText,
  History,
  Users,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  Coffee,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useCartStore } from '../stores/cartStore';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { to: '/pos', label: 'POS', icon: ShoppingCart, roles: ['ADMIN', 'CAJERO'] },
  { to: '/menu', label: 'Menú', icon: UtensilsCrossed, roles: ['ADMIN'] },
  { to: '/reportes', label: 'Reportes', icon: FileText, roles: ['ADMIN'] },
  { to: '/historial', label: 'Historial', icon: History, roles: ['ADMIN', 'CAJERO'] },
  { to: '/usuarios', label: 'Usuarios', icon: Users, roles: ['ADMIN'] },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const cartCount = useCartStore((s) => s.getItemCount());
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClick = () => setUserMenuOpen(false);
    if (userMenuOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [userMenuOpen]);

  const handleLogout = async () => {
    await logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  // Bottom nav: max 5 items for mobile
  const bottomNav = filteredNav.slice(0, 5);

  return (
    <div className="h-screen h-[100dvh] bg-cream-100 dark:bg-gray-900 flex overflow-hidden">
      {/* ============ Sidebar - Desktop (lg+) ============ */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 72 }}
        transition={{ duration: 0.3 }}
        className="hidden lg:flex flex-col bg-cafe-700 dark:bg-gray-800 text-white fixed h-full z-40 shadow-xl"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-cafe-600 dark:border-gray-700">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold-400 flex-shrink-0">
            <img
              src="/assets/images/Logo.jpg"
              alt="Logo"
              className="w-full h-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="font-display font-bold text-sm leading-tight">
                  M&M Café
                </h1>
                <p className="text-[10px] text-cream-300">y Más...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto overscroll-contain">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative cursor-pointer select-none ${
                  isActive
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-cream-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.to === '/pos' && cartCount > 0 && (
                <span className="absolute right-2 top-1 bg-gold-400 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 border-t border-cafe-600 dark:border-gray-700 text-cream-300 hover:text-white transition-colors cursor-pointer select-none"
        >
          <Menu size={20} className="mx-auto" />
        </button>
      </motion.aside>

      {/* ============ Mobile/Tablet Sidebar Overlay ============ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25 }}
            className="lg:hidden fixed left-0 top-0 h-full w-[75vw] max-w-[280px] bg-cafe-700 dark:bg-gray-800 text-white z-50 shadow-xl safe-top overflow-y-auto overscroll-contain touch-pan-y"
          >
            <div className="flex items-center justify-between p-4 border-b border-cafe-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold-400">
                  <img src="/assets/images/Logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-sm">M&M Café</h1>
                  <p className="text-[10px] text-cream-300">y Más...</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
              >
                <X size={24} />
              </button>
            </div>
            <nav className="py-4 space-y-1 px-2">
              {filteredNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer select-none ${
                      isActive
                        ? 'bg-white/20 text-white font-semibold'
                        : 'text-cream-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span className="text-sm">{item.label}</span>
                  {item.to === '/pos' && cartCount > 0 && (
                    <span className="ml-auto bg-gold-400 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Theme toggle in mobile sidebar */}
            <div className="px-4 py-3 border-t border-cafe-600">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 text-cream-300 hover:text-white transition-colors w-full py-2 cursor-pointer select-none"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
                <span className="text-sm">{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
              </button>
            </div>

            {/* Logout in mobile sidebar */}
            <div className="px-4 py-3 border-t border-cafe-600">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 text-red-300 hover:text-red-100 transition-colors w-full py-2 cursor-pointer select-none"
              >
                <LogOut size={20} />
                <span className="text-sm">Cerrar Sesión</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ============ Main Content ============ */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 h-full ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-[72px]'
        }`}
      >
        {/* Top Navbar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-cream-200 dark:border-gray-700 sticky top-0 z-30 safe-top">
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
            {/* Left */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Hamburger for mobile & tablet (hidden on lg+) */}
              <button
                className="lg:hidden text-cafe-700 dark:text-white min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu size={22} />
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <Coffee size={20} className="text-gold-400" />
                <h2 className="font-display font-bold text-cafe-700 dark:text-white text-base lg:text-lg">
                  M&M Café y Más...
                </h2>
              </div>
              <div className="flex sm:hidden items-center gap-2">
                <Coffee size={16} className="text-gold-400" />
                <h2 className="font-display font-bold text-cafe-700 dark:text-white text-sm">
                  M&M Café
                </h2>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Dark mode toggle - hidden on small mobile */}
              <button
                onClick={toggleTheme}
                className="hidden sm:flex p-2 rounded-xl hover:bg-cream-200 dark:hover:bg-gray-700 transition-colors text-cafe-600 dark:text-cream-300 min-h-[44px] min-w-[44px] items-center justify-center cursor-pointer select-none"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-cream-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] cursor-pointer select-none"
                >
                  <div className="w-8 h-8 rounded-full bg-cafe-700 dark:bg-gold-400 flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-cafe-700 dark:text-white">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-cafe-400 dark:text-cream-400">
                      {user?.role === 'ADMIN' ? 'Administrador' : 'Cajero'}
                    </p>
                  </div>
                  <ChevronDown size={16} className="text-cafe-400 hidden sm:block" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-cream-200 dark:border-gray-700 py-2 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-4 py-2 border-b border-cream-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-cafe-700 dark:text-white">
                          {user?.name}
                        </p>
                        <p className="text-xs text-cafe-400">{user?.email}</p>
                      </div>
                      {/* Theme toggle in dropdown for mobile */}
                      <button
                        onClick={toggleTheme}
                        className="sm:hidden w-full flex items-center gap-2 px-4 py-2 text-sm text-cafe-600 dark:text-cream-300 hover:bg-cream-100 dark:hover:bg-gray-700 transition-colors cursor-pointer select-none"
                      >
                        {isDark ? <Sun size={16} /> : <Moon size={16} />}
                        {isDark ? 'Modo Claro' : 'Modo Oscuro'}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer select-none"
                      >
                        <LogOut size={16} />
                        Cerrar Sesión
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-h-0 p-3 sm:p-4 md:p-6 pb-20 md:pb-6 safe-bottom overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* ============ Bottom Navigation Bar - Mobile Only (<md) ============ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-cream-200 dark:border-gray-700 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-[60px] px-1">
          {bottomNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-lg min-h-[44px] min-w-[44px] transition-colors cursor-pointer select-none ${
                  isActive
                    ? 'text-cafe-700 dark:text-gold-400'
                    : 'text-cafe-400 dark:text-gray-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    {item.to === '/pos' && cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 bg-gold-400 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] leading-none ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
