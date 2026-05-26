import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Outbox } from './outbox.entity';

export interface PublishEventOptions {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, any>;
}

@Injectable()
export class OutboxService {

  async putInOutbox(manager: EntityManager, options: PublishEventOptions): Promise<void> {
    const outboxEvent = new Outbox();
    outboxEvent.aggregateType = options.aggregateType;
    outboxEvent.aggregateId = options.aggregateId;
    outboxEvent.eventType = options.eventType;
    outboxEvent.payload = options.payload;

    await manager.save(Outbox, outboxEvent);
    
  }
}