import { applyDecorators } from "@nestjs/common";
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiBody 
} from "@nestjs/swagger";
import { CreateTeamDTO } from "./dto/create-team.dto";
import { TeamUserUpdateDTO } from "./dto/team-user-update.dto";
import { TeamWebsiteUpdateDTO } from "./dto/team-website-update.dto";
import { TeamDetailsDTO, TeamDTO } from "./dto/team.dto";
import { PaginationResponse } from "src/common/repositories/base.repository";
import { UserPaginationResponse } from "../user/dto/pagination-response.dto";

export const TeamDocs = {
  controller: () => applyDecorators(
    ApiTags("Teams"),
    ApiBearerAuth(),
    ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing token." }),
    ApiResponse({ status: 403, description: "Forbidden - Insufficient permissions." }),
    ApiResponse({ status: 500, description: "Internal Server Error." })
  ),

  createTeam: () => applyDecorators(
    ApiOperation({ summary: "Create a new team" }),
    ApiBody({ type: CreateTeamDTO }),
    ApiResponse({ status: 201, type: TeamDetailsDTO, description: "Team created successfully." }),
    ApiResponse({ status: 409, description: "Conflict - Team name already exists." })
  ),

  getTeamById: () => applyDecorators(
    ApiOperation({ summary: "Get team by ID" }),
    ApiParam({ name: "id", type: "integer", description: "Numerical team ID" }),
    ApiResponse({ status: 200, type: TeamDetailsDTO, description: "Team details returned successfully." }),
    ApiResponse({ status: 404, description: "Team not found." })
  ),

  getAllTeams: () => applyDecorators(
    ApiOperation({ summary: "List all teams" }),
    ApiResponse({ status: 200, type: UserPaginationResponse, description: "List of teams returned successfully." })
  ),

  deleteTeam: () => applyDecorators(
    ApiOperation({ summary: "Delete a team" }),
    ApiParam({ name: "id", type: "integer", description: "Target team ID" }),
    ApiResponse({ status: 204, description: "Team deleted successfully." }),
    ApiResponse({ status: 404, description: "Team not found." })
  ),

  addUserToTeam: () => applyDecorators(
    ApiOperation({ summary: "Add users to a team" }),
    ApiParam({ name: "id", type: "integer", description: "Target team ID" }),
    ApiBody({ type: TeamUserUpdateDTO }),
    ApiResponse({ status: 200, type: TeamDetailsDTO, description: "Users associated successfully." }),
    ApiResponse({ status: 400, description: "Bad Request - Invalid team or user ID." })
  ),

  removeUsersFromTeam: () => applyDecorators(
    ApiOperation({ summary: "Remove users from a team" }),
    ApiParam({ name: "id", type: "integer", description: "Target team ID" }),
    ApiBody({ type: TeamUserUpdateDTO }),
    ApiResponse({ status: 200, type: TeamDetailsDTO, description: "Users removed successfully." }),
    ApiResponse({ status: 400, description: "Bad Request - User not found in team." })
  ),

  addWebsitesToTeam: () => applyDecorators(
    ApiOperation({ summary: "Add websites to a team" }),
    ApiParam({ name: "id", type: "integer", description: "Target team ID" }),
    ApiBody({ type: TeamWebsiteUpdateDTO }),
    ApiResponse({ status: 200, type: TeamDetailsDTO, description: "Websites associated successfully." }),
    ApiResponse({ status: 400, description: "Bad Request - Invalid website ID." })
  ),

  removeWebsitesFromTeam: () => applyDecorators(
    ApiOperation({ summary: "Remove websites from a team" }),
    ApiParam({ name: "id", type: "integer", description: "Target team ID" }),
    ApiBody({ type: TeamWebsiteUpdateDTO }),
    ApiResponse({ status: 200, type: TeamDetailsDTO, description: "Websites removed successfully." }),
    ApiResponse({ status: 400, description: "Bad Request - Website not found in team." })
  ),
};