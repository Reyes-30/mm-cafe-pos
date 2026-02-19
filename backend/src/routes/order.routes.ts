import { Router } from 'express';
import { createOrder, getOrders, getOrderById, voidOrder, completeOrder, getPendingOrders } from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createOrder);
router.get('/pending', getPendingOrders);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.patch('/:id/complete', completeOrder);
router.patch('/:id/void', authorize('ADMIN'), voidOrder);

export default router;
