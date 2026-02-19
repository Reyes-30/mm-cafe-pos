import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductAvailability,
  deleteProduct,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin only
router.post('/', authorize('ADMIN'), upload.single('image'), createProduct);
router.put('/:id', authorize('ADMIN'), upload.single('image'), updateProduct);
router.patch('/:id/toggle', authorize('ADMIN'), toggleProductAvailability);
router.delete('/:id', authorize('ADMIN'), deleteProduct);

export default router;
