import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CrawlerController } from "./controllers/crawler.controller";
import { CrawlWebsite } from "./entities/crawler-website.entity";
import { CrawlPage } from "./entities/crawler-page.entity";
import { PageModule } from "src/domains/inventory/page/page.module";
import { CrawlWorker } from "./processors/crawler-private.processor";
import { CrawlerCron } from "./crons/crawller.cron";
import { CrawlerService } from "./services/discovery.service";
import { CrawlerWebsiteRepository } from "./repositories/crawler-website.repository";
import { CrawlerPageRepository } from "./repositories/crawler-page.repository";
import { WebsiteService } from "src/domains/inventory/website/website.service";
import { WebsiteModule } from "src/domains/inventory/website/website.module";
import { WebsitesGateway } from "./gateways/crawler.gateway";
import { EvaluationModule } from "../evaluation/evaluation.module";
@Module({
  imports: [
    TypeOrmModule.forFeature([CrawlWebsite, CrawlPage]),
    PageModule,
    BullModule.registerQueue({ name: "crawl-queue-private" }),
    BullModule.registerQueue({ name: "crawl-queue-public" }),
    WebsiteModule,
    EvaluationModule,
  ],
  controllers: [CrawlerController],
  providers: [
    WebsiteService,
    CrawlerService,
    CrawlWorker,
    CrawlerCron,
    CrawlerPageRepository,
    CrawlerWebsiteRepository,
    WebsitesGateway,
  ],
  exports: [CrawlerService],
})
export class DiscoveryModule {}
