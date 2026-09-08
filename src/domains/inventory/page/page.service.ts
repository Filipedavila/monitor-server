import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Page } from './page.entity';
import { PageRepository } from './page.repository';
import { SecurityContext } from 'src/core/authorization/SecurityContext';

import { QueryRequest, PaginationResponse } from 'src/common/repositories/base.repository';
import type { PageFilter, PageSort, PagePagination } from './types';
import { CreatePageDto } from './dto/create-page.dto';
import { ContextEnum } from '../context/context.enum';
import { PageEvalDTO } from './dto/page-detailed.dto';
import xxhash from 'xxhash-wasm';

@Injectable()
export class PageService {
  constructor(private readonly pageRepo: PageRepository) {}

  async findAll(
    queryArgs: QueryRequest<PageFilter, PageSort, PagePagination>,
    contexts: ContextEnum[],
    securityContext: SecurityContext,
  ): Promise<PaginationResponse<PageEvalDTO>> {
    const query = {
      filters: queryArgs.filters || {},
      sortings: queryArgs.sortings || {},
      pagination: queryArgs.pagination || {},
      contexts,
      securityContext,
    };
    return await this.pageRepo.findManyWithLastEvalScore(query);
  }

  async create(dto: CreatePageDto, securityContext: SecurityContext): Promise<void> {
    const { h64 } = await xxhash();
    const rawPages = dto.pagesUrl.map((url) => {
      const rawUint64 = h64(url.trim());
      const signedInt64 = BigInt.asIntN(64, rawUint64).toString();

      return {
        websiteId: dto.websiteId,
        url,
        urlHash: signedInt64,
      };
    });
    if (rawPages.length === 0) return;

    await this.pageRepo.upsertPages(dto.websiteId, rawPages, securityContext);
  }

  async findPageById(
    websiteId: number,
    id: number,
    securityContext: SecurityContext,
  ): Promise<Page> {
    const page = await this.pageRepo.findByPageByWebsiteId(websiteId, id);
    if (!page) throw new NotFoundException(`Page with ID ${id} not found`);

    return page;
  }

  async changePageContexts(
    pageId: number[],
    contexts: ContextEnum[],
    securityContext: SecurityContext,
  ): Promise<void> {
    await this.pageRepo.changePageContexts(pageId, contexts, securityContext);
  }

  async handlePageRemoval(pageIds: number[], securityContext: SecurityContext): Promise<void> {
    await this.pageRepo.deletePagesWithContextCheck(pageIds, securityContext);
  }

  async importPages(
    securityContext: SecurityContext,
    websiteId: number,
    crawlPages: string[],
  ): Promise<void> {
    const { h64 } = await xxhash();

    const crawlerPages = crawlPages.map((url) => {
      const rawUint64 = h64(url.trim());
      const signedInt64 = BigInt.asIntN(64, rawUint64).toString();
      return {
        url,
        urlHash: signedInt64,
      };
    });
    await this.pageRepo.upsertPages(websiteId, crawlerPages, securityContext);
  }
}
