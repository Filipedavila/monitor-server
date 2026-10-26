import { Test, TestingModule } from '@nestjs/testing';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';
import { SSEService } from './sse.service';
import { CHANNELS, SsePublisherService } from './sse-publisher.service';
import { SSE_REDIS_PUBLISHER, SSE_REDIS_SUBSCRIBER } from '../../redis/sse-redis.tokens';
import { firstValueFrom, take, timeout, toArray } from 'rxjs';

describe('SseModule Integration (Testcontainers - Robust Scenarios)', () => {
  let container: StartedTestContainer;
  let redisPublisherMock: Redis;
  let redisSubscriberMock: Redis;
  let publisherService: SsePublisherService;
  let sseService: SSEService;

  // O serviço faz quit() ao subscriber no onModuleDestroy; um segundo quit() numa ligação
  // já fechada rejeita com "Connection is closed", por isso fechamos sempre de forma segura.
  const safeQuit = async (client: Redis) => {
    if (client.status === 'end') return;
    await client.quit().catch(() => undefined);
  };

  // Em vez de dormir um tempo fixo, espera até o Redis reportar um subscritor no canal.
  const waitForSubscription = async (channel: string, timeoutMs = 3000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const [, count] = (await redisPublisherMock.pubsub('NUMSUB', channel)) as any;
      if (Number(count) >= 1) return;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error(`Nenhum subscritor Redis no canal ${channel}`);
  };

  beforeAll(async () => {
    container = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();

    const host = container.getHost();
    const port = container.getMappedPort(6379);

    redisPublisherMock = new Redis({ host, port });
    redisSubscriberMock = new Redis({ host, port });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SSEService,
        SsePublisherService,
        {
          provide: SSE_REDIS_PUBLISHER,
          useValue: redisPublisherMock,
        },
        {
          provide: SSE_REDIS_SUBSCRIBER,
          useValue: redisSubscriberMock,
        },
      ],
    }).compile();

    publisherService = module.get<SsePublisherService>(SsePublisherService);
    sseService = module.get<SSEService>(SSEService);

    // Inicializa o ciclo de vida do serviço principal
    await sseService.onModuleInit();
  }, 60000);

  afterAll(async () => {
    await sseService.onModuleDestroy();
    await safeQuit(redisPublisherMock);
    await safeQuit(redisSubscriberMock);
    await container.stop();
  });

  // O evento que o stream emite é { type: <eventType>, data: <payload> }.
  it('should publish and receive messages across private and global channels', async () => {
    const userId = 999;

    const stream$ = sseService.getUserStream(userId, ['GLOBAL', 'PRIVATE']);
    const eventPromise = firstValueFrom(stream$.pipe(timeout(3000)));

    // Aguarda o registo da subscrição privada no Redis
    await waitForSubscription(CHANNELS.PRIVATE(userId));

    await publisherService.notifyUser(userId, 'TEST_EVENT', { foo: 'bar' }, 'PRIVATE');

    const event = await eventPromise;

    expect(event).toBeDefined();
    expect(event.type).toBe('TEST_EVENT');
    expect(event.data).toEqual({ foo: 'bar' });
  });

  it('should receive messages broadcasted to the GLOBAL channel', async () => {
    const userId = 111;

    // O canal GLOBAL é subscrito no onModuleInit, não é preciso esperar.
    const stream$ = sseService.getUserStream(userId, ['GLOBAL']);
    const eventPromise = firstValueFrom(stream$.pipe(timeout(3000)));

    await publisherService.notifyUser(
      userId,
      'SYSTEM_ANNOUNCEMENT',
      { maintenance: true },
      'GLOBAL',
    );

    const event = await eventPromise;

    expect(event).toBeDefined();
    expect(event.type).toBe('SYSTEM_ANNOUNCEMENT');
    expect(event.data).toEqual({ maintenance: true });
  });

  it('EDGE CASE: user without AMS visibility should NOT receive AMS messages', async () => {
    const regularUserId = 404;

    const stream$ = sseService.getUserStream(regularUserId, ['GLOBAL', 'PRIVATE']);
    const firstEvent = firstValueFrom(stream$.pipe(timeout(3000)));

    await waitForSubscription(CHANNELS.PRIVATE(regularUserId));

    // O evento AMS é publicado primeiro e um evento de controlo (GLOBAL) a seguir.
    // O Redis mantém a ordem, logo se o AMS vazasse seria ele o primeiro a chegar.
    await publisherService.notifyUser(
      regularUserId,
      'AMS_SECRET_ALERT',
      { restricted: true },
      'AMS',
    );
    await publisherService.notifyUser(regularUserId, 'CONTROL_EVENT', { ok: true }, 'GLOBAL');

    const event = await firstEvent;

    expect(event.type).toBe('CONTROL_EVENT');
  });

  it('CONCURRENCY & ISOLATION: multiple concurrent user streams should not leak data between each other', async () => {
    const userAId = 1001;
    const userBId = 2002;

    const subscriberA = new Redis({
      host: container.getHost(),
      port: container.getMappedPort(6379),
    });
    const subscriberB = new Redis({
      host: container.getHost(),
      port: container.getMappedPort(6379),
    });

    const sseServiceA = new SSEService(subscriberA);
    const sseServiceB = new SSEService(subscriberB);

    // Inicialização obrigatória do ciclo de vida NestJS nas instâncias manuais
    await sseServiceA.onModuleInit();
    await sseServiceB.onModuleInit();

    try {
      const streamA$ = sseServiceA.getUserStream(userAId, ['GLOBAL', 'PRIVATE']);
      const streamB$ = sseServiceB.getUserStream(userBId, ['GLOBAL', 'PRIVATE']);

      const promiseA = firstValueFrom(streamA$.pipe(take(2), toArray(), timeout(5000)));
      const promiseB = firstValueFrom(streamB$.pipe(take(2), toArray(), timeout(5000)));

      // Garante que as subscrições privadas de ambos os clientes estão ativas no Redis
      await Promise.all([
        waitForSubscription(CHANNELS.PRIVATE(userAId)),
        waitForSubscription(CHANNELS.PRIVATE(userBId)),
      ]);

      await Promise.all([
        publisherService.notifyUser(userAId, 'EVENT_FOR_A', { target: 'A' }, 'PRIVATE'),
        publisherService.notifyUser(userBId, 'EVENT_FOR_B', { target: 'B' }, 'PRIVATE'),
        publisherService.notifyUser(0, 'GLOBAL_ANNOUNCE', { target: 'EVERYONE' }, 'GLOBAL'),
      ]);

      const [eventsA, eventsB] = await Promise.all([promiseA, promiseB]);

      expect(eventsA).toHaveLength(2);
      const aEventTypes = eventsA.map((e: any) => e.type);
      expect(aEventTypes).toContain('EVENT_FOR_A');
      expect(aEventTypes).toContain('GLOBAL_ANNOUNCE');
      expect(aEventTypes).not.toContain('EVENT_FOR_B');

      expect(eventsB).toHaveLength(2);
      const bEventTypes = eventsB.map((e: any) => e.type);
      expect(bEventTypes).toContain('EVENT_FOR_B');
      expect(bEventTypes).toContain('GLOBAL_ANNOUNCE');
      expect(bEventTypes).not.toContain('EVENT_FOR_A');
    } finally {
      // onModuleDestroy já faz quit() ao subscriber; safeQuit evita o segundo quit() a falhar
      await sseServiceA.onModuleDestroy();
      await sseServiceB.onModuleDestroy();
      await safeQuit(subscriberA);
      await safeQuit(subscriberB);
    }
  }, 15000);

  it('should handle multiple sequential events across different subscribed channels', async () => {
    const userId = 777;

    const stream$ = sseService.getUserStream(userId, ['GLOBAL', 'PRIVATE']);

    const eventsPromise = firstValueFrom(stream$.pipe(take(2), toArray(), timeout(5000)));

    await waitForSubscription(CHANNELS.PRIVATE(userId));

    await publisherService.notifyUser(userId, 'EVENT_ONE', { order: 1 }, 'GLOBAL');
    await publisherService.notifyUser(userId, 'EVENT_TWO', { order: 2 }, 'PRIVATE');

    const events = await eventsPromise;

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('EVENT_ONE');
    expect(events[0].data).toEqual({ order: 1 });
    expect(events[1].type).toBe('EVENT_TWO');
    expect(events[1].data).toEqual({ order: 2 });
  }, 15000);

  it('SECURITY EDGE CASE: user A should NOT receive private messages intended for user B', async () => {
    const userAId = 111;
    const userBId = 222;

    const streamUserA$ = sseService.getUserStream(userAId, ['GLOBAL', 'PRIVATE']);
    const firstEvent = firstValueFrom(streamUserA$.pipe(timeout(3000)));

    await waitForSubscription(CHANNELS.PRIVATE(userAId));

    // Mensagem privada do B primeiro, evento de controlo GLOBAL a seguir: se a mensagem
    // do B vazasse para o A, seria o primeiro evento recebido.
    await publisherService.notifyUser(
      userBId,
      'SENSITIVE_DATA',
      { secret: 'credit_card_123' },
      'PRIVATE',
    );
    await publisherService.notifyUser(userAId, 'CONTROL_EVENT', { ok: true }, 'GLOBAL');

    const event = await firstEvent;

    expect(event.type).toBe('CONTROL_EVENT');
    expect(JSON.stringify(event.data)).not.toContain('credit_card_123');
  });
});
