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
import {  TeamDTO } from "./dto/team.dto";
import { TeamQueryDTO } from "./dto/request/team-request.dto";
import { PaginationResponse } from "src/common/repositories/base.repository";
import { FgaGuard } from "src/core/authorization/guards/fda.guard";
import { FgaAuthorized } from "src/core/authorization/decorators/fga-authorization.decorator";

@TeamDocs.controller()
@Controller("teams")
@UseGuards(JwtAuthGuard,RolesGuard,FgaGuard)
@UseInterceptors(LoggingInterceptor)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}
  @TeamDocs.createTeam()
   @FgaAuthorized({
          objectType: "role",
          action: "can_manage_users",
          resourceIdResolver: () => "ams"
    })
  @Roles(RoleSlug.ADMIN)
   
  @Post()
  async createTeam(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createTeamDTO: CreateTeamDTO,
  ): Promise<TeamDTO> {

  return await this.teamService.createTeam(user, createTeamDTO);

  }

  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized({
          objectType: "role",
          action: "can_view_users",
          resourceIdResolver: () => 'ams'
  }) 
  @TeamDocs.getTeamById()
  @Get(":id")
  async getTeamById(@Param("id", ParseIntPipe) id: number): Promise<TeamDTO> {
     return await this.teamService.getTeamById(id);
  }
 
  @Roles(RoleSlug.ADMIN) 
  @TeamDocs.getAllTeams()
  @Get()
  async getAllTeams(@Query() query: TeamQueryDTO): Promise<PaginationResponse<TeamDTO>> {
      return await this.teamService.getAllTeams(query);
}
 @FgaAuthorized({
        objectType: "role",
        action: "can_manage_users",
        resourceIdResolver: () => "ams"
  })
  @TeamDocs.deleteTeam()
  @Roles(RoleSlug.ADMIN) 
  @Delete(":id")
  @HttpCode(204)
  async deleteTeam(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<void> {
      await this.teamService.deleteTeam(id);
  }

}