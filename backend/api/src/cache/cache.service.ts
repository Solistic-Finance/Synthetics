import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    if (typeof this.cacheManager['clear'] === 'function') {
      await this.cacheManager['clear']();
    } else {
      console.warn(
        'Cache manager does not have a clear method, reset operation not supported',
      );
    }
  }

  /**
   * Get cached data or fetch from source function if not in cache
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cachedData = await this.get<T>(key);

    if (cachedData) {
      return cachedData;
    }

    const freshData = await fetchFn();
    await this.set(key, freshData, ttl);
    return freshData;
  }
}
