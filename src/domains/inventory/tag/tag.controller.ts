import {
  Controller, InternalServerErrorException, Post, Get, Request, Param, UseGuards, UseInterceptors, Body,
  Patch,
  Delete,
  Query,
} from "@nestjs/common";
import { TagService } from "./tag.service";
import { Tag } from "./tag.entity";
import { LoggingInterceptor } from "src/core/log/log.interceptor";

import { ImportTagDto } from "./dto/import-tag.dto";
import { TagDocs } from "./tag.swagger";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { AuthenticatedUser } from "src/core/authentication/interfaces/types";
import { TagRequestDTO } from "./dto/request/tag-request.dto";
import { BaseController } from "src/common/controllers/base.controller";
import { CreateTagDto } from "./dto/create-tag.dto";
import { DeleteTagDto } from "./dto/delete-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";

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
    return await this.tagService.findAll();
  }/*

    @TagDocs.userTagWebsitesStudy()
  @Roles("admin")
    @Get(":tag/user/:user/websites/study")
  async getUserTagWebsites(@Param("tag") tag: string, @Param("user") user: string): Promise<any> {
    const websites = await this.tagService.findAllUserTagWebsites(tag, user);
    for (const website of websites || []) {
      website["imported"] = await this.tagService.verifyUpdateWebsiteAdmin(website.WebsiteId);
      const websiteAdmin = await this.tagService.websiteExistsInAdmin(website.WebsiteId);
      website["hasWebsite"] = websiteAdmin.length === 1;
      website["webName"] = websiteAdmin.length === 1 ? websiteAdmin[0].Name : undefined;
    }
    return websites;
  }*/



  @TagDocs.create()
  @Post("")
  async create(@Request() req: Request, @CurrentUser() user: AuthenticatedUser, @Body() createTagDto: CreateTagDto): Promise<any> {
    const tag = new Tag();
    tag.name = createTagDto.name;
    tag.createdAt = new Date();

    const createSuccess = await this.tagService.createOne(tag, createTagDto.directories, createTagDto.websites);
    if (!createSuccess) throw new InternalServerErrorException();
    return true;
  }

  @TagDocs.update()
  @Patch("")
  async update(@Request() req: Request, @CurrentUser() user: AuthenticatedUser, @Body() updateTagDto: UpdateTagDto): Promise<any> {
    const updateSuccess = await this.tagService.update(
      updateTagDto.tagId,
      updateTagDto.name ?? "",
      updateTagDto.defaultDirectories ?? [],
      updateTagDto.directories ?? [],
      updateTagDto.defaultWebsites ?? [],
      updateTagDto.websites ?? []
    );
    if (!updateSuccess) throw new InternalServerErrorException();
    return true;
  }

  @TagDocs.delete()
  @Roles("admin")
  @Delete("")
  async delete(@Request() req: Request, @CurrentUser() user: AuthenticatedUser, @Body() deleteTagDto: DeleteTagDto): Promise<any> {
    const deleteSuccess = await this.tagService.delete(deleteTagDto.tagId);
    if (!deleteSuccess) throw new InternalServerErrorException();
    return true;
  }


  @TagDocs.import()
  @Roles("admin")
  @Post("import")
  async importTag(@Body() importTagDto: ImportTagDto): Promise<any> {
    return await this.tagService.import(importTagDto.tagId, importTagDto.tagName);
  }
/*


  @TagDocs.userTagWebsites()
    @Roles("admin")
  @Get(":tag/user/:user/websites")
  async getTagWebsites(@Param("tag") tag: string, @Param("user") user: string): Promise<any> {
    return await this.tagService.findAllUserTagWebsites(tag, user);
  }

  @TagDocs.userWebsitePages()
    @Roles("admin")
  @Get(":tag/website/:website/user/:user/pages")
  async getUserWebsitePages(@Param("tag") tag, @Param("website") website, @Param("user") user): Promise<any> {
    return await this.tagService.findAllUserWebsitePages(tag, website, user);
  }

  @TagDocs.tagWebsitePages()
    @Roles("admin")
  @Get(":tag/websites/pages")
  async getListOfTagWebsitePages(@Param("tag") tag: string): Promise<any> {
    return await this.tagService.findAllWebsitePages(tag);
  }

  @TagDocs.info()
  @Roles("admin")
  @Get("info/:tagId")
  async getTagInfo(@Param("tagId") tagId: number): Promise<any> {
    return await this.tagService.findInfo(tagId);
  }

  @TagDocs.allOfficial()
  @Roles("admin")
  @Get("allOfficial")
  async getAllOfficialTags(): Promise<any> {
    return await this.tagService.findAllOfficial();
  }

  @TagDocs.totalStudyMonitor()
  @Roles("admin")
  @Get("studyMonitor/total")
  async getNumberOfStudyMonitorUsers(): Promise<any> {
    return await this.tagService.findNumberOfStudyMonitor();
  }

  @TagDocs.totalObservatory()
  @Roles("admin")
  @Get("observatory/total")
  async getNumberOfObservatoryTags(): Promise<any> {
    return await this.tagService.findNumberOfObservatory();
  }

  @TagDocs.studyMonitorUserTags()
  @Roles("admin")
  @Get("studyMonitor")
  async getStudyMonitorUserTags(@Request() req: any): Promise<any> {
    return await this.tagService.findAllFromStudyMonitorUser(req.user.userId);
  }

  @TagDocs.studyMonitorTagData()
  @Roles("admin")
  @Get("studyMonitor/:tag/data")
  async getStudyMonitorUserTagData(@Request() req, @Param("tag") tag): Promise<any> {
    return await this.tagService.findStudyMonitorUserTagData(req.user.userId, tag);
  }

  @TagDocs.studyMonitorWebsiteData()
  @Roles("admin")
  @Get("studyMonitor/:tag/website/:website/data")
  async getStudyMonitorUserTagWebsitesPagesData(@Request() req, @Param("tag") tag, @Param("website") website): Promise<any> {
    return await this.tagService.findStudyMonitorUserTagWebsitesPagesData(req.user.userId, tag, website);
  }
/*
  @TagDocs.count()
  @Roles("admin")
  @Get("all/count/:search")
  async getAdminTagCount(@Param("search") search: string): Promise<any> {
    return await this.tagService.adminCount(decodeURIComponent(search.substring(7)));
  }-*/
}