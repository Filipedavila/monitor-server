import { Test, TestingModule } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { createKeyv } from '@keyv/redis';
import { AppCacheService } from './cache.service';
describe('AppCacheService Integration (Testcontainers + Redis)', () => {
  let redisContainer: StartedTestContainer;
  let cacheService: AppCacheService;
  let cacheManager: Cache;

  beforeAll(async () => {
    redisContainer = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();

    const host = redisContainer.getHost();
    const port = redisContainer.getMappedPort(6379);
    const redisUrl = `redis://${host}:${port}/3`;

    @Module({
      imports: [
        CacheModule.registerAsync({
          isGlobal: true,
          useFactory: async () => ({
            stores: [createKeyv(redisUrl)],
          }),
        }),
      ],
      providers: [AppCacheService],
    })
    class CacheIntegrationTestModule {}

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CacheIntegrationTestModule],
    }).compile();

    cacheService = moduleFixture.get<AppCacheService>(AppCacheService);
    cacheManager = moduleFixture.get<Cache>(CACHE_MANAGER);
  }, 60000);

  afterAll(async () => {
    if (redisContainer) await redisContainer.stop();
  });

  beforeEach(async () => {
    await cacheManager.clear();
  });

  describe('Ciclo Base (Cache-Aside & Invalidação)', () => {
    it('deve executar a factory no Miss e servir do Redis no Hit', async () => {
      let factoryExecutions = 0;
      const key = 'user:metric:100';
      const factory = async () => {
        factoryExecutions++;
        return { score: 98.5, updated: 'now' };
      };

      // 1ª Chamada: Miss -> executa factory
      const res1 = await cacheService.wrap(key, 10000, factory);
      expect(res1).toEqual({ score: 98.5, updated: 'now' });
      expect(factoryExecutions).toBe(1);

      // 2ª Chamada: Hit -> devolve do Redis, factory não é chamada
      const res2 = await cacheService.wrap(key, 10000, factory);
      expect(res2).toEqual({ score: 98.5, updated: 'now' });
      expect(factoryExecutions).toBe(1);
    });

    it('deve invalidar a chave atomicamente via evict()', async () => {
      let executions = 0;
      const key = 'catalog:item:200';
      const factory = async () => ++executions;

      await cacheService.wrap(key, 10000, factory);
      expect(executions).toBe(1);

      // Invalidação
      await cacheService.evict(key);

      // Nova chamada deve forçar Cache Miss
      await cacheService.wrap(key, 10000, factory);
      expect(executions).toBe(2);
    });

    it('deve suportar invalidação em lote via evictMany()', async () => {
      let execA = 0;
      let execB = 0;
      const keyA = 'batch:a';
      const keyB = 'batch:b';

      await cacheService.wrap(keyA, 10000, async () => ++execA);
      await cacheService.wrap(keyB, 10000, async () => ++execB);

      expect(execA).toBe(1);
      expect(execB).toBe(1);

      await cacheService.evictMany([keyA, keyB]);

      await cacheService.wrap(keyA, 10000, async () => ++execA);
      await cacheService.wrap(keyB, 10000, async () => ++execB);

      expect(execA).toBe(2);
      expect(execB).toBe(2);
    });
  });

  describe('Concorrência e TTL', () => {
    it('deve conter Cache Stampede no Service: 50 chamadas paralelas disparam apenas 1 factory', async () => {
      let factoryCalls = 0;
      const key = 'expensive:calculation:777';

      // Simula operação computacionalmente pesada ou I/O de base de dados
      const slowFactory = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        factoryCalls++;
        return { computedValue: 42 };
      };

      // 50 consumidores concorrentes no mesmo processo a pedir a mesma chave
      const requests = Array.from({ length: 50 }, () => cacheService.wrap(key, 5000, slowFactory));

      const results = await Promise.all(requests);

      // Todos os 50 receberam o resultado correto
      results.forEach((res) => {
        expect(res).toEqual({ computedValue: 42 });
      });

      // A factory foi executada ESTRITAMENTE 1 vez graças ao Single-Flight
      expect(factoryCalls).toBe(1);
    });

    it('deve respeitar a expiração real por TTL', async () => {
      let executions = 0;
      const key = 'short-lived:token';
      const factory = async () => ++executions;

      // TTL de 500ms
      await cacheService.wrap(key, 500, factory);
      expect(executions).toBe(1);

      // Espera 700ms para expiração física no contentor Redis
      await new Promise((resolve) => setTimeout(resolve, 700));

      await cacheService.wrap(key, 500, factory);
      expect(executions).toBe(2);
    });
  });
});
