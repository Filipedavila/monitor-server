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
import { RoleSlug, UserPermission } from 'src/core/authentication/interfaces/types';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { FGA_RESOURCE } from 'src/core/authorization/types/fga.types';
import { AuthorizationEvent } from 'src/core/authorization/queue/payload.types';
import { AUTHORIZATION_ACTION } from 'src/core/authorization/registry/registry.keys';


export interface UserFilter extends BaseFilter, Pick<User, "id" | "username" > {
  id: number;
  username: string;
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
                                      protected readonly outboxService: OutboxService,

  ) {
    super(ormRepo, logger, configService);
    this.logger.setContext(UserRepository.name);
  }
    protected readonly alias = "user";


  protected readonly filterMap: FilterMap<UserFilter, User> = {
    ids: (query, ids) => ids?.length && query.andWhere(`${this.alias}.id IN (:...ids)`, { ids }),
    id: (query, id) => query.andWhere(`${this.alias}.id = :id`, { id }),
    username: (query, username) => query.andWhere(`${this.alias}.username = :username`, { username }),
    searchTerm: (query, term) => 
      query.andWhere(`(${this.alias}.username LIKE :term)`, { term: `%${term}%` }),
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

  
async findByUniqueCriteria(criteria: { ccNumber?: string, username: string }): Promise<User[] | null> {
    const { ccNumber, username } = criteria;

    const whereConditions: FindOptionsWhere<User>[] = [
      { username }
    ];

    if (ccNumber) {
      whereConditions.push({ ccNumber });
    }

    return this.ormRepo.find({
      where: whereConditions
    });
  }

  async createUser(user: User, role:RoleSlug, permission: UserPermission): Promise<User> {

   return  this.runInTransaction(async (queryRunner) => {

      const savedUser = await queryRunner.manager.save(User, user);
      const manager = queryRunner.manager;
       await this.outboxService.putInOutbox(manager, {
              aggregateType: FGA_RESOURCE.USER,
              aggregateId: savedUser.id,
              eventType: AuthorizationEvent.AUTHORIZATION,
              payload: { 
                resourceType: FGA_RESOURCE.USER, 
                resourceId: savedUser.id.toString(), 
                action: AUTHORIZATION_ACTION.USER_CREATE, 
                userId: savedUser.id,
                role: role,
                permission: permission,
              }
              }, 
            );
            
            return savedUser;
          });
    }

    async updateUser(user: User, role:RoleSlug, permission: UserPermission): Promise<User> {
      return this.runInTransaction(async (queryRunner) => {
        const updatedUser = await queryRunner.manager.save(User, user);
        const manager = queryRunner.manager;

         await this.outboxService.putInOutbox(manager, {
                aggregateType: FGA_RESOURCE.USER,
                aggregateId: updatedUser.id,
                eventType: AuthorizationEvent.AUTHORIZATION,
                payload: { 
                  resourceType: FGA_RESOURCE.USER, 
                  resourceId: updatedUser.id.toString(), 
                  action: AUTHORIZATION_ACTION.USER_UPDATE, 
                  userId: updatedUser.id,
                  role: role,
                  permission: permission,
                }
                }, 
              );
              
              return updatedUser;
            });
          }

      async deleteUser(userId: number): Promise<void> {
        return this.runInTransaction(async (queryRunner) => {
          await queryRunner.manager.delete(User, { id: userId });
          const manager = queryRunner.manager;
          
           await this.outboxService.putInOutbox(manager, {
                  aggregateType: FGA_RESOURCE.USER,
                  aggregateId: userId,
                  eventType: AuthorizationEvent.AUTHORIZATION,
                  payload: { 
                    resourceType: FGA_RESOURCE.USER, 
                    resourceId: userId.toString(), 
                    action: AUTHORIZATION_ACTION.USER_DELETE, 
                    userId: userId,
                  }
                  }, 
                );
                
            });
          }
  
}