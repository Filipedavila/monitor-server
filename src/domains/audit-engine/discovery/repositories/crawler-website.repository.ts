import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryBuilder, Repository, SelectQueryBuilder } from "typeorm";
import { CrawlerStatus, CrawlerWebsite } from "../entities/crawler-website.entity";
import { BaseTransactionalRepository } from "../../../../common/repositories/base-transactional.repository";
import { FilterMap, SortingMap } from "src/common/repositories/base.repository";
import {
  BaseFilter,
  BasePagination,
  BaseSort,
  SortCriteria,
} from "src/common/interfaces/types";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";
import { ConfigService } from "@nestjs/config";
import { ContextEnum, ContextMapByRole, getContextIdByRole } from "src/domains/inventory/context/context.enum";
import { SecurityContext } from "src/core/authentication/interfaces/types";

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
  protected readonly alias = "crawlerWebsite";
  protected readonly contextAlias = "crawlerContext";
  protected readonly filterMap: FilterMap<WebsiteCrawlerFilter, CrawlerWebsite> =
    {
      id: (q, val) => this.addFilter(q, "id", val),
      ids: (q, val) => this.addFilter(q, "id", val, "in"),
      searchTerm: (q, val) => this.addFilter(q, "baseUrl", val, "like"),
      websiteId: (q, val) => this.addFilter(q, "websiteId", val),
      websiteIds: (q, val) => this.addFilter(q, "websiteId", val, "in"),
      status: (q, val) => this.addFilter(q, "status", val),
    };

  protected readonly sortMap: SortingMap<WebsiteCrawlerSorting, CrawlerWebsite> =
    {
      id: (q, order) => this.addSort(q, "id", order),
      websiteId: (q, order) => this.addSort(q, "websiteId", order),
      status: (q, order) => this.addSort(q, "status", order),
    };

    private applyContextFilter(
      query: SelectQueryBuilder<CrawlerWebsite>, 
      securityContext: SecurityContext
    ): void {
      const contextId = getContextIdByRole(securityContext.user.role_slug);
      if(!contextId) {
        throw new BadRequestException("User role does not have an associated context");
      }
      query.innerJoin("crawler_contexts", this.contextAlias, `${this.contextAlias}.crawler_website_id = ${this.alias}.id`);
        query.andWhere(`${this.contextAlias}.context_id = :contextId`, { 
          contextId: contextId
        });

      
  }

    public async getAllCrawlersWebsites(queryArgs:WebsiteCrawlerQueryRequest ): Promise<{ data: CrawlerWebsite[]; count: number }> {
      const query = this.ormRepo.createQueryBuilder(`${this.alias}`);
      this.applyContextFilter(query,queryArgs.securityContext);
      this.applyDynamicFilters(query, queryArgs.filters);
      this.applyDynamicSorting(query, queryArgs.sortings);
      this.applyPagination(query, queryArgs.pagination);
  
      const [data, count] = await query.getManyAndCount();
      return { data, count };
    }

    findAllWithPageCounter(): Promise<CrawlerWebsite[]> {
      return this.ormRepo
        .createQueryBuilder()
        .select()
        .loadRelationCountAndMap(`${this.alias}.pageCount`, `${this.alias}.pages`)
        .getMany();
    }
  


  // TODO , what if id list is too long ?
  async findAllUrlByIds(ids: number[]): Promise<{id: number, baseUrl: string}[]> {
    const results = await this.ormRepo
      .createQueryBuilder()
      .select(["id", "baseUrl"])
      .where("id IN (:...ids)", { ids })
      .getMany();

    return results.map((result) => ({ id: result.id, baseUrl: result.baseUrl }));
  }

}
