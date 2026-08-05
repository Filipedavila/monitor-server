import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CrawlerWebsiteController } from "./crawler-website.controller";
import { CrawlerWebsite } from "./entities/crawler-website.entity";
import { CrawlerWebsiteRepository } from "./crawler-website.repository";
import { CrawlerWebsiteService } from "./crawler-website.service";
import { CrawlPrivateWorker } from "./processors/crawler-private.processor";
import { WebsitesGateway } from "./gateways/crawler.gateway";
import { WebsiteModule } from "src/domains/inventory/website/website.module";
import { IWebsiteScraper } from "./scrapers/scraper.interface";
import { PlaywrightWebsiteScraperAdapter } from "./scrapers/playwright-website-scraper.adapter";
import { CrawlPublicWorker } from "./processors/crawler-public.processor";

@Module({
  imports: [
    TypeOrmModule.forFeature([CrawlerWebsite]),
    BullModule.registerQueue({ name: "crawl-queue-private" }),
    BullModule.registerQueue({ name: "crawl-queue-public" }),
    WebsiteModule,
  ],
  controllers: [CrawlerWebsiteController],
  providers: [
    CrawlerWebsiteService,
    CrawlerWebsiteRepository,
    CrawlPublicWorker,
    CrawlPrivateWorker,
    WebsitesGateway,
    {
      provide: IWebsiteScraper,
      useClass: PlaywrightWebsiteScraperAdapter,
    },
  ],
  exports: [CrawlerWebsiteService, CrawlerWebsiteRepository],
})
export class CrawlerWebsiteModule {}