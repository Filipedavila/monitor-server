import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {  Repository, SelectQueryBuilder } from 'typeorm';
import {  CrawlWebsiteNew } from './crawler.entity';
import { BaseTransactionalRepository } from '../base-transactional.repository';
import { FilterMap } from 'src/base.repository';

export class WebsiteFilterDto {
  tagId?: number ;
  tagsId?: number[];
  tagName?: string;
  websiteId?: number;
  isDone?: boolean;
  searchTerm?: string; 
}

 const filterMappings: FilterMap<WebsiteFilterDto> = {
    tagName:    (query: any, tagName: string) => query.andWhere('t.Name = :tagName', { tagName: tagName }),
    tagId:      (query: any, tagId: number) => query.andWhere('t.TagId = :tagId', { tagId: tagId }),
    tagsId:     (query: any, tagsId: number[]) => tagsId?.length && query.andWhere('t.TagId IN (:...tagsId)', { tagsId: tagsId }),
    websiteId:  (query: any, websiteId: number) => query.andWhere('cw.WebsiteId = :websiteId', { websiteId: websiteId }),
    isDone:     (query: any, isDone: boolean) => query.andWhere('cw.Done = :isDone', { isDone: isDone ? 1 : 0 }),
    searchTerm: (query: any, searchTerm: string) => query.andWhere('w.Name LIKE :term', { term: `%${searchTerm}%` }),
  };

@Injectable()
export class CrawlerWebsiteRepository extends BaseTransactionalRepository<CrawlWebsiteNew> {
  constructor(
    @InjectRepository(CrawlWebsiteNew)
    private readonly ormRepo: Repository<CrawlWebsiteNew>,

  ) {
    super(ormRepo);
  }
      async findNextPendingByUserId(userId: number): Promise<CrawlWebsiteNew | null> {
        return this.ormRepo.createQueryBuilder()
          .select()
          .where('UserId = :userId', { userId })
          .andWhere('Done = :done', { done: false })
          .orderBy('Creation_Date', 'ASC')
          .limit(1)
          .getOne();

      }

      async findWebsites(userId: number, filters: WebsiteFilterDto): Promise<CrawlWebsiteNew[]> {
        const query = this.ormRepo.createQueryBuilder('cw')
          .innerJoinAndSelect('cw.website', 'w') 
          .leftJoin('w.tags', 't')
          .where('cw.UserId = :userId', { userId });

        this.applyDynamicFilters(query, filters, filterMappings);
        
        return await query.getMany();
      }

      async deleteByUserIdAndWebsiteId(userId: number, websiteId: number): Promise<boolean> {
        const result = await this.ormRepo.createQueryBuilder()
          .delete()
          .from(CrawlWebsiteNew)
          .where('UserId = :userId', { userId })
          .andWhere('WebsiteId = :websiteId', { websiteId })
          .execute();
        
        return result.affected > 0;
      }

}