import { Injectable } from '@nestjs/common';
import {  Repository, DeleteResult, SelectQueryBuilder, In, FindOptionsWhere } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

export type FilterMap<F> = {
  [P in keyof F]-?: (query: SelectQueryBuilder<any>, value: F[P]) => void;
};
export interface BaseEntity {
  id: string | number;
}

@Injectable()
export abstract class EntityRepository<T> {
   constructor(protected readonly orm: Repository<T>) {
   }
    async findAll():Promise<T[]> {
        return await this.orm.find();
    }

    async findById(id: string | number): Promise<T | null> {
         const primaryKey = this.orm.metadata.primaryColumns[0].propertyName;
        return  await this.orm.findOneBy({ [primaryKey]: id } as FindOptionsWhere<T>);
    }

    async save(data: T): Promise<T> {
        return  this.orm.save(data);
    }
    async insertMany(data: T[]): Promise<void> {
    if (!data?.length) return;
    await this.orm.insert(data as QueryDeepPartialEntity<T>[]); 
  }

    async delete(id: string | number): Promise<DeleteResult> {
        const primaryKey = this.orm.metadata.primaryColumns[0].propertyName;
        return  this.orm.delete({ [primaryKey]: id } as FindOptionsWhere<T>);
    }
    
    async deleteMany(ids: Array<string | number>): Promise<DeleteResult> {
        if (!ids || ids.length === 0) {
        return { raw: [], affected: 0 } as DeleteResult;
        }
        const primaryKey = this.orm.metadata.primaryColumns[0].propertyName;
        const result = await this.orm.delete({ [primaryKey]: In(ids) } as FindOptionsWhere<T>);
        return result;
    }

    protected applyDynamicFilters<F>(
    query: SelectQueryBuilder<T>,
    filters: F,
    mappings: FilterMap<F>,
  ): void {
    if (!filters) return;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && mappings[key as keyof F]) {
        mappings[key as keyof F](query, value);
      }
    });
  }
}