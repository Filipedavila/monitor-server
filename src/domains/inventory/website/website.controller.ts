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
  Patch,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { WebsiteQueryRequestDTO } from "./dto/request/query/website-query-request.dto";
import { WebsiteService } from "./website.service";
import { AuthenticatedUser } from "src/core/authentication/interfaces/types";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { UpdateWebsiteDto } from "./dto/update-website.dto";
import { CreateWebsiteDto } from "./dto/create-website.dto";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { WebsiteDocs } from "./website.swagger";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";


@WebsiteDocs.controller()

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("websites")
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @WebsiteDocs.findAll()
  @Get()
  async findAll(
    @Query() queryDto: WebsiteQueryRequestDTO,
    @CurrentUser() user: AuthenticatedUser, 
  ) {
    return this.websiteService.findMany({
      securityContext: { user },
      pagination: { limit: queryDto.pagination?.limit, page: queryDto.pagination?.page },
      sorting: queryDto.sorts?.toSafeOrder(),
      filters: queryDto.filters,

    });
  }

  @WebsiteDocs.findOne()
  @Get(":id")
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.websiteService.findOne(id, { user });
  }

  @WebsiteDocs.create()
  @Post()
  async create(
    @Body() dto: CreateWebsiteDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.websiteService.createWebsite(dto, { user });
  }

  @WebsiteDocs.update()
  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateWebsiteDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    
    return this.websiteService.update(dto, { user });
  }

  @WebsiteDocs.delete()
  @Delete()
  async delete(
    @Body("ids") ids: number[],
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.websiteService.delete(ids, { user });
  }


  @ApiOperation({ summary: "Transfer website pages to Observatory" })
  @Roles("monitor", "admin")
  @Post(":id/publish")
  async transfer(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser
  ) {
       await this.websiteService.publishToObservatory(id, { user });
    
  }
}