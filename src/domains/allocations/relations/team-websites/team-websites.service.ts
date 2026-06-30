import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FGA_RESOURCE } from "src/core/authorization/types/fga.types";
import { AuthorizationEvent } from "src/core/authorization/queue/payload.types";
import { OutboxService } from "src/core/outbox/outbox.service";
import { TeamWebsites } from "./team-websites.entity";

@Injectable()
export class TeamWebsiteAllocationService {
  private readonly logger = new Logger("TeamWebsiteAllocationService");

  constructor( 
    @InjectRepository(TeamWebsites)
    private readonly assignmentRepo: Repository<TeamWebsites>,
    private readonly outboxService: OutboxService
  ) {}

  async allocateWebsitesToTeam(
        teamId: number,
    websiteIds: number[]
    ): Promise<void> {
    this.logger.log(`A afiliar os website IDs [${websiteIds.join(", ")}] à equipa ID ${teamId}`);

    if (websiteIds.length === 0) return;

    const connection = this.assignmentRepo.manager.connection;

    await connection.transaction(async (transactionalEntityManager) => {
      const allocations = websiteIds.map(websiteId => 
        this.assignmentRepo.create({ websiteId, teamId })
      );
      
      await transactionalEntityManager.save(TeamWebsites, allocations);

      await this.outboxService.putInOutbox(transactionalEntityManager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: teamId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: { 
          resourceType: FGA_RESOURCE.TEAM, 
          resourceId: teamId, 
          action: 'create', 
          teamId, 
          websiteIds 
        },
      });
    });
  }

async deallocateWebsitesFromTeam(
    teamId: number, 
    websiteIds: number[], 

  ): Promise<void> {
    this.logger.log(`A remover os website IDs [${websiteIds.join(", ")}] da equipa ID ${teamId}`);

    if (websiteIds.length === 0) return;

  
    const connection = this.assignmentRepo.manager.connection;
    
    await connection.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager
        .createQueryBuilder()
        .delete()
        .from(TeamWebsites)
        .where("teamId = :teamId", { teamId })
        .andWhere("websiteId IN (:...websiteIds)", { websiteIds })
        .execute();

      
      await this.outboxService.putInOutbox(transactionalEntityManager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: teamId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: { 
          resourceType: FGA_RESOURCE.TEAM, 
          resourceId: teamId, 
          action: 'remove_websites', 
          teamId, 
          websiteIds 
        }, 
      });
    });
  }
}