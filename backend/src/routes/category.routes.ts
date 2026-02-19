import { Router } from 'express';
import { getCategories } from '../controllers/category.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/', getCategories);

export default router;
