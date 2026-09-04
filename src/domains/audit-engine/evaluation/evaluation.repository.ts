import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, QueryBuilder, Repository, SelectQueryBuilder, In } from 'typeorm';
import { Evaluation, EvaluationStatus, PublishStatus } from './entities/evaluation.entity';
import { BaseTransactionalRepository } from '@common/repositories/base-transactional.repository';
import { FilterMap, SortingMap } from '@common/repositories/base.repository';
import { BaseFilter, BasePagination, BaseSort, SortCriteria } from 'src/common/interfaces/types';
import { AppLoggerService } from '@core/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import {
  ContextEnum,
  ContextMapByRole,
  getContextIdByCode,
  getContextIdByRole,
} from 'src/domains/inventory/context/context.enum';
import { EvaluationContext } from './entities/contexts-evaluation.entity';
import { EvaluationScoring } from './types';

export interface EvaluationFilter extends BaseFilter {
  id: number;
  ids: number[] | string[];
  score: string;
  pageId: number;
}

export interface EvaluationSorting extends BaseSort {
  id: SortCriteria;
  pageId: SortCriteria;
  createdAt: SortCriteria;
  updatedAt: SortCriteria;
  score: SortCriteria;
}

type EvaluationQueryRequest = {
  filters: Partial<EvaluationFilter>;
  sortings: Partial<EvaluationSorting>;
  pagination: Partial<BasePagination>;
  contexts: ContextEnum[];
  securityContext: SecurityContext;
};

@Injectable()
export class EvaluationRepository extends BaseTransactionalRepository<
  Evaluation,
  EvaluationFilter,
  EvaluationSorting
> {
  constructor(
    @InjectRepository(Evaluation)
    private readonly ormRepo: Repository<Evaluation>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
  ) {
    super(ormRepo, logger, configService);
    this.logger.setContext(EvaluationRepository.name);
  }

  protected readonly alias = 'evaluation';
  protected readonly contextAlias = 'evaluation_context';

  protected readonly filterMap: FilterMap<EvaluationFilter, Evaluation> = {
    id: (query, id) => query.andWhere({ id }),
    ids: (query, ids) =>
      ids?.length &&
      query.andWhere({ id: In(ids.map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))) }),
    score: (query, score) => query.andWhere({ score }),
    pageId: (query, pageId) => query.andWhere({ pageId }),
  };

  protected readonly sortMap: SortingMap<EvaluationSorting, Evaluation> = {
    id: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.id`, order),
    pageId: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.pageId`, order),
    score: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.score`, order),
    createdAt: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.createdAt`, order),
    updatedAt: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.updatedAt`, order),
  };

  private applyContextFilter(
    query: SelectQueryBuilder<Evaluation>,
    contexts: ContextEnum[] | undefined,
    securityContext: SecurityContext,
  ): void {
    const targetContexts: number[] =
      contexts && contexts.length > 0
        ? contexts
            .map((context) => getContextIdByCode(context))
            .filter((id): id is number => id !== undefined)
        : [getContextIdByRole(securityContext.user.role_slug)].filter(
            (id): id is number => id !== undefined,
          );
    if (!targetContexts || targetContexts.length === 0) {
      throw new BadRequestException('User role does not have an associated context');
    }
    query
      .innerJoin(
        'evaluation_contexts',
        this.contextAlias,
        `${this.contextAlias}.evaluation_id = ${this.alias}.id`,
      )
      .andWhere(`${this.contextAlias}.context_id IN (:...contextIds)`, {
        contextIds: targetContexts,
      });
  }

  public async getManyEvaluations(
    websiteId: number,
    pageId: number,
    queryArgs: EvaluationQueryRequest,
  ): Promise<{ data: Evaluation[]; count: number }> {
    const query = this.ormRepo.createQueryBuilder(`${this.alias}`);
    query
      .innerJoin(`${this.alias}.page`, 'p')
      .innerJoin('p.website', 'w')
      .where('w.id = :websiteId', { websiteId })
      .andWhere(`${this.alias}.pageId = :pageId`, { pageId });
    this.applyContextFilter(query, queryArgs.contexts, queryArgs.securityContext);
    query.where({ websiteId: websiteId, pageId: pageId });
    this.applyContextFilter(query, queryArgs.contexts, queryArgs.securityContext);
    this.applyDynamicFilters(query, queryArgs.filters);
    this.applyDynamicSorting(query, queryArgs.sortings);
    this.applyPagination(query, queryArgs.pagination);
    const [data, count] = await query.getManyAndCount();
    return { data, count };
  }

  private getBaseQuery(): SelectQueryBuilder<Evaluation> {
    return this.ormRepo
      .createQueryBuilder(`${this.alias}`)
      .innerJoin(`${this.alias}.page`, 'p')
      .innerJoin('p.website', 'w');
  }

  async createEvaluation(evaluation: Evaluation, contextId: number): Promise<Evaluation> {
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      const savedEval = await transactionalEntityManager.save(evaluation);

      const evaluationContext = transactionalEntityManager.create(EvaluationContext, {
        evaluationId: savedEval.id,
        contextId: contextId,
      });

      await transactionalEntityManager.save(evaluationContext);

      return savedEval;
    });
  }
  async createManyEvaluations(evaluations: Evaluation[], contextId: number): Promise<Evaluation[]> {
    return await this.dataSource.transaction(async (entityManager) => {
      const savedEvals = await entityManager.save(Evaluation, evaluations);

      const contexts = savedEvals.map((evalItem) => {
        const ec = new EvaluationContext();
        ec.evaluationId = evalItem.id;
        ec.contextId = contextId;
        return ec;
      });

      await entityManager.save(EvaluationContext, contexts);

      return savedEvals;
    });
  }

  async updateEntityFromRawData(
    evaluationId: number,
    evaluationData: EvaluationScoring,
  ): Promise<Evaluation> {
    const evaluation = await this.findByIdOrFail(evaluationId);
    evaluation.pageTitle = evaluationData.title;
    evaluation.A = evaluationData.A;
    evaluation.AA = evaluationData.AA;
    evaluation.AAA = evaluationData.AAA;
    evaluation.score = evaluationData.score;
    evaluation.createdAt = new Date(evaluationData.createdAt);
    return await this.orm.save(evaluation);
  }

  async updateStatus(evaluationId: number, status: EvaluationStatus): Promise<Evaluation> {
    const evaluation = await this.findByIdOrFail(evaluationId);
    evaluation.status = status;
    return await this.orm.save(evaluation);
  }

  async updatePublishStatus(evaluationId: number, status: PublishStatus): Promise<Evaluation> {
    const evaluation = await this.findByIdOrFail(evaluationId);
    evaluation.publishStatus = status;
    return await this.orm.save(evaluation);
  }

  async findWithDetails(filters: EvaluationFilter): Promise<Evaluation[]> {
    const query = this.getBaseQuery();
    this.applyDynamicFilters(query, filters);

    query.orderBy(`${this.alias}.createdAt`, 'DESC');

    return await query.getMany();
  }

  async findNewestByPageId(pageId: number): Promise<Evaluation | null> {
    const query = this.getBaseQuery().where(`${this.alias}.pageId = :pageId`, { pageId });

    return await query.orderBy(`${this.alias}.createdAt`, 'DESC').getOne();
  }

  async findEvaluationById(
    websiteId: number,
    pageId: number,
    evaluationId: number,
    securityContext: SecurityContext,
  ): Promise<Evaluation | null> {
    const query = this.getBaseQuery()
      .where(`${this.alias}.id = :evaluationId`, { evaluationId })
      .andWhere(`${this.alias}.pageId = :pageId`, { pageId })
      .andWhere('w.id = :websiteId', { websiteId })
      .innerJoin(
        'evaluation_contexts',
        this.contextAlias,
        `${this.contextAlias}.evaluation_id = ${this.alias}.id`,
      )
      .andWhere(`${this.contextAlias}.contextId IN (:...contextIds)`, {
        contextIds: [securityContext.user.context.id],
      });
    return await query.getOne();
  }
}
