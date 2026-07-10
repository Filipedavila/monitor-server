import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
  Logger,
} from "@nestjs/common";
import { PageService } from "./page.service";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { PageImportDto } from "./dto/page-import.dto";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { CreatePageDto } from "./dto/create-page.dto";
import {PageQueryRequestDTO} from "./dto/request/query/page-query-request.dto";
import { LoggableController } from "src/common/controllers/loggable.interface";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { ContextFilterGuard } from "src/core/authorization/guards/context.guard";

@UseGuards(JwtAuthGuard, RolesGuard)

@Controller("pages")
export class PageController implements LoggableController{
  readonly logger = new Logger("PageController");
  constructor(private readonly pageService: PageService) {}


  
  @Roles(RoleSlug.ADMIN,RoleSlug.MONITOR)
  @UseGuards(ContextFilterGuard)
  @Get()
  async find(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PageQueryRequestDTO
  ) {
    return this.pageService.findAll({
      securityContext: { user },
      pagination: { limit: query.pagination?.limit, page: query.pagination?.page },
      sortings: query.sorts?.sort,
      filters: query.filters,
    });
  }

  @Roles(RoleSlug.ADMIN,RoleSlug.MONITOR)
  @Get(":pageId")
  async findOne(
    @Param("pageId", ParseIntPipe) pageId: number,
    @CurrentUser() user: AuthenticatedUser,

  ) {
    return this.pageService.findPageById(pageId, { user });
  }

  @Roles(RoleSlug.ADMIN)
  @Post("import")
  async import(@Body() dto: PageImportDto, @CurrentUser() user: AuthenticatedUser) {
    /* TODO , add only token to OpenFGA */
    throw new Error("Not implemented yet");
    /*
    return this.pageService.import(dto, { user });
    */
  }

  @Post("")
  async create(@Body() dto: CreatePageDto, @CurrentUser() user: AuthenticatedUser) {
    return this.pageService.create(dto, { user });
  }

  @Roles(RoleSlug.ADMIN)
  @Delete()
  async bulkDelete(@Body("ids") ids: number[], @CurrentUser() user: AuthenticatedUser) {
    return this.pageService.delete(ids, { user });
  }


  @Get("website/:websiteId")
  async getByWebsite(
    @Param("websiteId", ParseIntPipe) websiteId: number,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.pageService.findAll({
      securityContext: { user },
      filters: { websiteId } ,
    });
  }



}