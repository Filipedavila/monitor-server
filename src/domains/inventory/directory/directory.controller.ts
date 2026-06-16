import {
  Controller, InternalServerErrorException, Post, Get, Param, UseGuards, UseInterceptors, Body, HttpCode,
  Query,
  Patch,
  Delete,
  ParseIntPipe,
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
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";

@DirectoryDocs.controller()
@Controller("directory")
@UseGuards(JwtAuthGuard,RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class DirectoryController {
  constructor(private readonly directoryService: DirectoryService) {}

  @DirectoryDocs.findAll()
  @Roles(RoleSlug.ADMIN)
  @Get("")
  async getAllDirectoriesPaginated(
    @CurrentUser( ) user: AuthenticatedUser,
    @Query() query: DirectoryQueryRequestDTO,
  ): Promise<any> {
    const securityContext = { user: user };
    return await this.directoryService.findAll(
     query,
     securityContext
    );
  }
  @DirectoryDocs.create()
  @Roles(RoleSlug.ADMIN)
  @Post("")
  async createDirectory(@Body() createDirectory: CreateDirectory): Promise<Directory> {
    
    return await this.directoryService.createOne(createDirectory);

  }



  @DirectoryDocs.update()
  @Roles(RoleSlug.ADMIN)
  @Patch("")
  async updateDirectory(@Body() updateDirectory: UpdateDirectory): Promise<any> {

    return await this.directoryService.update(updateDirectory);

  }

  @DirectoryDocs.delete()
  @Roles(RoleSlug.ADMIN)
  @Delete("")
  @HttpCode(204)
  async deleteDirectory(@Body() deleteDirectory: DeleteDirectory, @CurrentUser() user: AuthenticatedUser): Promise<any> {
    const securityContext = { user: user };
    const directoryId = deleteDirectory.directoryId;
    await this.directoryService.delete([directoryId],securityContext);
  }


  @DirectoryDocs.getDirectory()
  @Roles(RoleSlug.ADMIN)
  @Get(":directoryId")
  async getDirectoryInfo(@Param("directoryId", ParseIntPipe) directoryId: number): Promise<any> {
    return await this.directoryService.getDirectory(directoryId);
  }

  
}