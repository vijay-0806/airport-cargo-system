import { Router } from 'express';
import {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getWarehouseCargo,
  assignCargo,
  removeCargo,
} from '../controllers/warehouseController.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

router.get('/', getWarehouses);
router.get('/:id', getWarehouseById);
router.post('/', requireRole('ADMIN'), createWarehouse);
router.put('/:id', requireRole('ADMIN'), updateWarehouse);
router.delete('/:id', requireRole('ADMIN'), deleteWarehouse);
router.get('/:id/cargo', getWarehouseCargo);
router.post('/:id/assign', requireRole('ADMIN', 'WAREHOUSE_STAFF'), assignCargo);
router.post('/:id/remove', requireRole('ADMIN', 'WAREHOUSE_STAFF'), removeCargo);

export default router;
