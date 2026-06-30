import { Controller, Post, Delete, Body, HttpStatus, HttpCode, ParseIntPipe, Param, UseGuards } from "@nestjs/common";
import { TeamMembersService } from "./team-members.service";
import { DeleteTeamMembersDto } from "./dtos/tag-members-delete.dto";
import { CreateTeamMembersDto } from "./dtos/tag-members-create.dto";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";

@Controller("teams/members")
@UseGuards(JwtAuthGuard,RolesGuard) 
export class TeamMembersController {
  constructor(private readonly service: TeamMembersService) {}

  @Roles(RoleSlug.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addMemberToTeam(
    @CurrentUser() user:AuthenticatedUser,
    @Body() dto: CreateTeamMembersDto
  ) {
    const actorId = user.id;
    return await this.service.addMembersToTeam(dto.userIds, dto.teamId, actorId);
  }

  @Roles(RoleSlug.ADMIN)
  @Delete(":teamId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMemberFromTeam(
    @CurrentUser() user:AuthenticatedUser,
    @Param("teamId", ParseIntPipe) teamId: number,
    @Body() dto: DeleteTeamMembersDto
  ) {
    const actorId = user.id;
    await this.service.removeMembersFromTeam(dto.userIds, teamId, actorId);
  }
}