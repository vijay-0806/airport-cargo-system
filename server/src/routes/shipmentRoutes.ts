import { Router } from 'express';
import {
  getShipments,
  getShipmentById,
  updateShipmentStatus,
  getShipmentHistory,
} from '../controllers/shipmentController.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

router.get('/', getShipments);
router.get('/:id', getShipmentById);
router.put('/:id/status', requireRole('ADMIN', 'WAREHOUSE_STAFF'), updateShipmentStatus);
router.get('/:id/history', getShipmentHistory);

export default router;
