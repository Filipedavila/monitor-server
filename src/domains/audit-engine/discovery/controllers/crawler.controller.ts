import {
  Controller,
  Param,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  Body,
  Delete,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CrawlerService } from "../services/discovery.service";
import { success } from "../../../../common/response";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiResponse,
  ApiTags,
  ApiOperation,
  ApiBody,
} from "@nestjs/swagger";

import { CrawlerCreateDTO } from "../dto/crawler-create.dto";
import { CrawlerWebsiteDTO } from "../dto/crawler-user-website.dto";
import { CrawlerDelete as CrawlerDeleteDTO } from "../dto/crawler-delete.dto";
import { CrawlWebsitesResponseDTO } from "../dto/crawler-website-response.dto";
import { CrawlerPageDeleteDTO } from "../dto/crawler-page-delete.dto";
import { CrawlerWebsiteRequestDTO } from "../dto/request/cralwer-website-request.dto";
export interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    userType: number;
    username?: string;
    type?: string;
  };
}

@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("crawler")
//@UseInterceptors(LoggingInterceptor)
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("")
  @ApiOperation({
    summary: "Find all crawl websites with filters, sorts, and pagination",
  })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: CrawlWebsitesResponseDTO,
  })
  async getCrawlWebsites(
    @Query() query: CrawlerWebsiteRequestDTO,
  ): Promise<any> {
    return await this.crawlerService.getMany(query);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @ApiOperation({ summary: "Create a new crawl" })
  @ApiBody({ type: CrawlerCreateDTO })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @Post("create")
  async crawlWebsite(
    @Request() req: AuthenticatedRequest,
    @Body() crawlerCreate: CrawlerCreateDTO,
  ): Promise<any> {
    const websites = crawlerCreate.websites_ids;
    const maxDepth = crawlerCreate.maxDepth;
    const maxPages = crawlerCreate.maxPages;
    const waitJS = crawlerCreate.waitJS;

    return await this.crawlerService.crawlWebsites(
      req.user.userType,

      req.user.userId,
      websites,
      {
        maxDepth: maxDepth,
        maxPages: maxPages,
        waitJS: waitJS,
      },
    );
  }

  @ApiOperation({ summary: "Check user crawl results from a specific website" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  //@UseGuards(AuthGuard("jwt-monitor"))
  @Get("pages")
  async getCrawlPages(
    @Request() req: AuthenticatedRequest,
    @Query() crawlerWebsite: CrawlerWebsiteDTO,
  ): Promise<any> {
    const userId = req.user.userId;
    const crawlerId = crawlerWebsite.crawlerId;

    return await this.crawlerService.getCrawlPages(userId, crawlerId);
  }

  @ApiOperation({ summary: "Delete user crawl from a specific website" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Delete("page")
  async deleteCrawlPage(
    @Request() req: AuthenticatedRequest,
    @Body() crawlerPageDeleteDTO: CrawlerPageDeleteDTO,
  ): Promise<any> {
    const userId = req.user.userId;
    const crawlerId = crawlerPageDeleteDTO.crawlerId;
    const uris = crawlerPageDeleteDTO.uris;

    return await this.crawlerService.deleteCrawlerPages(
      userId,
      crawlerId,
      uris,
    );
  }

  @ApiOperation({ summary: "Delete specific crawl" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // TODO: URGENT Uniformizar os jwt e aplicar ROLES
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async deleteCrawl(@Body() crawlerDelete: CrawlerDeleteDTO): Promise<any> {
    const crawlWebsiteId = crawlerDelete.ids;
    return await this.crawlerService.delete(crawlWebsiteId);
  }
}
