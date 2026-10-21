import { Router } from 'express';
import { getTrackingByCode } from '../controllers/trackingController.ts';

const router = Router();

// Public cargo tracking endpoint
router.get('/:cargoCode', getTrackingByCode);

export default router;
