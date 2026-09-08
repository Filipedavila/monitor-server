import { Inject, Injectable } from '@nestjs/common';
import { Page } from './page.entity';
import { PageContext } from './page-contexts.entity';
import { BaseFilter, BasePagination, BaseSort, SortCriteria } from 'src/common/interfaces/types';
import { FilterMap, PaginationResponse, SortingMap } from 'src/common/repositories/base.repository';
import { EntityManager, In, QueryRunner, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { Context } from '../context/context.identity';
import { ContextEnum } from '../context/context.enum';
import { SecurityContext } from 'src/core/authentication/interfaces/types';
import { PageEvalDTO } from './dto/page-detailed.dto';
import { ContextAwareRepository } from 'src/common/repositories/context-aware.repository';
import type { PageFilter, PageSort, PagePagination, PageQueryRequest, PageRecord } from './types';
import {
  BASE_CONTEXT_CONFIG_TOKEN,
  RepositoryTableConfig,
} from 'src/common/repositories/base-context';

@Injectable()
export class PageRepository extends ContextAwareRepository<
  Page,
  PageFilter,
  PageSort,
  PagePagination
> {
  protected readonly alias = 'p';

  constructor(
    @InjectRepository(Page) orm: Repository<Page>,
    logger: AppLoggerService,
    configService: ConfigService,
    @Inject(BASE_CONTEXT_CONFIG_TOKEN)
    tableConfig: RepositoryTableConfig,
  ) {
    super(orm, logger, configService, tableConfig);
  }

  protected readonly filterMap: FilterMap<PageFilter, Page> = {
    ids: (query, value) => query.andWhereInIds(value),
    url: (query, val) => this.addFilter(query, 'url', val, 'like'),
    websiteId: (query, val) => {
      query
        .innerJoin('page.websites', 'website')
        .andWhere('website.id = :websiteId', { websiteId: val });
    },
    contexts: (query, val) => {
      if (val && val.length > 0) {
        query
          .innerJoin('page.contexts', 'context')
          .andWhere('context.code IN (:...contextCodes)', { contextCodes: val.map((c) => c.code) });
      }
    },
  };

  protected readonly sortMap: SortingMap<PageSort, Page> = {
    id: (query, order) => this.addSort(query, 'id', order),
    url: (query, order) => this.addSort(query, 'url', order),
    score: (query, order) => query.addOrderBy('evaluation.score', order),
    createdAt: (query, order) => query.addOrderBy('evaluation.createdAt', order),
  };
  async findManyWithLastEvalScore(
    queryArgs: PageQueryRequest,
  ): Promise<PaginationResponse<PageEvalDTO>> {
    const { filters, sortings, pagination } = queryArgs;
    const connection = this.getOrmRepository().manager.connection;
    const query = connection.createQueryBuilder().from(Page, 'page');
    this.applyContextRules(query, queryArgs.contexts, queryArgs.securityContext);

    const subQuery = connection
      .createQueryBuilder()
      .select('e.id', 'id')
      .addSelect('e.page_id', 'page_id')
      .addSelect('e.score', 'score')
      .addSelect('e.created_at', 'created_at')
      .addSelect('"e"."A"', 'A')
      .addSelect('"e"."AA"', 'AA')
      .addSelect('"e"."AAA"', 'AAA')
      .addSelect('"e"."tag_count"', 'tag_count')

      .from('evaluations', 'e')
      .distinctOn(['e.page_id'])
      .orderBy('e.page_id', 'ASC')
      .addOrderBy('e.created_at', 'DESC');

    query.innerJoin(`(${subQuery.getQuery()})`, 'evaluation', 'evaluation.page_id = page.id');

    query.select([
      'page.id AS id',
      'page.url AS url',
      'page.website_id AS "websiteId"',
      'page.created_at AS "createdAt"',
      'page.updated_at AS "updatedAt"',
      `json_build_object(
        'id', evaluation.id,
        'score', evaluation.score,
        'createdAt', evaluation.created_at,
        'A', evaluation."A",
        'AA', evaluation."AA",
        'AAA', evaluation."AAA",
        'tagCount', evaluation."tag_count"
      ) AS evaluation`,
    ]);

    this.applyDynamicFilters(query, filters);
    this.applyDynamicSorting(query, sortings);
    this.applyPagination(query, pagination);

    const rawData = await query.getRawMany();
    const count = await query.getCount();

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
  async findByPageByWebsiteId(websiteId: number, pageId: number): Promise<Page | null> {
    const query = this.getOrmRepository().createQueryBuilder(this.alias);
    query
      .where(`${this.alias}.id = :pageId`, { pageId })
      .andWhere(`${this.alias}.website_id = :websiteId`, { websiteId });
    return await query.getOne();
  }

  async upsertPages(
    websiteId: number,
    records: PageRecord[],
    securityContext: SecurityContext,
  ): Promise<void> {
    if (!records.length) return;

    const urls = records.map((r) => r.url);
    const hashes = records.map((r) => r.urlHash);

    const query = `
      WITH incoming_data AS (
        SELECT 
          $1::int AS website_id,
          u.url,
          u.url_hash::bigint AS url_hash
        FROM unnest($2::text[], $3::text[]) AS u(url, url_hash)
      )
      INSERT INTO pages (website_id, url, url_hash, created_by_id, updated_by_id)
      SELECT website_id, url, url_hash, $4::int, $4::int
      FROM incoming_data
      ON CONFLICT (website_id, url_hash) DO UPDATE
      SET updated_at = CURRENT_TIMESTAMP
      RETURNING id;
    `;

    this.runInTransaction(async (queryRunner) => {
      const rows: { id: number }[] = await queryRunner.query(query, [
        websiteId,
        urls,
        hashes,
        securityContext.user.id ?? null,
      ]);

      this.addContextRules(
        queryRunner,
        rows.map((r) => r.id),
        undefined,
        securityContext,
      );
      return rows.map((r) => r.id);
    });
  }

  async deletePagesWithContextCheck(
    pageIds: number[],
    securityContext: SecurityContext,
  ): Promise<void> {
    if (!pageIds.length) {
      return;
    }
    await this.runInTransaction(async (queryRunner) => {
      const query = `
      WITH target_pages AS (
        -- 1. Lock determinístico nas páginas para evitar race conditions
        SELECT p.id
        FROM pages p
        WHERE p.id = ANY($1::int[])
          AND p.deleted_at IS NULL
        ORDER BY p.id ASC
        FOR UPDATE
      ),
      removed_contexts AS (
        -- 2. Remove estritamente o meu contexto das páginas alvo
        DELETE FROM page_contexts pc
        USING target_pages tp
        WHERE pc.page_id = tp.id
          AND pc.context_id = $2::int
        RETURNING pc.page_id
      ),
      orphaned_pages AS (
        -- 3. Identifica as páginas afetadas que já NÃO possuem nenhum outro contexto
        SELECT rc.page_id AS id
        FROM removed_contexts rc
        WHERE NOT EXISTS (
          SELECT 1
          FROM page_contexts pc
          WHERE pc.page_id = rc.page_id
        )
      ),
      soft_deleted_pages AS (
        -- 4. Aplica soft delete apenas às que ficaram órfãs de contexto
        UPDATE pages p
        SET 
          deleted_at = CURRENT_TIMESTAMP,
          updated_by_id = $3::int
        FROM orphaned_pages op
        WHERE p.id = op.id
        RETURNING p.id
      )
      SELECT 
        (SELECT COUNT(*)::int FROM removed_contexts) AS unlinked_count,
        (SELECT COUNT(*)::int FROM soft_deleted_pages) AS soft_deleted_count;
    `;

      const result = await queryRunner.query(query, [
        pageIds,
        securityContext.user.context.id,
        securityContext.user.id ?? null,
      ]);
    });

    // No need to return anything as the method now returns void
  }

  public changePageContexts(
    pageId: number[],
    contexts: ContextEnum[],
    securityContext: SecurityContext,
  ): Promise<void> {
    return this.runInTransaction(async (queryRunner) => {
      await this.substituteContextRules(queryRunner, pageId, contexts, securityContext);
    });
  }
}
