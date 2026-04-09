import { Injectable } from "@nestjs/common";
import {  EntityRepository, QueryRequest } from "./base.repository";
import { Repository, SelectQueryBuilder } from "typeorm";
import { BaseAccess, GranteeType } from "../entities/base-access.entity";
import { BaseFilter, BasePagination, BaseSort } from "../interfaces/types";
import { BaseModel } from "../entities/base.entity";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";

export interface SecurableEntity {
  accessControl: any[];
}
export interface AccessIdentity {
  id: number;
  type: GranteeType; 
}

@Injectable()
export abstract class SecureEntityRepository<T extends BaseModel,A extends BaseAccess, F extends BaseFilter, S extends BaseSort, P extends BasePagination>
    extends EntityRepository<T, F, S, P> {
  
    constructor(orm: Repository<T>,
      protected readonly accessOrm: Repository<A>,
       logger: AppLoggerService) {
      super(orm, logger);
    } 

  async findSecure(
    queryArgs: QueryRequest<F, S, P>, 
    identities: AccessIdentity[]
  ): Promise<{ data: T[]; count: number }> {
    const query = this.orm.createQueryBuilder('entity');

    this.applySecurityFilter(query, identities);

    this.applyDynamicFilters(query, queryArgs?.filters);
    this.applyDynamicSorting(query, queryArgs?.sorting);
    this.applyPagination(query, queryArgs?.pagination);

    const [data, count] = await query
    .distinct(true) 
    .getManyAndCount();
    
    return { data, count };
  }

 protected applySecurityFilter(query: SelectQueryBuilder<T>, identities: AccessIdentity[]) {
  if (!identities?.length) return query.andWhere('1 = 0');

  const mainAlias = query.alias;
  const accessAlias = 'ac';

  const relation = this.accessOrm.metadata.relations.find(
    (r) => r.type === this.orm.target
  );

  if (!relation) {
    throw new Error(`Nenhuma relação encontrada em ${this.accessOrm.metadata.name} para ${this.orm.metadata.name}`);
  }

  const joinColumn = relation.joinColumns[0].databaseName;

  const filter = identities
    .map((_, i) => `(${accessAlias}.grantee_id = :id${i} AND ${accessAlias}.grantee_type = :type${i})`)
    .join(' OR ');
    
    const params = identities.reduce((acc, id, i) => {
      acc[`id${i}`] = id.id;
      acc[`type${i}`] = id.type;
      return acc;
    }, {} as Record<string, number | GranteeType>);

  return query
    .innerJoin(
      this.accessOrm.metadata.tableName, 
      accessAlias, 
      `${accessAlias}.${joinColumn} = ${mainAlias}.id`
    )
    .andWhere(`${mainAlias}.deletedAt IS NULL`)
    .andWhere(`(${filter})`, params);
}
}