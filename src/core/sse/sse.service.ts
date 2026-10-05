import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import Redis from 'ioredis';
import { SSE_REDIS_SUBSCRIBER } from '../../redis/sse-redis.tokens';
import { CHANNELS, SseVisibility } from './sse-publisher.service';

@Injectable()
export class SSEService implements OnModuleInit, OnModuleDestroy {
  private channelSubjects = new Map<string, Subject<MessageEvent>>();

  constructor(
    @Inject(SSE_REDIS_SUBSCRIBER)
    private readonly redisSubscriber: Redis,
  ) {}

  onModuleInit() {
    this.redisSubscriber.on('message', (incomingChannel: string, message: string) => {
      const subject = this.channelSubjects.get(incomingChannel);
      if (subject) {
        try {
          const parsedData = JSON.parse(message);
          subject.next({ data: parsedData } as MessageEvent);
        } catch (e) {
          subject.next({ data: message } as MessageEvent);
        }
      }
    });
  }

  getUserStream(userId: number, visibilities: SseVisibility[]): Observable<MessageEvent> {
    const channels = visibilities.map((vis) => {
      if (vis === 'PRIVATE') {
        return CHANNELS.PRIVATE(userId);
      }
      return CHANNELS[vis]();
    });

    const clientSubject = new Subject<MessageEvent>();

    channels.forEach((channel) => {
      if (!this.channelSubjects.has(channel)) {
        this.channelSubjects.set(channel, new Subject<MessageEvent>());
      }
      const channelSub = this.channelSubjects.get(channel)!.subscribe((event) => {
        clientSubject.next(event);
      });

      (clientSubject as any)._internalSubs = (clientSubject as any)._internalSubs || [];
      (clientSubject as any)._internalSubs.push(channelSub);
    });

    this.redisSubscriber.subscribe(...channels).catch((err) => {
      clientSubject.error(err);
    });

    return clientSubject.asObservable().pipe(
      finalize(async () => {
        if ((clientSubject as any)._internalSubs) {
          (clientSubject as any)._internalSubs.forEach((sub: any) => sub.unsubscribe());
        }

        await this.redisSubscriber.unsubscribe(...channels).catch(() => {});
      }),
    );
  }

  async onModuleDestroy() {
    await this.redisSubscriber.quit();
  }
}
