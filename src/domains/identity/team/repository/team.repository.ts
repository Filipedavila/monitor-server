import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseTransactionalRepository } from "@common/repositories/base-transactional.repository";
import { FilterMap, SortingMap } from "@common/repositories/base.repository";
import {
  BaseFilter,
  BasePagination,
  BaseSort,
  SortCriteria,
} from "src/common/interfaces/types";
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { Team } from '../team.entity';


export interface TeamFilter extends BaseFilter, Pick<Team, "id" | "teamName"> {
  id: number;
  teamName: string;
  searchTerm: string;

}

export interface TeamSorting extends BaseSort {
  id: SortCriteria;
  teamName: SortCriteria;
  createdAt: SortCriteria;
  updatedAt: SortCriteria;
}

type TeamQueryRequest = {
  filters?: Partial<TeamFilter>;
  sortings?: Partial<TeamSorting>;
  pagination?: Partial<BasePagination>;
  securityContext: SecurityContext;
};

@Injectable()
export class TeamRepository extends BaseTransactionalRepository<Team, TeamFilter, TeamSorting> {
  constructor(@InjectRepository(Team) private readonly ormRepo: Repository<Team>,
                                      protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
  ) {
    super(ormRepo, logger, configService);
    this.logger.setContext(TeamRepository.name);
  }
    protected readonly alias = "team";


  protected readonly filterMap: FilterMap<TeamFilter, Team> = {
    ids: (query, ids) => ids?.length && query.andWhere(`${this.alias}.id IN (:...ids)`, { ids }),
    id: (query, id) => query.andWhere(`${this.alias}.id = :id`, { id }),
    teamName: (query, teamName) => query.andWhere(`${this.alias}.teamName = :teamName`, { teamName }),
    searchTerm: (query, term) => 
      query.andWhere(`(${this.alias}.teamName LIKE :term)`, { term: `%${term}%` }),

  };

  protected readonly sortMap: SortingMap<TeamSorting, Team> = {
    id: (query, order) => query.addOrderBy(`${this.alias}.id`, order),
    teamName: (query, order) => query.addOrderBy(`${this.alias}.teamName`, order),
    createdAt: (query, order) => query.addOrderBy(`${this.alias}.createdAt`, order),
    updatedAt: (query, order) => query.addOrderBy(`${this.alias}.updatedAt`, order),
  };


  
}