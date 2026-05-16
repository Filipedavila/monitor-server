import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Directory, TagMatchingStrategy } from '../directory.entity';
import { BaseTransactionalRepository } from 'src/common/repositories/base-transactional.repository'; 
import { FilterMap, SortingMap } from 'src/common/repositories/base.repository';
import { DirectoryWebsiteDTO } from '../dto/response/directory-website.dto';
import { Website } from '../../website/website.entity';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';

@Injectable()
export class DirectoryRepository extends BaseTransactionalRepository<Directory, any, any> {
  protected readonly alias = 'd';

  constructor(@InjectRepository(Directory) private readonly ormRepo: Repository<Directory>,
 logger: AppLoggerService, configService: ConfigService) {
    super(ormRepo, logger, configService);
  }

  public async applyAuthorization(query: SelectQueryBuilder<Directory>, rules: any, operation: string): Promise<void> {
    // Authorization logic here if needed
  }

  protected readonly filterMap: FilterMap<any, Directory> = {
    searchTerm: (query, term) => query.andWhere('d.Name LIKE :term', { term: `%${term}%` }),
    observatory: (query, val) => query.andWhere('d.Show_in_Observatory = :val', { val }),
  };

  protected readonly sortMap: SortingMap<any, Directory> = {
    name: (query, order) => query.addOrderBy('d.Name', order),
    date: (query, order) => query.addOrderBy('d.Creation_Date', order),
    tagsCount: (query, order) => query.addOrderBy('TagsCount', order),
  };

async findWebsitesByDirectoryTags(directoryId: number): Promise<{ data: DirectoryWebsiteDTO[], count: number }> {
  const directory = await this.ormRepo.findOne({
    where: { id: directoryId },
    relations: ['tags']
  });

  if (!directory || !directory.tags?.length) {
    return { data: [], count: 0 };
  }

  const tagIds = directory.tags.map(t => t.id);

  const query = this.orm.manager.createQueryBuilder(Website, 'w')
    .innerJoin('w.tags', 'tag') 
    .where('tag.id IN (:...tagIds)', { tagIds });

  query.select([
    'w.id AS id',
    'w.title AS title',
    'w.baseUrl AS url'
  ]);

  if (directory.tagMatchingStrategy === TagMatchingStrategy.MATCH_ALL) {
    query
      .groupBy('w.id')
      .having('COUNT(DISTINCT tag.id) = :tagCount', { tagCount: tagIds.length });
  } else {
    query.distinct(true);
  }


  const rawData = await query.getRawMany<DirectoryWebsiteDTO>();

  return { 
    data: rawData, 
    count: rawData.length 
  };
}
}
