import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow localhost and any LAN IP
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || /^https?:\/\/192\.168\./.test(origin) || /^https?:\/\/10\./.test(origin) || /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./.test(origin)) {
      return callback(null, true);
    }
    callback(null, true); // Allow all in dev
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Static files - uploads
app.use('/uploads', express.static(path.join(process.cwd(), config.upload.dir)));

// Serve logo and menu images
app.use('/assets/images', express.static(path.join(process.cwd(), '..', 'images')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(config.port, () => {
  console.log(`🚀 M&M Café API running on http://localhost:${config.port}`);
  console.log(`📁 Environment: ${config.nodeEnv}`);
});

export default app;
