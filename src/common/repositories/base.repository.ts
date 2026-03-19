import { Injectable, Logger } from '@nestjs/common';
import {  Repository, DeleteResult, SelectQueryBuilder, In, FindOptionsWhere } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';
import { BasePaginationDto } from '../dto/base-pagination.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';
import { BaseSortDto } from '../dto/base-sort.dto';
import { chunkArray } from '../utils/utils';

export type SortCriteria = 'ASC' | 'DESC';

export type FilterMap<F,T> = {
  [P in keyof F]-?: (query: SelectQueryBuilder<T>, value: F[P]) => void;
};

export type SortingMap<S,T> = {
  [P in keyof S]-?: (query: SelectQueryBuilder<T>, order: SortCriteria) => void;
};


export interface BaseEntity {
  id: string | number;
}

@Injectable()
export abstract class EntityRepository<T, 
  F extends BaseFilterDto = BaseFilterDto,
  S extends BaseSortDto = BaseSortDto, 
  P extends BasePaginationDto = BasePaginationDto> {
  
  constructor(protected readonly orm: Repository<T>,protected readonly logger:Logger) {
    this.primaryKey = this.orm.metadata.primaryColumns[0].propertyName;
   }
   protected readonly primaryKey: string;

   protected abstract readonly filterMap: FilterMap<F, T>;
   protected abstract readonly sortMap: SortingMap<S, T>;


    async findAll():Promise<T[]> {
        return await this.orm.find();
    }

    async findById(id: string | number): Promise<T | null> {
        return  await this.orm.findOneBy({ [this.primaryKey]: id } as FindOptionsWhere<T>);
    }

    async save(data: T): Promise<T> {
        return  this.orm.save(data);
    }
    /*
    * Saves multiple entities in batches to optimize performance and reduce memory usage.
    * @param data - An array of entities to be saved.
    * @returns A promise that resolves to an array of saved entities.
    */
    async saveMany(data: T[]): Promise<T[]> {
      if (!data?.length) return [];
      
      const savedEntities: T[] = [];
        const chunks = chunkArray(data, 10); 

      for (const chunk of chunks) {
        try {
          const results = await this.orm.save(chunk);
          savedEntities.push(...results);
        } catch (err) {
        this.logger.error(`[${this.orm.metadata.name}] Failed to save chunk`, err.stack);        }
      }
      
      return savedEntities;
    }


    async delete(id: string | number): Promise<DeleteResult> {
        return  this.orm.delete({ [this.primaryKey]: id } as FindOptionsWhere<T>);
    }
    
    async deleteMany(ids: Array<string | number>): Promise<DeleteResult> {
        if (!ids || ids.length === 0) {
        return { raw: [], affected: 0 } as DeleteResult;
        }
        const result = await this.orm.delete({ [this.primaryKey]: In(ids) } as FindOptionsWhere<T>);
        return result;
    }

    protected applyPagination(
          query: SelectQueryBuilder<T>,
          pagination: P,
          filters: F,
          sorts: S,
        ): void {
          const limit = pagination.limit || 100;
          const page = pagination.page || 1;
          const skip = (page - 1) * limit;
            this.applyDynamicFilters(query, filters);
            this.applyDynamicSorting(query, sorts);
          query.take(limit).skip(skip);
    }

      protected applyDynamicFilters(
      query: SelectQueryBuilder<T>,
      filters: F
    ): void {
      if (!filters) return;
      if(filters.ids) {
        query.andWhereInIds(filters.ids);

      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && this.filterMap[key as keyof F]) {
          this.filterMap[key as keyof F](query, value);
        }
      });
    }

    protected applyDynamicSorting(
      query: SelectQueryBuilder<T>,
      sorting: S
    ): void {
      if (!sorting) return;

      Object.entries(sorting).forEach(([key, order]) => {
        if (order && this.sortMap[key as keyof S]) {
          this.sortMap[key as keyof S](query, (order as SortCriteria) || 'DESC');
        }
      });
    } 
}