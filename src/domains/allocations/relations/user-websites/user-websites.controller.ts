import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class WebsiteAllocationService {
  private readonly logger = new Logger("WebsiteAllocationService");

  constructor() {}

  async allocateWebsiteToUser(userId: number, websiteId: number): Promise<any> {
    this.logger.log(`A atribuir website ID ${websiteId} ao user ID ${userId}`);
    // Regras de negócio de alocação direta
    return { status: "allocated" };
  }

  async deallocateWebsiteFromUser(userId: number, websiteId: number): Promise<void> {
    this.logger.log(`A remover website ID ${websiteId} do user ID ${userId}`);
  }
}