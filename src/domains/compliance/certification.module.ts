import { Module } from "@nestjs/common";
import { AutomaticStatementModule } from "./possibly-trash/automatic-statement/automatic-statement.module";
import { CollectionDateModule } from "./collection-date/collection-date.module";
import { ContactModule } from "./contact/contact.module";
import { ManualStatementModule } from "./possibly-trash/manual-statement/manual-statement..module";
import { UserEvaluationModule } from "./possibly-trash/user-evaluation/user-evaluation.module";
import { AccessibilityStatementModule } from "./accessibility-statement/accessibility-statement.module";
import { StampModule } from "./stamp-generator/stamp.module";

@Module({
  imports: [
    AccessibilityStatementModule,
    AutomaticStatementModule,
    CollectionDateModule,
    ContactModule,
    ManualStatementModule,
    UserEvaluationModule,
    StampModule,
  ],
  exports: [
    AccessibilityStatementModule,
    AutomaticStatementModule,
    CollectionDateModule,
    ContactModule,
    ManualStatementModule,
    UserEvaluationModule,
    StampModule,
  ],
})
export class CertificationModule {}
