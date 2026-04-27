import {
  Controller,
  Post,
  Get,
  UseGuards,
  Param,
  UseInterceptors,
  InternalServerErrorException,
  Body
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AppsDirectoryService } from "./apps-directory.service";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AppsDirectory } from "./apps-directory.entity";
import { CreateAppsDirectoryDTO } from "./dto/create-apps-diretory.dto";
import { UpdateAppsDirectoryDTO } from "./dto/update-apps-directory.dto";
import { DeleteAppsDirectoryDTO } from "./dto/delete-apps-directory.dto";
import { DeleteBulkAppsDirectoryDTO } from "./dto/delete-bulk-apps-directory.dto";
import { AppsCategory } from "src/apps-category/apps-category.entity";
import { Application } from "src/application/application.entity";

@ApiBasicAuth()
@ApiTags("apps-directory")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("apps-directory")
@UseInterceptors(LoggingInterceptor)
export class AppsDirectoryController {
  constructor(private readonly appsDirectoryService: AppsDirectoryService) {}

  @ApiOperation({ summary: "Create a new apps directory" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("create")
  async createAppsDirectory(
    @Body() createAppsDirectoryDTO: CreateAppsDirectoryDTO
  ): Promise<any> {
    const directory = new AppsDirectory();
    directory.Name = createAppsDirectoryDTO.name;
    directory.Method = createAppsDirectoryDTO.method;
    directory.Creation_Date = new Date();

    const categories = createAppsDirectoryDTO.categories;

    const createSuccess = await this.appsDirectoryService.createOne(
      directory,
      categories
    );

    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Update a specific apps directory" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("update")
  async updateAppsDirectory(
    @Body() updateAppsDirectoryDTO: UpdateAppsDirectoryDTO
  ): Promise<any> {
    const appsDirectoryId = updateAppsDirectoryDTO.appsDirectoryId;
    const name = updateAppsDirectoryDTO.name;
    const method = updateAppsDirectoryDTO.method;
    const defaultCategories = updateAppsDirectoryDTO.defaultCategories;
    const categories = updateAppsDirectoryDTO.categories;

    const updateSuccess = await this.appsDirectoryService.update(
      appsDirectoryId,
      name,
      method,
      defaultCategories,
      categories
    );

    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Delete a specific apps directory" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("delete")
  async deleteAppsDirectory(
    @Body() deleteAppsDirectoryDTO: DeleteAppsDirectoryDTO
  ): Promise<any> {
    const appsDirectoryId = deleteAppsDirectoryDTO.appsDirectoryId;

    const deleteSuccess = await this.appsDirectoryService.deleteOne(appsDirectoryId);
    
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }
  
  @ApiOperation({ summary: "Delete a list of apps directories" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("deleteList")
  async deleteAppsDirectories(
    @Body() deleteBulkAppsDirectoryDTO: DeleteBulkAppsDirectoryDTO
  ): Promise<any> {
    const appsDirectoriesId = deleteBulkAppsDirectoryDTO.appsDirectoriesId;

    const deleteSuccess = await this.appsDirectoryService.deleteList(appsDirectoriesId);
    
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Find all apps directories" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<AppsDirectory>,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("all")
  async getAllAppsDirectories(): Promise<any> {
    return success(await this.appsDirectoryService.findAll());
  }

  @ApiOperation({ summary: "Find number of apps observatory directories" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Number,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("observatoryApps/total")
  async getNumberOfAppsObservatoryDirectories(): Promise<any> {
    return success(await this.appsDirectoryService.findNumberOfAppsObservatory());
  }

  @ApiOperation({ summary: "Find a specific apps directory info" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: AppsDirectory,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("info/:appsDirectoryId")
  async getAppsDirectoryInfo(
    @Param("appsDirectoryId") appsDirectoryId: number
  ): Promise<any> {
    return success(await this.appsDirectoryService.findInfo(appsDirectoryId));
  }
  
  @ApiOperation({ summary: "Find all apps categories from a specific apps directory" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<AppsCategory>,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("categories/:appsDirectory")
  async getAppsDirectoryCategories(
    @Param("appsDirectory") appsDirectory: string
  ): Promise<any> {
    return success(await this.appsDirectoryService.findAllAppsDirectoryCategories(appsDirectory));
  }
  
  @ApiOperation({ summary: "Find all applications from a specific apps directory" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<Application>,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("applications/:appsDirectory")
  async getAppsDirectoryApplications(
    @Param("appsDirectory") appsDirectory: string
  ): Promise<any> {
    return success(
      await this.appsDirectoryService.findAllAppsDirectoryApplications(appsDirectory)
    );
  }
}
