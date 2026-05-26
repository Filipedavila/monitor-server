import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Outbox, OutboxStatus } from './outbox.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OutboxRouter } from './outbox.router';

@Injectable()
export class OutboxRelayerService {
  constructor(
    @InjectRepository(Outbox)
    private readonly outboxRepository: Repository<Outbox>,
    private readonly outboxRouter: OutboxRouter,
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutbox() {
    const pendingEvents = await this.outboxRepository.find({
      where: { status: OutboxStatus.PENDING },
      take: 50, 
      order: { createdAt: 'ASC' }
    });

    for (const event of pendingEvents) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const lockEvent = await queryRunner.manager.findOne(Outbox, {
          where: { id: event.id, status: OutboxStatus.PENDING },
          lock: { mode: 'pessimistic_write' }
        });

        if (!lockEvent) {
          await queryRunner.rollbackTransaction();
          continue;
        }

        lockEvent.status = OutboxStatus.PROCESSING;
        await queryRunner.manager.save(Outbox, lockEvent);
        await this.outboxRouter.routeAndDispatch(lockEvent.eventType, lockEvent.id, lockEvent.payload);
        
        await queryRunner.commitTransaction();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await queryRunner.rollbackTransaction();
        await this.outboxRepository.update(event.id, {
          status: OutboxStatus.FAILED,
          errorReason: errorMessage,
          attempts: event.attempts + 1,
        });
      } finally {
        await queryRunner.release();
      }
    }
  }
}