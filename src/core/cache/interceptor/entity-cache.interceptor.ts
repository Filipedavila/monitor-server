import { ExecutionContext, Injectable, Inject, CallHandler, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_OPTIONS_KEY, CacheRuleOptions } from '../decorator/cache-resource.decorator';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Observable, of, lastValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class EntityCacheInterceptor implements NestInterceptor {
  // Shared table of in-flight Promises by cacheKey
  private static readonly inFlightRequests = new Map<string, Promise<any>>();

  constructor(
    private readonly reflector: Reflector,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const options = this.reflector.get<CacheRuleOptions>(CACHE_OPTIONS_KEY, context.getHandler());

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    // Only GET requests can be cached
    if (request.method !== 'GET') {
      return next.handle();
    }

    let identifier = '';

    if (options.source && options.param) {
      let rawValue: any;

      if (options.source === 'path') {
        rawValue = request.params?.[options.param];
      } else if (options.source === 'body') {
        rawValue = options.param === '*' ? request.body : request.body?.[options.param];
      } else if (options.source === 'query') {
        rawValue = options.param === '*' ? request.query : request.query?.[options.param];
      }

      if (rawValue === undefined || rawValue === null) {
        return next.handle();
      }

      identifier =
        typeof rawValue === 'object'
          ? crypto.createHash('sha256').update(this.canonicalStringify(rawValue)).digest('hex')
          : String(rawValue);
    }

    const cacheKey = identifier ? `cache:${options.key}:${identifier}` : `cache:${options.key}`;
    const ttlMs = options.ttl ?? 30000;

    //Check cache first
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData !== undefined && cachedData !== null) {
      return of(cachedData);
    }

    // check if there is an in-flight request for get and write in cache
    // if there is an in-flight request, wait for it instead of executing the handler again
    const inFlight = EntityCacheInterceptor.inFlightRequests.get(cacheKey);
    if (inFlight) {
      const coalescedData = await inFlight;
      return of(coalescedData);
    }

    // First request executes the handler and notifies the rest
    const leaderPromise = (async () => {
      try {
        const response = await lastValueFrom(next.handle());
        if (response !== undefined && response !== null) {
          await this.cacheManager.set(cacheKey, response, ttlMs);
        }
        return response;
      } finally {
        // Remove the in-flight request from the map
        EntityCacheInterceptor.inFlightRequests.delete(cacheKey);
      }
    })();

    EntityCacheInterceptor.inFlightRequests.set(cacheKey, leaderPromise);

    const freshResult = await leaderPromise;
    return of(freshResult);
  }

  // Canonical JSON stringify for consistent hashing of complex objects
  private canonicalStringify(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return `[${obj.map((item) => this.canonicalStringify(item)).join(',')}]`;
    }
    const sortedKeys = Object.keys(obj).sort();
    const result = sortedKeys.map((k) => `${JSON.stringify(k)}:${this.canonicalStringify(obj[k])}`);
    return `{${result.join(',')}}`;
  }
}
