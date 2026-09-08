import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { FilterMap, QueryRequest, SortingMap } from 'src/common/repositories/base.repository';
import { CrawlerPage } from './crawler-page.entity';
import { BaseFilter, BasePagination, BaseSort, SortCriteria } from 'src/common/interfaces/types';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { SecurityContext } from 'src/core/authentication/interfaces/types';
import { getContextIdByRole } from 'src/domains/inventory/context/context.enum';
import { CrawlerPageDTO } from './dto/crawler-page.dto';
import { ContextAwareRepository } from 'src/common/repositories/context-aware.repository';
import { RepositoryTableConfig } from 'src/common/repositories/base-context';
import { CRAWLER_PAGE_CONTEXT_METADATA_CONFIG } from './crawler-page.constants';

export interface PageCrawlerFilter extends BaseFilter {
  crawlerWebsiteId: number;
  url: string;
  urls: string[];
  ids: number[] | string[];
}
export interface PageCrawlerSorting extends BaseSort {
  crawlerWebsiteId: SortCriteria;
  url: SortCriteria;
}

@Injectable()
export class CrawlerPageRepository extends ContextAwareRepository<
  CrawlerPage,
  PageCrawlerFilter,
  PageCrawlerSorting,
  BasePagination
> {
  protected readonly alias = 'cp';

  protected filterMap: FilterMap<PageCrawlerFilter, CrawlerPage> = {
    crawlerWebsiteId: (query: any, crawlerWebsiteId: number) =>
      query.andWhere(`${this.alias}.crawlerWebsiteId = :crawlerWebsiteId`, {
        crawlerWebsiteId: crawlerWebsiteId,
      }),
    url: (query: any, url: string) =>
      query.andWhere(`${this.alias}.url LIKE :url`, { url: `%${url}%` }),
    urls: (query: any, urls: string[]) =>
      urls?.length && query.andWhere(`${this.alias}.url IN (:...urls)`, { urls: urls }),
    ids: (query: SelectQueryBuilder<any>, value: number[] | string[]): void => {
      if (value?.length) {
        query.andWhere(`${this.alias}.id IN (:...ids)`, { ids: value });
      }
    },
  };

  protected sortMap: SortingMap<PageCrawlerSorting, CrawlerPage> = {
    id: (query: any, order: SortCriteria) => query.addOrderBy(`${this.alias}.id`, order),
    crawlerWebsiteId: (query: any, order: SortCriteria) =>
      query.addOrderBy(`${this.alias}.crawlerWebsiteId`, order),
    url: (query: any, order: SortCriteria) => query.addOrderBy(`${this.alias}.url`, order),
  };

  constructor(
    @InjectRepository(CrawlerPage)
    private readonly ormRepo: Repository<CrawlerPage>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
    @Inject(CRAWLER_PAGE_CONTEXT_METADATA_CONFIG)
    tableConfig: RepositoryTableConfig,
  ) {
    super(ormRepo, logger, configService, tableConfig);
  }

  async findPagesCrawler(
    websiteId: number,
    crawlerWebsiteId: number,
    securityContext: SecurityContext,
    queryParams: QueryRequest<PageCrawlerFilter, PageCrawlerSorting, BasePagination>,
  ): Promise<{ data: CrawlerPageDTO[]; meta: any }> {
    const { mainTable, contextTable, helperTable } = this.tables;
    if (!helperTable) {
      throw new Error('Crawler website table configuration is missing');
    }
    const query = this.ormRepo
      .createQueryBuilder(this.alias)
      .where(`${this.alias}.crawlerWebsiteId = :crawlerWebsiteId`, {
        crawlerWebsiteId: crawlerWebsiteId,
      })
      .innerJoin(
        `${helperTable.table}`,
        `${helperTable.alias}`,
        `${helperTable.alias}.id = ${this.alias}.crawlerWebsiteId`,
      )
      .innerJoin('websites', 'w', 'w.id = cw.websiteId')
      .andWhere(`w.id = :websiteId`, { websiteId: websiteId })
      .select([
        `${this.alias}.id AS "id"`,
        `${this.alias}.url AS "url"`,
        `${this.alias}.crawlerWebsiteId AS "crawlerWebsiteId"`,
      ]);

    const { filters, sortings, pagination } = queryParams;
    this.customContextRuleQuery(query, securityContext);
    this.applyDynamicFilters(query, filters);
    this.applyDynamicSorting(query, sortings);

    const count = await query.getCount();

    this.applyPagination(query, pagination);
    const rawData = await query.getRawMany<CrawlerPageDTO>();

    const metadataPagination = this.calculatePaginationMeta(
      count,
      pagination?.page ?? 1,
      pagination?.limit ?? 10,
    );

    return {
      data: rawData,
      meta: metadataPagination,
    };
  }

  public async getCrawledUrls(
    websiteId: number,
    crawlerWebsiteId: number,
    securityContext: SecurityContext,
    crawlPagesIds: number[],
  ): Promise<string[]> {
    const result = await this.findPagesCrawler(websiteId, crawlerWebsiteId, securityContext, {
      filters: { ids: crawlPagesIds },
      sortings: {},
      pagination: { page: 1, limit: 10000 },
    });
    return result.data.map((page) => page.url);
  }

  public async deleteCrawlerPages(
    websiteId: number,
    crawlerWebsiteId: number,
    securityContext: SecurityContext,
    crawlerPageIds: number[],
  ): Promise<boolean> {
    if (!crawlerPageIds?.length) {
      return false;
    }
    1;
    const contextId = getContextIdByRole(securityContext.user.role_slug);
    if (!contextId) {
      throw new BadRequestException('User role does not have an associated context');
    }

    const result = await this.ormRepo
      .createQueryBuilder()
      .delete()
      .where('id IN (:...crawlerPageIds)', { crawlerPageIds })
      .andWhere('crawler_website_id = :crawlerWebsiteId', { crawlerWebsiteId })
      .andWhere(
        `EXISTS (` +
          `SELECT 1 FROM crawler_websites cw ` +
          `WHERE cw.id = :crawlerWebsiteId AND cw.website_id = :websiteId` +
          `)`,
        { crawlerWebsiteId, websiteId },
      )
      .andWhere(
        `EXISTS (` +
          `SELECT 1 FROM crawler_websites_contexts cwc ` +
          `WHERE cwc.crawler_id = :crawlerWebsiteId ` +
          `AND cwc.context_id = :contextId` +
          `)`,
        { contextId, crawlerWebsiteId },
      )
      .execute();

    return (result.affected ?? 0) > 0;
  }
}
