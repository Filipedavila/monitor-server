import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TeamMembers } from "./team-members.entity";
import { FGA_RESOURCE } from "src/core/authorization/types/fga.types";
import { AuthorizationEvent } from "src/core/authorization/queue/payload.types";
import { OutboxService } from "src/core/outbox/outbox.service";

@Injectable()
export class TeamMembersService {
  private readonly logger = new Logger("TeamMembersService");

  constructor( 
    @InjectRepository(TeamMembers)
    private readonly assignmentRepo: Repository<TeamMembers>,
    private readonly outboxService: OutboxService
  ) {}

  async addMembersToTeam(
    userIds: number[], 
    teamId: number, 
    actorId: number
  ): Promise<void> {
    this.logger.log(`A afiliar os user IDs [${userIds.join(", ")}] à equipa ID ${teamId}`);

    if (userIds.length === 0) return;

    const connection = this.assignmentRepo.manager.connection;

    await connection.transaction(async (transactionalEntityManager) => {
      const allocations = userIds.map(userId => 
        this.assignmentRepo.create({ userId, teamId })
      );
      
      await transactionalEntityManager.save(TeamMembers, allocations);

      await this.outboxService.putInOutbox(transactionalEntityManager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: teamId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: { 
          resourceType: FGA_RESOURCE.TEAM, 
          resourceId: teamId, 
          action: 'create', 
          teamId, 
          userIds 
        },
      });
    });
  }

async removeMembersFromTeam(
    userIds: number[], 
    teamId: number, 
    actorId: number
  ): Promise<void> {
    this.logger.log(`A remover os user IDs [${userIds.join(", ")}] da equipa ID ${teamId}`);

    if (userIds.length === 0) return;

  
    const connection = this.assignmentRepo.manager.connection;
    
    await connection.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager
        .createQueryBuilder()
        .delete()
        .from(TeamMembers)
        .where("teamId = :teamId", { teamId })
        .andWhere("userId IN (:...userIds)", { userIds })
        .execute();

      
      await this.outboxService.putInOutbox(transactionalEntityManager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: teamId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: { 
          resourceType: FGA_RESOURCE.TEAM, 
          resourceId: teamId, 
          action: 'delete', 
          teamId, 
          userIds 
        }, 
      });
    });
  }
}