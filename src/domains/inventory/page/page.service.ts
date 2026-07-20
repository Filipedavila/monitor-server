import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Page } from "./page.entity";
import { PageRepository,PageFilter, PageSort, PagePagination } from "./page.repository";
import { SecurityContext } from "src/core/authorization/SecurityContext";

import { QueryRequest, PaginationResponse } from "src/common/repositories/base.repository";
import { CreatePageDto } from "./dto/create-page.dto";
import { FgaService } from "src/core/authorization/fga.service";
import { ContextEnum,  ContextMapByRole } from "../context/context.enum";

@Injectable()
export class PageService {
  constructor(
    private readonly pageRepo: PageRepository, 
    private readonly fgaService: FgaService, 
  ) {}


  async findAll(
    queryArgs: QueryRequest<PageFilter, PageSort, PagePagination>,
    contexts: ContextEnum[],
    securityContext: SecurityContext
  ): Promise<PaginationResponse<Page>> {
    const query = {
      filters: queryArgs.filters || {},
      sortings: queryArgs.sortings || {},
      pagination: queryArgs.pagination || {},
      contexts,
      securityContext
    };
    return await this.pageRepo.findManyWithLastEvalScore(query);
  }


  async create(dto: CreatePageDto, securityContext: SecurityContext): Promise<Page[]> {
    const roleSlug = securityContext.user.role_slug;
    const contexts = ContextMapByRole[roleSlug] ? [ContextMapByRole[roleSlug]] : [];
    const rawPages = dto.pagesUrl.map(url => ({
    websiteId: dto.websiteId,
    url,
  }));
  if (rawPages.length === 0) return [];
  return await this.pageRepo.createPages(dto.websiteId, dto.pagesUrl, contexts);
  }

  async findPageById(websiteId: number, id: number, securityContext: SecurityContext): Promise<Page> {
    const page = await this.pageRepo.findByPageByWebsiteId(websiteId, id);
    if (!page) throw new NotFoundException(`Page with ID ${id} not found`);
    
    return page;
  } 
  async handlePageRemoval(pageIds: number[], securityContext: SecurityContext): Promise<void> {
    const roleSlug = securityContext.user.role_slug;
    const contextEnum = ContextMapByRole[roleSlug];
    if (!contextEnum) {
      throw new ForbiddenException("User role does not have an associated context");
    }
    const states = await this.pageRepo.getOwnershipStates(pageIds); 
    
    const toUnlink = states.filter(s => s.contextCount > 1).map(s => s.pageId);
    const toDelete = states.filter(s => s.contextCount === 1).map(s => s.pageId);

    await this.pageRepo.batchExecuteRemoval(toUnlink, toDelete, contextEnum);
}

  async changePageContexts(
      pageId: number[],
      contexts: ContextEnum[],
       actorId: number): Promise<Page[]> {
  
      const updatePages = await this.pageRepo.updateContextsMany(pageId, contexts);

      return updatePages;
    }

}