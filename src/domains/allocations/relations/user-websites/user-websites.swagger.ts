import { applyDecorators, HttpStatus } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBearerAuth, 
  ApiBody,
  ApiParam
} from "@nestjs/swagger";
import { UpdateUserWebsitesDto } from "./dtos/user-website-update.dto";

export const UserWebsitesDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("user-websites"),
      ApiBearerAuth(),
      ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" }),
      ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
    ),

  getUserWebsites: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Get user website allocations",
        description: "Retrieves the list of websites currently assigned to a specific user."
      }),
      ApiParam({ name: "userId", type: "number", description: "The unique identifier of the user" }),
      ApiResponse({ status: HttpStatus.OK, description: "Successfully retrieved websites" })
    ),

  updateUserWebsites: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Update user websites allocation (Delta update)",
        description: "Atomically adds or removes website assignments for a specific user."
      }),
      ApiParam({ name: "userId", type: "number", description: "The unique identifier of the user" }),
      ApiBody({ type: UpdateUserWebsitesDto }),
      ApiResponse({ status: HttpStatus.OK, description: "Allocations successfully updated" })
    ),
};