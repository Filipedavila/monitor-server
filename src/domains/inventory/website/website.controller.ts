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
import { DeleteBulkWebsiteDto } from "./dto/delete-bulk-website.dto";
import { FgaGuard } from "src/core/authorization/guards/fda.guard";
import { FgaAuthorized } from "src/core/authorization/decorators/fga-authorization.decorator";


@WebsiteDocs.controller()

@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
@Controller("websites")
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @WebsiteDocs.findAll()
  @Roles(RoleSlug.ADMIN,RoleSlug.MONITOR)
  @Get()
  async findAll(
    @Query() queryDto: WebsiteQueryRequestDTO,
    @CurrentUser() user: AuthenticatedUser, 
  ) {
    return this.websiteService.findMany(
      queryDto,
   queryDto.contexts,
      { user },);
  }

  @WebsiteDocs.findOne()
  @FgaAuthorized({
          objectType: "website",
          action: "can_view",
          resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId
  })
  @Roles(RoleSlug.ADMIN,RoleSlug.MONITOR)
  @Get(":websiteId")
  async findOne(
    @Param("websiteId", ParseIntPipe) websiteId: number,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.websiteService.findOne(websiteId, { user });
  }


  @WebsiteDocs.create()
  @FgaAuthorized({
          objectType: "role",
          action: "can_manage_users",
          resourceIdResolver: () => 'ams'
  })
  @Roles(RoleSlug.ADMIN)
  @Post()
  async create(
    @Body() dto: CreateWebsiteDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.websiteService.createWebsite(dto, { user });
  }
  
  @WebsiteDocs.update()
   @FgaAuthorized({
          objectType: "role",
          action: "can_edit_users",
          resourceIdResolver: () => 'ams'
  })
  @Roles(RoleSlug.ADMIN)
  @Patch(":websiteId")
  async update(
    @Param("websiteId", ParseIntPipe) websiteId: number,
    @Body() dto: UpdateWebsiteDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    
    return this.websiteService.update(websiteId,dto, { user });
  }

  @WebsiteDocs.delete()
  @FgaAuthorized({
          objectType: "role",
          action: "can_manage_users",
          resourceIdResolver: () => 'ams'
  })
  @Roles(RoleSlug.ADMIN)
  @Delete()
  async delete(
    @Body() deleteBulkDto: DeleteBulkWebsiteDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.websiteService.delete(deleteBulkDto.websiteIds, { user });
  }



}