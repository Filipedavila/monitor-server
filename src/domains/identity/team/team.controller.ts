import {
  Controller, InternalServerErrorException, Post, Get, Param, UseGuards, UseInterceptors, Body,
} from "@nestjs/common";
import { LoggingInterceptor } from "src/core/log/log.interceptor";

import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";

import { TeamDocs } from "./team.swagger";
import { TeamService } from "./team.service";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { RoleSlug } from "src/core/authentication/interfaces/types";
import { CreateTeamDTO } from "./dto/create-team.dto";
import { TeamDTO } from "./dto/team.dto";

@TeamDocs.controller()
@Controller("teams")
@UseGuards(JwtAuthGuard,RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Roles(RoleSlug.ADMIN) 
  @TeamDocs.createTeam()
  @Post()
  async createTeam(@Body() createTeamDTO: CreateTeamDTO): Promise<TeamDTO> {

  return await this.teamService.createTeam(createTeamDTO);

  }

  @Roles(RoleSlug.ADMIN) 
  @TeamDocs.getTeamById()
  @Get(":id")
  async getTeamById(@Param("id") id: string): Promise<any> {
    try {
      const team = await this.teamService.getTeamById(id);
      return team;
    } catch (error) {
      throw new InternalServerErrorException("Failed to get team");
    }
  }
 
  @Roles(RoleSlug.ADMIN) 
  @TeamDocs.getAllTeams()
  @Get()
  async getAllTeams(): Promise<any> {
    try {
      const teams = await this.teamService.getAllTeams();
      return teams;
    } catch (error) {
      throw new InternalServerErrorException("Failed to get teams");
  }
}
@Roles(RoleSlug.ADMIN) 
@TeamDocs.deleteTeam()
@Post(":id/delete")
async deleteTeam(@Param("id") id: string): Promise<any> {
  try {
    await this.teamService.deleteTeam(id);
    return { message: "Team deleted successfully" };
  } catch  {
    throw new InternalServerErrorException("Failed to delete team");  
  }
}
@Roles(RoleSlug.ADMIN) 
@TeamDocs.addUserToTeam()
@Post(":id/add-user")
async addUserToTeam(@Param("id") id: string, @Body() body: any): Promise<any> {
  try {
    const team = await this.teamService.addUserToTeam(id, body.userId);
    return team;
  } catch  {
    throw new InternalServerErrorException("Failed to add user to team");
  }
}

@Roles(RoleSlug.ADMIN) 
@TeamDocs.removeUserFromTeam()
@Post(":id/remove-user")
async removeUserFromTeam(@Param("id") id: string, @Body() body: any): Promise<any> {
  try {
    const team = await this.teamService.removeUserFromTeam(id, body.userId);
    return team;
  } catch  {
    throw new InternalServerErrorException("Failed to remove user from team");
  }
}

@Roles(RoleSlug.ADMIN) 
@TeamDocs.addWebsiteToTeam()
@Post(":id/add-website")
async addWebsiteToTeam(@Param("id") id: string, @Body() body: any): Promise<any> {
  try {
    const team = await this.teamService.addWebsiteToTeam(id, body.websiteId);
    return team;
  } catch  {
    throw new InternalServerErrorException("Failed to add website to team");
  }
}
  
@Roles(RoleSlug.ADMIN) 
@TeamDocs.removeWebsiteFromTeam()
@Post(":id/remove-website")
async removeWebsiteFromTeam(@Param("id") id: string, @Body() body: any): Promise<any> {
  try {
    const team = await this.teamService.removeWebsiteFromTeam(id, body.websiteId);
    return team;
  }
  catch  {
    throw new InternalServerErrorException("Failed to remove website from team");
  }
}
}