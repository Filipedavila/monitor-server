import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";

import { Website } from "./website.entity";
import { AbilityFactory } from "src/core/security-authorization/ablities/ability.factory";
import { SecurityContext } from "@core/security-authorization/SecurityContext";
import { SecureQueryRequest } from "src/common/repositories/access-secure.repository";
import { QueryResponse } from "src/common/repositories/base.repository";
import { WebsiteFilter, WebsitePagination, WebsiteRepository, WebsiteSort } from "./repositories/website.repository";
import { Action } from "src/core/security-authorization/ability.types";
import { UpdateWebsiteDto } from "./dto/update-website.dto";

@Injectable()
export class WebsiteService {
  constructor(
    private readonly websiteRepo: WebsiteRepository,
    private readonly abilityFactory: AbilityFactory,
  ) {}


  async findAll(
    queryArgs: SecureQueryRequest<WebsiteFilter, WebsiteSort, WebsitePagination>,
  ): Promise<QueryResponse<Website>> {
    // TODO Implement security filtering based on the user's abilities with SecureRepository Implementation

    return await this.websiteRepo.findMany(queryArgs);
  }


  async findOne(id: number, securityContext: SecurityContext): Promise<Website> {
    const website:Website| null = await this.websiteRepo.findById(id);

    if (!website) {
      throw new NotFoundException(`Website with ID ${id} not found`);
    }

    const ability = this.abilityFactory.defineAbility(securityContext.user, Website);

    if (ability.cannot(Action.Read, website)) {
      throw new ForbiddenException("You do not have access to this website");
    }

    return website;
  }


  async update(
    id: number, 
    updateDto: UpdateWebsiteDto, 
    securityContext: SecurityContext
  ): Promise<Website> {
    const website = await this.findOne(id, securityContext);
    const fields = Object.keys(updateDto);
    const ability = this.abilityFactory.defineAbility(securityContext.user, Website);
    fields.forEach(field => {
      if (ability.cannot(Action.Update, website, field)) {
        throw new ForbiddenException(`You are not allowed to update the field: ${field}`);
      }
    });

    Object.assign(website, updateDto);
    return await this.websiteRepo.save(website);
  }


  async delete(ids: number[], securityContext: SecurityContext): Promise<number[]> {
    
    const ability = this.abilityFactory.defineAbility(securityContext.user, Website);
    
    for (const id of ids) {
      const website = await this.websiteRepo.findById(id);
      if (website && ability.cannot(Action.Delete, website)) {
        throw new ForbiddenException(`Forbidden: Cannot delete website ${id}`);
      }
    }

    await this.websiteRepo.deleteMany(ids);
    return ids;
  }
}