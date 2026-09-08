import {
  Controller,
  Get,
  Post,
  UseGuards,
  Body,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CrawlerWebsiteService } from './crawler-website.service';

import { CrawlerCreateDTO } from './dto/crawler-create.dto';
import { CrawlerDelete as CrawlerDeleteDTO } from './dto/crawler-delete.dto';
import { CrawlerRequestDTO } from './dto/request/cralwer-request.dto';

import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { SecurityContext } from 'src/core/authorization/SecurityContext';

import { DiscoveryDocs } from './crawler-website.swagger';
import { RolesGuard } from 'src/core/authorization/guards/roles.guard';
import { JwtAuthGuard } from 'src/core/authentication/guards/jwt-auth.guard';
import { Roles } from 'src/core/authorization/decorators/roles.decorator';
import { FgaGuard } from 'src/core/authorization/guards/fga.guard';
import { FgaAuthorized } from 'src/core/authorization/decorators/fga-authorization.decorator';
import { CrawlerImportDTO } from './dto/crawler-import.dto';

@DiscoveryDocs.controller()
@Controller('discovery')
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
export class CrawlerWebsiteController {
  constructor(private readonly crawlerWebsiteService: CrawlerWebsiteService) {}

  @DiscoveryDocs.getCrawlWebsites()
  @Roles(RoleSlug.ADMIN, RoleSlug.MONITOR)
  @Get('')
  async getCrawlWebsites(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CrawlerRequestDTO,
  ): Promise<any> {
    const securityContext: SecurityContext = { user };
    return await this.crawlerWebsiteService.getMany(query, securityContext);
  }

  @DiscoveryDocs.importCrawlers()
  @Roles(RoleSlug.ADMIN, RoleSlug.MONITOR)
  @HttpCode(HttpStatus.OK)
  @Post('import')
  async importCrawlers(
    @CurrentUser() user: AuthenticatedUser,
    @Body() crawlerImport: CrawlerImportDTO,
  ): Promise<void> {
    const securityContext: SecurityContext = { user };
    await this.crawlerWebsiteService.importCrawlers(securityContext, crawlerImport.crawlerIds);
  }

  @DiscoveryDocs.crawlWebsite()
  @Roles(RoleSlug.ADMIN, RoleSlug.MONITOR)
  @FgaAuthorized({
    objectType: 'website',
    action: 'can_view',
    resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
  })
  @Post(':websiteId')
  async crawlWebsite(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Body() crawlerCreate: CrawlerCreateDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const securityContext: SecurityContext = { user };
    const websites = [websiteId];

    return await this.crawlerWebsiteService.crawlWebsites(securityContext, websites, {
      maxDepth: crawlerCreate.maxDepth,
      maxPages: crawlerCreate.maxPages,
      waitJS: crawlerCreate.waitJS,
    });
  }

  @DiscoveryDocs.deleteCrawler()
  @Roles(RoleSlug.ADMIN, RoleSlug.MONITOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('')
  async deleteManyCrawlers(
    @CurrentUser() user: AuthenticatedUser,
    @Body() crawlerDelete: CrawlerDeleteDTO,
  ): Promise<void> {
    const securityContext: SecurityContext = { user };
    await this.crawlerWebsiteService.deleteMany(securityContext, crawlerDelete.ids);
  }
}
