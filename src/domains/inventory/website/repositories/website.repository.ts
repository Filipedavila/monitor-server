import { Injectable } from "@nestjs/common";
import { Brackets, QueryBuilder, Repository, SelectQueryBuilder } from "typeorm"; 
import  {EntityRepository, FilterMap, 
  QueryRequest, 
  QueryResponse, 
  SortingMap 
} from "src/common/repositories/base.repository"; // Ajuste o path conforme sua estrutura
import { Website } from "../website.entity";
import { BaseFilter, BasePagination, BaseSort } from "src/common/interfaces/types";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { FgaService } from "src/core/authorization/fga.service";


export interface WebsiteFilter extends BaseFilter {
  searchTerm?: string;
  baseUrl?: string;
  institutionId?: number;
}

export interface WebsiteSort extends BaseSort {
  title?: "ASC" | "DESC";
  score?: "ASC" | "DESC";
  createdAt?: "ASC" | "DESC";
  updatedAt?: "ASC" | "DESC";
  createdBy?: "ASC" | "DESC";
}

export interface WebsitePagination extends BasePagination {

}

@Injectable()
export class WebsiteRepository extends EntityRepository<
  Website,
  WebsiteFilter,
  WebsiteSort,
  WebsitePagination
> {
  protected readonly alias = 'w'; 
  constructor(
    @InjectRepository(Website)
    public readonly orm: Repository<Website>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
    private readonly fgaService: FgaService
  ) {
    super(orm, logger, configService);
  }

  protected readonly filterMap: FilterMap<WebsiteFilter, Website> = {
    ids: (query, value) => query.andWhereInIds(value),
    searchTerm: (query, value) => {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`${this.alias}.title LIKE :searchTerm`, { searchTerm: `%${value}%` })
            .orWhere(`${this.alias}.base_url LIKE :searchTerm`, { searchTerm: `%${value}%` });
        }),
      );
    },
    baseUrl: (query, value) => {
      query.andWhere(`${this.alias}.base_url = :baseUrl`, { baseUrl: value });
    },
    institutionId: (query, value) => {
      query.innerJoin(`${this.alias}.institutions`, 'inst')
           .andWhere('inst.id = :instId', { instId: value });
    },
  };

  protected readonly sortMap: SortingMap<WebsiteSort, Website> = {
    id: (query, order) => this.addSort(query, 'id', order),
    title: (query, order) => this.addSort(query, 'title', order),
    score: (query, order) => query.addOrderBy(`${this.alias}.averageScore`, order),
    createdAt: (query, order) => this.addSort(query, 'createdAt', order),
    updatedAt: (query, order) => this.addSort(query, 'updatedAt', order),
    createdBy: (query, order) => query.addOrderBy(`${this.alias}.createdById`, order)
  };



  public async applyAuthorization(query: SelectQueryBuilder<Website>, rules: any): Promise<void> {
    const queryuserId = rules.principal.id;
     const allowedIds = await this.fgaService.listObjects({
      user: `user:${queryuserId}`,
      relation: 'can_view',
      type: 'website',
      });
    };
  }
  

