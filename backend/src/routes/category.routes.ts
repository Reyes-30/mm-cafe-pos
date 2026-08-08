import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/', getCategories);
router.post('/', authorize('ADMIN'), createCategory);
router.put('/:id', authorize('ADMIN'), updateCategory);
router.delete('/:id', authorize('ADMIN'), deleteCategory);

export default router;
