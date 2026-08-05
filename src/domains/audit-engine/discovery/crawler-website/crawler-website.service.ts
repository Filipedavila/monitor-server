import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CrawlerStatus, CrawlerWebsite } from "./entities/crawler-website.entity";
import { CrawlerWebsiteRepository } from "./crawler-website.repository";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import {
  CrawlWebsiteResponseDTO,
  CrawlWebsitesResponseDTO,
} from "./dto/crawler-website-response.dto";
import { plainToInstance } from "class-transformer";
import { EventEmitter2 } from "eventemitter2";
import { CrawlerRequestDTO } from "./dto/request/cralwer-request.dto";
import { BaseService } from "src/common/services/base.service";
import { SecurityContext } from "src/core/authorization/SecurityContext";
import { RoleSlug } from "src/core/authentication/interfaces/types";
import { In } from "typeorm/find-options/operator/In.js";
import { FgaService } from "src/core/authorization/fga.service";

@Injectable() 
export class CrawlerWebsiteService extends BaseService {
  constructor(
    private readonly crawlerWebsiteRepository: CrawlerWebsiteRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly fgaService: FgaService,

    @InjectQueue("crawl-queue-private") readonly crawlQueuePrivate: Queue,
    @InjectQueue("crawl-queue-public") readonly crawlQueuePublic: Queue,
  ) {
    super("CrawlerWebsiteService");
  }

  async findOne(dto: number, securityContext: SecurityContext): Promise<CrawlWebsiteResponseDTO> {
    const crawlWebsite = await this.crawlerWebsiteRepository.findById(dto);
    if (!crawlWebsite) {
      throw new NotFoundException("Crawl website not found");
    }
    return plainToInstance(CrawlWebsiteResponseDTO, crawlWebsite, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  async getMany(
    query: CrawlerRequestDTO,
    securityContext: SecurityContext,
  ): Promise<CrawlWebsitesResponseDTO> {
    const sortings = query.sorts?.sort;
    const filters = query.filters;
    const pagination = query.pagination;
    const queryArgs = {
      sortings: sortings ? sortings : {},
      filters,
      pagination,
      securityContext,
    };
    const websitesCrawled = await this.crawlerWebsiteRepository.getAllCrawlersWebsites(queryArgs);
    return plainToInstance(CrawlWebsitesResponseDTO, websitesCrawled, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  async deleteManyIdempotent(securityContext: SecurityContext, websiteIds: number[]): Promise<void> {
    if (!websiteIds || websiteIds.length === 0) {
      return;
    }

    const uniqueIds = Array.from(new Set(websiteIds));

    const authorizedIds = await this.fgaService.filterAuthorizedIds(
      `user:${securityContext.user.id}`,
      'website',
      uniqueIds,
      'can_edit'
    );

    if (authorizedIds.length === 0) {
      return; 
    }

    await this.crawlerWebsiteRepository.getOrmRepository().delete({
      id: In(authorizedIds),
    });
  }

  async delete(websiteId: number): Promise<boolean> {
    try {
      const result = await this.crawlerWebsiteRepository.delete(websiteId);
      return (result?.affected ?? 0) > 0;
    } catch (err) {
      return false;
    }
  }

  async crawlWebsites(
    securityContext: SecurityContext,
    websitesIds: number[],
    options?: {
      maxDepth?: number;
      maxPages?: number;
      waitJS?: number;
      tag?: number;
    },
  ): Promise<void> {
    this.logger.log(
      `Initiating crawl for userId: ${securityContext.user.id} with websites: ${websitesIds.join(", ")} and options: ${JSON.stringify(options)}`,
    );

    const websiteIds = websitesIds
      .map((id) => Number(id))
      .filter((id) => !isNaN(id));
      
    if (websiteIds.length === 0) {
      this.logger.warn(
        `No valid website IDs provided for userId: ${securityContext.user.id}. Provided IDs: ${websitesIds.join(", ")}`,
      );
      throw new BadRequestException("No valid website IDs provided");
    }
    
    const websiteObjs = await this.crawlerWebsiteRepository.findAllUrlByIds(websiteIds);

    const entities = websiteObjs.map((obj) => {
      const newCrawlWebsite = new CrawlerWebsite();
      newCrawlWebsite.websiteId = obj.id;
      newCrawlWebsite.baseUrl = obj.baseUrl;
      newCrawlWebsite.createdById = securityContext.user.id;
      return newCrawlWebsite;
    });

    const savedCrawls = await this.crawlerWebsiteRepository.saveManyCrawlWebsites(entities,securityContext);

    const queue =
      securityContext.user.role_slug === RoleSlug.ADMIN
        ? this.crawlQueuePrivate
        : this.crawlQueuePublic;

    const jobs = savedCrawls.map((crawl) => ({
      name: "crawl-job",
      data: {
        websiteId: crawl.websiteId,
        userId: securityContext.user.id,
        ...options,
      },
    }));

    await queue.addBulk(jobs);

    this.eventEmitter.emit("crawler.created", securityContext.user, savedCrawls.map((c) => c.id));
    this.logger.log(
      `Crawl jobs added to queue for userId: ${securityContext.user.id} with crawlWebsiteIds: ${savedCrawls.map((c) => c.id).join(", ")}`,
    );
  }
/*
  public async handleCrawl(crawlerWebsiteId: number) {
    const websiteCrawler = await this.crawlerWebsiteRepository.findById(crawlerWebsiteId);
    if (!websiteCrawler) {
      return;
    }
    const urls = await this.startCrawlerWebsite(websiteCrawler);

    for (const url of urls || []) {
      try {
        // Nota: A criação de páginas em lote ou individual passa a ser responsabilidade de quem processa
        // ou do repositório correspondente, mantendo o acoplamento limpo.
      } catch (e) {
        this.logger.error("Error saving crawled page", e);
      }
    }
    
    websiteCrawler.status = CrawlerStatus.COMPLETED;
    const websiteCrawled = await this.crawlerWebsiteRepository.save(websiteCrawler);
    const responseDto = plainToInstance(
      CrawlWebsiteResponseDTO,
      websiteCrawled,
      { excludeExtraneousValues: true, enableImplicitConversion: true },
    );
    this.eventEmitter.emit(
      "crawler.finished",
      websiteCrawler.createdBy,
      responseDto,
    );
  }
*/
}