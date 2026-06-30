
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FGA_RESOURCE } from "src/core/authorization/types/fga.types";
import { AuthorizationEvent } from "src/core/authorization/queue/payload.types";
import { OutboxService } from "src/core/outbox/outbox.service";
import { UserWebsite } from "./user-websites.entity";

@Injectable()
export class UserWebsitesService {
  private readonly logger = new Logger("UserWebsitesService");

  constructor( 
    @InjectRepository(UserWebsite)
    private readonly assignmentRepo: Repository<UserWebsite>,
    private readonly outboxService: OutboxService
  ) {}

  async allocateWebsiteToUser(
        userId: number,
    websiteIds: number[]
    ): Promise<void> {
    this.logger.log(`A afiliar os website IDs [${websiteIds.join(", ")}] ao user ID ${userId}`);

    if (websiteIds.length === 0) return;

    const connection = this.assignmentRepo.manager.connection;

    await connection.transaction(async (transactionalEntityManager) => {
      const allocations = websiteIds.map(websiteId => 
        this.assignmentRepo.create({ websiteId, userId })
      );
      
      await transactionalEntityManager.save(UserWebsite, allocations);

      await this.outboxService.putInOutbox(transactionalEntityManager, {
        aggregateType: FGA_RESOURCE.USER,
        aggregateId: userId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: { 
          resourceType: FGA_RESOURCE.USER, 
          resourceId: userId, 
          action: 'createUserWebsiteAllocations', 
          userId, 
          websiteIds 
        },
      });
    });
  }

async deallocateWebsiteFromUser(
    userId: number, 
    websiteIds: number[], 

  ): Promise<void> {
    this.logger.log(`A remover os website IDs [${websiteIds.join(", ")}] do user ID ${userId}`);

    if (websiteIds.length === 0) return;

  
    const connection = this.assignmentRepo.manager.connection;
    
    await connection.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager
        .createQueryBuilder()
        .delete()
        .from(UserWebsite)
        .where("userId = :userId", { userId })
        .andWhere("websiteId IN (:...websiteIds)", { websiteIds })
        .execute();

      
      await this.outboxService.putInOutbox(transactionalEntityManager, {
        aggregateType: FGA_RESOURCE.USER,
        aggregateId: userId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: { 
          resourceType: FGA_RESOURCE.USER, 
          resourceId: userId, 
          action: 'removeUserWebsiteAllocations', 
          userId, 
          websiteIds 
        }, 
      });
    });
  }
}