import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { CrawlPageNew } from './crawler.entity';
import { BaseTransactionalRepository } from '../base-transactional.repository';
import { WebsiteFilterDto } from './crawler-website.repository';
import { FilterMap } from 'src/base.repository';

export class PageCrawlerFilterDto {
  websiteId?: number;
  uri?: string ;
  isDone?: any;
}

 const filterMappings: FilterMap<PageCrawlerFilterDto> = {
    websiteId: (query: any, websiteId: number) => query.andWhere('cp.CrawlWebsiteId = :websiteId', { websiteId: websiteId }),
    uri:    (query: any, uri: string) => query.andWhere('cp.Uri LIKE :uri', { uri: `%${uri}%` }),
    isDone: (query: any, isDone: any) => query.andWhere('cp.Done = :isDone', { isDone: isDone }),
  };
  

@Injectable()
export class CrawlerPageRepository  extends BaseTransactionalRepository<CrawlPageNew> {
  constructor(
  
    @InjectRepository(CrawlPageNew)
    private readonly ormRepo: Repository<CrawlPageNew>,
  ) {
    super(ormRepo);
  }


  async findCrawlPagesWithFilters(
            userId: number, 
            websiteId: number, 
            filters?: PageCrawlerFilterDto
          ): Promise<CrawlPageNew[]> {
            
            const query = this.ormRepo.createQueryBuilder('cp')
              .innerJoin('cp.website', 'w')
              .where('w.UserId = :userId', { userId })
              .andWhere('w.WebsiteId = :websiteId', { websiteId });

            this.applyDynamicFilters(query, filters, filterMappings);

            query.orderBy('cp.CrawlId', 'ASC');

            return await query.getMany();
          }
        

}