import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WebsiteService } from "./website.service";
import { Website } from "./website.entity";
import { Tag } from "../tag/tag.entity";
import { Page } from "../page/page.entity";
import { WebsiteController } from "./website.controller";
import { AccessibilityStatementModule } from "src/domains/compliance/accessibility-statement/accessibility-statement.module";
import { CollectionDateModule } from "src/domains/compliance/collection-date/collection-date.module";
import { EvaluationModule } from "src/domains/audit-engine/evaluation/evaluation.module";
import { WebsiteAccess } from "./website-access.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Tag, Website, Page, WebsiteAccess]),
    AccessibilityStatementModule,
    CollectionDateModule,
    EvaluationModule,
  ],
  exports: [
    WebsiteService,
    TypeOrmModule,
    AccessibilityStatementModule,
    CollectionDateModule,
  ],
  providers: [WebsiteService],
  controllers: [WebsiteController],
})
export class WebsiteModule {}
