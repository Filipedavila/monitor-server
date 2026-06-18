import {
  Controller,  Post, Get,  UseGuards, UseInterceptors, Body,
  Delete,
  HttpCode,
  Patch,
  Query,
  ParseIntPipe,
  Param,
} from "@nestjs/common";
import { OrganizationService } from "./organization.service";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import { DeleteEntityDto } from "./dto/delete-organization.dto";
import { OrganizationDocs } from "./organization.swagger";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { OrganizationRequestDTO } from "./dto/request/organization-request.dto";
import { OrganizationDTO } from "./dto/organization.dto";
import { PaginationResponse } from "src/common/repositories/base.repository";
import { CreateOrganizationDTO } from "./dto/create-organization.dto";
import { UpdateOrganizationDTO } from "./dto/update-organization.dto";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";

@OrganizationDocs.controller()
@Controller("organizations")
@UseGuards(JwtAuthGuard,RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class OrganizationController {
  constructor(private readonly entityService: OrganizationService) {}



 
  @OrganizationDocs.findAllPaged()
  @Roles(RoleSlug.ADMIN)
  @Get("")
  @HttpCode(200)
  async getAllEntities(@Query() organizationRequestDTO:OrganizationRequestDTO): Promise<PaginationResponse<OrganizationDTO>> {
    return await this.entityService.findAll( organizationRequestDTO );
  }


  @OrganizationDocs.getOne()
  @Roles(RoleSlug.ADMIN)
  @Get(":organizationId")
  @HttpCode(200)
  async getOneEntity(@Param("organizationId", ParseIntPipe) organizationId: number): Promise<OrganizationDTO> {
    return await this.entityService.findByProperties({ id: organizationId });
  }

  @OrganizationDocs.create()
  @Roles(RoleSlug.ADMIN)
  @Post("")
  @HttpCode(201)
  async createEntity(@CurrentUser() user: AuthenticatedUser, @Body() createEntityDto: CreateOrganizationDTO): Promise<OrganizationDTO> {
    const actorId = user.id;
    return await this.entityService.createOne(createEntityDto,actorId );

  }

  @OrganizationDocs.update()
  @Roles(RoleSlug.ADMIN)
  @Patch("")
  @HttpCode(200)
  async updateEntity(@CurrentUser() user: AuthenticatedUser,@Body() updateEntityDto: UpdateOrganizationDTO): Promise<OrganizationDTO> {
    const entityId = updateEntityDto.organizationId;
    const shortName = updateEntityDto.shortName;
    const longName = updateEntityDto.longName;
    const websiteIds = updateEntityDto.websiteIds;
    const actorId = user.id;

    return await this.entityService.update(entityId, shortName, longName, websiteIds,actorId);
  }

  @OrganizationDocs.delete()
  @Roles(RoleSlug.ADMIN)
  @Delete(":organizationId")
  @HttpCode(200)
  async deleteEntity(@Param("organizationId", ParseIntPipe) organizationId: number): Promise<void> {
    await this.entityService.delete(organizationId);
  }

 
}