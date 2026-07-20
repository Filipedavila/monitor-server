import { BadRequestException, Injectable } from "@nestjs/common";
import { Page } from "./page.entity";
import { PageContext } from "./page-contexts.entity";
import { BaseFilter, BasePagination, BaseSort, SortCriteria } from "src/common/interfaces/types";
import { FilterMap, PaginationResponse, SortingMap } from "src/common/repositories/base.repository";
import { EntityManager, In, QueryRunner, Repository, SelectQueryBuilder } from "typeorm";
import { ConfigService } from "@nestjs/config/dist/config.service";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";
import { InjectRepository } from "@nestjs/typeorm/dist/common/typeorm.decorators";
import { BaseTransactionalRepository } from "src/common/repositories/base-transactional.repository";
import { OutboxService } from "src/core/outbox/outbox.service";
import { Context } from "../context/context.identity";
import { ContextEnum, ContextMap, ContextMapByRole, getContextIdByCode, getContextIdByRole } from "../context/context.enum";
import { SecurityContext } from "src/core/authentication/interfaces/types";
export interface PageFilter extends BaseFilter {
  url?: string;
  websiteId?: number;
  contexts?: Context[]
}

export interface PageSort extends BaseSort {
  url?: SortCriteria;
  createdAt?: SortCriteria;
  score?: SortCriteria;
}

type PageQueryRequest = {
  filters: Partial<PageFilter>;
  sortings: Partial<PageSort>;
  pagination: Partial<BasePagination>;
  contexts: ContextEnum[];
  securityContext: SecurityContext;
};

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

  protected readonly contextAlias = "page_context";


  protected readonly filterMap: FilterMap<PageFilter, Page> = {
    ids : (query, value) => query.andWhereInIds(value),
    url: (query, val) => this.addFilter(query, "url", val, "like"),
    websiteId: (query, val) => {
      query.innerJoin("page.websites", "website")
           .andWhere("website.id = :websiteId", { websiteId: val });
    },
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
  };

  async findManyWithLastEvalScore(queryArgs: PageQueryRequest): Promise<PaginationResponse<Page>> {
    const { filters, sortings, pagination } = queryArgs;
    const query = this.getOrmRepository().createQueryBuilder(this.alias);
    this.applyContextFilter(query, queryArgs.contexts, queryArgs.securityContext);
    query.leftJoin(
      (subQuery) =>
        subQuery
          .select("e.id", "id")
          .addSelect("e.page_id", "pageId")
          .from("evaluations", "e")
          .where(
            "e.id = (SELECT id FROM evaluations WHERE page_id = e.page_id ORDER BY created_at DESC LIMIT 1)"
          ),
      "evaluation",
      "evaluation.pageId = page.id"
    );

    this.applyDynamicFilters(query, filters);

    this.applyDynamicSorting(query, sortings);

    this.applyPagination(query, pagination);

    const [data, count] = await query.getManyAndCount();

    const metadataPagination = this.calculatePaginationMeta(
      count,
      queryArgs.pagination?.page ?? 1,
      queryArgs.pagination?.limit ?? 10,
    );
    return {
      data,
      meta: metadataPagination
    };
  }
 
  async findByPageByWebsiteId(websiteId: number, pageId: number): Promise<Page | null> {
    const query = this.getOrmRepository().createQueryBuilder(this.alias);
    query.where(`${this.alias}.id = :pageId`, { pageId })
         .andWhere(`${this.alias}.website_id = :websiteId`, { websiteId });
    return await query.getOne();
  }
      private applyContextFilter(
        query: SelectQueryBuilder<Page>, 
        contexts: ContextEnum[] | undefined, 
        securityContext: SecurityContext
      ): void {
        const targetContexts: number[] = (contexts && contexts.length > 0) 
          ? contexts.map(context => getContextIdByCode(context)).filter((id): id is number => id !== undefined)
          : [getContextIdByRole(securityContext.user.role_slug)].filter((id): id is number => id !== undefined);
          if (!targetContexts || targetContexts.length === 0) {
            throw new BadRequestException("User role does not have an associated context");
          }
        query.innerJoin(
          "page_contexts", 
          this.contextAlias, 
          `${this.contextAlias}.page_id = ${this.alias}.id`
        )
        .andWhere(`${this.contextAlias}.context_id IN (:...contextIds)`, { 
          contextIds: targetContexts 
        });
      }
  

  async createPages(websiteId: number, urls: string[], contexts: ContextEnum[] | undefined): Promise<Page[]> {
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

      if (contexts && contexts.length > 0) {
        const pageContexts = finalPages.flatMap(page => {
          return contexts.map(contextEnum => {
            const pageContext = new PageContext();
            pageContext.pageId = page.id;
            pageContext.contextId = ContextMap[contextEnum];
            return pageContext;
          });
        });
        await txManager.save(PageContext, pageContexts);
      }

     
      return finalPages;
    });
  }

  updateContexts(pageId: number, contextEnums: ContextEnum[]): Promise<Page> {
    return this.runInTransaction<Page>(async (queryRunner: QueryRunner) => {
      const txManager = queryRunner.manager;
      const page = await txManager.findOne(Page, { where: { id: pageId } });
      if (!page) {
        throw new Error(`Page with ID ${pageId} not found`);
      }

      await txManager.delete(PageContext, { pageId });

      if (contextEnums && contextEnums.length > 0) {
        const pageContexts = contextEnums.map(contextEnum => ({
          pageId,
          contextId: ContextMap[contextEnum]
        }));
        await txManager.save(PageContext, pageContexts);
      }

      return page;
    });
  }

  updateContextsMany(pageIds: number[], contextEnums: ContextEnum[]): Promise<Page[]> {
    return this.runInTransaction<Page[]>(async (queryRunner: QueryRunner) => {
      const txManager = queryRunner.manager;
      const pages = await txManager.find(Page, { where: { id: In(pageIds) } });
      if (pages.length === 0) {
        throw new Error(`No pages found with IDs ${pageIds}`);
      }

      await txManager.delete(PageContext, { pageId: In(pageIds) });

      if (contextEnums && contextEnums.length > 0) {
        const pageContexts = pages.flatMap(page =>
          contextEnums.map(contextEnum => ({
            pageId: page.id,
            contextId: ContextMap[contextEnum]
          }))
        );
        await txManager.save(PageContext, pageContexts);
      }

      return pages;
    });
  }

  async getOwnershipStates(ids: number[]): Promise<{ pageId: number; contextCount: number }[]>   {
    return this.orm
      .createQueryBuilder('pc')
      .select('pc.pageId', 'pageId')
      .addSelect('COUNT(pc.id)', 'contextCount')
      .from(PageContext, 'pc')
      .where('pc.pageId IN (:...ids)', { ids })
      .groupBy('pc.pageId')
      .getRawMany();
  }
  
  async removeAssociations(ids: number[], contextEnum: ContextEnum, tx?: EntityManager): Promise<void> {
    const contextId = ContextMap[contextEnum];
    const manager = tx || this.orm;
    await manager
      .createQueryBuilder()
      .delete()
      .from(PageContext)
      .where('pageId IN (:...ids)', { ids })
      .andWhere('contextId = :contextId', { contextId })
      .execute();
  }

  async deletePages(ids: number[], tx?: EntityManager): Promise<void> {
    const manager = tx || this.orm;
    await manager
      .createQueryBuilder()
      .delete()
      .from(Page)
      .where('id IN (:...ids)', { ids })
      .execute();
  }

  async batchExecuteRemoval(
    toUnlink: number[], 
    toDelete: number[], 
    contextEnum: ContextEnum
  ): Promise<void> {
    await this.runInTransaction(async (queryRunner:QueryRunner) => {
      const manager = queryRunner.manager;
      if (toUnlink.length > 0) {
        await this.removeAssociations(toUnlink, contextEnum, manager);
      }

      if (toDelete.length > 0) {
       await this.deletePages(toDelete, manager);
      }
    });
  }

}
