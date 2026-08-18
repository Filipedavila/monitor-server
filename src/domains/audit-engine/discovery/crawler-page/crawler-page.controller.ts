import {
  Controller,
  Get,
  UseGuards,
  Body,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { CrawlerPageService } from "./crawler-page.service";

import { CrawlerWebsiteDTO } from "./dto/crawler-user-website.dto";
import { CrawlerPageDeleteDTO } from "./dto/crawler-page-delete.dto";

import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { SecurityContext } from "src/core/authorization/SecurityContext";

import { DiscoveryDocs } from "../discovery.swagger";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { FgaGuard } from "src/core/authorization/guards/fga.guard";

@DiscoveryDocs.controller()
@Controller("discovery/pages") 
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
export class CrawlerPageController {
  constructor(private readonly crawlerPageService: CrawlerPageService) {}

  @DiscoveryDocs.getCrawlPages()
  @Roles(RoleSlug.ADMIN, RoleSlug.MONITOR)
  @Get("")
  async getCrawlPages(
    @Query() crawlerWebsite: CrawlerWebsiteDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const securityContext: SecurityContext = { user };
    const crawlerId = crawlerWebsite.crawlerId;

    return await this.crawlerPageService.getCrawlPages(securityContext, crawlerId);
  }

  @DiscoveryDocs.deleteCrawlPage()
  @Roles(RoleSlug.ADMIN, RoleSlug.MONITOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("")
  async deleteCrawlPages(
    @CurrentUser() user: AuthenticatedUser,
    @Body() crawlerPageDeleteDTO: CrawlerPageDeleteDTO,
  ): Promise<any> {
    const securityContext: SecurityContext = { user };
    return await this.crawlerPageService.deletePagesIdempotent(
      securityContext,
      crawlerPageDeleteDTO,
    );
  }
}