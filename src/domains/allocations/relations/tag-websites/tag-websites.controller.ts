import { Controller, Post, Delete, Param, HttpStatus, HttpCode, Body, ParseIntPipe, UseGuards } from "@nestjs/common";
import { CreateWebsiteTagsDto } from "./dtos/tag-website-create.dto";
import { TagWebsitesService } from "./tag-website.service";
import { DeleteWebsiteTagsDto } from "./dtos/tag.website-delete.dto";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";

@Controller("tags/websites")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagWebsitesController {
  constructor(
    private readonly orchestrator: TagWebsitesService,
  ) {}

  @Roles(RoleSlug.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async allocateTagToWebsite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createWebsiteTagsDto: CreateWebsiteTagsDto,
  ) {
    const actorId = user.id;
    return await this.orchestrator.assignTagsToWebsite(createWebsiteTagsDto.tagIds, createWebsiteTagsDto.websiteId, actorId);
  }

  @Roles(RoleSlug.ADMIN)
  @Delete(":websiteId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTagFromWebsite(
    @CurrentUser() user: AuthenticatedUser,
    @Param("websiteId", ParseIntPipe) websiteId: number,
    @Body() deleteWebsiteTagsDto: DeleteWebsiteTagsDto,
  ) {
    const actorId = user.id;
    await this.orchestrator.removeTagsFromWebsite(deleteWebsiteTagsDto.tagIds, websiteId, actorId);
  }
}