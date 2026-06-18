import {
  Controller, InternalServerErrorException, Post, Get, Request, Param, UseGuards, UseInterceptors, Body,
  Patch,
  Delete,
  Query,
  HttpCode,
} from "@nestjs/common";
import { TagService } from "./tag.service";
import { Tag } from "./tag.entity";
import { LoggingInterceptor } from "src/core/log/log.interceptor";

import { ImportTagDTO } from "./dto/import-tag.dto";
import { TagDocs } from "./tag.swagger";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { TagRequestDTO } from "./dto/request/tag-request.dto";
import { BaseController } from "src/common/controllers/base.controller";
import { CreateTagDTO } from "./dto/create-tag.dto";
import { UpdateTagDTO } from "./dto/update-tag.dto";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { DeleteTagsDTO } from "./dto/delete-tag.dto";

@TagDocs.controller()
@Controller("tags")
@UseGuards(JwtAuthGuard,RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class TagController extends BaseController {
  constructor(private readonly tagService: TagService) {
    super("TagController");
  }

  
  @TagDocs.findAll()
  @Get("")
  @Roles(RoleSlug.ADMIN, RoleSlug.STUDY)
  async findAllAdmin(@Request() req: Request, @CurrentUser() user: AuthenticatedUser, @Query() query: TagRequestDTO): Promise<any> {
    return await this.tagService.findAll(query, user);
  }
  
  @Get(":id")
  @Roles(RoleSlug.ADMIN)
  async getTag(@Request() req: Request, @CurrentUser() user: AuthenticatedUser, @Param("id") tagId: number): Promise<Tag> {
    return await this.tagService.findById(tagId, user);
  }

  @TagDocs.create()
  @Post("")
  @Roles(RoleSlug.ADMIN, RoleSlug.STUDY)
  async create(@Request() req: Request, @CurrentUser() user: AuthenticatedUser, @Body() createTagDto: CreateTagDTO): Promise<any> {
   return await this.tagService.createOne(createTagDto,user);

  }

  @TagDocs.update()
  @Patch("")
  @Roles(RoleSlug.ADMIN, RoleSlug.STUDY)
  async update(@Request() req: Request, @CurrentUser() user: AuthenticatedUser, @Body() updateTagDto: UpdateTagDTO): Promise<Tag> {

    return await this.tagService.update(updateTagDto, user);

  }

  @TagDocs.deleteBulk()
  @Roles(RoleSlug.ADMIN, RoleSlug.STUDY)
  @Delete(":id")
  @HttpCode(204)
  async delete(@CurrentUser() user: AuthenticatedUser, @Param("id") tagId: number): Promise<void> {
    await this.tagService.deleteBulk([tagId], user);

  }


  @TagDocs.clone()
  @Roles(RoleSlug.ADMIN)
  @Post("clone")
  async cloneTags(@Body() importTagDto: ImportTagDTO): Promise<any> {
    return await this.tagService.import(importTagDto.tagsId, importTagDto.tagName);
  }

}