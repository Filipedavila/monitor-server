import { Module } from "@nestjs/common";
import { AccessibilityStatementService } from "./accessibility-statement.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccessibilityStatement } from "./entities/accessibility-statement.entity";
import { AccessibilityStatementController } from "./accessibility-statement.controller";
import { AccessibilityStatementRepository } from "./accessibility-statement.repository";

@Module({
  controllers: [AccessibilityStatementController],
  imports: [
    TypeOrmModule.forFeature([AccessibilityStatement]),
  ],
  providers: [AccessibilityStatementService, AccessibilityStatementRepository],
  exports: [AccessibilityStatementService],
})
export class AccessibilityStatementModule {}
