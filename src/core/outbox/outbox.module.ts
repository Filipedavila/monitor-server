import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Outbox } from './outbox.entity';
import { OutboxRouter } from './outbox.router';
import { OutboxRelayerService,  } from './outbox.cron';
import { OutboxService } from './outbox.service';

@Global() 
@Module({
  imports: [
    TypeOrmModule.forFeature([Outbox]),
    BullModule.registerQueue(
      { name: 'authorization-queue' },
    ),
  ],
  providers: [
    OutboxService,
    OutboxRouter,
    OutboxRelayerService
  ],
  exports: [
    OutboxService 
  ],
})
export class OutboxModule {}