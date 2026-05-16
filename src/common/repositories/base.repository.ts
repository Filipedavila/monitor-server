import { Injectable } from "@nestjs/common";
import {
  Repository,
  DeleteResult,
  SelectQueryBuilder,
  In,
  FindOptionsWhere,
  QueryBuilder,
} from "typeorm";
import { chunkArray } from "../utils/utils";
import {
  BaseFilter,
  BasePagination,
  BaseSort,
  SortCriteria,
} from "../interfaces/types";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";
import { BaseModel } from "../entities/base.entity";
import { ConfigService } from "@nestjs/config";
import { SecurityContext } from "src/core/authorization/SecurityContext";

export type FilterMap<F, T extends BaseModel> = {
  [P in keyof F]-?: (query: SelectQueryBuilder<T>, value: F[P]) => void;
};

export type SortingMap<S, T extends BaseModel> = {
  [P in keyof S]-?: (query: SelectQueryBuilder<T>, order: SortCriteria) => void;
};

export interface QueryRequest<F, S, P> {
  filters?: Partial<F>;
  sorting?: Partial<S>;
  pagination?: Partial<P>;
  securityContext?: SecurityContext; 
}
export interface QueryResponse<T> {
  data: T[];
  count: number;
}

@Injectable()
export abstract class EntityRepository<
  T extends BaseModel,
  F extends BaseFilter = BaseFilter,
  S extends BaseSort = BaseSort,
  P extends BasePagination = BasePagination,
> {
  constructor(
    public readonly orm: Repository<T>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
  ) {
    this.maxPaginationLimit = this.configService.get<number>(
      "PAGINATION_MAX_LIMIT",
      100,
    );
    this.primaryKey = this.orm.metadata.primaryColumns[0].propertyName;
  }
  protected readonly maxPaginationLimit: number;
  protected readonly primaryKey: string;
  protected abstract readonly alias: string;
  protected abstract readonly filterMap: FilterMap<F, T>;
  protected abstract readonly sortMap: SortingMap<S, T>;

  /** Find entities based on dynamic filters, sorting, and pagination.
   *
   * @param filters
   * @param sorts
   * @param pagination
   * @returns { data: T[]; count: number }
   */
 
    abstract  applyAuthorization(query: QueryBuilder<T>, rules:any,operation:string): Promise<void>;
  
    async findOneBy( filters: Partial<F> ): Promise<T | null> {
    const query = this.orm.createQueryBuilder(this.alias);
    this.applyDynamicFilters(query, filters);
    const result = await query.getOne();
    return result || null;
  } 

    async findMany(queryArgs: QueryRequest<F, S, P>): Promise<QueryResponse<T>> {
    const query = this.orm.createQueryBuilder(this.alias);
    if (queryArgs.securityContext) {
      await this.applyAuthorization(query, queryArgs.securityContext, "read");
    }
    this.applyDynamicFilters(query, queryArgs.filters);
    this.applyDynamicSorting(query, queryArgs.sorting);
    this.applyPagination(query, queryArgs.pagination);
    const [data, count] = await query.getManyAndCount();
    return { data, count };
  }


  async findById(id: string | number): Promise<T | null> {
    return await this.orm.findOneBy({
      [this.primaryKey]: id,
    } as FindOptionsWhere<T>);
  }

  async save(data: T): Promise<T> {
    return this.orm.save(data);
  }
  /*
   * Saves multiple entities in batches to optimize performance and reduce memory usage.
   * @param data - An array of entities to be saved.
   * @returns A promise that resolves to an array of saved entities.
   */
  async saveMany(data: T[]): Promise<T[]> {
    if (!data?.length) return [];

    const chunks = chunkArray(data, 10);
    const savedEntities: T[] = [];

    for (const chunk of chunks) {
      try {
        const results = await this.orm.save(chunk);
        savedEntities.push(...results);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.logger.error(
          `[${this.orm.metadata.name}] Failed to save chunk`,
          error.stack,
        );
        throw error;
      }
    }

    return savedEntities;
  }

  async delete(id: string | number): Promise<DeleteResult> {
    return this.orm.delete({ [this.primaryKey]: id } as FindOptionsWhere<T>);
  }

  async deleteMany(ids: Array<string | number>): Promise<DeleteResult> {
    if (!ids || ids.length === 0) {
      return { raw: [], affected: 0 } as DeleteResult;
    }
    const result = await this.orm.delete({
      [this.primaryKey]: In(ids),
    } as FindOptionsWhere<T>);
    return result;
  }

  protected applyPagination(
    query: SelectQueryBuilder<T>,
    pagination?: Partial<P>,
  ): void {
    const rawLimit = pagination?.limit ?? 10;
    const limit = Math.min(Math.max(1, rawLimit), this.maxPaginationLimit);
    const rawPage = pagination?.page ?? 1;
    const page = Math.max(1, rawPage);

    const skip = (page - 1) * limit;
    query.take(limit).skip(skip);
  }

  protected applyDynamicFilters(
    query: SelectQueryBuilder<T>,
    filters?: Partial<F>,
  ): void {
    console.log("Filters recebido para aplicação:", filters); // Log para depuração
    if (!filters) return;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && this.filterMap[key as keyof F]) {
        this.filterMap[key as keyof F](query, value);
      }
    });
  }

  protected applyDynamicSorting(
    query: SelectQueryBuilder<T>,
    sorting?: Partial<S>,
  ): void {
    console.log("Sorting recebido para aplicação:", sorting); // Log para depuração
    if (!sorting) return;


    Object.entries(sorting).forEach(([key, order]) => {
      console.log(`Aplicando ordenação para ${key} com ordem ${order}`); // Log para depuração
      if (order && this.sortMap[key as keyof S]) {
        this.sortMap[key as keyof S](query, (order as SortCriteria) || "DESC");
      }
    });
  }

  async rawQuery(sql: string, parameters?: any[]): Promise<any> {
    return this.orm.query(sql, parameters);
  }

  protected getColumnName(propertyName: keyof T): string {
    const column = this.orm.metadata.findColumnWithPropertyName(
      String(propertyName),
    );

    if (!column) {
      throw new Error(
        `[${this.orm.metadata.name}] Property "${String(propertyName)}" does not exist in the entity.`,
      );
    }
    return `${this.alias}.${column.databaseName}`;
  }

  protected addFilter(
    query: SelectQueryBuilder<T>,
    property: keyof T,
    value: any,
    operator: "eq" | "in" | "like" = "eq",
  ) {
    const col = this.getColumnName(property);
    const param = `p_${String(property)}`;

    if (operator === "in" && Array.isArray(value) && value.length) {
      query.andWhere(`${col} IN (:...${param})`, { [param]: value });
    } else if (operator === "like") {
      query.andWhere(`${col} LIKE :${param}`, { [param]: `%${value}%` });
    } else if (operator === "eq") {
      query.andWhere(`${col} = :${param}`, { [param]: value });
    }
  }

  protected addSort(
    query: SelectQueryBuilder<T>,
    propertyName: keyof T,
    order: SortCriteria = "ASC",
  ): void {
    const columnName = this.getColumnName(propertyName);

    query.addOrderBy(columnName, order);
  }
}
