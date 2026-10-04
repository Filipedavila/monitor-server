import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CrawlerWebsite } from './entities/crawler-website.entity';
import { CrawlerWebsiteRepository } from './crawler-website.repository';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  CrawlWebsiteResponseDTO,
  CrawlWebsitesResponseDTO,
} from './dto/crawler-website-response.dto';
import { plainToInstance } from 'class-transformer';
import { EventEmitter2 } from 'eventemitter2';
import { CrawlerRequestDTO } from './dto/request/cralwer-request.dto';
import { BaseService } from 'src/common/services/base.service';
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { RoleSlug } from 'src/core/authentication/interfaces/types';
import { In } from 'typeorm/find-options/operator/In.js';
import { FgaService } from 'src/core/authorization/fga.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Website } from 'src/domains/inventory/website/website.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CrawlerWebsiteService extends BaseService {
  constructor(
    private readonly crawlerWebsiteRepository: CrawlerWebsiteRepository,
    @InjectRepository(Website)
    private readonly websiteRepository: Repository<Website>,
    private readonly eventEmitter: EventEmitter2,
    private readonly fgaService: FgaService,

    @InjectQueue('crawl-queue-private') readonly crawlQueuePrivate: Queue,
    @InjectQueue('crawl-queue-public') readonly crawlQueuePublic: Queue,
  ) {
    super('CrawlerWebsiteService');
  }

  async findOne(dto: number, securityContext: SecurityContext): Promise<CrawlWebsiteResponseDTO> {
    const crawlWebsite = await this.crawlerWebsiteRepository.findById(dto);
    if (!crawlWebsite) {
      throw new NotFoundException('Crawl website not found');
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
      excludeExtraneousValues: false,
      enableImplicitConversion: false,
    });
  }

  async deleteMany(securityContext: SecurityContext, crawlerIds: number[]): Promise<void> {
    if (!crawlerIds || crawlerIds.length === 0) {
      return;
    }
    await this.crawlerWebsiteRepository.deleteCrawlers(crawlerIds, securityContext);
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
    websitesId: number[],
    options?: {
      maxDepth?: number;
      maxPages?: number;
      waitJS?: number;
      tag?: number;
    },
  ): Promise<void> {
    if (websitesId.length === 0) {
      this.logger.warn(
        `No valid website IDs provided for userId: ${securityContext.user.id}. Provided IDs: ${websitesId.join(', ')}`,
      );
      throw new BadRequestException('No valid website IDs provided');
    }

    const authorizedIds = await this.fgaService.filterAuthorizedIds(
      `user:${securityContext.user.id}`,
      'website',
      websitesId,
      ['can_manage', 'can_edit'],
    );
    if (authorizedIds.length === 0) {
      this.logger.warn(
        `UserId: ${securityContext.user.id} has no authorized website IDs. Provided IDs: ${websitesId.join(', ')}`,
      );
      throw new ForbiddenException('User has no authorization to the provided website IDs');
    }

    const websiteObjs = await this.websiteRepository.findBy({
      id: In(authorizedIds),
    });

    const entities = websiteObjs.map((obj) => {
      const newCrawlWebsite = new CrawlerWebsite();
      newCrawlWebsite.websiteId = obj.id;
      newCrawlWebsite.baseUrl = obj.baseUrl;
      newCrawlWebsite.createdById = securityContext.user.id;
      return newCrawlWebsite;
    });

    const savedCrawls = await this.crawlerWebsiteRepository.saveManyCrawlWebsites(
      entities,
      securityContext,
    );

    const queue =
      securityContext.user.role_slug === RoleSlug.ADMIN
        ? this.crawlQueuePrivate
        : this.crawlQueuePublic;

    const jobs = savedCrawls.map((crawl) => ({
      name: 'crawl-job',
      data: {
        crawlerId: crawl.id,
        baseUrl: crawl.baseUrl,
        userId: securityContext.user.id,
        ...options,
      },
      opts: {
        jobId: `crawl-job-${crawl.websiteId}`,
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }));

    await queue.addBulk(jobs);

    this.eventEmitter.emit(
      'crawler.created',
      securityContext.user,
      savedCrawls.map((c) => c.id),
    );
    this.logger.log(
      `Crawl jobs added to queue for userId: ${securityContext.user.id} with crawlWebsiteIds: ${savedCrawls.map((c) => c.id).join(', ')}`,
    );
  }

  async crawlWebsitesTags(
    securityContext: SecurityContext,
    tagsIds: number[],
    options?: {
      maxDepth?: number;
      maxPages?: number;
      waitJS?: number;
      tag?: number;
    },
  ): Promise<void> {
    this.logger.log(
      `Initiating crawl for userId: ${securityContext.user.id} with tags: ${tagsIds.join(', ')} and options: ${JSON.stringify(options)}`,
    );

    if (tagsIds.length === 0) {
      this.logger.warn(
        `No valid tag IDs provided for userId: ${securityContext.user.id}. Provided IDs: ${tagsIds.join(', ')}`,
      );
      throw new BadRequestException('No valid tag IDs provided');
    }
    const websiteObjs = await this.crawlerWebsiteRepository.getWebsitesIdsByTags(tagsIds);

    const entities = websiteObjs.map((obj) => {
      const newCrawlWebsite = new CrawlerWebsite();
      newCrawlWebsite.websiteId = obj.id;
      newCrawlWebsite.baseUrl = obj.base_url;
      newCrawlWebsite.createdById = securityContext.user.id;
      return newCrawlWebsite;
    });

    const savedCrawls = await this.crawlerWebsiteRepository.saveManyCrawlWebsites(
      entities,
      securityContext,
    );

    const queue = this.crawlQueuePrivate;

    const jobs = savedCrawls.map((crawl) => ({
      name: 'crawl-job',
      data: {
        crawlerId: crawl.id,
        baseUrl: crawl.baseUrl,
        userId: securityContext.user.id,
        ...options,
      },
      opts: {
        jobId: `crawl-job-${crawl.websiteId}`,
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }));

    await queue.addBulk(jobs);

    this.eventEmitter.emit(
      'crawler.created',
      securityContext.user,
      savedCrawls.map((c) => c.id),
    );
    this.logger.log(
      `Crawl jobs added to queue for userId: ${securityContext.user.id} with crawlWebsiteIds: ${savedCrawls.map((c) => c.id).join(', ')}`,
    );
  }

  async importCrawlers(securityContext: SecurityContext, crawlerIds: number[]): Promise<void> {
    await this.crawlerWebsiteRepository.importCrawlers(crawlerIds, securityContext);
  }
}
