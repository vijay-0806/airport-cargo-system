import { Router } from 'express';
import {
  getCargos,
  getCargoById,
  createCargo,
  updateCargo,
  deleteCargo,
} from '../controllers/cargoController.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

router.get('/', getCargos);
router.get('/:id', getCargoById);
router.post('/', requireRole('ADMIN', 'WAREHOUSE_STAFF'), createCargo);
router.put('/:id', requireRole('ADMIN', 'WAREHOUSE_STAFF'), updateCargo);
router.delete('/:id', requireRole('ADMIN'), deleteCargo);

export default router;
