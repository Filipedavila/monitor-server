import { Injectable, BadRequestException } from "@nestjs/common";
import { DataSource, SelectQueryBuilder } from "typeorm";
import { AppLoggerService } from "@core/app-logger/app-logger.service";
import { ConfigService } from "@nestjs/config";
import { BaseTransactionalRepository } from "src/common/repositories/base-transactional.repository";
import { QueryRequest, PaginationResponse } from "src/common/repositories/base.repository";
import { BaseFilter, BaseSort, SortCriteria } from "src/common/interfaces/types";
import { UserWebsite } from "../relations/user-websites/user-websites.entity";
import { TeamWebsites } from "../relations/team-websites/team-websites.entity";
import { TeamMembers } from "../relations/team-members/team-members.entity";
import { TagWebsite } from "../relations/tag-websites/tag-websites.entity";




export type AllocationType = "user-website" | "team-website" | "team-member" | "tag-website";

export interface UnifiedAllocationFilter extends BaseFilter {
  sourceId?: number;
  targetId?: number;
  websiteTitle?: string; 
}

export interface UnifiedAllocationSort extends BaseSort {
  websiteTitle?: SortCriteria;
}

@Injectable()
export class UnifiedAllocationsRepository extends BaseTransactionalRepository<
  any, 
  UnifiedAllocationFilter,
  UnifiedAllocationSort,
  any
> {
  protected alias = "alloc";
  protected filterMap = {} as any; 
  protected sortMap = {} as any;  

  private readonly entityConfig = {
    'user-website': { entity: UserWebsite, source: 'user_id', target: 'website_id' },
    'team-website': { entity: TeamWebsites, source: 'team_id', target: 'website_id' },
    'team-member':  { entity: TeamMembers,  source: 'team_id', target: 'user_id' },
    'tag-website':  { entity: TagWebsite,  source: 'tag_id',  target: 'website_id' },
  };

  constructor(
    private readonly dataSourceConnection: DataSource,
    logger: AppLoggerService,
    configService: ConfigService,
  ) {

    super(dataSourceConnection.getRepository(UserWebsite), logger, configService);
  }

  async findAllocations(
    type: AllocationType,
    queryArgs: QueryRequest<UnifiedAllocationFilter, UnifiedAllocationSort, any>
  ): Promise<PaginationResponse<any>> {
    const config = this.entityConfig[type];
    const specificAlias = `alloc_${type.replace('-', '_')}`;
    
    const targetRepo = this.dataSourceConnection.getRepository(config.entity);
    const query = targetRepo.createQueryBuilder(specificAlias);

    const isTargetingWebsite = config.target === 'website_id';
    this.applyAllocationFilters(query, queryArgs.filters, config, specificAlias, isTargetingWebsite);
    this.applyAllocationSorting(query, queryArgs.sortings, specificAlias, isTargetingWebsite);

    this.applyPagination(query, queryArgs.pagination);

    const requiresJoin = isTargetingWebsite && (queryArgs.filters?.websiteTitle || queryArgs.sortings?.websiteTitle);
    
    let data: any[];
    let count: number;

    if (requiresJoin) {
      query.select([
        `${specificAlias}.${config.source} AS "sourceId"`,
        `${specificAlias}.${config.target} AS "targetId"`,
        `w.title AS "websiteTitle"`,
        `w.base_url AS "websiteUrl"`
      ]);
      // if we need to join with websites for filtering/sorting, we must get raw results
      [data, count] = await Promise.all([query.getRawMany(), query.getCount()]);
    } else {
    // if simple relationship without website title filtering/sorting, we can just get the entities
       [data, count] = await query.getManyAndCount();
    }

    const meta = this.calculatePaginationMeta(
      count,
      queryArgs.pagination?.page ?? 1,
      queryArgs.pagination?.limit ?? 10
    );

    return { data, meta };
  }

  private applyAllocationFilters(
    query: SelectQueryBuilder<any>,
    filters: Partial<UnifiedAllocationFilter> | undefined,
    config: any,
    alias: string,
    isTargetingWebsite: boolean
  ) {
    if (!filters) return;

    if (filters.sourceId !== undefined) {
      query.andWhere(`${alias}.${config.source} = :sourceId`, { sourceId: filters.sourceId });
    }
    if (filters.targetId !== undefined) {
      query.andWhere(`${alias}.${config.target} = :targetId`, { targetId: filters.targetId });
    }
    if (isTargetingWebsite && filters.websiteTitle !== undefined) {
      this.ensureWebsiteJoin(query, alias);
      query.andWhere('w.title LIKE :title', { title: `%${filters.websiteTitle}%` });
    }
  }

  private applyAllocationSorting(
    query: SelectQueryBuilder<any>,
    sortings: Partial<UnifiedAllocationSort> | undefined,
    alias: string,
    isTargetingWebsite: boolean
  ) {
    if (!sortings) return;

    if (isTargetingWebsite && sortings.websiteTitle) {
      this.ensureWebsiteJoin(query, alias);
      query.addOrderBy('w.title', sortings.websiteTitle);
    }
  }

  private ensureWebsiteJoin(query: SelectQueryBuilder<any>, alias: string) {
    const hasJoin = query.expressionMap.joinAttributes.some(j => j.alias.name === 'w');
    if (!hasJoin) {
      query.innerJoin('websites', 'w', `w.id = ${alias}.website_id`);
    }
  }
  // disable findById and delete for allocations since they are composite key entities
  async findById(id: string | number): Promise<any> {
    throw new BadRequestException("findById Disabled for allocation entities (composite keys). Use findMany with sourceId and targetId instead.");
  }
  // disable delete for allocations since they are composite key entities
  async delete(id: string | number): Promise<any> {
    throw new BadRequestException("delete Disabled for allocation entities (composite keys). Use deleteMany with sourceId and targetId instead.");
  }

}