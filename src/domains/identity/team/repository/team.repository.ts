import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseTransactionalRepository } from "@common/repositories/base-transactional.repository";
import { FilterMap, SortingMap } from "@common/repositories/base.repository";
import {
  BaseFilter,
  BasePagination,
  BaseSort,
  SortCriteria,
} from "src/common/interfaces/types";
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { Team } from '../team.entity';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { BaseUser, BaseWebsite } from 'src/common/types';
import { FGA_RESOURCE } from 'src/core/authorization/types/fga.types';
import { AuthorizationEvent, AuthorizationEventType, PublishEventAuthOptions } from 'src/core/authorization/queue/payload.types';
import { User } from '../../user/user.entity';
import { Website } from 'src/domains/inventory/website/website.entity';


export interface TeamFilter extends BaseFilter, Pick<Team, "id" | "teamName"> {
  id: number;
  teamName: string;
  searchTerm: string;

}

export interface TeamSorting extends BaseSort {
  id: SortCriteria;
  teamName: SortCriteria;
  createdAt: SortCriteria;
  updatedAt: SortCriteria;
}



@Injectable()
export class TeamRepository extends BaseTransactionalRepository<Team, TeamFilter, TeamSorting,BasePagination> {
  constructor(@InjectRepository(Team) private readonly ormRepo: Repository<Team>,
                                      protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
    protected readonly outboxService: OutboxService
  ) {
    super(ormRepo, logger, configService);
    this.logger.setContext(TeamRepository.name);
  }
    protected readonly alias = "team";
    


  protected readonly filterMap: FilterMap<TeamFilter, Team> = {
    ids: (query, ids) => ids?.length && query.andWhere(`${this.alias}.id IN (:...ids)`, { ids }),
    id: (query, id) => query.andWhere(`${this.alias}.id = :id`, { id }),
    teamName: (query, teamName) => query.andWhere(`${this.alias}.teamName = :teamName`, { teamName }),
    searchTerm: (query, term) => 
      query.andWhere(`(${this.alias}.teamName LIKE :term)`, { term: `%${term}%` }),

  };

  protected readonly sortMap: SortingMap<TeamSorting, Team> = {
    id: (query, order) => query.addOrderBy(`${this.alias}.id`, order),
    teamName: (query, order) => query.addOrderBy(`${this.alias}.teamName`, order),
    createdAt: (query, order) => query.addOrderBy(`${this.alias}.createdAt`, order),
    updatedAt: (query, order) => query.addOrderBy(`${this.alias}.updatedAt`, order),
  };


  public createTeam(teamName: string, websiteIds: number[], userIds: number[], actorId: number): Promise<Team> {
    return this.runInTransaction(async (queryRunner) => {
        const manager = queryRunner.manager;
        if(websiteIds?.length > 0){
          await this.validatingWebsiteIds(websiteIds);
        }
        if(userIds?.length > 0){
          await this.validatingUserIds(userIds);
        }
        const team = new Team();
        team.teamName = teamName;
        team.createdById = actorId;
        team.websites = websiteIds?.map(id => ({ id } as BaseWebsite)) || [];
        team.users = userIds?.map(id => ({ id } as BaseUser)) || [];
    
        const savedTeam = await manager.save(Team, team);

        await this.outboxService.putInOutbox<PublishEventAuthOptions<typeof FGA_RESOURCE.TEAM>>(queryRunner.manager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: savedTeam.id,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: { resourceType: FGA_RESOURCE.TEAM, resourceId: savedTeam.id, action: 'create', teamId: savedTeam.id, websiteIds, userIds },
      });
        return savedTeam;
    });
  }


  public deleteTeam(id: number): Promise<void> {
    return this.runInTransaction(async (queryRunner) => {

      const associations = await queryRunner.manager.findOne(Team, { where: { id }, relations: ["users", "websites"] }).then(team => ({
        userIds: team?.users.map(user => user.id) || [],
        websiteIds: team?.websites.map(website => website.id) || [],
      }));
      
      const updateResult = await queryRunner.manager.delete(Team, id);
      if (updateResult.affected === 0) {
        throw new Error(`Team with id ${id} not found.`);
      }
      await this.outboxService.putInOutbox(queryRunner.manager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: id,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: { resourceType: FGA_RESOURCE.TEAM, resourceId: id, action: 'delete', teamId: id, websiteIds: associations.websiteIds, userIds: associations.userIds },
      });
    });
  }

  public async addUsersToTeam(teamId: number, userIds: number[], actorId: number): Promise<Team> {
    const uniqueNewIds = [...new Set(userIds)];
    return this.runInTransaction(async (queryRunner) => {
      const manager = queryRunner.manager;
      await this.validatingUserIds(userIds);

      const team = await manager.findOneOrFail(Team, { 
        where: { id: teamId }, 
        relations: ["users"] 
      });

      const existingIds = new Set(team.users.map(u => u.id));
      const newIds = uniqueNewIds.filter(id => !existingIds.has(id));

      if (newIds.length === 0) {
        return team; 
      }

      const newUsers = newIds.map(id => ({ id } as BaseUser));
      team.users.push(...newUsers);
      team.updatedById = actorId;
      
      const updatedTeam = await manager.save(Team, team);

      await this.outboxService.putInOutbox<PublishEventAuthOptions<typeof FGA_RESOURCE.TEAM>>(queryRunner.manager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: teamId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: { resourceType: FGA_RESOURCE.TEAM, resourceId: teamId, action: 'create', teamId, userIds: newIds },
      });

      return updatedTeam;
    });
  }

  public async removeUsersFromTeam(teamId: number, userIds: number[], actorId: number): Promise<Team> {
    return this.runInTransaction(async (queryRunner) => {
      const manager = queryRunner.manager;
      await this.validatingUserIds(userIds);
      const team = await manager.findOneOrFail(Team, { where: { id: teamId }, relations: ["users"] });
   
      team.users = team.users.filter(user => !userIds.includes(user.id));
      team.updatedById = actorId;
      const updatedTeam = await manager.save(Team, team);

      await this.outboxService.putInOutbox<PublishEventAuthOptions<typeof FGA_RESOURCE.TEAM>>(queryRunner.manager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: teamId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: {
          resourceType: FGA_RESOURCE.TEAM,
          resourceId: teamId,
          action: 'delete',
          teamId:teamId,
          userIds: userIds
        },
      });

      return updatedTeam;
    });
  }

  public async addWebsitesToTeam(teamId: number, websiteIds: number[], actorId: number): Promise<Team> {
    const uniqueNewIds = [...new Set(websiteIds)];

    return this.runInTransaction(async (queryRunner) => {

      await this.validatingWebsiteIds(websiteIds);
      const team = await queryRunner.manager.findOneOrFail(Team, { 
        where: { id: teamId }, 
        relations: ["websites"] 
      });

      const existingIds = new Set(team.websites.map(w => w.id));
      const newIds = uniqueNewIds.filter(id => !existingIds.has(id));

      if (newIds.length === 0) {
        return team; 
      }

      team.websites.push(...newIds.map(id => ({ id } as BaseWebsite)));
      team.updatedById = actorId;
      const updatedTeam = await queryRunner.manager.save(Team, team);

      await this.outboxService.putInOutbox<PublishEventAuthOptions<typeof FGA_RESOURCE.TEAM>>(queryRunner.manager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: teamId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: { resourceType: FGA_RESOURCE.TEAM, resourceId: teamId, action: 'create', teamId, websiteIds: newIds },
      });

      return updatedTeam;
    });
  }

  public async removeWebsitesFromTeam(teamId: number, websiteIds: number[], actorId: number): Promise<Team> {
    await this.validatingWebsiteIds(websiteIds);
    return this.runInTransaction(async (queryRunner) => {
      const team = await queryRunner.manager.findOneOrFail(Team, { where: { id: teamId }, relations: ["websites"] });
   
      const websiteIdsSet = new Set(websiteIds);
      team.websites = team.websites.filter(website => !websiteIdsSet.has(website.id));
      team.updatedById = actorId;
      const updatedTeam = await queryRunner.manager.save(Team, team);

      await this.outboxService.putInOutbox<PublishEventAuthOptions<typeof FGA_RESOURCE.TEAM>>(queryRunner.manager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: teamId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: { resourceType: FGA_RESOURCE.TEAM, resourceId: teamId, action: 'delete', teamId, websiteIds },
      });

      return updatedTeam;
    });
  }

  async validatingWebsiteIds(websiteIds: number[]): Promise<void> {
     await this.executeBatchCount(
      websiteIds,
      async (batch:number[]): Promise<number> => {
        const uniqueWebsiteIds = [...new Set(batch)];
        const count = await this.getOrmRepository().manager.getRepository(Website).count({
          where: { id: In(uniqueWebsiteIds) },
        });
        if (count !== uniqueWebsiteIds.length) {
          throw new BadRequestException("One or more provided websiteIds do not exist.");
        }
        return count;
      },
    );
  }

  async validatingUserIds(userIds: number[]): Promise<void> {
      await this.executeBatchCount(
        userIds,
         async (batch: number[]): Promise<number> => {
          const uniqueUserIds = [...new Set(batch)];
          const count = await this.getOrmRepository().manager.getRepository(User).count({
            where: { id: In(uniqueUserIds) },
          });
          if (count !== uniqueUserIds.length) {
          throw new BadRequestException("One or more provided userIds do not exist.");
        }
        return count;
      });
  }
  
}