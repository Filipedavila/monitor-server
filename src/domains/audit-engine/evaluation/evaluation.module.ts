import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EvaluationService } from "./services/evaluation.service";
import { Evaluation } from "./entities/evaluation.entity";
import { EvaluationController } from "./evaluation.controller";
import { BullModule } from "@nestjs/bullmq";
import { Page } from "src/domains/inventory/page/page.entity";
import { AccessibilityStatementModule } from "src/domains/compliance/accessibility-statement/accessibility-statement.module";
import { EvaluationRepository } from "./evaluation.repository";

import { EvaluationPublicWorker } from "./queue/processors/evaluation-public.processor";
import { EvaluationPrivateWorker } from "./queue/processors/evaluation-private.processor";
import { EvaluationStorageService } from "./evaluation-storage.service";
import { RedisModule } from "src/redis/redis.module";
import { EvaluationProducer } from "./redis/evaluation.producer";
import { EvaluationConsumer } from "./redis/evaluation.consumer";
import { ClickhouseModule } from "src/core/clickhouse/clickhouse.module";
import { EvaluationContext } from "./entities/contexts-evaluation.entity";
import { EvaluatePageHandler } from "./handlers/evaluate-page.handler";
import { IEvaluationEngine } from "./types/evaluation-engine.interface";
import { EvaluationEngineAdapter } from "./adapters/evaluate.adapter";
import { SaveEvaluationHandler } from "./handlers/save-evaluation.handler";
import  { IEvaluationPersistence } from "./types/evaluation-persistence.interface";
import { EvaluationPersistenceAdapter } from "./adapters/evaluation-persistence.adapter";
import { ProcessEvaluationOrchestrator } from "./handlers/evaluation.orchestrator";

@Module({
  imports: [
    BullModule.registerQueue({ name: "evaluation-queue-private" }),
    BullModule.registerQueue({ name: "evaluation-queue-public" }),
    TypeOrmModule.forFeature([Page, Evaluation,EvaluationContext]),
    RedisModule,
    AccessibilityStatementModule,
    ClickhouseModule,

  ],
  exports: [EvaluationService],
  providers: [
      EvaluatePageHandler,

      {
      provide: IEvaluationEngine,
      useClass: EvaluationEngineAdapter,
    },
    SaveEvaluationHandler,
    {
      provide: IEvaluationPersistence,
      useClass: EvaluationPersistenceAdapter,
    },
    EvaluationService, 
    EvaluationRepository,
    EvaluationPrivateWorker,
     EvaluationPublicWorker,
     Logger,
     EvaluationStorageService,
     ProcessEvaluationOrchestrator,
     EvaluationProducer,
     EvaluationConsumer],
  controllers: [EvaluationController],
})
export class EvaluationModule {}
