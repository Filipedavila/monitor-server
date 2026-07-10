import { applyDecorators, HttpStatus } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBearerAuth, 
  ApiBody,
  ApiParam
} from "@nestjs/swagger";
import { UpdateTeamWebsitesDto } from "./dtos/team-website-update.dto";

export const TeamWebsitesDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("team-websites"),
      ApiBearerAuth(),
      ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" }),
      ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden - Requires Admin role" })
    ),

  updateTeamWebsites: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Update team websites allocation (Delta update)",
        description: "Atomically adds or removes specific websites from a team's allocation list."
      }),
      ApiParam({ 
        name: "teamId", 
        type: "number", 
        description: "The unique identifier of the team" 
      }),
      ApiBody({ 
        type: UpdateTeamWebsitesDto,
        description: "Arrays of website IDs to add and remove"
      }),
      ApiResponse({ 
        status: HttpStatus.OK, 
        description: "Websites successfully updated for the team" 
      }),
      ApiResponse({ 
        status: HttpStatus.BAD_REQUEST, 
        description: "Invalid team or website identifiers" 
      })
    ),
};