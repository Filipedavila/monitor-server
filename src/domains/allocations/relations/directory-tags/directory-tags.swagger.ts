import { applyDecorators, HttpStatus } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBearerAuth, 
  ApiBody,
  ApiParam
} from "@nestjs/swagger";
import { UpdateDirectoryTagsDto } from "./dtos/directory-tags-update.dto"; 

export const DirectoryTagsDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("directory-tags"),
      ApiBearerAuth(),
      ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" }),
      ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden - Requires Admin role" })
    ),

  getDirectoryTags: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Get directory tags",
        description: "Retrieves the list of tags currently associated with a specific directory."
      }),
      ApiParam({ 
        name: "directoryId", 
        type: "number", 
        description: "The unique identifier of the directory" 
      }),
      ApiResponse({ 
        status: HttpStatus.OK, 
        description: "List of tags successfully retrieved" 
      })
    ),

  updateDirectoryTags: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Update directory tags allocation (Delta update)",
        description: "Atomically adds or removes tags for a specific directory."
      }),
      ApiParam({ 
        name: "directoryId", 
        type: "number", 
        description: "The unique identifier of the directory" 
      }),
      ApiBody({ 
        type: UpdateDirectoryTagsDto,
        description: "Payload containing arrays of tag IDs to add and remove"
      }),
      ApiResponse({ 
        status: HttpStatus.OK, 
        description: "Tags successfully updated for the directory" 
      }),
      ApiResponse({ 
        status: HttpStatus.BAD_REQUEST, 
        description: "Invalid directory ID or tag identifiers" 
      })
    ),
};