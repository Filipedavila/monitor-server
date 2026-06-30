import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseTransactionalRepository } from 'src/common/repositories/base-transactional.repository';
import { FilterMap, SortingMap } from 'src/common/repositories/base.repository';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { BaseFilter, BaseSort, SortCriteria } from 'src/common/interfaces/types';
import {  TagWebsite } from './tag-website.entity';

export interface TagWebsiteFilter extends BaseFilter {
  tagId?: number;
  websiteId?: number;
  websiteTitle?: string; 
}

export interface TagWebsiteSort extends BaseSort {
  tagId?: SortCriteria;
  websiteTitle?: SortCriteria;
}

@Injectable()
export class TagWebsitesRepository extends BaseTransactionalRepository<
  TagWebsite,
  TagWebsiteFilter,
  TagWebsiteSort
> {
  protected readonly alias = 'tw'; 

  constructor(
    @InjectRepository(TagWebsite)
    protected readonly ormRepo: Repository<TagWebsite>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
  ) {
    super(ormRepo, logger, configService);
  }

  protected readonly filterMap: FilterMap<TagWebsiteFilter, TagWebsite> = {
    ids: (query, value) => {
      query.andWhere(`${this.alias}.id IN (:...ids)`, { ids: value });
    },
    tagId: (query, value) => {
      query.andWhere(`${this.alias}.tag_id = :tagId`, { tagId: value });
    },
    websiteId: (query, value) => {
      query.andWhere(`${this.alias}.website_id = :websiteId`, { websiteId: value });
    },
    websiteTitle: (query, value) => {
      this.ensureWebsiteJoin(query);
      query.andWhere(`w.title LIKE :title`, { title: `%${value}%` });
    }
  };

  protected readonly sortMap: SortingMap<TagWebsiteSort, TagWebsite> = {
    id: (query, order) => this.addSort(query, 'id', order),
    tagId: (query, order) => this.addSort(query, 'tagId', order),
    websiteTitle: (query, order) => {
      this.ensureWebsiteJoin(query);
      query.addOrderBy('w.title', order);
    }
  };


  private ensureWebsiteJoin(query: SelectQueryBuilder<TagWebsite>) {
    const hasJoin = query.expressionMap.joinAttributes.some(j => j.alias.name === 'w');
    if (!hasJoin) {
      // Acoplamento estrito à string 'websites', zero acoplamento ao código do Inventory
      query.innerJoin('websites', 'w', `w.id = ${this.alias}.website_id`);
    }
  }

  
  async findWebsitesByTagRaw(filters: TagWebsiteFilter, sort: TagWebsiteSort, limit: number, page: number) {
    const query = this.ormRepo.createQueryBuilder(this.alias);

    // Se o teu BaseRepo tem métodos protegidos para aplicar o mapa, usa-os aqui:
    this.applyDynamicFilters(query, filters);
    this.applyDynamicSorting(query, sort);

    // Selecionamos explicitamente os campos raw que queremos ler
    this.ensureWebsiteJoin(query); // Garante que temos a tabela
    query.select([
      `${this.alias}.tag_id AS "tagId"`,
      `${this.alias}.website_id AS "websiteId"`,
      `w.title AS "websiteTitle"`,
      `w.base_url AS "websiteUrl"`
    ]);

    const offset = (page - 1) * limit;
    query.limit(limit).offset(offset);

    const [data, total] = await Promise.all([
      query.getRawMany(),
      query.getCount()
    ]);

    return { data, total };
  }
}