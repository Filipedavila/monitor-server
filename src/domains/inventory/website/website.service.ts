import { Injectable, ForbiddenException, NotFoundException, Inject, BadRequestException } from "@nestjs/common";

import { Website } from "./website.entity";
import { SecurityContext } from "src/core/authorization/SecurityContext";
import { QueryRequest, PaginationResponse } from "src/common/repositories/base.repository";
import { WebsiteFilter, WebsitePagination, WebsiteRepository, WebsiteSort } from "./repositories/website.repository";
import { UpdateWebsiteDto } from "./dto/update-website.dto";
import { CreateWebsiteDto } from "./dto/create-website.dto";
import { FgaService } from "src/core/authorization/fga.service";
import { FGA_RELATION, FgaObjectIdentifier, FgaUserIdentifier } from "src/core/authorization/types/fga.types";
import { BaseService } from "src/common/services/base.service";
import { FieldConflictException } from "src/common/exceptions/conflict.exception";

@Injectable()
export class WebsiteService extends BaseService {
  constructor(
    private readonly repository: WebsiteRepository,
    private readonly fgaService: FgaService,
  ) {
    super("WebsiteService");
  }


  async findMany<Q extends QueryRequest<WebsiteFilter, WebsiteSort, WebsitePagination>>(
    queryArgs: Q,
  ): Promise<PaginationResponse<Website>> {
    
    const userId = queryArgs.securityContext?.user.id;

    const objectsId  = await this.fgaService.listObjects({
      user: `user:${userId}`,
      relation: 'can_view',
      type: 'website',
    });

    queryArgs.filters = {
      ...queryArgs.filters,
      ids: objectsId.map(id => parseInt(id.split(':')[1], 10)),
    };

    return  this.repository.findMany(queryArgs);
  }

  async createWebsite(
    createDto: CreateWebsiteDto,
    securityContext: SecurityContext
  ): Promise<Website> {
    const isAdmin = await this.fgaService.isSystemAdmin(securityContext.user.id);

    if (!isAdmin) {
      throw new ForbiddenException("You do not have permission to create a website");
    }
    const normalizedBaseUrl = this.normalizeBaseUrl(createDto.baseUrl);
    const existingWebsite = await this.repository.findOneBy({ baseUrl: normalizedBaseUrl });
    if (existingWebsite) {
      throw new FieldConflictException({
        baseUrl: "url already exists",
      });
    }

    const website = this.repository.orm.create();
    Object.assign(website, createDto);
    const savedWebsite = await this.repository.save(website);
    
    if (!savedWebsite) {
      throw new Error("Failed to create website");
    }
    
    await this.fgaService.createBatchesRelationships(
      [ 
        {
          user: `user:${securityContext.user.id}`,
          relation: 'owner',
          object: `website:${savedWebsite.id}`,
        },
        {
          user: `team:pending`,
          relation: 'parent',
          object: `website:${savedWebsite.id}`,
        }
      ] 
    );
  
    

    
    return savedWebsite;
  }


  async findOne(id: number, securityContext: SecurityContext): Promise<Website> {
    const permitted = await this.fgaService.check(
      `user:${securityContext.user.id}`,
      'can_view',
      `website:${id}`
    );
    if (!permitted) {
      throw new ForbiddenException("You do not have permission to view this website");
    }
    const website:Website| null = await this.repository.findById(id);

    if (!website) {
      throw new NotFoundException(`Website with ID ${id} not found`);
    }
    return website;
  }


  async update(
    updateDto: UpdateWebsiteDto, 
    securityContext: SecurityContext
  ): Promise<Website> {
     const permitted = await this.fgaService.check(
      `user:${securityContext.user.id}`,
      'can_edit',
      `website:${updateDto.websiteId}`
    );
    if (!permitted) {
      throw new ForbiddenException("You do not have permission to edit this website");
    }
    const website = await this.findOne(updateDto.websiteId, securityContext);


    Object.assign(website, updateDto);
    return await this.repository.save(website);
  }


  async delete(ids: number[], securityContext: SecurityContext): Promise<void> {
    const idsPermited = await this.fgaService.listObjects({
      user: `user:${securityContext.user.id}`,
      relation: 'can_manage',
      type: 'website',
    }).then(objects => objects.map(obj => parseInt(obj.split(':')[1], 10)));
    const idsToDelete = ids.filter(id => idsPermited.includes(id));

    for (const id of idsToDelete) {
    await this.repository.delete(id);

    await this.fgaService.deleteResourceTuples(`website:${id}`);

    } 
  }

  async publishToObservatory(id: number, securityContext: SecurityContext): Promise<void> {
    const permitted = await this.fgaService.check(
      `user:${securityContext.user.id}`,
      'can_edit',
      `website:${id}`
    );
    if (!permitted) {
      throw new ForbiddenException("You do not have permission to transfer this website");
    }
    const website = await this.findOne(id, securityContext);
    if (!website) {
      throw new NotFoundException(`Website with ID ${id} not found`);
    }
    website.isInObservatory = true;
    await this.repository.save(website);
  }
  async isSystemAdmin(userId: string): Promise<boolean> {
  return this.fgaService.check(
    `user:${userId}` as FgaUserIdentifier<'user'>,
    FGA_RELATION.ROLE, 
    `role:admin` as FgaObjectIdentifier<'role'>
  );
}

private normalizeBaseUrl(baseUrl: string): string {
    if (baseUrl) {
      return baseUrl
        .trim()
        .toLowerCase()
        .replace(/\/+$/, "");
    }
    return baseUrl;

    }
  
}