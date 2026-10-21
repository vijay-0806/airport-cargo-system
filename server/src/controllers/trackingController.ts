import { Request, Response } from 'express';
import { dbStore } from '../services/dbStore.ts';
import { redisCache } from '../config/redis.ts';
import { ENV } from '../config/env.ts';

export async function getTrackingByCode(req: Request, res: Response): Promise<void> {
  const { cargoCode } = req.params;

  if (!cargoCode || cargoCode.trim() === '') {
    res.status(400).json({ success: false, error: 'Valid Cargo ID is required (e.g. CG-10025).' });
    return;
  }

  const normalizedCode = cargoCode.trim().toUpperCase();
  const cacheKey = `tracking:${normalizedCode}`;

  // 1. Check Redis / Memory cache
  try {
    const cached = await redisCache.get<any>(cacheKey);
    if (cached.data) {
      res.setHeader('X-Cache-Status', `HIT-${cached.source.toUpperCase()}`);
      res.status(200).json({
        success: true,
        data: cached.data,
        cached: true,
        cacheSource: cached.source,
      });
      return;
    }
  } catch (err: any) {
    console.warn(`[Tracking Cache] Read error for ${normalizedCode}, falling back directly to DB:`, err.message);
  }

  // 2. Fetch from DB
  const trackingInfo = dbStore.getTrackingInfo(normalizedCode);

  if (!trackingInfo) {
    res.status(404).json({
      success: false,
      error: `No cargo tracking records found for Cargo ID '${normalizedCode}'. Please verify the shipment number.`,
    });
    return;
  }

  // 3. Cache the response with configurable TTL
  try {
    await redisCache.set(cacheKey, trackingInfo, ENV.REDIS_TTL_SECONDS);
  } catch (err: any) {
    console.warn(`[Tracking Cache] Write error for ${normalizedCode}:`, err.message);
  }

  res.setHeader('X-Cache-Status', 'MISS');
  res.status(200).json({
    success: true,
    data: trackingInfo,
    cached: false,
    cacheSource: 'database',
  });
}
