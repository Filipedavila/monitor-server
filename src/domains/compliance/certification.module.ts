import { Module } from "@nestjs/common";
import { AccessibilityStatementModule } from "./accessibility-statement/accessibility-statement.module";
import { StampModule } from "./stamp/stamp.module";
import { DeclarationModule } from "src/domains/compliance/declaration/declaration.module";


@Module({
  imports: [
    AccessibilityStatementModule,
    DeclarationModule,
    StampModule,
  ],
  exports: [
    AccessibilityStatementModule,
    DeclarationModule,
    StampModule,
  ],
})
export class CertificationModule {}
