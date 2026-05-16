import {
  Controller, InternalServerErrorException, Post, Get, Param, UseGuards, UseInterceptors, Body, HttpCode,
  Query,
  Patch,
  Delete,
} from "@nestjs/common";
import { DirectoryService } from "./directory.service";
import { Directory } from "./directory.entity";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import { CreateDirectory } from "./dto/create-diretory.dto";
import { UpdateDirectory } from "./dto/update-diretory.dto";
import { DeleteDirectory } from "./dto/delete-diretory.dto";
import { DirectoryDocs } from "./directory.swagger";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { DirectoryQueryRequestDTO } from "./dto/request/query/directory-query-request.dto";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { AuthenticatedUser } from "src/core/authentication/interfaces/types";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";

@DirectoryDocs.controller()
@Controller("directory")
@UseGuards(JwtAuthGuard,RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class DirectoryController {
  constructor(private readonly directoryService: DirectoryService) {}

  /*
  @DirectoryDocs.reEvaluate()
  @Roles("admin")
  @Post("reEvaluate")
  async reEvaluateWebsitePages(@Body() reEvaluateDto: ReEvaluateDto): Promise<any> {
    const directoriesId = reEvaluateDto.directoriesId;
    const option = reEvaluateDto.option;
    return await this.directoryService.addPagesToEvaluate(directoriesId, option);
  }
*/
/*
  @DirectoryDocs.findAll()
  @Roles("admin")
  @Get("all")
  async getAllTags(): Promise<any> {
    return await this.directoryService.findAll();
  }*/

  @DirectoryDocs.create()
  @Roles("admin")
  @Post("")
  async createDirectory(@Body() createDirectory: CreateDirectory): Promise<any> {
    const directory = new Directory();
    directory.name = createDirectory.name;
    directory.showInObservatory = createDirectory.observatory;
    directory.tagMatchingStrategy = createDirectory.tagMatchingStrategy;

    const tags = createDirectory.tags;
    const createSuccess = await this.directoryService.createOne(directory, tags);

    if (!createSuccess) {
      throw new InternalServerErrorException();
    }
    return true;
  }

  @DirectoryDocs.exists()
  @Roles("admin")
  @Get("exists/:directoryName")
  async checkIfDictoryNameExists(@Param("directoryName") directoryName: string): Promise<boolean> {
    return !!(await this.directoryService.findByDirectoryName(directoryName));
  }

  @DirectoryDocs.update()
  @Roles("admin")
  @Patch("update")
  async updateDirectory(@Body() updateDirectory: UpdateDirectory): Promise<any> {
    const directoryId = updateDirectory.directoryId;
    const name = updateDirectory.name;
    const observatory = updateDirectory.observatory;
    const method = updateDirectory.method;
    const defaultTags = updateDirectory.defaultTags;
    const tags = updateDirectory.tags;

    const updateSuccess = await this.directoryService.update(directoryId, name, observatory, method, defaultTags, tags);

    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }
    return true;
  }

  @DirectoryDocs.delete()
  @Roles("admin")
  @Delete("")
  @HttpCode(204)
  async deleteDirectory(@Body() deleteDirectory: DeleteDirectory, @CurrentUser() user: AuthenticatedUser): Promise<any> {
    const securityContext = { user: user };
    const directoryId = deleteDirectory.directoryId;
    await this.directoryService.delete([directoryId],securityContext);
  }
/*
  @DirectoryDocs.deleteBulk()
  @Roles("admin")
  @Post("deleteBulk")
  async deleteDirectories(@Body() deleteBulkDirectory: DeleteBulkDirectory): Promise<any> {
    const directoriesId = deleteBulkDirectory.directoriesId;
    const deleteSuccess = await this.directoryService.deleteBulk(directoriesId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }
    return true;
  }
*/
/*
  @DirectoryDocs.deletePagesBulk()
  @Roles("admin")
  @Post("pages/deleteBulk")
  async deleteDirectoriesPages(@Body() deleteBulkDirectory: DeleteBulkDirectory): Promise<any> {
    const directoriesId = deleteBulkDirectory.directoriesId;
    const deleteSuccess = await this.directoryService.pagesDeleteBulk(directoriesId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }
    return true;
  }
*/
  @DirectoryDocs.totalObservatory()
  @Roles("admin")
  @Get("observatory/total")
  async getNumberOfObservatoryDirectories(): Promise<any> {
    return await this.directoryService.findNumberOfObservatory();
  }

  @DirectoryDocs.info()
  @Get("info/:directoryId")
  async getDirectoryInfo(@Param("directoryId") directoryId: number): Promise<any> {
    return await this.directoryService.findInfo(directoryId);
  }

  @DirectoryDocs.tags()
  @Roles("admin")
  @Get(":directory/tags")
  async getDirectoryTags(@Param("directory") directory: string): Promise<any> {
    return await this.directoryService.findAllDirectoryTags(directory);
  }

  @DirectoryDocs.websites()
  @Roles("admin")
  @Get(":directory/websites")
  async getDirectoryWebsites(@Param("directory") directory: string): Promise<any> {
    return await this.directoryService.findAllDirectoryWebsites(directory);
  }

  @DirectoryDocs.pages()
  @Roles("admin")
  @Get(":directory/websites/pages")
  async getListOfDirectoryWebsitePages(@Param("directory") directory: string): Promise<any> {
    return await this.directoryService.findAllDirectoryWebsitePages(directory);
  }

  @DirectoryDocs.count()
  @Roles("admin")
  @Get("all/count/:search")
  async getAdminDirectoryCount(@Param("search") search: string): Promise<any> {
    return await this.directoryService.adminCount(decodeURIComponent(search.substring(7)));
  }

  @DirectoryDocs.findAllPaged()
  @Roles("admin")
  @Get("")
  async getAllDirectoriesPaginated(
    @CurrentUser( ) user: AuthenticatedUser,
    @Query() query: DirectoryQueryRequestDTO,
  ): Promise<any> {
    const securityContext = { user: user };
    return await this.directoryService.findAll(
     query 
    );
  }
}