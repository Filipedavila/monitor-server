import { Logger, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationService } from './evaluation.service';
import { Evaluation } from './entities/evaluation.entity';
import { EvaluationController } from './evaluation.controller';
import { BullModule } from '@nestjs/bullmq';
import { Page } from 'src/domains/inventory/page/page.entity';
import { AccessibilityStatementModule } from 'src/domains/compliance/accessibility-statement/accessibility-statement.module';
import { EvaluationRepository } from './evaluation.repository';

import { EvaluationPublicWorker } from './queue/processors/evaluation-public.processor';
import { EvaluationPrivateWorker } from './queue/processors/evaluation-private.processor';
import { RedisModule } from 'src/redis/redis.module';
import { EvaluationProducer } from './redis/evaluation.producer';
import { EvaluationConsumer } from './redis/evaluation.consumer';
import { ClickhouseModule } from 'src/core/clickhouse/clickhouse.module';
import { EvaluationContext } from './entities/contexts-evaluation.entity';
import { EvaluationEngine } from './types/evaluation-engine.interface';
import { EvaluationStorage } from './types/evaluation-storage.interface';
import { EvaluationLocalStorageStrategy } from './strategies/evaluation-local-storage.strategy';
import { QualWebPuppeteerEngine } from './strategies/evaluation-engine-puppeteer.strategy';
import { EvaluationPersister } from './types/evaluation-persister.interface';
import { EvaluationDocumentStrategy } from './strategies/evaluation-document.strategy';
import { Website } from 'src/domains/inventory/website/website.entity';
import { EvaluationParserService } from './evaluation-parser.service';
import { QualWebPlaywrightEngine } from './strategies/evaluation-engine-playwright.strategy';
import { EvaluationPublishingService } from './evaluation-publish.service';
import { RepositoryTableConfig } from 'src/common/repositories/base-context';
import { EVALUATION_CONTEXT_METADATA_CONFIG } from './evaluation.constatnts';

export const EvaluationTableConfigProvider: Provider = {
  provide: EVALUATION_CONTEXT_METADATA_CONFIG,
  useFactory: (): RepositoryTableConfig => ({
    mainTable: {
      table: 'evaluations',
      alias: 'evaluation',
      pk: 'id',
      fk: 'evaluation_id',
    },
    contextTable: {
      table: 'evaluation_contexts',
      alias: 'evaluation_context',
      pk: 'id',
      fk: 'evaluation_id',
    },
    hasHelperTable: false,
  }),
};

@Module({
  imports: [
    BullModule.registerQueue({ name: 'evaluation-queue-private' }),
    BullModule.registerQueue({ name: 'evaluation-queue-public' }),
    BullModule.registerQueue({ name: 'evaluation-queue-public-dql' }),
    BullModule.registerQueue({ name: 'evaluation-queue-private-dlq' }),
    TypeOrmModule.forFeature([Website, Page, Evaluation, EvaluationContext]),
    RedisModule,
    AccessibilityStatementModule,
    ClickhouseModule,
  ],
  exports: [EvaluationService],
  providers: [
    {
      provide: EvaluationEngine,
      useClass: QualWebPlaywrightEngine,
    },
    {
      provide: EvaluationStorage,
      useClass: EvaluationLocalStorageStrategy,
    },
    {
      provide: EvaluationPersister,
      useClass: EvaluationDocumentStrategy,
    },
    EvaluationPublishingService,
    EvaluationService,
    EvaluationParserService,
    EvaluationRepository,
    EvaluationPrivateWorker,
    EvaluationPublicWorker,
    Logger,
    EvaluationProducer,
    EvaluationConsumer,
    EvaluationTableConfigProvider,
  ],
  controllers: [EvaluationController],
})
export class EvaluationModule {}
