import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WebsiteService } from "./website.service";
import { Website } from "./website.entity";
import { Tag } from "../tag/tag.entity";
import { Page } from "../page/page.entity";
import { WebsiteController } from "./website.controller";
import { AccessibilityStatementModule } from "src/domains/compliance/accessibility-statement/accessibility-statement.module";
import { EvaluationModule } from "src/domains/audit-engine/evaluation/evaluation.module";
import { WebsiteRepository } from "./repositories/website.repository";


@Module({
  imports: [
    TypeOrmModule.forFeature([Tag, Website, Page]),
    AccessibilityStatementModule,
    EvaluationModule,
  ],
  exports: [
    WebsiteService,
    TypeOrmModule,
    AccessibilityStatementModule,
    WebsiteRepository,
  ],
  providers: [WebsiteService,WebsiteRepository],
  controllers: [WebsiteController],
})
export class WebsiteModule {}
