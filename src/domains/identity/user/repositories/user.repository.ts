import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../user.entity';
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


export interface UserFilter extends BaseFilter, Pick<User, "id" | "username" | "email" | "fullName"> {
  id: number;
  username: string;
  email: string;
  fullName: string;
  searchTerm: string;
  role: string;
}

export interface UserSorting extends BaseSort {
  id: SortCriteria;
  username: SortCriteria;
  createdAt: SortCriteria;
  updatedAt: SortCriteria;
  lastLogin: SortCriteria;
  role: SortCriteria;
}

type UserQueryRequest = {
  filters?: Partial<UserFilter>;
  sortings?: Partial<UserSorting>;
  pagination?: Partial<BasePagination>;
  securityContext: SecurityContext;
};

@Injectable()
export class UserRepository extends BaseTransactionalRepository<User, UserFilter, UserSorting> {
  constructor(@InjectRepository(User) private readonly ormRepo: Repository<User>,
                                      protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
  ) {
    super(ormRepo, logger, configService);
    this.logger.setContext(UserRepository.name);
  }
    protected readonly alias = "user";


  protected readonly filterMap: FilterMap<UserFilter, User> = {
    ids: (query, ids) => ids?.length && query.andWhere(`${this.alias}.id IN (:...ids)`, { ids }),
    id: (query, id) => query.andWhere(`${this.alias}.id = :id`, { id }),
    username: (query, username) => query.andWhere(`${this.alias}.username = :username`, { username }),
    email: (query, email) => query.andWhere(`${this.alias}.email = :email`, { email }),
    fullName: (query, fullName) => query.andWhere(`${this.alias}.fullName = :fullName`, { fullName }),
    searchTerm: (query, term) => 
      query.andWhere(`(${this.alias}.username LIKE :term OR ${this.alias}.fullName LIKE :term OR ${this.alias}.email LIKE :term)`, { term: `%${term}%` }),
    role: (query, role) => query.andWhere(`role.slug = :role`, { role }),

  };

  protected readonly sortMap: SortingMap<UserSorting, User> = {
    id: (query, order) => query.addOrderBy(`${this.alias}.id`, order),
    username: (query, order) => query.addOrderBy(`${this.alias}.username`, order),
    createdAt: (query, order) => query.addOrderBy(`${this.alias}.createdAt`, order),
    updatedAt: (query, order) => query.addOrderBy(`${this.alias}.updatedAt`, order),
    lastLogin: (query, order) => query.addOrderBy(`${this.alias}.lastLogin`, order),
    role: (query, order) => query.addOrderBy(`role.displayName`, order),
  };

  
async findByUniqueCriteria(criteria: { ccNumber?: string; email: string; username: string }): Promise<User[] | null> {
    const { ccNumber, email, username } = criteria;

    const whereConditions: FindOptionsWhere<User>[] = [
      { email },
      { username }
    ];

    if (ccNumber) {
      whereConditions.push({ ccNumber });
    }

    return this.ormRepo.find({
      where: whereConditions
    });
  }
  
  
}