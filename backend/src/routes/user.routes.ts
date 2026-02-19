import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, toggleUserStatus } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/toggle', toggleUserStatus);

export default router;
