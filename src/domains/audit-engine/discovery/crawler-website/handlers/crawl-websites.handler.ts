import { Inject, Injectable } from '@nestjs/common';
import { CrawlerWebsite } from '../entities/crawler-website.entity';
import { IWebsiteScraper } from '../types/scraper.interface';
import { CrawlerPage } from '../../crawler-page/crawler-page.entity';
import { CrawlerWebsiteRepository } from '../crawler-website.repository';

interface CrawlWebsiteHandlerRequest {
  id: number;
  baseUrl: string;
}
@Injectable()
export class CrawlWebsiteHandler {
  constructor(
    @Inject(IWebsiteScraper)
    private readonly scraper: IWebsiteScraper,
    private readonly crawlerWebsiteRepo: CrawlerWebsiteRepository,
  ) {}

  async execute(website: CrawlWebsiteHandlerRequest): Promise<void> {
    const scrapedPages = await this.scraper.scrapeWebsite(website.baseUrl);
    if (scrapedPages.length > 0) {
      await this.crawlerWebsiteRepo.saveWebsiteCrawl(website.id, scrapedPages);
    }
  }
}
