import { Module } from "@nestjs/common";
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from "@nestjs/typeorm";
import { CrawlerController } from "./crawler.controller";
import { CrawlWebsiteNew, CrawlPageNew } from "./crawler.entity";
import { PageModule } from "src/page/page.module";
import { CrawlWorker } from "./processors/crawler-private.processor";
import { CrawlerCron } from "./crons/crawller.cron";
import { CrawlerService } from "./crawler.service";
import { CrawlerWebsiteRepository } from "./crawler-website.repository";
import { CrawlerPageRepository } from "./crawler-page.repository";
import { WebsiteService } from "src/website/website.service";
import { WebsiteModule } from "src/website/website.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([CrawlWebsiteNew, CrawlPageNew]), 
    PageModule,
    BullModule.registerQueue({ name: 'crawl-queue-private' }),
    BullModule.registerQueue({ name: 'crawl-queue-public' }),
    WebsiteModule
  ],
  controllers: [CrawlerController],
  providers: [
    WebsiteService,
    CrawlerService, 
    CrawlWorker, 
    CrawlerCron,
    CrawlerPageRepository, 
    CrawlerWebsiteRepository
  ],
  exports: [CrawlerService],
})
export class CrawlerNewModule {}
