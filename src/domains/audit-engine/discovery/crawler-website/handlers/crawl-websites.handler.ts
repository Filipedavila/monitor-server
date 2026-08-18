import { Inject, Injectable } from "@nestjs/common";
import { CrawlerWebsite } from "../entities/crawler-website.entity";
import { IWebsiteScraper } from "../scrapers/scraper.interface";
import { CrawlerPage } from "../../crawler-page/crawler-page.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class CrawlWebsiteHandler {
  constructor(
    @Inject(IWebsiteScraper)
    private readonly scraper: IWebsiteScraper,
    @InjectRepository(CrawlerPage)
    private readonly crawlerPageRepo: Repository<CrawlerPage>
  ) {}

  async execute(website: CrawlerWebsite): Promise<void> {
    const scrapedPages = await this.scraper.scrapeWebsite(website.baseUrl);
    if (scrapedPages.length > 0) {
    const recordsToSave = scrapedPages.map((url) => ({
        url
        }));
    await this.crawlerPageRepo.upsert(recordsToSave, ['url'] );
  }
}
}