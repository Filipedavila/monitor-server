import { Module } from "@nestjs/common";
import { DiscoveryModule } from "./discovery/discovery.module";
import { EvaluationModule } from "./evaluation/evaluation.module";

@Module({
  imports: [DiscoveryModule, EvaluationModule],
  exports: [DiscoveryModule, EvaluationModule],
})
export class EvaluationMotorModule {}
