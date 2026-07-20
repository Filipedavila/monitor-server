import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Repository } from "typeorm";
import { TeamMembers } from "./team-members.entity";
import { FGA_RESOURCE } from "src/core/authorization/types/fga.types";
import { AuthorizationEvent } from "src/core/authorization/queue/payload.types";
import { OutboxService } from "src/core/outbox/outbox.service";
import { sanitizeDelta } from "../util";
import { AUTHORIZATION_ACTION } from "src/core/authorization/registry/registry.keys";


@Injectable()
export class TeamMembersService {
  private readonly logger = new Logger("TeamMembersService");

  constructor(
    @InjectRepository(TeamMembers)
    private readonly assignmentRepo: Repository<TeamMembers>,
    private readonly outboxService: OutboxService
  ) {}

  async getTeamMembers(
    teamId: number
  ): Promise<{ id: number; name: string }[]> {
  return await this.assignmentRepo
    .createQueryBuilder('assignment')
    .innerJoin('assignment.user', 'user') 
    .select('user.id', 'id')
    .addSelect('user.name', 'name')
    .where('assignment.teamId = :teamId', { teamId: teamId })
    .getRawMany();
  }

  async updateTeamMembers(
    teamId: number,
    toAdd: number[],
    toRemove: number[]
  ): Promise<void> {
    const uniqueAdd = Array.from(new Set(toAdd));
    const uniqueRemove = Array.from(new Set(toRemove));
    const { add: sanitizedAdd, remove: sanitizedRemove } = sanitizeDelta(uniqueAdd, uniqueRemove);

    await this.assignmentRepo.manager.transaction(async (manager) => {
      
      await this.handleRemoveMembers(sanitizedRemove, manager, teamId);

      await this.handleAddMembers(sanitizedAdd, manager, teamId);
    });
  }

  private async handleAddMembers(sanitizedAdd: number[], manager: EntityManager, teamId: number) {
    if (sanitizedAdd.length > 0) {
      const existing = await manager.find(TeamMembers, {
        where: { teamId, userId: In(sanitizedAdd) }
      });
      const existingIds = existing.map(e => e.userId);
      const toInsert = sanitizedAdd.filter(id => !existingIds.includes(id));

      if (toInsert.length > 0) {
        await manager.save(TeamMembers, toInsert.map(id => ({ userId: id, teamId })));

        await this.outboxService.putInOutbox(manager, {
          aggregateType: FGA_RESOURCE.TEAM,
          aggregateId: teamId,
          eventType: AuthorizationEvent.AUTHORIZATION,
          payload: { action: AUTHORIZATION_ACTION.TEAM_ADD_MEMBER, teamId, userIds: toInsert }
        });
      }
    }
  }

  private async handleRemoveMembers(sanitizedRemove: number[], manager: EntityManager, teamId: number) {
    if (sanitizedRemove.length > 0) {
      const existing = await manager.find(TeamMembers, {
        where: { teamId, userId: In(sanitizedRemove) }
      });
      const idsToRemove = existing.map(e => e.userId);

      if (idsToRemove.length > 0) {
        await manager.delete(TeamMembers, { teamId, userId: In(idsToRemove) });

        await this.outboxService.putInOutbox(manager, {
          aggregateType: FGA_RESOURCE.TEAM,
          aggregateId: teamId,
          eventType: AuthorizationEvent.AUTHORIZATION,
          payload: { action: AUTHORIZATION_ACTION.TEAM_REMOVE_MEMBER, teamId, userIds: idsToRemove }
        });
      }
    }
  }
}