import { applyDecorators, HttpStatus } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBearerAuth, 
  ApiBody,
  ApiParam
} from "@nestjs/swagger";
import { UpdateWebsiteTagsDto } from "./dtos/tag-website-update.dto"; 

export const TagWebsitesDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("tag-websites"),
      ApiBearerAuth(),
      ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" }),
      ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden - Requires Admin role" })
    ),

  updateWebsiteTags: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Update website tags allocation (Delta update)",
        description: "Atomically adds or removes tags for a specific website."
      }),
      ApiParam({ 
        name: "websiteId", 
        type: "number", 
        description: "The unique identifier of the website" 
      }),
      ApiBody({ 
        type: UpdateWebsiteTagsDto,
        description: "Payload containing arrays of tag IDs to add and remove"
      }),
      ApiResponse({ 
        status: HttpStatus.OK, 
        description: "Tags successfully updated for the website" 
      }),
      ApiResponse({ 
        status: HttpStatus.BAD_REQUEST, 
        description: "Invalid website ID or tag identifiers" 
      })
    ),
};