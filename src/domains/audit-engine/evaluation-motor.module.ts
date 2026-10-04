import { Module } from "@nestjs/common";
import { DiscoveryModule } from "./discovery/discovery.module";
import { EvaluationModule } from "./evaluation/evaluation.module";
import { ManualEvaluationModule } from "./manual-evaluation/manual-evaluation.module";

@Module({
  imports: [DiscoveryModule, EvaluationModule, ManualEvaluationModule],
  exports: [DiscoveryModule, EvaluationModule, ManualEvaluationModule],
})
export class EvaluationMotorModule {}
