import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
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

// Serve logo and menu images — works from both dev (cwd=backend) and prod (cwd=backend)
const imagesDir = path.join(process.cwd(), '..', 'images');
const imagesDirAlt = path.join(process.cwd(), 'images'); // fallback if images is copied
app.use('/assets/images', express.static(fs.existsSync(imagesDir) ? imagesDir : imagesDirAlt));

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

// --- Serve frontend in production ---
const frontendDist = path.join(process.cwd(), '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // All non-API routes → index.html (SPA fallback)
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  console.log('📦 Serving frontend from:', frontendDist);
}

// Start server
const HOST = '0.0.0.0'; // Listen on all interfaces for LAN access
app.listen(config.port, HOST, () => {
  console.log(`🚀 M&M Café running on http://localhost:${config.port}`);
  console.log(`📁 Environment: ${config.nodeEnv}`);
  // Show LAN IP
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`🌐 LAN: http://${iface.address}:${config.port}`);
      }
    }
  }
});

export default app;
