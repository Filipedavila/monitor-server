import {
  Controller,
  InternalServerErrorException,
  Post,
  Get,
  Request,
  Param,
  UseGuards,
  UseInterceptors,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AppsCategoryService } from "./apps-category.service";
import { AppsCategory } from "./apps-category.entity";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiTags,
  ApiResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { CreateAppsCategoryDTO } from "./dto/create-apps-category.dto";
import { UpdateAppsCategoryDTO } from "./dto/update-apps-category.dto";
import { DeleteAppsCategoryDTO } from "./dto/delete-apps-category.dto";
import { DeleteBulkAppsCategoryDTO } from "./dto/delete-bulk-apps-category.dto";
import { Application } from "src/application/application.entity";

@ApiBasicAuth()
@ApiTags("apps-category")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("apps-category")
@UseInterceptors(LoggingInterceptor)
export class AppsCategoryController {
  constructor(private readonly appsCategoryService: AppsCategoryService) {}

  @ApiOperation({ summary: "Create a new apps category" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("create")
  async createAppsCategory(
    @Body() createAppsCategoryDTO: CreateAppsCategoryDTO
  ): Promise<any> {
    const appsCategory = new AppsCategory();
    appsCategory.Name = createAppsCategoryDTO.name;
    appsCategory.Creation_Date = new Date();

    const directories = createAppsCategoryDTO.directories;
    const applications = createAppsCategoryDTO.applications;

    const createSuccess = await this.appsCategoryService.createOne(
      appsCategory,
      directories,
      applications
    );

    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Update a specific apps category" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("update")
  async updateAppsCategory(
    @Body() updateAppsCategoryDTO: UpdateAppsCategoryDTO
  ): Promise<any> {
    const appsCategoryId = updateAppsCategoryDTO.appsCategoryId;
    const name = updateAppsCategoryDTO.name;
    const defaultDirectories = updateAppsCategoryDTO.defaultDirectories;
    const directories = updateAppsCategoryDTO.directories;
    const defaultApplications = updateAppsCategoryDTO.defaultApplications;
    const applications = updateAppsCategoryDTO.applications;

    const updateSuccess = await this.appsCategoryService.update(
      appsCategoryId,
      name,
      defaultDirectories,
      directories,
      defaultApplications,
      applications
    );

    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Delete a specific apps category" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("delete")
  async deleteAppsCategory(
    @Body() deleteAppsCategoryDTO: DeleteAppsCategoryDTO
  ): Promise<any> {
    const appsCategoryId = deleteAppsCategoryDTO.appsCategoryId;

    const deleteSuccess = await this.appsCategoryService.deleteOne(appsCategoryId);

    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Delete a list of apps categories" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("deleteList")
  async deleteAppsCategories(
    @Body() deleteBulkAppsCategoryDTO: DeleteBulkAppsCategoryDTO
  ): Promise<any> {
    const appsCategoriesId = deleteBulkAppsCategoryDTO.appsCategoriesId;

    const deleteSuccess = await this.appsCategoryService.deleteList(appsCategoriesId);

    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Find all apps categories" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<AppsCategory>,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("all")
  async getAllAppsCategories(): Promise<any> {
    return success(await this.appsCategoryService.findAll());
  }

  @ApiOperation({ summary: "Find the number apps observatory categories" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Number,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("observatoryApps/total")
  async getNumberOfAppsObservatoryCategories(): Promise<any> {
    return success(await this.appsCategoryService.findNumberOfAppsObservatory());
  }

  @ApiOperation({ summary: "Find a specific apps category info" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: AppsCategory,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("info/:appsCategoryId")
  async getAppsCategoryInfo(
    @Param("appsCategoryId") appsCategoryId: number
  ): Promise<any> {
    return success(await this.appsCategoryService.findInfo(appsCategoryId));
  }

  @ApiOperation({ summary: "Find all applications from a specific apps category" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<Application>,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("applications/:appsCategory")
  async getAppsCategoryApplications(
    @Param("appsCategory") appsCategory: string
  ): Promise<any> {
    return success(await this.appsCategoryService.findAllAppsCategoryApplications(appsCategory));
  }
}
