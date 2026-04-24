import { Module } from "@nestjs/common";
import { IdentityModule } from "./identity/identity.module";
import { EvaluationMotorModule } from "./audit-engine/evaluation-motor.module";
import { CertificationModule } from "./compliance/certification.module";
import { AccessibilityCatalogModule } from "./inventory/inventory.module";

const modules = [
  IdentityModule,
  EvaluationMotorModule,
  CertificationModule,
  AccessibilityCatalogModule,
];

@Module({
  imports: modules,
  exports: modules,
})
export class DomainsModule {}
