import {
  Controller,  Post, Get, Param, UseGuards, UseInterceptors, Body, HttpCode,
  Query,
  Patch,
  Delete,
  ParseIntPipe,
} from "@nestjs/common";
import { DirectoryService } from "./directory.service";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import { CreateDirectory } from "./dto/create-diretory.dto";
import { UpdateDirectory } from "./dto/update-diretory.dto";
import { DirectoryDocs } from "./directory.swagger";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { DirectoryQueryRequestDTO } from "./dto/request/query/directory-query-request.dto";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { DirectoryDTO } from "./dto/directory.dto";
import { PaginationResponse } from "src/common/repositories/base.repository";
import { FgaGuard } from "src/core/authorization/guards/fda.guard";
import { FgaAuthorized } from "src/core/authorization/decorators/fga-authorization.decorator";

@DirectoryDocs.controller()
@Controller("directories")
@UseGuards(JwtAuthGuard,RolesGuard,FgaGuard)
@UseInterceptors(LoggingInterceptor)
export class DirectoryController {
  constructor(private readonly directoryService: DirectoryService) {}

  @DirectoryDocs.findAll()
  @Roles(RoleSlug.ADMIN)
  @Get("")
  async getAllDirectoriesPaginated(
    @CurrentUser( ) user: AuthenticatedUser,
    @Query() query: DirectoryQueryRequestDTO,
  ): Promise<PaginationResponse<DirectoryDTO>> {
    const securityContext = { user: user };
    return await this.directoryService.findAll(
     query,
     securityContext
    );
  } 
 
  @DirectoryDocs.getDirectory()
  
  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized({
          objectType: "role",
          action: "can_view_users",
          resourceIdResolver: () => 'ams'
  })
  @Get(":directoryId")
  async getDirectoryInfo(@Param("directoryId", ParseIntPipe) directoryId: number): Promise<DirectoryDTO> {
    return await this.directoryService.getDirectory(directoryId);
  }
  @DirectoryDocs.create()
  @FgaAuthorized({
            objectType: "role",
            action: "can_manage_users",
            resourceIdResolver: () => 'ams'
    })
  @Roles(RoleSlug.ADMIN)
  @Post("")
  async createDirectory(@Body() createDirectory: CreateDirectory): Promise<DirectoryDTO> {
    
    return await this.directoryService.createOne(createDirectory);

  }

  
  @DirectoryDocs.update()
  @FgaAuthorized({
          objectType: "role",
          action: "can_edit_users",
          resourceIdResolver: () => 'ams'
  })
  @Roles(RoleSlug.ADMIN)
  @Patch("")
  async updateDirectory(@Body() updateDirectory: UpdateDirectory): Promise<DirectoryDTO> {

    return await this.directoryService.update(updateDirectory);

  }

  @DirectoryDocs.delete()
  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized({
          objectType: "role",
          action: "can_manage_users",
          resourceIdResolver: () => 'ams'
  })
  @Delete(":directoryId")
  @HttpCode(204)
  async deleteDirectory(@Param("directoryId", ParseIntPipe) directoryId: number, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    const securityContext = { user: user };
    await this.directoryService.delete([directoryId],securityContext);
  }



  
}