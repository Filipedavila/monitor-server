import {
  Controller,
  InternalServerErrorException,
  Get,
  Post,
  UseGuards,
  Param,
  UseInterceptors,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApplicationService } from "./application.service";
import { Application } from "./application.entity";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CreateApplicationDTO } from "./dto/create-application.dto";
import { UpdateApplicationDTO } from "./dto/update-application.dto";
import { DeleteApplicationDTO } from "./dto/delete-application.dto";
import { DeleteBulkApplicationDTO } from "./dto/delete-bulk-application.dto";

@ApiBasicAuth()
@ApiTags("application")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("application")
@UseInterceptors(LoggingInterceptor)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @ApiOperation({ summary: "Create application" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("create")
  async createApplication(
    @Body() createApplicationDTO: CreateApplicationDTO
  ): Promise<any> {
    const application = new Application();
    application.Name = createApplicationDTO.name;
    application.UserId = createApplicationDTO.userId;
    application.OperatingSystem = createApplicationDTO.operatingSystem;
    application.Declaration = createApplicationDTO.declaration;
    application.DeclarationUpdateDate = createApplicationDTO.declarationUpdateDate;
    application.Stamp = createApplicationDTO.stamp;
    application.StampUpdateDate = createApplicationDTO.stampUpdateDate;
    application.CreationDate = new Date();
    application.DownloadUrl = decodeURIComponent(createApplicationDTO.downloadUrl);

    const entities = createApplicationDTO.appsEntities;
    const categories = createApplicationDTO.appsCategories;

    const createSuccess = await this.applicationService.createOne(
      application,
      entities,
      categories
    );

    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Update a specific application" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("update")
  async updateApplication(
    @Body() updateApplicationDTO: UpdateApplicationDTO
  ): Promise<any> {
    const applicationId = updateApplicationDTO.applicationId;
    const userId = updateApplicationDTO.userId;
    const name = updateApplicationDTO.name;
    const downloadUrl = decodeURIComponent(updateApplicationDTO.downloadUrl);
    const operatingSystem = updateApplicationDTO.operatingSystem;
    const stamp = updateApplicationDTO.stamp;
    const stampUpdateDate = updateApplicationDTO.stampUpdateDate;
    const declaration = updateApplicationDTO.declaration;
    const declarationUpdateDate = updateApplicationDTO.declarationUpdateDate;
    const entities = updateApplicationDTO.entities;
    const defaultEntities = updateApplicationDTO.defaultEntities;
    const categories = updateApplicationDTO.categories;
    const defaultCategories = updateApplicationDTO.defaultCategories;

    const updateSuccess = await this.applicationService.update(
      applicationId,
      userId,
      name,
      downloadUrl,
      operatingSystem,
      stamp,
      stampUpdateDate,
      declaration,
      declarationUpdateDate,
      entities,
      defaultEntities,
      categories,
      defaultCategories
    );
    
    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Delete a specific application" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("delete")
  async deleteApplication(
    @Body() deleteApplicationDTO: DeleteApplicationDTO
  ): Promise<any> {
    const deleteSuccess = await this.applicationService.deleteOne(
      deleteApplicationDTO.applicationId
    );

    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Delete a list of applications" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("deleteList")
  async deleteApplications(
    @Body() deleteBulkApplicationDTO: DeleteBulkApplicationDTO
  ): Promise<any> {
    const deleteSuccess = await this.applicationService.deleteList(
      deleteBulkApplicationDTO.applicationsId
    );

    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Find the number of apps observatory applications" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Number,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("observatoryApps/total")
  async getNumberOfAppsObservatoryApplications(): Promise<any> {
    return success(await this.applicationService.findNumberOfAppsObservatory());
  }

  @ApiOperation({ summary: "Find the number of apps observatory applications" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Number,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("missingEvaluation")
  async getNumberOfApplicationsMissingEvaluation(): Promise<any> {
    return success(await this.applicationService.findNumberOfMissingEvaluation());
  }

  @ApiOperation({ summary: "Find a specific application info" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Application,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("info/:applicationId")
  async getApplicationInfo(
    @Param("applicationId") applicationId: number
  ): Promise<any> {
    return success(await this.applicationService.findInfo(applicationId));
  }

  @ApiOperation({ summary: "Find all applications" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<Application>,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("all")
  async getAllApplications(): Promise<any> {
    return success(await this.applicationService.findAll());
  }
}
