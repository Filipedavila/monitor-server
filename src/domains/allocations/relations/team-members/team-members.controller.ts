import { Controller, Patch, Body, HttpStatus, HttpCode, Param, UseGuards, ParseIntPipe, Get } from "@nestjs/common";
import { TeamMembersService } from "./team-members.service";
import { UpdateTeamMembersDto } from "./dtos/tag-members-update.dto"; 
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { TeamMembersDocs } from "./team-members.swagger";
import { FgaGuard } from "src/core/authorization/guards/fga.guard";
import { FgaAuthorized } from "src/core/authorization/decorators/fga-authorization.decorator";

@TeamMembersDocs.controller()
@Controller("teams/:teamId/members") 
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
export class TeamMembersController {
  constructor(private readonly service: TeamMembersService) {}


    @Get('')
    @FgaAuthorized({
      objectType: "role",
      action: "can_view_users",
      resourceIdResolver: () => 'ams'
    })
    @HttpCode(HttpStatus.OK)
    async getTeamMembers(
      @Param("teamId", ParseIntPipe) teamId: number
    ) {
      return await this.service.getTeamMembers(teamId);
    }
  
  @Patch()
  @TeamMembersDocs.updateTeamMembers()
  @FgaAuthorized({
    objectType: "role",
    action: "can_edit_users",
    resourceIdResolver: () => 'ams'
  })
  @Roles(RoleSlug.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param("teamId", ParseIntPipe) teamId: number,
    @Body() dto: UpdateTeamMembersDto
  ) {
    return await this.service.updateTeamMembers(
      teamId, 
      dto.add || [], 
      dto.remove || [],
    );
  }
}