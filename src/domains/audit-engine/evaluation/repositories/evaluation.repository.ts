import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, QueryBuilder, Repository, SelectQueryBuilder,In } from "typeorm";
import { Evaluation, EvaluationContext, SubjectType } from "../entities/evaluation.entity";
import { BaseTransactionalRepository } from "@common/repositories/base-transactional.repository";
import { FilterMap, SortingMap } from "@common/repositories/base.repository";
import {
  BaseFilter,
  BasePagination,
  BaseSort,
  SortCriteria,
} from "src/common/interfaces/types";
import { AppLoggerService } from "@core/app-logger/app-logger.service";
import { ConfigService } from "@nestjs/config";
import { SecurityContext } from "src/core/authorization/SecurityContext";

export interface EvaluationFilter extends BaseFilter {
  id: number;
  ids: number[] | string[];
  score: string;
  context: EvaluationContext;
  pageId: number;
}

export interface EvaluationSorting extends BaseSort {
  id: SortCriteria;
  pageId: SortCriteria;
  context: SortCriteria;
  createdAt: SortCriteria;
  updatedAt: SortCriteria;
  score: SortCriteria;
}
type EvaluationQueryRequest = {
  filters: Partial<EvaluationFilter>;
  sortings: Partial<EvaluationSorting>;
  pagination: Partial<BasePagination>;
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
  
  protected readonly alias = "evaluation";

  
  protected readonly filterMap: FilterMap<EvaluationFilter, Evaluation> = {
    id: (query, id) => query.andWhere({ id }),
    ids: (query, ids) =>
      ids?.length && query.andWhere({ id: In(ids.map(id => typeof id === 'string' ? parseInt(id, 10) : id)) }),
    score: (query, score) => query.andWhere({ score }),
    pageId: (query, pageId) => query.andWhere({ pageId }),
    context: (query, context) => query.andWhere({ context }),
  };

  protected readonly sortMap: SortingMap<EvaluationSorting, Evaluation> = {
    id: (query, order: SortCriteria) =>
      query.addOrderBy(`${this.alias}.id`, order),
    pageId: (query, order: SortCriteria) =>
    query.addOrderBy(`${this.alias}.pageId`, order),
    score: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.score`, order),
    createdAt: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.createdAt`, order),
    updatedAt: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.updatedAt`, order),
    context: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.context`, order),
  };

  public async getManyEvaluationsAMS(pageId: number, queryArgs: EvaluationQueryRequest ): Promise<{ data: Evaluation[]; count: number }> {
    const query = this.ormRepo.createQueryBuilder(`${this.alias}`);
    query.where({pageId : pageId});
    query.andWhere(
      new Brackets(qb => {
        qb.where({ context: EvaluationContext.ADMIN_AMS })
          .orWhere({ isVisiblePublic: true });
      })
    );
    this.applyDynamicFilters(query, queryArgs.filters);
    this.applyDynamicSorting(query, queryArgs.sortings);
    this.applyPagination(query, queryArgs.pagination);

    const [data, count] = await query.getManyAndCount();
    return { data, count };
  }

  public async getManyEvaluationsByPageIdORG(pageId: number, queryArgs: EvaluationQueryRequest): Promise<{ data: Evaluation[]; count: number }> {
    const query = this.ormRepo.createQueryBuilder(`${this.alias}`);
    query.where({ pageId });
    query.andWhere(
      new Brackets(qb => {
        qb.where({ context: EvaluationContext.MY_MONITOR })
          .orWhere({ isVisibleOrganizations: true });
      })
    );
    this.applyDynamicFilters(query, queryArgs.filters);
    this.applyDynamicSorting(query, queryArgs.sortings);
    this.applyPagination(query, queryArgs.pagination);

    const [data, count] = await query.getManyAndCount();
    return { data, count };
  }

  public async getManyEvaluationsByPageIdSTUDY(pageId: number, queryArgs: EvaluationQueryRequest): Promise<{ data: Evaluation[]; count: number }> {
    const query = this.ormRepo.createQueryBuilder(`${this.alias}`);
    query.where({ pageId });
    query.andWhere({ context: EvaluationContext.STUDY_MONITOR });
    query.andWhere({ isVisiblePublic: false });
    query.andWhere({ isVisibleOrganizations: false });
    query.andWhere({ ownerSubjectId: queryArgs.securityContext.user.id });
    query.andWhere({ ownerType: SubjectType.USER });
    this.applyDynamicFilters(query, queryArgs.filters);
    this.applyDynamicSorting(query, queryArgs.sortings);
    this.applyPagination(query, queryArgs.pagination);

    const [data, count] = await query.getManyAndCount();
    return { data, count };
  }

  private getBaseQuery(): SelectQueryBuilder<Evaluation> {
    return this.ormRepo
      .createQueryBuilder(`${this.alias}`)
      .innerJoin(`${this.alias}.page`, "p")
      .leftJoin("p.websites", "w");
  }

  async findWithDetails(filters: EvaluationFilter): Promise<Evaluation[]> {
    const query = this.getBaseQuery();
    this.applyDynamicFilters(query, filters);

    query.orderBy(`${this.alias}.createdAt`, "DESC");

    return await query.getMany();
  }

  async findNewestByPageId(pageId: number): Promise<Evaluation | null> {
    const query = this.getBaseQuery().where(`${this.alias}.pageId = :pageId`, { pageId });

    return await query.orderBy(`${this.alias}.createdAt`, "DESC").getOne();
  }


}
