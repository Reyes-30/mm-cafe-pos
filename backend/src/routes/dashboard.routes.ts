import { Router } from 'express';
import {
  getDashboardStats,
  getSalesChart,
  getCategorySales,
  getRecentActivity,
  getReportByDateRange,
} from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/sales-chart', getSalesChart);
router.get('/category-sales', getCategorySales);
router.get('/recent-activity', getRecentActivity);
router.get('/report', authorize('ADMIN'), getReportByDateRange);

export default router;
