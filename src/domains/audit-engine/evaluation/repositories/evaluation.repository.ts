import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, QueryBuilder, Repository, SelectQueryBuilder,In } from "typeorm";
import { Evaluation } from "../entities/evaluation.entity";
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
import { ContextEnum, ContextMapByRole } from "src/domains/inventory/context/context.enum";

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
  
  protected readonly alias = "evaluation";
  protected readonly contextAlias = "evaluation_context";
  
  protected readonly filterMap: FilterMap<EvaluationFilter, Evaluation> = {
    id: (query, id) => query.andWhere({ id }),
    ids: (query, ids) =>
      ids?.length && query.andWhere({ id: In(ids.map(id => typeof id === 'string' ? parseInt(id, 10) : id)) }),
    score: (query, score) => query.andWhere({ score }),
    pageId: (query, pageId) => query.andWhere({ pageId }),
   
  };

  protected readonly sortMap: SortingMap<EvaluationSorting, Evaluation> = {
    id: (query, order: SortCriteria) =>
      query.addOrderBy(`${this.alias}.id`, order),
    pageId: (query, order: SortCriteria) =>
    query.addOrderBy(`${this.alias}.pageId`, order),
    score: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.score`, order),
    createdAt: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.createdAt`, order),
    updatedAt: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.updatedAt`, order),
  };


  private applyContextFilter(query: SelectQueryBuilder<Evaluation>, contexts: ContextEnum[], securityContext: SecurityContext): void {

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

    public async getManyEvaluations(pageId: number, queryArgs: EvaluationQueryRequest ): Promise<{ data: Evaluation[]; count: number }> {
        const query = this.ormRepo.createQueryBuilder(`${this.alias}`);
            query.where({pageId : pageId});
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
