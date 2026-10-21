import { Router } from 'express';
import { getDashboardStats, getRecentActivity } from '../controllers/dashboardController.ts';
import { authenticate } from '../middleware/auth.ts';

const router = Router();

router.get('/stats', authenticate, getDashboardStats);
router.get('/recent-activity', authenticate, getRecentActivity);

export default router;
