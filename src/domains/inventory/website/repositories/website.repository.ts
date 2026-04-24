import { Injectable } from "@nestjs/common";
import { Brackets, Repository } from "typeorm"; 
import  {EntityRepository, FilterMap, 
  SortingMap 
} from "src/common/repositories/base.repository"; // Ajuste o path conforme sua estrutura
import { Website } from "../website.entity";
import { BaseFilter, BasePagination, BaseSort } from "src/common/interfaces/types";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";
import { ConfigService } from "@nestjs/config";


export interface WebsiteFilter extends BaseFilter {
  search?: string;
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
    protected readonly orm: Repository<Website>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
  ) {
    super(orm, logger, configService);
  }

  protected readonly filterMap: FilterMap<WebsiteFilter, Website> = {
    ids: (query, value) => query.andWhereInIds(value),
    search: (query, value) => {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`${this.alias}.title LIKE :search`, { search: `%${value}%` })
            .orWhere(`${this.alias}.base_url LIKE :search`, { search: `%${value}%` });
        }),
      );
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
}

