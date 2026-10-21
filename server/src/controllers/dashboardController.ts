import { Request, Response } from 'express';
import { dbStore } from '../services/dbStore.ts';
import { redisCache } from '../config/redis.ts';

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  const cacheKey = 'dashboard:stats';
  const cached = await redisCache.get(cacheKey);

  if (cached.data) {
    res.setHeader('X-Cache-Status', `HIT-${cached.source.toUpperCase()}`);
    res.status(200).json({
      success: true,
      data: cached.data,
      source: cached.source,
    });
    return;
  }

  const stats = dbStore.getDashboardStats();
  await redisCache.set(cacheKey, stats, 60);

  res.setHeader('X-Cache-Status', 'MISS');
  res.status(200).json({
    success: true,
    data: stats,
    source: 'database',
  });
}

export async function getRecentActivity(req: Request, res: Response): Promise<void> {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const activity = dbStore.getRecentActivity(limit);

  res.status(200).json({
    success: true,
    data: activity,
  });
}
