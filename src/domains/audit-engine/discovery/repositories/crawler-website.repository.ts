import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryBuilder, Repository, SelectQueryBuilder } from "typeorm";
import { CrawlerWebsite } from "../entities/crawler-website.entity";
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

export interface WebsiteCrawlerFilter extends BaseFilter {
  id: number;
  ids: number[] | string[];
  tagName: string;
  tagId: number;
  tagsId: number[];
  websiteId: number;
  websiteIds: number[];
  isDone: boolean;
  searchTerm: string;
}
export interface WebsiteCrawlerSorting extends BaseSort {
  id: SortCriteria;
  tagId: SortCriteria;
  websiteId: SortCriteria;
  isDone: SortCriteria;
}

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
      isDone: (q, val) => this.addFilter(q, "isDone", val),
    };

  protected readonly sortMap: SortingMap<WebsiteCrawlerSorting, CrawlerWebsite> =
    {
      id: (q, order) => this.addSort(q, "id", order),
      tagId: (q, order) => this.addSort(q, "tagId", order),
      websiteId: (q, order) => this.addSort(q, "websiteId", order),
      isDone: (q, order) => this.addSort(q, "isDone", order),
    };

  findAllWithPageCounter(): Promise<CrawlerWebsite[]> {
    return this.ormRepo
      .createQueryBuilder()
      .select()
      .loadRelationCountAndMap(`${this.alias}.pageCount`, `${this.alias}.pages`)
      .getMany();
  }
  async findNextPendingByUserId(userId: number): Promise<CrawlerWebsite | null> {
    return this.ormRepo
      .createQueryBuilder()
      .select()
      .where("UserId = :userId", { userId })
      .andWhere("Done = :done", { done: false })
      .orderBy("Creation_Date", "ASC")
      .limit(1)
      .getOne();
  }
 

  async deleteByUserIdAndWebsiteId(
    userId: number,
    websiteId: number,
  ): Promise<boolean> {
    const result = await this.ormRepo
      .createQueryBuilder()
      .delete()
      .from(CrawlerWebsite)
      .where("UserId = :userId", { userId })
      .andWhere("WebsiteId = :websiteId", { websiteId })
      .execute();

    if (result && result.affected) {
      return result.affected > 0;
    } else {
      throw new InternalServerErrorException("Failed to delete crawl website");
    }
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

  applyAuthorization(query: QueryBuilder<CrawlerWebsite>, rules: any, operation: string): Promise<void> {
      throw new Error("Method not implemented."); 
  }
}
