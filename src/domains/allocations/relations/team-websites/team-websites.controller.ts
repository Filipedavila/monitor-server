import { Controller, Post, Delete, Body, HttpStatus, HttpCode, ParseIntPipe, Param, UseGuards } from "@nestjs/common";
import { TeamWebsiteAllocationService } from "./team-websites.service";
import { CreateTeamWebsiteDto } from "./dtos/team-website-create.dto";
import { DeleteTeamWebsitesDto } from "./dtos/team-website-delete.dto";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { RoleSlug } from "src/core/authentication/interfaces/types";
import { Roles } from "src/core/authorization/decorators/roles.decorator";

@Controller("teams/members")
@UseGuards(JwtAuthGuard,RolesGuard)
export class TeamWebsitesController {
  constructor(private readonly service: TeamWebsiteAllocationService) {}

  @Roles(RoleSlug.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addWebsiteToTeam(
    @Body() dto: CreateTeamWebsiteDto
  ) {
    return await this.service.allocateWebsitesToTeam(dto.teamId, dto.websiteIds);
  }

  @Roles(RoleSlug.ADMIN)
  @Delete(":teamId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeWebsiteFromTeam(
    @Param("teamId", ParseIntPipe) teamId: number,
    @Body() dto: DeleteTeamWebsitesDto
  ) {
    await this.service.deallocateWebsitesFromTeam(teamId, dto.websiteIds);
  }
}