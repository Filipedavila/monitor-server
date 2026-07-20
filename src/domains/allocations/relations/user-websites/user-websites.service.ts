import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Repository } from "typeorm";
import { UserWebsite } from "./user-websites.entity";
import { FGA_RESOURCE } from "src/core/authorization/types/fga.types";
import { AuthorizationEvent } from "src/core/authorization/queue/payload.types";
import { OutboxService } from "src/core/outbox/outbox.service";
import { sanitizeDelta } from "../util";
import { AUTHORIZATION_ACTION } from "src/core/authorization/registry/registry.keys";

@Injectable()
export class UserWebsitesService {
  private readonly logger = new Logger("UserWebsitesService");

  constructor(
    @InjectRepository(UserWebsite)
    private readonly assignmentRepo: Repository<UserWebsite>,
    private readonly outboxService: OutboxService
  ) {}

  async getUserWebsites(
    userId: number
  ): Promise<{ id: number; baseUrl: string }[]> {
  return await this.assignmentRepo
    .createQueryBuilder('assignment')
    .innerJoin('assignment.website', 'website') 
    .select('website.id', 'id')
    .addSelect('website.baseUrl', 'baseUrl')
    .where('assignment.userId = :userId', { userId: userId })
    .getRawMany();
  }

  async updateUserWebsites(
    userId: number,
    toAdd: number[],
    toRemove: number[]
  ): Promise<void> {
    const uniqueAdd = Array.from(new Set(toAdd));
    const uniqueRemove = Array.from(new Set(toRemove));
    const { add: sanitizedAdd, remove: sanitizedRemove } = sanitizeDelta(uniqueAdd, uniqueRemove);

    await this.assignmentRepo.manager.transaction(async (manager) => {

      await this.handleRemoveUser(sanitizedRemove, manager, userId);

      await this.handleAddUser(sanitizedAdd, manager, userId);
    });
  }

  private async handleAddUser(sanitizedAdd: number[], manager: EntityManager, userId: number) {
    if (sanitizedAdd.length > 0) {
      const existing = await manager.find(UserWebsite, {
        where: { userId, websiteId: In(sanitizedAdd) }
      });
      const existingIds = new Set(existing.map(e => e.websiteId));
      const toInsert = sanitizedAdd.filter(id => !existingIds.has(id));

      if (toInsert.length > 0) {
        await manager.save(UserWebsite, toInsert.map(id => ({ websiteId: id, userId })));

        await this.outboxService.putInOutbox(manager, {
          aggregateType: FGA_RESOURCE.USER,
          aggregateId: userId,
          eventType: AuthorizationEvent.AUTHORIZATION,
          payload: { action: AUTHORIZATION_ACTION.USER_ADD_WEBSITE, userId, websiteIds: toInsert }
        });
      }
    }
  }

  private async handleRemoveUser(sanitizedRemove: number[], manager: EntityManager, userId: number) {
    if (sanitizedRemove.length > 0) {
      const existing = await manager.find(UserWebsite, {
        where: { userId, websiteId: In(sanitizedRemove) }
            });
      
      const idsToRemove = existing.map(e => e.websiteId);

      if (idsToRemove.length > 0) {
        await manager.delete(UserWebsite, { userId, websiteId: In(idsToRemove) });

        await this.outboxService.putInOutbox(manager, {
          aggregateType: FGA_RESOURCE.USER,
          aggregateId: userId,
          eventType: AuthorizationEvent.AUTHORIZATION,
          payload: { action: AUTHORIZATION_ACTION.USER_REMOVE_WEBSITE, userId, websiteIds: idsToRemove }
        });
      }
    }
  }
}