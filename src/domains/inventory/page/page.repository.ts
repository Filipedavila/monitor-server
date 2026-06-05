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
export interface PageFilter extends BaseFilter {
  url?: string;
  url_hash?: string;
  websiteId?: number;
  roleId?: number; // Para filtrar por allowedRoles
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
    @InjectRepository(Page) orm: Repository<Page>, logger: AppLoggerService, configService: ConfigService) {
    super(orm, logger, configService);
  }



  protected readonly filterMap: FilterMap<PageFilter, Page> = {
    ids : (query, value) => query.andWhereInIds(value),
    url: (query, val) => this.addFilter(query, "url", val, "like"),
    websiteId: (query, val) => {
      query.innerJoin("page.websites", "website")
           .andWhere("website.id = :websiteId", { websiteId: val });
    },
    roleId: (query, val) => {
      query.innerJoin("page.allowedRoles", "role")
           .andWhere("role.id = :roleId", { roleId: val });
    },
    url_hash: (query, val) => this.addFilter(query, "url_hash", val),
  };

  protected readonly sortMap: SortingMap<PageSort, Page> = {
    id : (query, order) => this.addSort(query, "id", order),
    url: (query, order) => this.addSort(query, "url", order),
    score: (query, order) => query.addOrderBy("evaluation.score", order),
    createdAt: (query, order) => query.addOrderBy("evaluation.createdAt", order),
    url_hash: (query, order) => this.addSort(query, "url_hash", order),
  };

 applyAuthorization(query: QueryBuilder<Page>, rules: any, operation: string): Promise<void> {
      throw new Error("Method not implemented."); 
  }

  async createPagesWithOutbox(websiteId: string, urls: string[]): Promise<Page[]> {
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

     const outboxEvents = finalPages.map(page => {
        const event = new Outbox();
        event.aggregateType = 'Page';
        event.aggregateId = String(page.id);
        event.eventType = 'authorization';
        event.payload = {
          action: 'create',
          fgaTuple: { 
            user: `website:${websiteId}`, 
            relation: 'parent', 
            object: `page:${page.id}` 
          }
        };
        event.status = OutboxStatus.PENDING;
        event.attempts = 0;
        return event;
      });

     if (outboxEvents.length > 0) {
        await txManager
          .createQueryBuilder(Outbox, 'outbox')
          .insert()
          .into(Outbox)
          .values(outboxEvents)
          .execute();
      }

      return finalPages;
    });
  }
}
