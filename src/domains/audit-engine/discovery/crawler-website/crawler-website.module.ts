import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerPageModule } from '../crawler-page/crawler-page.module';
import { CrawlerWebsiteController } from './crawler-website.controller';
import { CrawlerWebsite } from './entities/crawler-website.entity';
import { CrawlerWebsiteRepository } from './crawler-website.repository';
import { CrawlerWebsiteService } from './crawler-website.service';
import { CrawlPrivateWorker } from './processors/crawler-private.processor';
import { WebsitesGateway } from './gateways/crawler.gateway';
import { WebsiteModule } from 'src/domains/inventory/website/website.module';
import { IWebsiteScraper } from './types/scraper.interface';
import { PlaywrightWebsiteScraperAdapter } from './strategies/playwright-website-scraper.adapter';
import { CrawlPublicWorker } from './processors/crawler-public.processor';
import { CrawlWebsiteHandler } from './handlers/crawl-websites.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([CrawlerWebsite]),
    BullModule.registerQueue({ name: QUEUE_NAMES.CRAWL_PRIVATE }),
    BullModule.registerQueue({ name: QUEUE_NAMES.CRAWL_PRIVATE_DQL }),
    BullModule.registerQueue({ name: QUEUE_NAMES.CRAWL_PUBLIC }),
    BullModule.registerQueue({ name: QUEUE_NAMES.CRAWL_PUBLIC_DQL }),
    WebsiteModule,
    CrawlerPageModule,
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
    CrawlWebsiteHandler,
  ],
  exports: [CrawlerWebsiteService, CrawlerWebsiteRepository],
})
export class CrawlerWebsiteModule {}
