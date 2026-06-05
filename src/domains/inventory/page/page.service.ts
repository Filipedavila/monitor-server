import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Page } from "./page.entity";
import { PageRepository,PageFilter, PageSort, PagePagination } from "./page.repository";
import { SecurityContext } from "src/core/authorization/SecurityContext";

import { QueryRequest, QueryResponse } from "src/common/repositories/base.repository";
import { CreatePageDto } from "./dto/create-page.dto";
import { FgaService } from "src/core/authorization/fga.service";

@Injectable()
export class PageService {
  constructor(
    private readonly pageRepo: PageRepository, 
    private readonly fgaService: FgaService, 
  ) {}


  async findAll(
    queryArgs: QueryRequest<PageFilter, PageSort, PagePagination>
  ): Promise<QueryResponse<Page>> {
    // TODO  : Authorization logic with FGA
    const userId = queryArgs.securityContext?.user.id;

    const objectsId  = await this.fgaService.listObjects({
      user: `user:${userId}`,
      relation: 'can_view',
      type: 'page',
    });

    queryArgs.filters = {
      ...queryArgs.filters,
      ids: objectsId.map(id => parseInt(id.split(':')[1], 10)),
    };
    return this.pageRepo.findMany(queryArgs);
  }


  async create(dto: CreatePageDto, securityContext: SecurityContext): Promise<Page[]> {
  const hasPermission = await this.fgaService.check(
    `user:${securityContext.user.id}`,
    'can_edit', 
    `website:${dto.websiteId}`
  );
  if (!hasPermission) {
    throw new ForbiddenException("You do not have permission to add pages to this website");
  }

  const rawPages = dto.pagesUrl.map(url => ({
    websiteId: dto.websiteId,
    url,
  }));
  if (rawPages.length === 0) return [];
  return await this.pageRepo.createPagesWithOutbox(dto.websiteId.toString(), dto.pagesUrl);
  }

  async findPageById(id: number, securityContext: SecurityContext): Promise<Page> {
    const page = await this.pageRepo.findById(id);
    if (!page) throw new NotFoundException();

    const hasPermission = await this.fgaService.check(
      `user:${securityContext.user.id}`,
      'can_view', 
      `page:${id}`
    );
    if (!hasPermission) {
      throw new ForbiddenException("You do not have permission to view this page"+"User:"+securityContext.user.id+"Page:"+id);
    }
    return page;
  } 


  async updateVisibility(
    id: number, 
    roleIds: number[], 
    securityContext: SecurityContext
  ): Promise<void > {
    const page = await this.pageRepo.findById(id);
    if (!page) throw new NotFoundException();
    const hasPermission = await this.fgaService.isSystemAdmin(securityContext.user.id);
    if (!hasPermission) {
      throw new ForbiddenException("You do not have permission to update page visibility");
    }
    // TODO  receive DTO the organization to associate.
    throw new Error("Not implemented yet");
  }


  
  async delete(ids: number[], securityContext: SecurityContext): Promise<void> {
    const idsPermited = await this.fgaService.listObjects({
      user: `user:${securityContext.user.id}`,
      relation: 'can_manage',
      type: 'page',
    }).then(objects => objects.map(obj => parseInt(obj.split(':')[1], 10)));
    const idsToDelete = ids.filter(id => idsPermited.includes(id));
    
    for (const id of idsToDelete) {
    await this.pageRepo.delete(id);

    await this.fgaService.deleteResourceTuples(`page:${id}`);

    } 
  }

}