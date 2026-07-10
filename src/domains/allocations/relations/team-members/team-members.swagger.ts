import { applyDecorators, HttpStatus } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBearerAuth, 
  ApiBody,
  ApiParam
} from "@nestjs/swagger";
import { UpdateTeamMembersDto } from "./dtos/tag-members-update.dto"; 

export const TeamMembersDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("team-members"),
      ApiBearerAuth(),
      ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" }),
      ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden - Requires Admin role" })
    ),

  updateTeamMembers: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Update team members membership (Delta update)",
        description: "Atomically adds or removes specific users from a team's membership list."
      }),
      ApiParam({ 
        name: "teamId", 
        type: "number", 
        description: "The unique identifier of the team" 
      }),
      ApiBody({ 
        type: UpdateTeamMembersDto,
        description: "Arrays of user IDs to add and remove"
      }),
      ApiResponse({ 
        status: HttpStatus.OK, 
        description: "Team members successfully updated" 
      }),
      ApiResponse({ 
        status: HttpStatus.BAD_REQUEST, 
        description: "Invalid team or user identifiers" 
      })
    ),
};