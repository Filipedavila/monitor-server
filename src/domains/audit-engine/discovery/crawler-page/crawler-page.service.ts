import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CrawlerPageRepository } from "./crawler-page.repository";
import { CrawlerPageDeleteDTO } from "./dto/crawler-page-delete.dto";
import { SecurityContext } from "src/core/authorization/SecurityContext";
import { CrawlerWebsiteService } from "../crawler-website/crawler-website.service"
import { FgaService } from "src/core/authorization/fga.service";

@Injectable()
export class CrawlerPageService {
  constructor(
    private readonly crawlerPageRepository: CrawlerPageRepository,
    private readonly crawlerWebsiteService: CrawlerWebsiteService,
    private readonly fgaService: FgaService,
  ) {}

  async getCrawlPages(securityContext: SecurityContext, crawlWebsiteId: number): Promise<any> {
    if (!crawlWebsiteId) {
      throw new BadRequestException("Crawl website id must be provided");
    }
    const pages = await this.crawlerPageRepository.findMany({
      securityContext,
      filters: { ids: [crawlWebsiteId] },
    });
    return pages;
  }

  async deletePagesIdempotent(
    securityContext: SecurityContext,
    crawlerPageDeleteDTO: CrawlerPageDeleteDTO,
  ): Promise<boolean> {
    const { crawlerId, uris } = crawlerPageDeleteDTO;
    
    if (!crawlerId && (!uris || uris.length === 0)) {
      throw new BadRequestException(
        "Crawl website id and urls must be provided for deletion",
      );
    }
    const isAuthorized = await this.fgaService.check(
      `user:${securityContext.user.id}`,
      'can_edit',
      `website:${crawlerId.toString()}`,
    );

    if (!isAuthorized) {
      throw new BadRequestException("Access denied to this crawler context.");
    }

    const filter: Record<string, any> = { ids: crawlerId };
    if (uris?.length) filter.urls = uris;

    const crawlPages = await this.crawlerPageRepository.findMany({ securityContext, filters: filter });
    
    if (!crawlPages.meta.totalItems) {
      throw new NotFoundException(
        "No crawl pages found for the given criteria",
      );
    }

    const crawlPageIds = crawlPages.data.map((page) => page.id);
    const result = await this.crawlerPageRepository.deleteMany(crawlPageIds);
    
    if (result && result.affected) {
      return result.affected > 0;
    } else {
      throw new InternalServerErrorException("Failed to delete crawl pages");
    }
  }
}