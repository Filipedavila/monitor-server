import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EvaluationService } from "./services/evaluation.service";
import { Evaluation } from "./entities/evaluation.entity";
import { EvaluationController } from "./controllers/evaluation.controller";
import { BullModule } from "@nestjs/bullmq";
import { Page } from "src/domains/inventory/page/page.entity";
import { AccessibilityStatementModule } from "src/domains/compliance/accessibility-statement/accessibility-statement.module";
import { EvaluationRepository } from "./repositories/evaluation.repository";

import { EvaluationPublicWorker } from "./queue/processors/evaluation-public.processor";
import { EvaluationPrivateWorker } from "./queue/processors/evaluation-private.processor";
import { EvaluationStorageService } from "./evaluation-storage.service";
import { RedisModule } from "src/redis/redis.module";
import { EvaluationProducer } from "./evaluation.producer";
import { EvaluationConsumer } from "./evaluation.consumer";
import { ClickhouseModule } from "src/core/clickhouse/clickhouse.module";

@Module({
  imports: [
    BullModule.registerQueue({ name: "evaluation-queue-private" }),
    BullModule.registerQueue({ name: "evaluation-queue-public" }),
    TypeOrmModule.forFeature([Page, Evaluation]),
    RedisModule,
    AccessibilityStatementModule,
    ClickhouseModule,

  ],
  exports: [EvaluationService],
  providers: [EvaluationService, 
    EvaluationRepository,
    EvaluationPrivateWorker,
     EvaluationPublicWorker,
     Logger,
     EvaluationStorageService,
     EvaluationProducer,
     EvaluationConsumer],
  controllers: [EvaluationController],
})
export class EvaluationModule {}
