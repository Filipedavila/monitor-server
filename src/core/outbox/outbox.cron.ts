import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Outbox, OutboxStatus } from './outbox.entity';

import { OutboxRouter } from './outbox.router';
@Injectable()
export class OutboxRelayerService {
  private readonly logger = new Logger(OutboxRelayerService.name);
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
     await this.processSingleEvent(event);
    }
  }

  private async processSingleEvent(event: Outbox) {
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
        return;
      }

      try {
        lockEvent.status = OutboxStatus.PROCESSING;
        await queryRunner.manager.save(Outbox, lockEvent);

        await this.outboxRouter.routeAndDispatch(lockEvent.eventType, lockEvent.id, lockEvent.payload);
        
        await queryRunner.commitTransaction();
      } 
      catch (dispatchError) {
      this.logger.error(`Error dispatching outbox event ${event.id}: ${dispatchError instanceof Error ? dispatchError.message : String(dispatchError)}`);
        lockEvent.attempts += 1;
        lockEvent.errorReason = dispatchError instanceof Error ? dispatchError.message : String(dispatchError);
        lockEvent.status = lockEvent.attempts > 3 ? OutboxStatus.FAILED : OutboxStatus.PENDING;
        
        await queryRunner.manager.save(Outbox, lockEvent);
        await queryRunner.commitTransaction();
      }

    } catch (dbError) {
      this.logger.error(`Database error processing outbox event ${event.id}: ${dbError instanceof Error ? dbError.message : String(dbError)}`);

      try { await queryRunner.rollbackTransaction(); } catch (_) {
        this.logger.error(`Failed to rollback transaction for outbox event ${event.id}: ${_ instanceof Error ? _.message : String(_)}`);
      }
    } finally {
      await queryRunner.release();
    }
  }
}