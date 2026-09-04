import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { CrawlerStatus, CrawlerWebsite } from './entities/crawler-website.entity';
import { BaseTransactionalRepository } from '../../../../common/repositories/base-transactional.repository';
import { FilterMap, SortingMap } from 'src/common/repositories/base.repository';
import { BaseFilter, BasePagination, BaseSort, SortCriteria } from 'src/common/interfaces/types';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { getContextIdByRole } from 'src/domains/inventory/context/context.enum';
import { SecurityContext } from 'src/core/authentication/interfaces/types';
import { CrawlerPage } from '../crawler-page/crawler-page.entity';
import xxhash from 'xxhash-wasm';

export interface WebsiteCrawlerFilter extends BaseFilter {
  id: number;
  ids: number[] | string[];
  websiteId: number;
  websiteIds: number[];
  status: CrawlerStatus;
  searchTerm: string;
}
export interface WebsiteCrawlerSorting extends BaseSort {
  id: SortCriteria;
  websiteId: SortCriteria;
  status: SortCriteria;
  pagesCount: SortCriteria;
}
type WebsiteCrawlerQueryRequest = {
  filters: Partial<WebsiteCrawlerFilter>;
  sortings: Partial<WebsiteCrawlerSorting>;
  pagination: Partial<BasePagination>;
  securityContext: SecurityContext;
};
@Injectable()
export class CrawlerWebsiteRepository extends BaseTransactionalRepository<
  CrawlerWebsite,
  WebsiteCrawlerFilter,
  WebsiteCrawlerSorting,
  BasePagination
> {
  constructor(
    @InjectRepository(CrawlerWebsite)
    private readonly ormRepo: Repository<CrawlerWebsite>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
  ) {
    logger.setContext(CrawlerWebsiteRepository.name);
    super(ormRepo, logger, configService);
  }
  protected readonly alias = 'crawler_website';
  protected readonly contextAlias = 'crawler_context';
  protected readonly filterMap: FilterMap<WebsiteCrawlerFilter, CrawlerWebsite> = {
    id: (q, val) => this.addFilter(q, 'id', val),
    ids: (q, val) => this.addFilter(q, 'id', val, 'in'),
    searchTerm: (q, val) => this.addFilter(q, 'baseUrl', val, 'like'),
    websiteId: (q, val) => this.addFilter(q, 'websiteId', val),
    websiteIds: (q, val) => this.addFilter(q, 'websiteId', val, 'in'),
    status: (q, val) => this.addFilter(q, 'status', val),
  };

  protected readonly sortMap: SortingMap<WebsiteCrawlerSorting, CrawlerWebsite> = {
    id: (q, order) => this.addSort(q, 'id', order),
    websiteId: (q, order) => this.addSort(q, 'websiteId', order),
    status: (q, order) => this.addSort(q, 'status', order),
    pagesCount: (q, order) => this.addSort(q, 'pagesCount', order),
  };

  private applyContextFilter(
    query: SelectQueryBuilder<CrawlerWebsite>,
    securityContext: SecurityContext,
  ): void {
    const contextId = getContextIdByRole(securityContext.user.role_slug);
    if (!contextId) {
      throw new BadRequestException('User role does not have an associated context');
    }
    query.innerJoin(
      'crawler_websites_contexts',
      this.contextAlias,
      `${this.contextAlias}.crawler_id = ${this.alias}.id`,
    );
    query.andWhere(`${this.contextAlias}.context_id = :contextId`, {
      contextId: contextId,
    });
    // TODO: Remove Magic number
    if (contextId != 1) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(
            `EXISTS (
              SELECT 1 FROM users_websites uw 
              WHERE uw.website_id = ${this.alias}.website_id AND uw.user_id = :userId
            )`,
          ).orWhere(
            `EXISTS (
              SELECT 1 FROM team_websites tw 
              JOIN team_member ut ON ut.team_id = tw.team_id 
              WHERE tw.website_id = ${this.alias}.website_id AND ut.user_id = :userId
            )`,
          );
        }),
        { userId: securityContext.user.id },
      );
    }
  }

  public async getAllCrawlersWebsites(
    queryArgs: WebsiteCrawlerQueryRequest,
  ): Promise<{ data: CrawlerWebsite[]; meta: any }> {
    const query = this.ormRepo.createQueryBuilder(this.alias);

    this.applyContextFilter(query, queryArgs.securityContext);
    this.applyDynamicFilters(query, queryArgs.filters);
    this.applyDynamicSorting(query, queryArgs.sortings);

    const count = await query.getCount();

    this.applyPagination(query, queryArgs.pagination);

    const data = await query.getMany();

    const metadataPagination = this.calculatePaginationMeta(
      count,
      queryArgs.pagination?.page ?? 1,
      queryArgs.pagination?.limit ?? 10,
    );

    return {
      data,
      meta: metadataPagination,
    };
  }

  findAllWithPageCounter(): Promise<CrawlerWebsite[]> {
    return this.ormRepo
      .createQueryBuilder()
      .select()
      .loadRelationCountAndMap(`${this.alias}.pageCount`, `${this.alias}.pages`)
      .getMany();
  }

  async saveManyCrawlWebsites(
    data: CrawlerWebsite[],
    securityContext: SecurityContext,
  ): Promise<CrawlerWebsite[]> {
    return this.runInTransaction(async (queryRunner) => {
      const savedEntities = await queryRunner.manager.save(data);
      return savedEntities;
    });
  }

  async saveWebsiteCrawl(crawlerId: number, urls: string[]): Promise<CrawlerWebsite> {
    const { h64 } = await xxhash();

    const crawlerPages = urls.map((url) => {
      const rawUint64 = h64(url.trim());
      const signedInt64 = BigInt.asIntN(64, rawUint64).toString();

      return {
        crawlerWebsiteId: crawlerId,
        url,
        urlHash: signedInt64,
      };
    });
    return await this.runInTransaction(async (queryRunner) => {
      await queryRunner.manager.upsert(CrawlerPage, crawlerPages, ['crawlerWebsiteId', 'urlHash']);
      return await queryRunner.manager.save(CrawlerWebsite, {
        id: crawlerId,
        status: CrawlerStatus.COMPLETED,
        pageCount: crawlerPages.length,
        updatedAt: new Date(),
      });
    });
  }

  public async deleteCrawlers(
    crawlerWebsiteIds: number[],
    securityContext: SecurityContext,
  ): Promise<boolean> {
    if (!crawlerWebsiteIds?.length) {
      return false;
    }

    const contextId = getContextIdByRole(securityContext.user.role_slug);
    if (!contextId) {
      throw new BadRequestException('User role does not have an associated context');
    }

    const result = await this.ormRepo
      .createQueryBuilder()
      .delete()
      .where('id IN (:...crawlerWebsiteIds)', { crawlerWebsiteIds })
      .andWhere(
        `EXISTS (` +
          `SELECT 1 FROM crawler_websites_contexts cwc ` +
          `WHERE cwc.crawler_id IN (:...crawlerWebsiteIds) ` +
          `AND cwc.context_id = :contextId` +
          `)`,
        { contextId, crawlerWebsiteIds },
      )
      .execute();

    return (result.affected ?? 0) > 0;
  }
}
