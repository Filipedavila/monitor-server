import { Module } from "@nestjs/common";
import { AccessibilityStatementService } from "./accessibility-statement.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccessibilityStatement } from "./entities/accessibility-statement.entity";
import { AutomaticStatementModule } from "../possibly-trash/automatic-statement/automatic-statement.module";
import { ManualStatementModule } from "../possibly-trash/manual-statement/manual-statement..module";
import { UserEvaluationModule } from "../possibly-trash/user-evaluation/user-evaluation.module";
import { ContactModule } from "../contact/contact.module";
import { AccessibilityStatementController } from "./accessibility-statement.controller";

@Module({
  controllers: [AccessibilityStatementController],
  imports: [
    TypeOrmModule.forFeature([AccessibilityStatement]),
    AutomaticStatementModule,
    ManualStatementModule,
    UserEvaluationModule,
    ContactModule,
  ],
  providers: [AccessibilityStatementService],
  exports: [AccessibilityStatementService],
})
export class AccessibilityStatementModule {}
