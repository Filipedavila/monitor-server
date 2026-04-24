import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { WebsiteQueryRequestDTO } from "./dto/request/query/website-query-request.dto";
import { WebsiteService } from "./website.service.v2";
import { SecurityContext } from "src/core/security-authorization/SecurityContext";
import { AuthenticatedUser } from "src/core/auth/interfaces/types";
import { CurrentUser } from "src/core/security-authorization/decorators/current-user.decorator";


@ApiTags("websites")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("websites")
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @ApiOperation({ summary: "List websites with pagination and security filters" })
  @Get()
  async findAll(
    @Query() queryDto: WebsiteQueryRequestDTO,
    @CurrentUser() user: AuthenticatedUser, 
  ) {
    return this.websiteService.findAll({
      securityContext: { user },
      pagination: { limit: queryDto.pagination?.limit, page: queryDto.pagination?.page },
      sorting: queryDto.sorts?.toSafeOrder(),
      filters: queryDto.filters,

    });
  }

  @ApiOperation({ summary: "Get detailed website information" })
  @Get(":id")
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.websiteService.findOne(id, { user });
  }

  @ApiOperation({ summary: "Create a new website" })
  @Post()
  async create(
    @Body() dto: CreateWebsiteDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.websiteService.createOne(dto, { user });
  }

  @ApiOperation({ summary: "Update website metadata and permissions" })
  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateWebsiteDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.websiteService.update(id, dto, { user });
  }

  @ApiOperation({ summary: "Delete one or multiple websites" })
  @Delete()
  async delete(
    @Body("ids") ids: number[],
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.websiteService.delete(ids, { user });
  }


  @ApiOperation({ summary: "Transfer website pages to Observatory" })
  @Roles("monitor", "admin")
  @Post(":id/transfer-observatory")
  async transfer(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.websiteService.transferToObservatory(id, { user });
  }

  @ApiOperation({ summary: "Check if a starting URL is already registered" })
  @Get("search/exists")
  async checkExistence(@Query("url") url: string) {
    return this.websiteService.existsUrl(url);
  }
}