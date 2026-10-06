import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AppCacheService {
  private readonly logger = new Logger(AppCacheService.name);
  // In-flight map to prevent service-level Cache Stampede
  private readonly inFlight = new Map<string, Promise<any>>();

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Executes Cache-Aside with anti-stampede protection and fail-open degradation.
   */
  async wrap<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
    // 1. Defensive cache read (Fail-Open if Redis fails)
    try {
      const cached = await this.cacheManager.get<T>(key);
      if (cached !== undefined && cached !== null) {
        return cached;
      }
    } catch (err) {
      this.logger.warn(
        `Falha na leitura do cache para a chave "${key}": ${(err as Error).message}. Prosseguindo para a factory.`,
      );
    }

    // 2. Anti-Stampede: If a calculation is already in progress for this key, join the Promise
    const activeFlight = this.inFlight.get(key);
    if (activeFlight) {
      return activeFlight as Promise<T>;
    }

    // 3. Leader execution with Request Coalescing
    const executionPromise = (async () => {
      try {
        const freshData = await factory();

        if (freshData !== undefined && freshData !== null) {
          try {
            await this.cacheManager.set(key, freshData, ttlMs);
          } catch (writeErr) {
            this.logger.error(
              `Failed to write cache for key "${key}": ${(writeErr as Error).message}`,
            );
          }
        }

        return freshData;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, executionPromise);
    return executionPromise;
  }

  /**
   * Remove a specific cache key.
   */
  async evict(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (err) {
      this.logger.error(`Failed to evict cache for key "${key}": ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Invalidate multiple cache keys at once.
   */
  async evictMany(keys: string[]): Promise<void> {
    if (!keys.length) return;
    await Promise.all(keys.map((k) => this.evict(k)));
  }
}
