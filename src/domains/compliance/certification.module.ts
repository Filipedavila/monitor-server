import { Module } from "@nestjs/common";
import { AccessibilityStatementModule } from "./accessibility-statement/accessibility-statement.module";


@Module({
  imports: [
    AccessibilityStatementModule,

  ],
  exports: [
    AccessibilityStatementModule,


  ],
})
export class CertificationModule {}
