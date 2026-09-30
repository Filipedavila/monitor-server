import { Global, Module } from '@nestjs/common';
import { FgaService } from './fga.service';
import { FgaClientProvider } from './fga.provider';
import { BullModule } from '@nestjs/bullmq';
import { Outbox } from '../outbox/outbox.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationWorker } from './queue/authorization.queue';
import { AuthorizationRegistry } from './registry/authorization.registry';
import { QUEUE_NAMES } from '../queues/queues.config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Outbox]),
    BullModule.registerQueue({
      name: QUEUE_NAMES.AUTHORIZATION,
    }),
  ],
  providers: [FgaService, FgaClientProvider, AuthorizationWorker, AuthorizationRegistry],
  exports: [FgaService, FgaClientProvider],
})
export class AuthorizationModule {}
