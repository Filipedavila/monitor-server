import {
  Controller, InternalServerErrorException, Post, Get, Param, UseGuards, UseInterceptors, Body,
  Delete,
  HttpCode,
  Patch,
  Query,
  Logger,
} from "@nestjs/common";
import { OrganizationService } from "./organization.service";
import { Organization } from "./organization.entity";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { DeleteOrganizationDto } from "./dto/delete-organization.dto";
import { DeleteBulkOrganizationDto } from "./dto/delete-bulk-organization.dto";
import { OrganizationDocs } from "./organization.swagger";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { RoleSlug } from "src/core/authentication/interfaces/types";
import { OrganizationRequestDTO } from "./dto/request/organization-request.dto";
import { LoggableController } from "src/common/controllers/loggable.interface";

@OrganizationDocs.controller()
@Controller("organizations")
@UseGuards(JwtAuthGuard,RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class OrganizationController implements LoggableController {
  readonly logger = new Logger("OrganizationController");
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
  async createOrganization(@Body() createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
 
    return await this.entityService.createOne(createOrganizationDto );

  }

  @OrganizationDocs.update()
  @Roles(RoleSlug.ADMIN)
  @Patch("")
  @HttpCode(200)
  async updateOrganization(@Body() updateOrganizationDto: UpdateOrganizationDto): Promise<any> {
    const organizationId = updateOrganizationDto.organizationId;
    const shortName = updateOrganizationDto.shortName;
    const longName = updateOrganizationDto.longName;

    const updateSuccess = await this.entityService.update(organizationId, shortName, longName);
    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }
    return true;
  }

  @OrganizationDocs.delete()
  @Roles(RoleSlug.ADMIN)
  @Delete("")
  @HttpCode(200)
  async deleteOrganization(@Body() deleteOrganizationDto: DeleteOrganizationDto): Promise<void> {
  const organizationId = deleteOrganizationDto.organizationId;
  await this.entityService.delete(organizationId);
    
  }

 
}