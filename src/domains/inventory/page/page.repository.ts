import { Injectable } from "@nestjs/common";
import { Page } from "./page.entity";
import { BaseFilter, BasePagination, BaseSort, SortCriteria } from "src/common/interfaces/types";
import { EntityRepository, FilterMap, SortingMap } from "src/common/repositories/base.repository";
import { In, QueryBuilder, QueryRunner, Repository } from "typeorm";
import { ConfigService } from "@nestjs/config/dist/config.service";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";
import { InjectRepository } from "@nestjs/typeorm/dist/common/typeorm.decorators";
import { BaseTransactionalRepository } from "src/common/repositories/base-transactional.repository";
import { Outbox, OutboxStatus } from "src/core/outbox/outbox.entity";
import { OutboxService } from "src/core/outbox/outbox.service";
import { FGA_RESOURCE } from "src/core/authorization/types/fga.types";
import { AuthorizationEvent } from "src/core/authorization/queue/payload.types";
import { Context } from "../context/context.identity";
export interface PageFilter extends BaseFilter {
  url?: string;
  url_hash?: string;
  websiteId?: number;
  contexts?: Context[]
}

export interface PageSort extends BaseSort {
  url?: SortCriteria;
  createdAt?: SortCriteria;
  score?: SortCriteria;
  url_hash?: SortCriteria;
}

export interface PagePagination extends BasePagination {}


@Injectable()
export class PageRepository extends BaseTransactionalRepository<
  Page,
  PageFilter,
  PageSort,
  PagePagination
> {
  protected readonly alias = "page";

  constructor( 
    @InjectRepository(Page) orm: Repository<Page>, logger: AppLoggerService, configService: ConfigService,
    private readonly outboxService:OutboxService) {
    super(orm, logger, configService);
  }



  protected readonly filterMap: FilterMap<PageFilter, Page> = {
    ids : (query, value) => query.andWhereInIds(value),
    url: (query, val) => this.addFilter(query, "url", val, "like"),
    websiteId: (query, val) => {
      query.innerJoin("page.websites", "website")
           .andWhere("website.id = :websiteId", { websiteId: val });
    },
    url_hash: (query, val) => this.addFilter(query, "url_hash", val),
    contexts: (query, val) => {
      if (val && val.length > 0) {
        query.innerJoin("page.contexts", "context")
             .andWhere("context.code IN (:...contextCodes)", { contextCodes: val.map(c => c.code) });
      }
    },


  };

  protected readonly sortMap: SortingMap<PageSort, Page> = {
    id : (query, order) => this.addSort(query, "id", order),
    url: (query, order) => this.addSort(query, "url", order),
    score: (query, order) => query.addOrderBy("evaluation.score", order),
    createdAt: (query, order) => query.addOrderBy("evaluation.createdAt", order),
    url_hash: (query, order) => this.addSort(query, "url_hash", order),
  };


  async createPagesWithOutbox(websiteId: number, urls: string[]): Promise<Page[]> {
    if (urls.length === 0) return [];

    return this.runInTransaction<Page[]>(async (queryRunner: QueryRunner) => {
      const txManager = queryRunner.manager;
       const rawPages = urls.map(url => {
        const page = new Page();
        page.websiteId = Number(websiteId);
        page.url = url;
        return page;
      });
      await txManager
        .createQueryBuilder(Page, 'page')
        .insert()
        .into(Page)
        .values(rawPages)
        .orIgnore()
        .execute();

      const finalPages = await txManager.find(Page, {
        where: { websiteId: Number(websiteId), url: In(urls) },
      });

      const pageIds = finalPages.map(page => page.id);

     await this.outboxService.putInOutbox(txManager, {
        aggregateType: FGA_RESOURCE.PAGE,
        aggregateId: websiteId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: {
          resourceType: FGA_RESOURCE.TEAM,
          resourceId: websiteId,
          action: 'create',
          websiteId: websiteId,
          pageIds: pageIds,
        },
      });
     
      return finalPages;
    });
  }
}
