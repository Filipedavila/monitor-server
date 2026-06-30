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
import { ContextEnum, ContextMapByRole } from "src/domains/inventory/context/context.enum";
import { SecurityContext } from "src/core/authentication/interfaces/types";

export interface WebsiteCrawlerFilter extends BaseFilter {
  id: number;
  ids: number[] | string[];
  tagName: string;
  tagId: number;
  tagsId: number[];
  websiteId: number;
  websiteIds: number[];
  status: CrawlerStatus;
  searchTerm: string;
}
export interface WebsiteCrawlerSorting extends BaseSort {
  id: SortCriteria;
  tagId: SortCriteria;
  websiteId: SortCriteria;
  status: SortCriteria;
}
type WebsiteCrawlerQueryRequest = {
  filters: Partial<WebsiteCrawlerFilter>;
  sortings: Partial<WebsiteCrawlerSorting>;
  pagination: Partial<BasePagination>;
  contexts: ContextEnum[];
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
  protected readonly contextAlias = "crawler_website_context";
  protected readonly filterMap: FilterMap<WebsiteCrawlerFilter, CrawlerWebsite> =
    {
      id: (q, val) => this.addFilter(q, "id", val),
      ids: (q, val) => this.addFilter(q, "id", val, "in"),
      tagName: (q, val) => this.addFilter(q, "tagId", val),
      searchTerm: (q, val) => this.addFilter(q, "baseUrl", val, "like"),
      tagId: (q, val) => this.addFilter(q, "tagId", val),
      tagsId: (q, val) => this.addFilter(q, "tagId", val, "in"),
      websiteId: (q, val) => this.addFilter(q, "websiteId", val),
      websiteIds: (q, val) => this.addFilter(q, "websiteId", val, "in"),
      status: (q, val) => this.addFilter(q, "status", val),
    };

  protected readonly sortMap: SortingMap<WebsiteCrawlerSorting, CrawlerWebsite> =
    {
      id: (q, order) => this.addSort(q, "id", order),
      tagId: (q, order) => this.addSort(q, "tagId", order),
      websiteId: (q, order) => this.addSort(q, "websiteId", order),
      status: (q, order) => this.addSort(q, "status", order),
    };

  private applyContextIsolation(query: SelectQueryBuilder<CrawlerWebsite>, contexts: ContextEnum[], securityContext: SecurityContext): void {
        if (contexts && contexts.length > 0) {
          query.innerJoin(`${this.alias}.contexts`, this.contextAlias)
               .andWhere(`${this.contextAlias}.code IN (:...contextCodes)`, { contextCodes: contexts });
        }else{
          const contextUser = ContextMapByRole[securityContext.user.role_slug];
          if (!contextUser) {
            throw new BadRequestException("User role does not have an associated context");
          }
          query.innerJoin(`${this.alias}.contexts`, this.contextAlias)
               .andWhere(`${this.contextAlias}.code = :contextCode`, { contextCode: contextUser });
        }
      }
  
    public async getAllCrawlersWebsites(queryArgs:WebsiteCrawlerQueryRequest ): Promise<{ data: CrawlerWebsite[]; count: number }> {
      const query = this.ormRepo.createQueryBuilder(`${this.alias}`);
      this.applyContextIsolation(query, queryArgs.contexts, queryArgs.securityContext);
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
 

  async atomicSaveMany(crawlWebsites: CrawlerWebsite[]): Promise<CrawlerWebsite[]> {
    if (!crawlWebsites?.length) return [];
    return await this.runInTransaction(async (queryRunner) => {
      return await queryRunner.manager.save(CrawlerWebsite, crawlWebsites);
    });
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
