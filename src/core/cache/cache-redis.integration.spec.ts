import { Test, TestingModule } from '@nestjs/testing';
import {
  Controller,
  Get,
  Post,
  Param,
  Put,
  Body,
  Module,
  Injectable,
  Inject,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { createKeyv } from '@keyv/redis';
import request from 'supertest';
import { CacheableBy } from './decorator/cache-resource.decorator';

// --- ROBUST TEST SERVICE ---
@Injectable()
class TestUsersService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  public dbCallCount = 0;

  async findOne(id: string) {
    this.dbCallCount++;
    if (id === 'not-found') {
      throw new NotFoundException('Utilizador inexistente');
    }
    return { id, name: `User ${id}` };
  }

  async searchUsers(filters: { role: string; orgId: string }) {
    this.dbCallCount++;
    return [{ id: '1', role: filters.role, orgId: filters.orgId }];
  }

  async update(id: string, name: string) {
    const cacheKey = `cache:user:${id}`;
    await this.cacheManager.del(cacheKey);
    return { id, name };
  }
}

// --- CONTROLLER WITH MULTIPLE CACHE STRATEGIES ---
@Controller('test-users')
class TestUsersController {
  constructor(private readonly usersService: TestUsersService) {}

  // 1. Extraction via Path with TTL of 10s
  @Get(':id')
  @CacheableBy({ key: 'user', source: 'path', param: 'id', ttl: 10000 })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // 2. Extraction via Path with very short TTL (1s) to validate physical expiration in Redis
  @Get('ephemeral/:id')
  @CacheableBy({ key: 'ephemeral', source: 'path', param: 'id', ttl: 1000 })
  async findEphemeral(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
  // 3. Extraction via Body with nested object (SHA-256 hash)
  // Note: the interceptor should allow GET with body or POST for queries
  @Post('search')
  @CacheableBy({ key: 'search', source: 'body', param: 'filter', ttl: 10000 })
  async search(@Body() body: { filter: { role: string; orgId: string } }) {
    return this.usersService.searchUsers(body.filter);
  }
  // 4. Endpoint with a required parameter missing (Bypass Edge Case)
  @Get('missing-param/test')
  @CacheableBy({ key: 'missing', source: 'path', param: 'nonExistentParam', ttl: 10000 })
  async findWithMissingParam() {
    return this.usersService.findOne('missing-key');
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body('name') name: string) {
    return this.usersService.update(id, name);
  }
}

describe('Cache Architecture Integration with Testcontainers (Redis)', () => {
  let redisContainer: StartedTestContainer;
  let app: INestApplication;
  let userService: TestUsersService;
  let cacheManager: Cache;

  beforeAll(async () => {
    redisContainer = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();

    const host = redisContainer.getHost();
    const port = redisContainer.getMappedPort(6379);
    const redisUrl = `redis://${host}:${port}/1`;

    @Module({
      imports: [
        CacheModule.registerAsync({
          isGlobal: true,
          useFactory: async () => ({
            stores: [createKeyv(redisUrl)],
          }),
        }),
      ],
      controllers: [TestUsersController],
      providers: [TestUsersService],
    })
    class TestAppModule {}

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userService = moduleFixture.get<TestUsersService>(TestUsersService);
    cacheManager = app.get<Cache>(CACHE_MANAGER);
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
    if (redisContainer) await redisContainer.stop();
  });

  beforeEach(async () => {
    userService.dbCallCount = 0;
    await cacheManager.clear();
  });

  describe('Base Flow and Invalidation', () => {
    it('should interact with the real Redis: Cache Miss on the 1st call and Cache Hit on the 2nd', async () => {
      const userId = '101';

      const res1 = await request(app.getHttpServer()).get(`/test-users/${userId}`).expect(200);
      expect(res1.body).toEqual({ id: userId, name: `User ${userId}` });
      expect(userService.dbCallCount).toBe(1);

      const res2 = await request(app.getHttpServer()).get(`/test-users/${userId}`).expect(200);
      expect(res2.body).toEqual({ id: userId, name: `User ${userId}` });
      expect(userService.dbCallCount).toBe(1);
    });

    it('should invalidate the key in the real Redis after a mutation (Update)', async () => {
      const userId = '202';

      await request(app.getHttpServer()).get(`/test-users/${userId}`).expect(200);
      expect(userService.dbCallCount).toBe(1);

      await request(app.getHttpServer()).get(`/test-users/${userId}`).expect(200);
      expect(userService.dbCallCount).toBe(1);

      await request(app.getHttpServer())
        .put(`/test-users/${userId}`)
        .send({ name: 'Atualizado' })
        .expect(200);

      const resAfterUpdate = await request(app.getHttpServer())
        .get(`/test-users/${userId}`)
        .expect(200);

      expect(resAfterUpdate.body).toEqual({ id: userId, name: `User ${userId}` });
      expect(userService.dbCallCount).toBe(2);
    });
  });

  describe('Domain and Infrastructure Edge Cases', () => {
    it('should completely isolate keys of distinct resources/IDs (No Key Leaks)', async () => {
      // 1. Populate cache for User A
      await request(app.getHttpServer()).get('/test-users/user-alpha').expect(200);
      expect(userService.dbCallCount).toBe(1);

      // 2. Calling User B should necessarily be a Cache Miss
      const resB = await request(app.getHttpServer()).get('/test-users/user-beta').expect(200);
      expect(resB.body).toEqual({ id: 'user-beta', name: 'User user-beta' });
      expect(userService.dbCallCount).toBe(2);

      // 3. Calling User A again should maintain the Cache Hit
      await request(app.getHttpServer()).get('/test-users/user-alpha').expect(200);
      expect(userService.dbCallCount).toBe(2);
    });

    it('should respect TTL expiration in the real Redis', async () => {
      const ephemeralId = 'temp-555';

      // 1st call: Cache Miss (TTL configured for 1000ms / 1s)
      await request(app.getHttpServer()).get(`/test-users/ephemeral/${ephemeralId}`).expect(200);
      expect(userService.dbCallCount).toBe(1);

      // Immediate call: Cache Hit
      await request(app.getHttpServer()).get(`/test-users/ephemeral/${ephemeralId}`).expect(200);
      expect(userService.dbCallCount).toBe(1);

      // Wait 1.2s to ensure the real expiration of the key in Redis
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // 2nd call after TTL: Should force a new Cache Miss
      await request(app.getHttpServer()).get(`/test-users/ephemeral/${ephemeralId}`).expect(200);
      expect(userService.dbCallCount).toBe(2);
    });

    it('should NEVER cache responses when the service throws an exception (No Negative Caching)', async () => {
      // 1st call throws 404
      await request(app.getHttpServer()).get('/test-users/not-found').expect(404);
      expect(userService.dbCallCount).toBe(1);

      // 2nd call to the same route with an error should hit the service again (cannot store error in Redis)
      await request(app.getHttpServer()).get('/test-users/not-found').expect(404);
      expect(userService.dbCallCount).toBe(2);
    });

    it('should bypass the cache if the parameter configured in the decorator does not exist in the request', async () => {
      // Endpoint is configured to look for a non-existent parameter in the route
      await request(app.getHttpServer()).get('/test-users/missing-param/test').expect(200);
      expect(userService.dbCallCount).toBe(1);

      // Second call should bypass the cache as the required parameter is missing
      await request(app.getHttpServer()).get('/test-users/missing-param/test').expect(200);
      expect(userService.dbCallCount).toBe(2);
    });
  });
});
