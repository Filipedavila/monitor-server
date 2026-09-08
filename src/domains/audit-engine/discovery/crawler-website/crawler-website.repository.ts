import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { CrawlerStatus, CrawlerWebsite } from './entities/crawler-website.entity';
import { ContextAwareRepository } from 'src/common/repositories/context-aware.repository';
import { FilterMap, SortingMap } from 'src/common/repositories/base.repository';
import { BaseFilter, BasePagination, BaseSort, SortCriteria } from 'src/common/interfaces/types';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { getContextIdByRole } from 'src/domains/inventory/context/context.enum';
import { SecurityContext } from 'src/core/authentication/interfaces/types';
import { CrawlerPage } from '../crawler-page/crawler-page.entity';
import xxhash from 'xxhash-wasm';
import { RepositoryTableConfig } from 'src/common/repositories/base-context';
import { CRAWLER_WEBSITE_CONTEXT_METADATA_CONFIG } from './crawler-website.constants';

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
export class CrawlerWebsiteRepository extends ContextAwareRepository<
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
    @Inject(CRAWLER_WEBSITE_CONTEXT_METADATA_CONFIG)
    protected readonly tableConfig: RepositoryTableConfig,
  ) {
    logger.setContext(CrawlerWebsiteRepository.name);
    super(ormRepo, logger, configService, tableConfig);
  }
  protected readonly alias = 'cw';

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

  public async getAllCrawlersWebsites(
    queryArgs: WebsiteCrawlerQueryRequest,
  ): Promise<{ data: CrawlerWebsite[]; meta: any }> {
    const query = this.ormRepo.createQueryBuilder(this.alias);

    this.customContextRuleQuery(query, queryArgs.securityContext);
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

      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into('crawler_websites_contexts')
        .values(
          savedEntities.map((entity) => ({
            crawler_id: entity.id,
            context_id: securityContext.user.context.id,
          })),
        )
        .orIgnore()
        .execute();

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

  async importCrawlers(crawlerIds: number[], securityContext: SecurityContext): Promise<void> {
    if (!crawlerIds || crawlerIds.length === 0) {
      return;
    }

    const contextId = getContextIdByRole(securityContext.user.role_slug);
    if (!contextId) {
      throw new BadRequestException('User role does not have an associated context');
    }

    const crawlerPages = await this.ormRepo
      .createQueryBuilder()
      .from('crawler_websites', 'cw')
      .select('cw.id', 'crawlerWebsiteId')
      .addSelect('cw.website_id', 'websiteId')
      .addSelect('cp.url', 'url')
      .addSelect('cp.url_hash', 'urlHash')
      .where('cw.id IN (:...crawlerIds)', { crawlerIds })
      .innerJoin('crawler_pages', 'cp', 'cp.crawler_website_id = cw.id')
      .innerJoin(
        'crawler_websites_contexts',
        'cwc',
        'cwc.crawler_id = cw.id AND cwc.context_id = :contextId',
        { contextId },
      )
      .getRawMany();

    const pagesInserts = crawlerPages.map((page) => ({
      websiteId: page.websiteId,
      url: page.url,
      urlHash: page.urlHash,
    }));

    await this.runInTransaction(async (queryRunner) => {
      if (pagesInserts.length > 0) {
        const result = await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into('pages')
          .values(pagesInserts)
          .orIgnore()
          .returning('id')
          .returning('id')
          .execute();

        const pageContextInserts = result.raw.map((row) => ({
          pageId: row.id,
          contextId: securityContext.user.context.id,
        }));

        if (pageContextInserts.length > 0) {
          await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into('page_contexts')
            .values(pageContextInserts)
            .orIgnore()
            .execute();
        }
      }
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
