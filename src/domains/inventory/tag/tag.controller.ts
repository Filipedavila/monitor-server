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

import { ImportTagDto } from "./dto/import-tag.dto";
import { TagDocs } from "./tag.swagger";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { TagRequestDTO } from "./dto/request/tag-request.dto";
import { BaseController } from "src/common/controllers/base.controller";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { DeleteTagsDto } from "./dto/delete-tag.dto";

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
  async find(@Request() req: Request, @CurrentUser() user: AuthenticatedUser, @Query() query: TagRequestDTO): Promise<any> {
    const securityContext = { user: user };
    return await this.tagService.findAll(query, user);
  }
  
  @TagDocs.create()
  @Post("")
  async create(@Request() req: Request, @CurrentUser() user: AuthenticatedUser, @Body() createTagDto: CreateTagDto): Promise<any> {

    const createSuccess = await this.tagService.createOne(createTagDto);
    if (!createSuccess) throw new InternalServerErrorException();
    return true;
  }

  @TagDocs.update()
  @Patch("")
  async update(@Request() req: Request, @CurrentUser() user: AuthenticatedUser, @Body() updateTagDto: UpdateTagDto): Promise<Tag> {
    return await this.tagService.update(updateTagDto);

  }

  @TagDocs.deleteBulk()
  @Roles(RoleSlug.ADMIN)
  @Delete("")
  @HttpCode(204)
  async delete(@Request() req: Request, @CurrentUser() user: AuthenticatedUser, @Body() deleteTagDto: DeleteTagsDto): Promise<void> {
    await this.tagService.deleteBulk(deleteTagDto.tagsId);

  }


  @TagDocs.clone()
  @Roles(RoleSlug.ADMIN)
  @Post("clone")
  async cloneTags(@Body() importTagDto: ImportTagDto): Promise<any> {
    return await this.tagService.import(importTagDto.tagsId, importTagDto.tagName);
  }

}