import { Injectable } from "@nestjs/common";
import { UnifiedAllocationsRepository } from "./webiste-allocations.repository";
import { WebsiteQueryRequestDTO } from "src/domains/inventory/website/dto/request/query/website-query-request.dto";

@Injectable()
export class WebsiteAllocationService {
  constructor(
    private readonly allocationsRepo: UnifiedAllocationsRepository
  ) {}

  async findWebsitesForUser(userId: number, queryArgs: WebsiteQueryRequestDTO) {

    const filters = {
      ...queryArgs.filters,
      sourceId: userId,
    };

    const sortings = queryArgs.sorts?.toSafeOrder();


    const result = await this.allocationsRepo.findAllocations('user-website', {
      filters,
      sortings,
      pagination: {
        limit: queryArgs.pagination?.limit,
        page: queryArgs.pagination?.page
      }
    });

    return result; 
  }
}