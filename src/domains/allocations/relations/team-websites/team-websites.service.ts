import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Repository } from "typeorm";
import { FGA_RESOURCE } from "src/core/authorization/types/fga.types";
import { AuthorizationEvent } from "src/core/authorization/queue/payload.types";
import { OutboxService } from "src/core/outbox/outbox.service";
import { TeamWebsites } from "./team-websites.entity";
import { AUTHORIZATION_ACTION } from "src/core/authorization/registry/registry.keys";
import { sanitizeDelta } from "../util";

@Injectable()
export class TeamWebsitesService {
  constructor(
    @InjectRepository(TeamWebsites)
    private readonly assignmentRepo: Repository<TeamWebsites>,
    private readonly outboxService: OutboxService
  ) {}

  async updateTeamWebsites(
    teamId: number,
    toAdd: number[],
    toRemove: number[]
  ): Promise<void> {
    const uniqueAdd = Array.from(new Set(toAdd));
    const uniqueRemove = Array.from(new Set(toRemove));
    const { add: sanitizedAdd, remove: sanitizedRemove } = sanitizeDelta(uniqueAdd, uniqueRemove);
    await this.assignmentRepo.manager.transaction(async (manager) => {
      
      await this.handleRemoveWebsites(sanitizedRemove, manager, teamId);

      await this.handleAddWebsites(sanitizedAdd, manager, teamId);
    });
  }


  private async handleAddWebsites(sanitizedAdd: number[], manager: EntityManager, teamId: number) {
    if (sanitizedAdd.length > 0) {
      const existing = await manager.find(TeamWebsites, {
        where: { teamId, websiteId: In(sanitizedAdd) }
      });
      const existingIds = new Set(existing.map(e => e.websiteId));
      const toInsert = sanitizedAdd.filter(id => !existingIds.has(id));

      if (toInsert.length > 0) {
        await manager.save(TeamWebsites, toInsert.map(id => ({ websiteId: id, teamId })));

        await this.outboxService.putInOutbox(manager, {
          aggregateType: FGA_RESOURCE.TEAM,
          aggregateId: teamId,
          eventType: AuthorizationEvent.AUTHORIZATION,
          payload: { action: AUTHORIZATION_ACTION.TEAM_ADD_WEBSITE, teamId, websiteIds: toInsert }
        });
      }
    }
  }

  private async handleRemoveWebsites(sanitizedRemove: number[], manager: EntityManager, teamId: number) {
    if (sanitizedRemove.length > 0) {
      const existing = await manager.find(TeamWebsites, {
        where: { teamId, websiteId: In(sanitizedRemove) }
      });
      const existingIds = new Set(existing.map(e => e.websiteId));
      const idsToRemove = sanitizedRemove.filter(id => existingIds.has(id));

  

      if (idsToRemove.length > 0) {
        await manager.delete(TeamWebsites, { teamId, websiteId: In(idsToRemove) });

        await this.outboxService.putInOutbox(manager, {
          aggregateType: FGA_RESOURCE.TEAM,
          aggregateId: teamId,
          eventType: AuthorizationEvent.AUTHORIZATION,
          payload: { action: AUTHORIZATION_ACTION.TEAM_REMOVE_WEBSITE, teamId, websiteIds: idsToRemove }
        });
      }
    }
  }
}