export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLEADO' | 'COCINA';
  isActive: boolean;
  createdAt: string;
  _count?: { orders: number };
  totalProcessed?: number;
  orders?: Order[];
}

export interface Category {
  id: number;
  name: string;
  _count?: { products: number };
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  category?: { name: string };
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  note: string | null;
  product?: { name: string; imageUrl?: string; category?: { name: string } };
}

export interface Order {
  id: number;
  orderNumber: string;
  total: number;
  paymentMethod: 'EFECTIVO' | 'TARJETA';
  cashReceived: number | null;
  change: number | null;
  note: string | null;
  serviceType: 'PARA_LLEVAR' | 'COMER_AQUI' | null;
  status: 'PENDIENTE' | 'EN_PREPARACION' | 'LISTA' | 'COMPLETADA' | 'ANULADA';
  voidReason: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user?: { name: string; email?: string; id?: number };
}

export interface CartItem {
  product: Product;
  quantity: number;
  note: string;
}

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  weekSales: number;
  weekOrders: number;
  pendingOrders: number;
  topProduct: { name: string; price: number; totalSold: number } | null;
}

export interface SalesChartData {
  date: string;
  total: number;
  orders: number;
}

export interface CategorySalesData {
  name: string;
  value: number;
}

export interface ReportData {
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalSales: number;
  orders: Order[];
  topProducts: { name: string; quantity: number; total: number }[];
}

export interface PaginatedResponse<T> {
  orders: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
