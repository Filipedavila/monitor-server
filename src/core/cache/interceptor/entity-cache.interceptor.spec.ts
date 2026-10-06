import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { of, lastValueFrom } from 'rxjs';
import { EntityCacheInterceptor } from './entity-cache.interceptor';
import * as crypto from 'crypto';

describe('EntityCacheInterceptor', () => {
  let interceptor: EntityCacheInterceptor;
  let reflector: Reflector;
  let cacheManager: Cache;

  beforeEach(() => {
    reflector = { get: jest.fn() } as unknown as Reflector;
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as Cache;

    interceptor = new EntityCacheInterceptor(reflector, cacheManager);
  });

  it('deve passar direto (bypass) se não houver metadados de cache', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET' }),
      }),
      getHandler: () => {},
    } as unknown as ExecutionContext;

    const next = { handle: () => of('dados-frescos') } as CallHandler;

    const result$ = await interceptor.intercept(context, next);
    const value = await lastValueFrom(result$);

    expect(value).toBe('dados-frescos');
    expect(cacheManager.get).not.toHaveBeenCalled();
  });

  it('deve retornar do cache (Cache Hit) se a chave existir para parâmetro do path', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue({
      key: 'user',
      source: 'path',
      param: 'id',
      ttl: 30000,
    });

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          params: { id: '123' },
        }),
      }),
      getHandler: () => {},
    } as unknown as ExecutionContext;

    // Simula que os dados já estão no Redis
    const cachedUser = { id: '123', name: 'Filipe' };
    jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedUser);

    const next = { handle: () => of('dados-frescos') } as CallHandler;

    const result$ = await interceptor.intercept(context, next);
    const value = await lastValueFrom(result$);

    expect(value).toEqual(cachedUser);
    expect(cacheManager.get).toHaveBeenCalledWith('cache:user:123');
    expect(cacheManager.set).not.toHaveBeenCalled(); // Não deve gravar novamente
  });

  it('deve fazer hash SHA-256 canónico determinístico para objetos complexos', async () => {
    const complexFilter = { role: 'admin', active: true };

    // Ordenação canónica das chaves ('active' antes de 'role'):
    const canonicalString = '{"active":true,"role":"admin"}';
    const expectedHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

    jest.spyOn(reflector, 'get').mockReturnValue({
      key: 'search',
      source: 'query',
      param: '*',
      ttl: 30000,
    });

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          query: complexFilter,
        }),
      }),
      getHandler: () => {},
    } as unknown as ExecutionContext;

    jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined); // Cache Miss
    const next = { handle: () => of([{ id: 1 }]) } as CallHandler;

    const result$ = await interceptor.intercept(context, next);
    await lastValueFrom(result$);

    expect(cacheManager.get).toHaveBeenCalledWith(`cache:search:${expectedHash}`);
    expect(cacheManager.set).toHaveBeenCalledWith(
      `cache:search:${expectedHash}`,
      [{ id: 1 }],
      30000,
    );
  });
});
