import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
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

export interface EvaluationFilter extends BaseFilter {
  id?: number;
  ids?: number[] | string[];
  evaluationId?: number;
  url?: string;
}

export interface EvaluationSorting extends BaseSort {
  id?: SortCriteria;
  date?: SortCriteria;
  score?: SortCriteria;
}

@Injectable()
export class EvaluationRepository extends BaseTransactionalRepository<
  Evaluation,
  EvaluationFilter,
  EvaluationSorting,
  any
> {
  constructor(
    @InjectRepository(Evaluation)
    private readonly ormRepo: Repository<Evaluation>,
    protected readonly logger: AppLoggerService,
  ) {
    super(ormRepo, logger);
    this.logger.setContext(EvaluationRepository.name);
  }
  protected readonly alias = "evaluation";
  // Comments , penso estarem a puxar o page id e o website para ver quem criou o website para forma de RBA
  // ver qual a melhor abordagem visto estar a usaro CASL
  protected readonly filterMap: FilterMap<EvaluationFilter, Evaluation> = {
    id: (query, id) => query.andWhere("e.EvaluationId = :id", { id }),
    ids: (query, ids) =>
      ids?.length && query.andWhere("e.EvaluationId IN (:...ids)", { ids }),
    evaluationId: (query, evaluationId) =>
      query.andWhere("e.EvaluationId = :evaluationId", { evaluationId }),
    //pageId: (query, pageId) => query.andWhere('e.PageId = :pageId', { pageId }),
    // userId: (query, userId) => query.andWhere('w.UserId = :userId', { userId }),
    // websiteId: (query, websiteId) => query.andWhere('w.WebsiteId = :websiteId', { websiteId }),
    //websiteName: (query, name) => query.andWhere('w.Name = :name', { name }),
    url: (query, url) => query.andWhere("p.Uri LIKE :url", { url: `%${url}%` }),
  };

  protected readonly sortMap: SortingMap<EvaluationSorting, Evaluation> = {
    id: (query, order: SortCriteria) =>
      query.addOrderBy("e.EvaluationId", order),
    date: (query, order: SortCriteria) =>
      query.addOrderBy("e.Evaluation_Date", order),
    score: (query, order: SortCriteria) => query.addOrderBy("e.Score", order),
  };

  private getBaseQuery(): SelectQueryBuilder<Evaluation> {
    return this.ormRepo
      .createQueryBuilder("e")
      .innerJoin("e.page", "p")
      .leftJoin("p.websites", "w");
  }

  async findWithDetails(filters: EvaluationFilter): Promise<Evaluation[]> {
    const query = this.getBaseQuery();
    this.applyDynamicFilters(query, filters);

    query.orderBy("e.Evaluation_Date", "DESC");

    return await query.getMany();
  }

  async findNewestByPageId(pageId: number): Promise<Evaluation | null> {
    const query = this.getBaseQuery().where("e.PageId = :pageId", { pageId });

    return await query.orderBy("e.Evaluation_Date", "DESC").getOne();
  }
}
