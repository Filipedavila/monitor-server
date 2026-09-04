import { BadRequestException, Injectable } from '@nestjs/common';
import { CrawlerPageRepository } from './crawler-page.repository';
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { PageService } from 'src/domains/inventory/page/page.service';

@Injectable()
export class CrawlerPageService {
  constructor(
    private readonly crawlerPageRepository: CrawlerPageRepository,
    private readonly pagesServices: PageService,
  ) {}

  async getCrawlPages(
    securityContext: SecurityContext,
    websiteId: number,
    crawlWebsiteId: number,
  ): Promise<any> {
    if (!crawlWebsiteId) {
      throw new BadRequestException('Crawl website id must be provided');
    }
    const pages = await this.crawlerPageRepository.findPagesCrawler(
      websiteId,
      crawlWebsiteId,
      securityContext,
      {
        filters: { crawlerWebsiteId: crawlWebsiteId },
      },
    );
    return { data: pages };
  }

  async importCrawlerPages(
    securityContext: SecurityContext,
    websiteId: number,
    crawlWebsiteId: number,
    crawlPagesId: number[],
  ): Promise<void> {
    const crawledUrls = await this.crawlerPageRepository.getCrawledUrls(
      websiteId,
      crawlWebsiteId,
      securityContext,
      crawlPagesId,
    );

    await this.pagesServices.importPages(securityContext, websiteId, crawledUrls);
  }

  async deleteCrawlerPages(
    securityContext: SecurityContext,
    websiteId: number,
    crawlWebsiteId: number,
    crawlerPageIds: number[],
  ): Promise<boolean> {
    return await this.crawlerPageRepository.deleteCrawlerPages(
      websiteId,
      crawlWebsiteId,
      securityContext,
      crawlerPageIds,
    );
  }
}
