import {
  Controller, Post, Get, Param, UseGuards, UseInterceptors, Body, Query,
  Delete,
} from "@nestjs/common";
import { LoggingInterceptor } from "src/core/log/log.interceptor";

import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";

import { TeamDocs } from "./team.swagger";
import { TeamService } from "./team.service";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { CreateTeamDTO } from "./dto/create-team.dto";
import { TeamDTO } from "./dto/team.dto";
import { TeamPaginationResponse } from "./dto/pagination-response.dto";
import { TeamMessageResponseDTO } from "./dto/team-message-response.dto";
import { TeamQueryDTO } from "./dto/request/team-request.dto";

@TeamDocs.controller()
@Controller("teams")
@UseGuards(JwtAuthGuard,RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Roles(RoleSlug.ADMIN) 
  @TeamDocs.createTeam()
  @Post()
  async createTeam(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createTeamDTO: CreateTeamDTO,
  ): Promise<TeamDTO> {

  return await this.teamService.createTeam(user, createTeamDTO);

  }

  @Roles(RoleSlug.ADMIN) 
  @TeamDocs.getTeamById()
  @Get(":id")
  async getTeamById(@Param("id") id: string): Promise<TeamDTO> {

      const team = await this.teamService.getTeamById(id);
      return team;

  }
 
  @Roles(RoleSlug.ADMIN) 
  @TeamDocs.getAllTeams()
  @Get()
  async getAllTeams(@Query() query: TeamQueryDTO): Promise<TeamPaginationResponse> {
      return await this.teamService.getAllTeams(query);
}
@Roles(RoleSlug.ADMIN) 
@TeamDocs.deleteTeam()
@Delete(":id")
async deleteTeam(
  @CurrentUser() user: AuthenticatedUser,
  @Param("id") id: string,
): Promise<TeamMessageResponseDTO> {
    await this.teamService.deleteTeam(id, user.id);
    return { message: "Team deleted successfully" };

}
@Roles(RoleSlug.ADMIN) 
@TeamDocs.addUserToTeam()
@Post(":id/add-user")
async addUserToTeam(
  @CurrentUser() user: AuthenticatedUser,
  @Param("id") id: string,
  @Body() body: any,
): Promise<TeamDTO> {

    const team = await this.teamService.addUserToTeam(id, body.userId, user.id);
    return team;

}

@Roles(RoleSlug.ADMIN) 
@TeamDocs.removeUserFromTeam()
@Post(":id/remove-user")
async removeUserFromTeam(
  @CurrentUser() user: AuthenticatedUser,
  @Param("id") id: string,
  @Body() body: any,
): Promise<TeamDTO> {
    const team = await this.teamService.removeUserFromTeam(id, body.userId, user.id);
    return team;
}

@Roles(RoleSlug.ADMIN) 
@TeamDocs.addWebsiteToTeam()
@Post(":id/add-website")
async addWebsiteToTeam(
  @CurrentUser() user: AuthenticatedUser,
  @Param("id") id: string,
  @Body() body: any,
): Promise<TeamDTO> {
    const team = await this.teamService.addWebsiteToTeam(id, body.websiteId, user.id);
    return team;
}
  
@Roles(RoleSlug.ADMIN) 
@TeamDocs.removeWebsiteFromTeam()
@Post(":id/remove-website")
async removeWebsiteFromTeam(
  @CurrentUser() user: AuthenticatedUser,
  @Param("id") id: string,
  @Body() body: any,
): Promise<TeamDTO> {
    const team = await this.teamService.removeWebsiteFromTeam(id, body.websiteId, user.id);
    return team;
}
}