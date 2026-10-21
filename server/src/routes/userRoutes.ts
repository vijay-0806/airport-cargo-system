import { Router } from 'express';
import { getUsers, createUser, resetSeed } from '../controllers/userController.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';

const router = Router();

router.get('/', authenticate, requireRole('ADMIN'), getUsers);
router.post('/', authenticate, requireRole('ADMIN'), createUser);
router.post('/seed/reset', resetSeed); // helper to reset demo database

export default router;
