import {
  Controller, Post, Get, Param, UseGuards, UseInterceptors, Body, Query,
  Delete,
  HttpCode,
  ParseIntPipe,
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
import { TeamDetailsDTO, TeamDTO } from "./dto/team.dto";
import { TeamQueryDTO } from "./dto/request/team-request.dto";
import { TeamUserUpdateDTO } from "./dto/team-user-update.dto";
import { TeamWebsiteUpdateDTO } from "./dto/team-website-update.dto";
import { PaginationResponse } from "src/common/repositories/base.repository";

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
  async getTeamById(@Param("id", ParseIntPipe) id: number): Promise<TeamDTO> {

      const team = await this.teamService.getTeamById(id);
      return team;

  }
 
  @Roles(RoleSlug.ADMIN) 
  @TeamDocs.getAllTeams()
  @Get()
  async getAllTeams(@Query() query: TeamQueryDTO): Promise<PaginationResponse<TeamDTO>> {
      return await this.teamService.getAllTeams(query);
}
@Roles(RoleSlug.ADMIN) 
@TeamDocs.deleteTeam()
@Delete(":id")
@HttpCode(204)
async deleteTeam(
  @Param("id", ParseIntPipe) id: number,
): Promise<void> {
    await this.teamService.deleteTeam(id);
}
@Roles(RoleSlug.ADMIN) 
@TeamDocs.addUserToTeam()
@Post(":id/add-user")
async addUserToTeam(
  @CurrentUser() user: AuthenticatedUser,
  @Param("id", ParseIntPipe) id: number,
  @Body()  teamUserUpdateDTO: TeamUserUpdateDTO,
): Promise<TeamDetailsDTO> {

    const team = await this.teamService.addUsersToTeam(id, teamUserUpdateDTO.userIds, user.id);
    return team;

}

@Roles(RoleSlug.ADMIN) 
@TeamDocs.removeUsersFromTeam()
@Post(":id/remove-users")
async removeUsersFromTeam(
  @CurrentUser() user: AuthenticatedUser,
  @Param("id", ParseIntPipe) id: number,
  @Body() teamUserUpdateDTO: TeamUserUpdateDTO,
): Promise<TeamDetailsDTO> {
    const team = await this.teamService.removeUsersFromTeam(id, teamUserUpdateDTO.userIds, user.id);
    return team;
}

@Roles(RoleSlug.ADMIN) 
@TeamDocs.addWebsitesToTeam()
@Post(":id/add-websites")
async addWebsitesToTeam(
  @CurrentUser() user: AuthenticatedUser,
  @Param("id", ParseIntPipe) id: number,
  @Body() teamWebsiteUpdateDTO: TeamWebsiteUpdateDTO,
): Promise<TeamDetailsDTO> {
    const team = await this.teamService.addWebsitesToTeam(id, teamWebsiteUpdateDTO.websiteIds, user.id);
    return team;
}
  
@Roles(RoleSlug.ADMIN) 
@TeamDocs.removeWebsitesFromTeam()
@Post(":id/remove-websites")
async removeWebsitesFromTeam(
  @CurrentUser() user: AuthenticatedUser,
  @Param("id", ParseIntPipe) id: number,
  @Body() teamWebsiteUpdateDTO: TeamWebsiteUpdateDTO,
): Promise<TeamDetailsDTO> {
    const team = await this.teamService.removeWebsitesFromTeam(id, teamWebsiteUpdateDTO.websiteIds, user.id);
    return team;
}
}