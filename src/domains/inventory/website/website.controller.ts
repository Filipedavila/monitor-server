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
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { UpdateWebsiteDto } from "./dto/update-website.dto";
import { CreateWebsiteDto } from "./dto/create-website.dto";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { WebsiteDocs } from "./website.swagger";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { UpdateWebsiteContextDto } from "./dto/update.website-context.dto";
import { WebsiteDTO } from "./dto/website.dto";
import { DeleteBulkWebsiteDto } from "./dto/delete-bulk-website.dto";


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
      sortings: queryDto.sorts?.toSafeOrder(),
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
  @Roles(RoleSlug.ADMIN)
  @Post()
  async create(
    @Body() dto: CreateWebsiteDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.websiteService.createWebsite(dto, { user });
  }
  
  @WebsiteDocs.update()
  @Roles(RoleSlug.ADMIN)
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
    @Body() deleteBulkDto: DeleteBulkWebsiteDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.websiteService.delete(deleteBulkDto.ids, { user });
  }


  @ApiOperation({ summary: "Update context of Website" })
  @Roles(RoleSlug.ADMIN)
  @Put(":id/contexts")
  async transfer(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateWebsiteContextDto: UpdateWebsiteContextDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<WebsiteDTO> {
       return await this.websiteService.changeWebsiteContexts(id, updateWebsiteContextDto.contexts, user.id);
    
  }

}