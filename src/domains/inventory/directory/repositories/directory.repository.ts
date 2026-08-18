import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Directory, TAG_MATCHING_STRATEGIES } from '../directory.entity';
import { BaseTransactionalRepository } from 'src/common/repositories/base-transactional.repository';
import { FilterMap, SortingMap } from 'src/common/repositories/base.repository';
import { BaseFilter, BaseSort, SortCriteria } from 'src/common/interfaces/types';
import { DirectoryWebsiteDTO } from '../dto/response/directory-website.dto';
import { Website } from '../../website/website.entity';
import { Tag } from '../../tag/tag.entity';
import { Page } from '../../page/page.entity';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { CreateDirectory } from '../dto/create-diretory.dto';
import { UpdateDirectory } from '../dto/update-diretory.dto';

export interface DirectoryFilter extends BaseFilter {
  id?: number;
  name?: string;
  showInObservatory?: boolean;
  searchTerm?: string;
}

export interface DirectorySort extends BaseSort {
  name?: SortCriteria;
  createdAt?: SortCriteria;
}

@Injectable()
export class DirectoryRepository extends BaseTransactionalRepository<Directory, DirectoryFilter, DirectorySort> {
  protected readonly alias = 'd';

  constructor(
    @InjectRepository(Directory)
    protected readonly ormRepo: Repository<Directory>,
    logger: AppLoggerService,
    configService: ConfigService,
  ) {
    super(ormRepo, logger, configService);
  }

  protected readonly filterMap: FilterMap<DirectoryFilter, Directory> = {
    ids: (query, value) => query.andWhere(`${this.alias}.id IN (:...ids)`, { ids: value }),
    id: (query, value) => query.andWhere(`${this.alias}.id = :id`, { id: value }),
    name: (query, value) => query.andWhere(`${this.alias}.name LIKE :name`, { name: `%${value}%` }),
    showInObservatory: (query, value) => query.andWhere(`${this.alias}.showInObservatory = :showInObservatory`, { showInObservatory: value }),
    searchTerm: (query, value) => {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`${this.alias}.name LIKE :searchTerm`, { searchTerm: `%${value}%` });
        }),
      );
    }
  };

  protected readonly sortMap: SortingMap<DirectorySort, Directory> = {
    id: (query, order) => this.addSort(query, 'id', order),
    name: (query, order) => this.addSort(query, 'name', order),
    createdAt: (query, order) => this.addSort(query, 'createdAt', order),
  };

  
  async findByName(name: string): Promise<Directory | null> {
    return this.ormRepo.findOne({ where: { name } });
  }

  async findOneWithTags(id: number): Promise<Directory | null> {
    return this.ormRepo.findOne({ where: { id }, relations: ['tags'] });
  }

  async count(): Promise<number> {
    return this.ormRepo.count();
  }

  async countBySearch(search: string): Promise<number> {
    const qb = this.ormRepo.createQueryBuilder(this.alias);
    if (search.trim()) {
      qb.where(`${this.alias}.name LIKE :search`, { search: `%${search.trim()}%` });
    }
    return qb.getCount();
  }

  async findTagsByDirectoryName(name: string): Promise<any[]> {
    return this.ormRepo.manager
      .createQueryBuilder(Tag, 't')
      .select(['t.id AS id', 't.name AS name'])
      .addSelect('COUNT(DISTINCT wt.website_id)', 'Websites')
      .innerJoin('directory_tags', 'dt', 'dt.tag_id = t.id')
      .innerJoin('directories', 'd', 'd.id = dt.directory_id')
      .leftJoin('website_tags', 'wt', 'wt.tag_id = t.id')
      .where('d.name = :name', { name })
      .groupBy('t.id')
      .getRawMany();
  }

  // --- Website finders ---

  async findWebsitesByDirectoryName(name: string): Promise<{ data: DirectoryWebsiteDTO[]; count: number }> {
    const directory = await this.ormRepo.findOne({ where: { name }, relations: ['tags'] });
    if (!directory || !directory.tags?.length) return { data: [], count: 0 };
    return this.findWebsitesByDirectoryTags(directory.id);
  }

  async findWebsitesByDirectoryTags(directoryId: number): Promise<{ data: DirectoryWebsiteDTO[]; count: number }> {
    const directory = await this.ormRepo.findOne({
      where: { id: directoryId },
      relations: ['tags'],
    });

    if (!directory || !directory.tags?.length) return { data: [], count: 0 };

    const tagIds = directory.tags.map((t) => t.id);

    const query = this.orm.manager
      .createQueryBuilder(Website, 'w')
      .innerJoin('w.tags', 'tag')
      .where('tag.id IN (:...tagIds)', { tagIds })
      .select(['w.id AS id', 'w.title AS title', 'w.baseUrl AS baseUrl']);

    if (directory.tagMatchingStrategy === TAG_MATCHING_STRATEGIES.INTERSECTION) {
      query.groupBy('w.id').having('COUNT(DISTINCT tag.id) = :tagCount', { tagCount: tagIds.length });
    } else {
      query.distinct(true);
    }

    const rawData = await query.getRawMany<DirectoryWebsiteDTO>();
    return { data: rawData, count: rawData.length };
  }


  async findPagesByDirectoryName(name: string): Promise<any[]> {
    const directory = await this.ormRepo.findOne({ where: { name }, relations: ['tags'] });
    if (!directory || !directory.tags?.length) return [];

    const tagIds = directory.tags.map((t) => t.id);

    const query = this.ormRepo.manager
      .createQueryBuilder(Page, 'p')
      .select(['p.id', 'p.url', 'p.websiteId', 'p.averageScore', 'p.totalEvaluations'])
      .innerJoin('website_tags', 'wt', 'wt.website_id = p.websiteId AND wt.tag_id IN (:...tagIds)', { tagIds })
      .where('p.showInMonitor = :show', { show: true })
      .groupBy('p.websiteId, p.id');

    if (directory.tagMatchingStrategy === TAG_MATCHING_STRATEGIES.INTERSECTION) {
      query.having('COUNT(DISTINCT wt.tag_id) = :tagCount', { tagCount: tagIds.length });
    }

    return query.getMany();
  }


  async createWithTags(dto: CreateDirectory): Promise<Directory> {
    return this.runInTransaction(async (qr) => {
      const directory = this.ormRepo.create({
        name: dto.name,
        showInObservatory: dto.showInObservatory,
        tagMatchingStrategy: dto.strategy,
      });
      const saved = await qr.manager.save(Directory, directory);
    
      return saved;
    });
  }

  async updateWithTags(updateDto: UpdateDirectory): Promise<Directory> {
  const { directoryId, name, showInObservatory, strategy } = updateDto;

  return this.runInTransaction(async (qr) => {
    const updatePayload: Partial<Directory> = {};
    if (name !== undefined) updatePayload.name = name;
    if (showInObservatory !== undefined) updatePayload.showInObservatory = showInObservatory;
    if (strategy !== undefined) updatePayload.tagMatchingStrategy = strategy;

    if (Object.keys(updatePayload).length > 0) {
      await qr.manager.update(Directory, { id: directoryId }, updatePayload);
    }
    
    const directory = await qr.manager.findOne(Directory, { 
      where: { id: directoryId }
        });

    if (!directory) throw new NotFoundException(`Directory ${directoryId} not found`);

    return directory;
  });
}
}