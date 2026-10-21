import { Router } from 'express';
import authRoutes from './authRoutes.ts';
import dashboardRoutes from './dashboardRoutes.ts';
import cargoRoutes from './cargoRoutes.ts';
import shipmentRoutes from './shipmentRoutes.ts';
import warehouseRoutes from './warehouseRoutes.ts';
import trackingRoutes from './trackingRoutes.ts';
import userRoutes from './userRoutes.ts';
import { redisCache } from '../config/redis.ts';
import { isConnectedToMongoDB } from '../config/database.ts';
import { resetSeed } from '../controllers/userController.ts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/cargo', cargoRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/tracking', trackingRoutes);
router.use('/users', userRoutes);
router.post('/seed/reset', resetSeed);

// Health check endpoint required by Render & monitoring
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Airport Cargo & Warehouse Management System',
    database: isConnectedToMongoDB() ? 'MongoDB Connected' : 'Embedded In-Memory Store Active',
    caching: redisCache.isUsingRedis() ? 'Redis Connected' : 'In-Memory Fallback Active',
  });
});

export default router;
