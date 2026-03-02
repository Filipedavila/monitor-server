
import {
  Controller,
  Param,
  Request,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CrawlerService } from "./crawler.service";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiResponse,
  ApiTags,
  ApiOperation,
} from "@nestjs/swagger";
import { CrawlWebsiteNew } from "./crawler.entity";
import { CrawlerConfig } from "./dto/crawler-config.dto";
import { CrawlerCreate } from "./dto/crawler-create.dto";
import { CrawlerTags } from "./dto/crawler-tags.dto";
import { CrawlerUserWebsite } from "./dto/crawler-user-website.dto";
import { CrawlerDelete } from "./dto/crawler-delete.dto";
import { CrawlerDeleteBulk } from "./dto/crawler-delete-bulk.dto";
import { ADMIN_USER_ID } from "src/common/constants/roles.constants";
import { WebsiteService } from "src/website/website.service";

//@ApiBasicAuth()
//@ApiTags("directory")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("crawler-new")
//@UseInterceptors(LoggingInterceptor)
export class CrawlerController {
  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly websiteService: WebsiteService
  ) {}

  @ApiOperation({ summary: "Find all crawl website" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<CrawlWebsiteNew>,
  })
  //@UseGuards(AuthGuard("jwt-admin"))
  @Get("all")
  async getAll(): Promise<any> {
    return success(await this.crawlerService.getAll());

  }

  @ApiOperation({ summary: "Find  the crawler config" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("config")
  getConfig(): Promise<any> {
    return success(this.crawlerService.getConfig());
  }

  @ApiOperation({ summary: "Change the crawler config" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("setConfig")
  setConfig(@Body() crawlerConfig: CrawlerConfig): Promise<any> {
    const maxDepth = crawlerConfig.maxDepth;
    const maxPages = crawlerConfig.maxPages;
    return success(this.crawlerService.setConfig(maxDepth, maxPages));
  }

  @ApiOperation({ summary: "Change the crawler config" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  //@UseGuards(AuthGuard("jwt-admin"))
  @Post("crawl")
  async crawlWebsite(@Body() crawlerCreate: CrawlerCreate): Promise<any> {
    const websites = crawlerCreate.websites;
    const maxDepth = crawlerCreate.maxDepth;
    const maxPages = crawlerCreate.maxPages;
    const waitJS = crawlerCreate.waitJS;

    return success(
      await this.crawlerService.crawlWebsites(
        ADMIN_USER_ID,
        websites,
        {
          maxDepth: maxDepth,
          maxPages: maxPages,
          waitJS: waitJS,
        }
      )
    );
  }

  @ApiOperation({ summary: "Crawl all websites in a list of tags" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  //@UseGuards(AuthGuard("jwt-admin"))
  @Post("tags")
  async crawlTags(@Body() crawlerTags: CrawlerTags): Promise<any> {
    const tagsId = crawlerTags.tagsId;
    return success(await this.crawlerService.crawlTags(tagsId));
  }

  @ApiOperation({ summary: "Crawl user website(My Monitor)" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  //@UseGuards(AuthGuard("jwt-monitor"))
  @Post("crawlUser")
  async crawlUserPage(
    @Request() req: any,
    @Body() crawlerUserWebsite: CrawlerUserWebsite
  ): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = crawlerUserWebsite.website;
    const websiteId = await this.websiteService.getWebsiteId(
      userId,
      websiteUrl
    );

    return success(
      await this.crawlerService.crawlWebsites(
        userId,
        [{ url: websiteUrl, websiteId }],
        )
    );
  }

  @ApiOperation({ summary: "Check user crawl results from a specific website" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  //@UseGuards(AuthGuard("jwt-monitor"))
  @Post("crawlUserResults")
  async getCrawlUserPageResults(
    @Request() req: any,
    @Body() crawlerUserWebsite: CrawlerUserWebsite
  ): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = crawlerUserWebsite.website;
    const websiteId = await this.websiteService.getWebsiteId(
      userId,
      websiteUrl
    );

    return success(
      await this.crawlerService.getCrawlResults(userId, websiteId)
    );
  }

  @ApiOperation({ summary: "Delete user crawl from a specific website" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  //@UseGuards(AuthGuard("jwt-monitor"))
  @Post("crawlUserDelete")
  async deleteCrawlUserPage(
    @Request() req: any,
    @Body() crawlerUserWebsite: CrawlerUserWebsite
  ): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = crawlerUserWebsite.website;
    const websiteId = await this.websiteService.getWebsiteId(
      userId,
      websiteUrl
    );

    return success(
      await this.crawlerService.deleteCrawler(userId, websiteId)
    );
  }

  @ApiOperation({ summary: "Crawl user website(Study Monitor)" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  //@UseGuards(AuthGuard("jwt-study"))
  @Post("crawlStudiesUser")
  async crawlStudiesUserPage(
    @Request() req: any,
    @Body() crawlerUserWebsite: CrawlerUserWebsite
  ): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = crawlerUserWebsite.website;
    const websiteId = await this.websiteService.getWebsiteId(
      userId,
      websiteUrl
    );

    return success(
      await this.crawlerService.crawlWebsites(
        userId,
        [{ url: websiteUrl, websiteId }],
        )
    );
  }

  @ApiOperation({
    summary: "Check user crawl results from a specific website(Study Monitor)",
  })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })

  //@UseGuards(AuthGuard("jwt-study"))
  @ApiOperation({ summary: "Find crawl results from a specific tag" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-study"))
  @Get("tag/:tagName")
  async getCrawlStudiesUserTagWebsites(
    @Param("tagName") tagName: string,
    @Request() req: any
  ): Promise<any> {
    const userId = req.user.userId;
    return success(
      await this.crawlerService.getUserTagWebsitesCrawlResults(
        userId,
        decodeURIComponent(tagName)
      )
    );
  }

  @ApiOperation({ summary: "Check user crawl results from a specific website" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-study"))
  @Post("crawlStudiesUserResults")
  async getCrawlStudiesUserPageResults(
    @Request() req: any,
    @Body() crawlerUserWebsite: CrawlerUserWebsite
  ): Promise<any> {
    const userId = req.user.userId;
    const websiteId = crawlerUserWebsite.websiteId;

    return success(
      await this.crawlerService.getCrawlResults(userId, websiteId)
    );
  }

  @ApiOperation({
    summary: "Delete user crawl from a specific website(Study Monitor)",
  })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-study"))
  @Post("crawlStudiesUserDelete")
  async deleteCrawlStudiesUserPage(
    @Request() req: any,
    @Body() crawlerUserWebsite: CrawlerUserWebsite
  ): Promise<any> {
    const userId = req.user.userId;
    const websiteId = crawlerUserWebsite.websiteId;

    return success(
      await this.crawlerService.deleteCrawler(userId, websiteId)
    );
  }

  @ApiOperation({ summary: "Delete specific crawl" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("delete")
  async deleteCrawl(@Body() crawlerDelete: CrawlerDelete): Promise<any> {
    const crawlWebsiteId = crawlerDelete.crawlWebsiteId;

    return success(await this.crawlerService.delete(crawlWebsiteId));
  }

  @ApiOperation({ summary: "Delete list of crawls" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("deleteBulk")
  async deleteCrawlers(
    @Body() crawlerDeleteBulk: CrawlerDeleteBulk
  ): Promise<any> {
    const crawlWebsiteIds = crawlerDeleteBulk.crawlWebsiteIds;

    return success(await this.crawlerService.deleteBulk(crawlWebsiteIds));
  }

  @ApiOperation({ summary: "Find crawl website by id" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("getByCrawlWebsiteID/:crawlWebsiteId")
  async getCrawlResultsCrawlWebsiteID(
    @Param("crawlWebsiteId") crawlWebsiteId: string
  ): Promise<any> {
    return success(
      await this.crawlerService.getCrawlResults(
        ADMIN_USER_ID,
        parseInt(crawlWebsiteId)
      )
    );
  }
}
