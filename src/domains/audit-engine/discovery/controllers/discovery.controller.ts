import {
  Controller,
  Param,
  Get,
  Post,
  UseGuards,
  Body,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CrawlerService } from "../services/discovery.service";

import { CrawlerCreateDTO } from "../dto/crawler-create.dto";
import { CrawlerWebsiteDTO } from "../dto/crawler-user-website.dto";
import { CrawlerDelete as CrawlerDeleteDTO } from "../dto/crawler-delete.dto";
import { CrawlerPageDeleteDTO } from "../dto/crawler-page-delete.dto";
import { CrawlerRequestDTO } from "../dto/request/cralwer-request.dto";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { SecurityContext } from "src/core/authorization/SecurityContext";

import { DiscoveryDocs } from "../discovery.swagger";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { FgaGuard } from "src/core/authorization/guards/fda.guard";
import { FgaAuthorized } from "src/core/authorization/decorators/fga-authorization.decorator";

@DiscoveryDocs.controller()
@Controller("discovery")
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
export class DiscoveryController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @DiscoveryDocs.getCrawlWebsites()
  @Roles(RoleSlug.ADMIN,RoleSlug.MONITOR)
  @Get("")
  async getCrawlWebsites(
    @Query() query: CrawlerRequestDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const securityContext: SecurityContext = { user };
    return await this.crawlerService.getMany(query, securityContext);
  }

  @DiscoveryDocs.crawlWebsite()
  @Roles(RoleSlug.ADMIN,RoleSlug.MONITOR)
  @FgaAuthorized({
      objectType: "website",
      action: "can_view",
      resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId
  })
  @Post("websites/:websiteId")
  async crawlWebsite(
    @Body() crawlerCreate: CrawlerCreateDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const secutityContext:SecurityContext = { user };
    const websites = crawlerCreate.websites_ids;
    const maxDepth = crawlerCreate.maxDepth;
    const maxPages = crawlerCreate.maxPages;
    const waitJS = crawlerCreate.waitJS;

    return await this.crawlerService.crawlWebsites(
      secutityContext,
      websites,
      {
        maxDepth: maxDepth,
        maxPages: maxPages,
        waitJS: waitJS,
      },
    );
  }
  
  @DiscoveryDocs.getCrawlPages()
  @Roles(RoleSlug.ADMIN,RoleSlug.MONITOR)
  @Get("pages")
  async getCrawlPages(
    @Query() crawlerWebsite: CrawlerWebsiteDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const securityContext: SecurityContext = { user };
    const crawlerId = crawlerWebsite.crawlerId;

    return await this.crawlerService.getCrawlPages(securityContext, crawlerId);
  }

  @DiscoveryDocs.deleteCrawlPage()
  @Roles("admin")
  @Delete("page")
  async deleteCrawlPage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() crawlerPageDeleteDTO: CrawlerPageDeleteDTO,
  ): Promise<any> {
    const crawlerId = crawlerPageDeleteDTO.crawlerId;
    const uris = crawlerPageDeleteDTO.uris;
    const SecutityContext: SecurityContext = { user };
    return await this.crawlerService.deleteCrawlerPages(
      SecutityContext,
      crawlerId,
      uris,
    );
  }

  @DiscoveryDocs.delete()
  @Roles("admin")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async delete(@Body() crawlerDelete: CrawlerDeleteDTO): Promise<any> {
    const crawlWebsiteId = crawlerDelete.ids;
    return await this.crawlerService.delete(crawlWebsiteId);
  }
}