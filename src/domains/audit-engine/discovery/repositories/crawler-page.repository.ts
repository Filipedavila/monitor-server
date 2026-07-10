import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { BaseTransactionalRepository } from "../../../../common/repositories/base-transactional.repository";
import {
  FilterMap,
  QueryRequest,
  SortingMap,
} from "src/common/repositories/base.repository";
import { CrawlerPage } from "../entities/crawler-page.entity";
import {
  BaseFilter,
  BasePagination,
  BaseSort,
  SortCriteria,
} from "src/common/interfaces/types";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";
import { ConfigService } from "@nestjs/config";
import { FgaAuthorized } from "src/core/authorization/decorators/fga-authorization.decorator";

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
export class CrawlerPageRepository extends BaseTransactionalRepository<
  CrawlerPage,
  PageCrawlerFilter,
  PageCrawlerSorting,
  BasePagination
> {
  protected readonly alias = "crawlerPage";
  protected filterMap: FilterMap<PageCrawlerFilter, CrawlerPage> = {
    crawlerWebsiteId: (query: any, crawlerWebsiteId: number) =>
      query.andWhere(`${this.alias}.crawlerWebsiteId = :crawlerWebsiteId`, {
        crawlerWebsiteId: crawlerWebsiteId,
      }),
    url: (query: any, url: string) =>
      query.andWhere(`${this.alias}.url LIKE :url`, { url: `%${url}%` }),
    urls: (query: any, urls: string[]) =>
      urls?.length &&
      query.andWhere(`${this.alias}.url IN (:...urls)`, { urls: urls }),
    ids: (query: SelectQueryBuilder<any>, value: number[] | string[]): void => {
      if (value?.length) {
        query.andWhere(`${this.alias}.id IN (:...ids)`, { ids: value });
      }
    },
  };

  protected sortMap: SortingMap<PageCrawlerSorting, CrawlerPage> = {
    id: (query: any, order: SortCriteria) =>
      query.addOrderBy(`${this.alias}.id`, order),
    crawlerWebsiteId: (query: any, order: SortCriteria) =>
      query.addOrderBy(`${this.alias}.crawlerWebsiteId`, order),
    url: (query: any, order: SortCriteria) =>
      query.addOrderBy(`${this.alias}.url`, order),
  };

  constructor(
    @InjectRepository(CrawlerPage)
    private readonly ormRepo: Repository<CrawlerPage>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,  
  ) {
    logger.setContext(CrawlerPageRepository.name);
    super(ormRepo, logger, configService);
  }


  async findPagesCrawler(
    crawlerWebsiteId: number,
    queryParams: QueryRequest<
      PageCrawlerFilter,
      PageCrawlerSorting,
      BasePagination
    >,
  ): Promise<CrawlerPage[]> {
    const query = this.ormRepo
      .createQueryBuilder("cp")
      .where("cp.crawlerWebsiteId = :crawlerWebsiteId", {
        crawlerWebsiteId: crawlerWebsiteId,
      });
 

    const { filters, sortings, pagination } = queryParams;
    this.applyDynamicFilters(query, filters);
    this.applyDynamicSorting(query, sortings);
    if (pagination) {
      this.applyPagination(query, pagination);
    }
    return await query.getMany();
  }

}
