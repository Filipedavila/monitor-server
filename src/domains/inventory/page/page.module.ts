import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PageService } from "./page.service";
import { Page } from "./page.entity";
import { PageController } from "./page.controller";
import { AuthModule } from "../../../core/authentication/auth.module";
import { EvaluationModule } from "src/domains/audit-engine/evaluation/evaluation.module";
import { Website } from "../website/website.entity";
import { Evaluation } from "src/domains/audit-engine/evaluation/entities/evaluation.entity";
import { AccessibilityStatementModule } from "src/domains/compliance/accessibility-statement/accessibility-statement.module";
import { PageRepository } from "./page.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([Website, Page, Evaluation]),
    AuthModule,
    EvaluationModule,
    AccessibilityStatementModule,
  ],
  exports: [PageService],
  providers: [PageService,PageRepository],

  controllers: [PageController],
})
export class PageModule {}
