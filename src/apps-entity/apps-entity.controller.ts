import {
  Controller,
  InternalServerErrorException,
  Get,
  Post,
  Request,
  Param,
  UseGuards,
  UseInterceptors,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AppsEntityService } from "./apps-entity.service";
import { AppsEntity } from "./apps-entity.entity";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CreateAppsEntityDTO } from "./dto/create-apps-entity.dto";
import { UpdateAppsEntityDTO } from "./dto/update-apps-entity.dto";
import { DeleteAppsEntityDTO } from "./dto/delete-apps-entity.dto";
import { DeleteBulkAppsEntityDTO } from "./dto/delete-bulk-apps-entity.dto";
import { Application } from "src/application/application.entity";

@ApiBasicAuth()
@ApiTags("apps-entity")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("apps-entity")
@UseInterceptors(LoggingInterceptor)
export class AppsEntityController {
  constructor(private readonly appsEntityService: AppsEntityService) {}

  @ApiOperation({ summary: "Create a new apps entity" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("create")
  async createAppsEntity(
    @Body() createAppsEntityDTO: CreateAppsEntityDTO
  ): Promise<any> {
    const entity = new AppsEntity();
    entity.Short_Name = createAppsEntityDTO.shortName;
    entity.Long_Name = createAppsEntityDTO.longName;
    entity.Creation_Date = new Date();

    const applications = createAppsEntityDTO.applications;

    const createSuccess = await this.appsEntityService.createOne(entity, applications);

    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Update a specific apps entity" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("update")
  async updateAppsEntity(
    @Body() updateAppsEntityDTO: UpdateAppsEntityDTO
  ): Promise<any> {
    const appsEntityId = updateAppsEntityDTO.appsEntityId;
    const shortName = updateAppsEntityDTO.shortName;
    const longName = updateAppsEntityDTO.longName;
    const defaultApplications = updateAppsEntityDTO.defaultApplications;
    const applications = updateAppsEntityDTO.applications;

    const updateSuccess = await this.appsEntityService.update(
      appsEntityId,
      shortName,
      longName,
      applications,
      defaultApplications
    );
    
    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Delete a specific apps entity" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("delete")
  async deleteAppsEntity(
    @Body() deleteAppsEntityDTO: DeleteAppsEntityDTO
  ): Promise<any> {
    const appsEntityId = deleteAppsEntityDTO.appsEntityId;

    const deleteSuccess = await this.appsEntityService.deleteOne(appsEntityId);

    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Delete a list of apps entities" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("deleteList")
  async deleteAppsEntities(
    @Request() deleteBulkAppsEntityDTO: DeleteBulkAppsEntityDTO
  ): Promise<any> {
    const appsEntitiesId = deleteBulkAppsEntityDTO.appsEntitiesId;

    const deleteSuccess = await this.appsEntityService.deleteList(appsEntitiesId);

    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: "Find all apps entities" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<AppsEntity>,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("all")
  async getAllAppsEntities(): Promise<any> {
    return success(await this.appsEntityService.findAll());
  }

  @ApiOperation({ summary: "Find number of apps observatory entities" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Number,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("observatoryApps/total")
  async getNumberOfAppsObservatoryEntities(): Promise<any> {
    return success(await this.appsEntityService.findNumberOfAppsObservatory());
  }

  @ApiOperation({ summary: "Find a specific apps entity info" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: AppsEntity,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("info/:appsEntityId")
  async getAppsEntityInfo(
    @Param("appsEntityId") appsEntityId: number
  ): Promise<any> {
    return success(await this.appsEntityService.findInfo(appsEntityId));
  }

  @ApiOperation({ summary: "Find all applications from a specific apps entity" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<Application>,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("applications/:appsEntity")
  async getAppsEntityApplications(
    @Param("appsEntity") appsEntity: string
  ): Promise<any> {
    return success(
      await this.appsEntityService.findAllAppsEntityApplications(appsEntity)
    );
  }
}
