import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppsEvaluationService } from "./apps-evaluation.service";
import { AppsEvaluation } from "./apps-evaluation.entity";
import { AppsEvaluationController } from "./apps-evaluation.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([AppsEvaluation])
  ],
  exports: [AppsEvaluationService],
  providers: [AppsEvaluationService],
  controllers: [AppsEvaluationController],
})
export class AppsEvaluationModule {}
