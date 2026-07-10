import { Module } from "@nestjs/common";
import { IdentityModule } from "./identity/identity.module";
import { EvaluationMotorModule } from "./audit-engine/evaluation-motor.module";
import { CertificationModule } from "./compliance/certification.module";
import { AccessibilityCatalogModule } from "./inventory/inventory.module";
import { AllocationModule } from "./allocations/allocation.module";

const modules = [
  IdentityModule,
  EvaluationMotorModule,
  CertificationModule,
  AccessibilityCatalogModule,
  AllocationModule,
];

@Module({
  imports: modules,
  exports: modules,
})
export class DomainsModule {}
