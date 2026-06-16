import {
  Controller, InternalServerErrorException, Post, Get, Param, UseGuards, UseInterceptors, Body,
  Delete,
  HttpCode,
  Patch,
  Query,
} from "@nestjs/common";
import { OrganizationService } from "./organization.service";
import { Organization } from "./organization.entity";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import { CreateEntityDto } from "./dto/create-entity.dto";
import { UpdateEntityDto } from "./dto/update-entity.dto";
import { DeleteEntityDto } from "./dto/delete-entity.dto";
import { DeleteBulkEntityDto } from "./dto/delete-bulk-entity.dto";
import { OrganizationDocs } from "./organization.swagger";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { RoleSlug } from "src/core/authentication/interfaces/types";
import { OrganizationRequestDTO } from "./dto/request/organization-request.dto";

@OrganizationDocs.controller()
@Controller("organizations")
@UseGuards(JwtAuthGuard,RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class OrganizationController {
  constructor(private readonly entityService: OrganizationService) {}



 
  @OrganizationDocs.findAllPaged()
  @Roles("admin")
  @Get("")
  @HttpCode(200)
  async getAllEntities(@Query() organizationRequestDTO:OrganizationRequestDTO): Promise<any> {
    return await this.entityService.findAll( organizationRequestDTO );
  }



  @OrganizationDocs.create()
  @Roles(RoleSlug.ADMIN)
  @Post("")
  @HttpCode(201)
  async createEntity(@Body() createEntityDto: CreateEntityDto): Promise<Organization> {
 
    return await this.entityService.createOne(createEntityDto );

  }

  @OrganizationDocs.update()
  @Roles(RoleSlug.ADMIN)
  @Patch("")
  @HttpCode(200)
  async updateEntity(@Body() updateEntityDto: UpdateEntityDto): Promise<any> {
    const entityId = updateEntityDto.entityId;
    const shortName = updateEntityDto.shortName;
    const longName = updateEntityDto.longName;
    const websites = updateEntityDto.websites;

    const updateSuccess = await this.entityService.update(entityId, shortName, longName, websites);
    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }
    return true;
  }

  @OrganizationDocs.delete()
  @Roles(RoleSlug.ADMIN)
  @Delete("")
  @HttpCode(200)
  async deleteEntity(@Body() deleteEntityDto: DeleteEntityDto): Promise<void> {
  const entityId = deleteEntityDto.entityId;
  await this.entityService.delete(entityId);
    
  }

 
}