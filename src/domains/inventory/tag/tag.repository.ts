
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {  In, Repository } from 'typeorm';
import { BaseTransactionalRepository } from 'src/common/repositories/base-transactional.repository';
import { FilterMap, SortingMap } from 'src/common/repositories/base.repository';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { BaseFilter, BaseSort, SortCriteria } from 'src/common/interfaces/types';
import { Tag, TagContext } from './tag.entity';
 

export interface TagFilter extends BaseFilter {
  id?: number;
  name?: string;
  createdAt?: Date;
  websites?: number[];
  directories?: number[];
  isOfficial?: boolean;
  context?: TagContext;
  searchTerm?: string;
}

export interface TagSort extends BaseSort {
  name?: SortCriteria;
  createdAt?: SortCriteria;
  context?: SortCriteria;
}

@Injectable()
export class TagRepository extends BaseTransactionalRepository<
  Tag,
  TagFilter,
  TagSort
> {
  protected readonly alias = 'tag';

  constructor(
    @InjectRepository(Tag)
    protected readonly ormRepo: Repository<Tag>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
  ) {
    super(ormRepo, logger, configService);
  }
  private readonly CHUNK_SIZE = 500;
  protected readonly filterMap: FilterMap<TagFilter, Tag> = {
    id: (query, value) => {
      query.andWhere(`${this.alias}.id = :id`, { id: value });
    },
    ids: (query, value) => {
      query.andWhere(`${this.alias}.id IN (:...ids)`, { ids: value });
    },
    name: (query, value) => {
      query.andWhere(`${this.alias}.name LIKE :name`, { name: `%${value}%` });
    },
    createdAt: (query, value) => {
      query.andWhere(`${this.alias}.createdAt = :createdAt`, { createdAt: value });
    },  
    websites: (query, value) => {
      query.andWhere(`${this.alias}.websites IN (:...websites)`, { websites: value });
    },
    directories: (query, value) => {
      query.andWhere(`${this.alias}.directories IN (:...directories)`, { directories: value });
    },
    isOfficial: (query, value) => {
      query.andWhere(`${this.alias}.isOfficial = :isOfficial`, { isOfficial: value });
    },
    context: (query, value) => {
      query.andWhere(`${this.alias}.context = :context`, { context: value });
    },
    searchTerm: (query, value) => {
      query.andWhere(`${this.alias}.name LIKE :searchTerm`, { searchTerm: `%${value}%` });
    }
  };

  protected readonly sortMap: SortingMap<TagSort, Tag> = {
    id: (query, order) => this.addSort(query, 'id', order),
    name: (query, order) => this.addSort(query, 'name', order),
    createdAt: (query, order) => this.addSort(query, 'createdAt', order),
    context: (query, order) => this.addSort(query, 'context', order),

  };
  

  async copyExistingTagsIds(tag: Tag, type: string, tagsId: number[]): Promise<any> {
  if (type !== "official" && type !== "user") {
    return false;
  }
  if (!tagsId || tagsId.length === 0) {
    return false;
  }
  this.runInTransaction(async (queryRunner) => {

    const newTag = await queryRunner.manager.save(Tag, tag);


    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('website_tags') 
      .values((subQuery) => {
        return subQuery
          .select('DISTINCT :tagId', 'tag_id')
          .addSelect('tw.website_id', 'website_id')
          .from('website_tags', 'tw')
          .where('tw.tag_id IN (:...tagsId)');
      })
      .orIgnore() 
      .setParameter('tagId', newTag.id)
      .setParameter('tagsId', tagsId)
      .execute();
      
  });
}

async deleteTagById(tagId: number): Promise<boolean> {
  const deleteResult = await this.ormRepo.delete(tagId);
  return (deleteResult.affected ?? 0) > 0;
}

async deleteManyTagsByIds(tagsId: number[]): Promise<boolean> {
  const deleteResult = await this.ormRepo.delete(tagsId);
  return (deleteResult.affected ?? 0) > 0;
}
async deleteBulk(tagsId: Array<number>): Promise<boolean> {
  if (!tagsId || tagsId.length === 0) return false;

  try {

    await this.ormRepo.manager.transaction(async (transactionalEntityManager) => {

      for (let i = 0; i < tagsId.length; i += this.CHUNK_SIZE) {
        const chunk = tagsId.slice(i, i + this.CHUNK_SIZE);
        await transactionalEntityManager.delete(Tag, chunk);
        
      }
    });

    this.logger.log(`deleteBulk de ${tagsId.length} tags concluído com sucesso total.`);
    return true;

  } catch (err: any) {
    const errorMessage = `Falha na transação de deleteBulk. Estado revertido: ${err.message}`;
    this.logger.error(errorMessage, err.stack);
    throw new InternalServerErrorException(errorMessage);
  }
}

  async validateContextAndOwnership(tagId: number[], context: TagContext, userId: number): Promise<boolean> {
    const result = await this.executeBatchCount(tagId, async (batch) => {  
      const count = await this.ormRepo.count({
        where: { id: In(batch), context: context, createdById: userId },
      });
      return count;
    });
    return result > 0;
  }
}