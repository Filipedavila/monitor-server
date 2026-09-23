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

import { Website } from 'src/domains/inventory/website/website.entity';
import { EvaluationParserService } from './evaluation-parser.service';
import { EvaluationPublishingService } from './evaluation-publish.service';
import { RepositoryTableConfig } from 'src/common/repositories/base-context';
import { EVALUATION_CONTEXT_METADATA_CONFIG } from './evaluation.constants';
import { EvaluationEngine } from './contracts/evaluation-engine.contract';
import { QualWebPuppeteerEngine } from './strategies/engines/evaluation-engine-puppeteer.strategy';
import { EvaluationStorage } from './contracts/evaluation-storage.contract';
import { EvaluationLocalStorageStrategy } from './strategies/storage/evaluation-local-storage.strategy';
import { EvaluationPersister } from './contracts/evaluation-persister.contract';
import { EvaluationDocumentStrategy } from './strategies/reporting/evaluation-document.strategy';
import { EvaluationInitiatorRegistry } from './registries/evaluation-initiator.registry';
import {
  GlobalEvaluationInitiationStrategy,
  TagEvaluationInitiationStrategy,
  DirectoryEvaluationInitiationStrategy,
  PageEvaluationInitiationStrategy,
  WebsiteEvaluationInitiationStrategy,
  InstitutionEvaluationInitiationStrategy,
} from './strategies/initiation';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { PublicPageExtractorProcessor } from './queue/processors/page-public.processor';
import { PrivatePageExtractorProcessor } from './queue/processors/page-private.processor';

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
    BullModule.registerQueue({ name: QUEUE_NAMES.EVAL_PRIVATE_DLQ }),
    BullModule.registerQueue({ name: QUEUE_NAMES.EVAL_PUBLIC }),
    BullModule.registerQueue({ name: QUEUE_NAMES.EVAL_PUBLIC_DLQ }),
    BullModule.registerQueue({ name: QUEUE_NAMES.EVAL_PRIVATE_DLQ }),
    BullModule.registerQueue({ name: QUEUE_NAMES.EVAL_PRIVATE }),
    BullModule.registerQueue({ name: QUEUE_NAMES.PUBLIC_PAGE_DISPATCH }),
    BullModule.registerQueue({ name: QUEUE_NAMES.PRIVATE_PAGE_DISPATCH }),
    TypeOrmModule.forFeature([Website, Page, Evaluation, EvaluationContext]),
    RedisModule,
    AccessibilityStatementModule,
    ClickhouseModule,
  ],
  exports: [EvaluationService],
  providers: [
    {
      provide: EvaluationEngine,
      useClass: QualWebPuppeteerEngine,
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
    EvaluationInitiatorRegistry,
    EvaluationService,
    EvaluationParserService,
    EvaluationRepository,
    EvaluationPrivateWorker,
    EvaluationPublicWorker,
    PublicPageExtractorProcessor,
    PrivatePageExtractorProcessor,
    Logger,
    EvaluationProducer,
    EvaluationConsumer,
    EvaluationTableConfigProvider,
    DirectoryEvaluationInitiationStrategy,
    TagEvaluationInitiationStrategy,
    PageEvaluationInitiationStrategy,
    WebsiteEvaluationInitiationStrategy,
    InstitutionEvaluationInitiationStrategy,
    GlobalEvaluationInitiationStrategy,
  ],
  controllers: [EvaluationController],
})
export class EvaluationModule {}
