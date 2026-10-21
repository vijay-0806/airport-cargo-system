import Redis from 'ioredis';
import { ENV } from './env.ts';

interface CacheEntry {
  data: string;
  expiresAt: number;
}

class CacheService {
  private client: Redis | null = null;
  private inMemoryCache: Map<string, CacheEntry> = new Map();
  private redisConnected = false;

  constructor() {
    this.init();
  }

  private init() {
    if (ENV.REDIS_URL && ENV.REDIS_URL.trim() !== '') {
      try {
        this.client = new Redis(ENV.REDIS_URL, {
          maxRetriesPerRequest: 1,
          retryStrategy(times) {
            if (times > 3) return null; // stop retrying after 3 attempts
            return Math.min(times * 100, 1000);
          },
          lazyConnect: true,
        });

        this.client.connect().then(() => {
          this.redisConnected = true;
          console.log('[Redis] Connected successfully to remote Redis service.');
        }).catch((err) => {
          this.redisConnected = false;
          console.warn('[Redis] Connection failed, falling back gracefully to in-memory caching:', err.message);
        });

        this.client.on('error', (err) => {
          this.redisConnected = false;
          console.warn('[Redis Error] Caching continuing in in-memory fallback:', err.message);
        });
      } catch (err: any) {
        this.redisConnected = false;
        console.warn('[Redis Init] Failed to initialize client, using in-memory cache:', err.message);
      }
    } else {
      console.log('[Redis] REDIS_URL not set; running with robust in-memory cache fallback.');
    }
  }

  public async get<T>(key: string): Promise<{ data: T | null; source: 'redis' | 'memory' | 'none' }> {
    if (this.redisConnected && this.client) {
      try {
        const val = await this.client.get(key);
        if (val) {
          return { data: JSON.parse(val) as T, source: 'redis' };
        }
      } catch (e: any) {
        console.warn(`[Redis Get] Error retrieving key ${key}, checking in-memory fallback:`, e.message);
      }
    }

    // In-memory fallback
    const entry = this.inMemoryCache.get(key);
    if (entry) {
      if (Date.now() > entry.expiresAt) {
        this.inMemoryCache.delete(key);
        return { data: null, source: 'none' };
      }
      return { data: JSON.parse(entry.data) as T, source: 'memory' };
    }

    return { data: null, source: 'none' };
  }

  public async set<T>(key: string, value: T, ttlSeconds: number = ENV.REDIS_TTL_SECONDS): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.redisConnected && this.client) {
      try {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } catch (e: any) {
        console.warn(`[Redis Set] Error setting key ${key}:`, e.message);
      }
    }

    // Always mirror in memory for fallback safety
    this.inMemoryCache.set(key, {
      data: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  public async del(key: string): Promise<void> {
    if (this.redisConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (e: any) {
        console.warn(`[Redis Del] Error deleting key ${key}:`, e.message);
      }
    }
    this.inMemoryCache.delete(key);
  }

  /**
   * Invalidate cargo tracking cache whenever cargo, shipment, or warehouse changes.
   */
  public async invalidateCargo(cargoCode: string): Promise<void> {
    const keys = [
      `tracking:${cargoCode.toUpperCase()}`,
      `shipment:code:${cargoCode.toUpperCase()}`,
      `dashboard:stats`,
      `dashboard:recent-activity`,
    ];
    await Promise.all(keys.map((k) => this.del(k)));
  }

  public isUsingRedis(): boolean {
    return this.redisConnected;
  }
}

export const redisCache = new CacheService();
