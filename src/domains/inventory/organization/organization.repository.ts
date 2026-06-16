
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {  Repository } from 'typeorm';
import { BaseTransactionalRepository } from 'src/common/repositories/base-transactional.repository';
import { FilterMap, SortingMap } from 'src/common/repositories/base.repository';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { Organization } from './organization.entity';
import { BaseFilter, BaseSort, SortCriteria } from 'src/common/interfaces/types';
 

export interface OrganizationFilter extends BaseFilter {
  id?: number;
  longName?: string;
  shortName?: string;
  createdAt?: Date;
}

export interface OrganizationSort extends BaseSort {
  longName?: SortCriteria;
  shortName?: SortCriteria;
  createdAt?: SortCriteria;
}

@Injectable()
export class OrganizationRepository extends BaseTransactionalRepository<
  Organization,
  OrganizationFilter,
  OrganizationSort
> {
  protected readonly alias = 'org';

  constructor(
    @InjectRepository(Organization)
    protected readonly ormRepo: Repository<Organization>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
  ) {
    super(ormRepo, logger, configService);
  }

  protected readonly filterMap: FilterMap<OrganizationFilter, Organization> = {
    id: (query, value) => {
      query.andWhere(`${this.alias}.id = :id`, { id: value });
    },
    ids: (query, value) => {
      query.andWhere(`${this.alias}.id IN (:...ids)`, { ids: value });
    },
    shortName: (query, value) => {
      query.andWhere(`${this.alias}.shortName LIKE :shortName`, { shortName: `%${value}%` });
    },
    longName: (query, value) => {
      query.andWhere(`${this.alias}.longName LIKE :longName`, { longName: `%${value}%` });
    },
    createdAt: (query, value) => {
      query.andWhere(`${this.alias}.createdAt = :createdAt`, { createdAt: value });
    },  
  };

  protected readonly sortMap: SortingMap<OrganizationSort, Organization> = {
    id: (query, order) => this.addSort(query, 'id', order),
    shortName: (query, order) => this.addSort(query, 'shortName', order),
    longName: (query, order) => this.addSort(query, 'longName', order),
    createdAt: (query, order) => this.addSort(query, 'createdAt', order),

  };


  async findInfo(id: number): Promise<Organization | null> {
    return this.ormRepo
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(`${this.alias}.websites`, 'websites')
      .where(`${this.alias}.id = :id`, { id })
      .getOne();
  }


async saveWithWebsites(entity: Organization, websites: any[]): Promise<Organization> {
    return this.runInTransaction(async (queryRunner) => {
      entity.websites = websites; 
      return await queryRunner.manager.save(Organization, entity);
    });
  }

  async updateWithWebsites(
    id: number,
    data: Partial<Organization>,
    websites: any[]
  ): Promise<Organization> {
    return this.runInTransaction(async (queryRunner) => {
      const entity = await queryRunner.manager.findOne(Organization, { 
        where: { id }, 
        relations: ['websites'] 
      });
      if (!entity) throw new Error('Organization not found');

      Object.assign(entity, data);
      entity.websites = websites; 
      return await queryRunner.manager.save(Organization, entity);
    });
  }

  async deleteOrganization(organization_id: number): Promise<void> {
    await this.runInTransaction(async (queryRunner) => {
      await queryRunner.manager.delete(Organization, { id: organization_id });
    });
  }

}