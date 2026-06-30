import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBasicAuth, 
  ApiQuery,
  ApiBody
} from "@nestjs/swagger";
import { Tag } from "./tag.entity";
import { TagRequestDTO } from "./dto/request/tag-request.dto";
import { CreateTagDTO } from "./dto/create-tag.dto";
import { UpdateTagDTO } from "./dto/update-tag.dto";
import { DeleteTagsDTO } from "./dto/delete-tag.dto";
import { ImportTagDTO } from "./dto/import-tag.dto";

export const TagDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("tag"),
      ApiBasicAuth(),
      ApiResponse({ status: 401, description: "Unauthorized" }),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  findAll: () =>
    applyDecorators(
      ApiQuery({ type: TagRequestDTO }),
      ApiOperation({ summary: "Find all tags based on user permissions and search terms" }),
      ApiResponse({ status: 200, description: "Success", type: [Tag] }) 
    ),

  create: () =>
    applyDecorators(
      ApiBody({ type: CreateTagDTO }),
      ApiOperation({ summary: "Create a new tag with optional multi-entity mappings" }),
      ApiResponse({ status: 201, description: "The tag was successfully created", type: Tag }) 
    ),

  update: () =>
    applyDecorators(
      ApiBody({ type: UpdateTagDTO }),
      ApiOperation({ summary: "Update a specific tag description/meta" }),
      ApiResponse({ status: 200, description: "The tag was updated", type: Tag })
    ),

  deleteBulk: () =>
    applyDecorators(
      ApiBody({ type: DeleteTagsDTO }),
      ApiOperation({ summary: "Delete a list of tags in batch (Transaction and Chunking safe)" }),
      ApiResponse({ status: 204, description: "The tags were deleted successfully" }),
      ApiResponse({ status: 400, description: "Invalid payloads or entities constraint block" })
    ),

  clone: () => 
    applyDecorators(
      ApiBody({ type: ImportTagDTO }),
      ApiOperation({ summary: "Clone/Duplicate the relational scope of an existing tag to a new tag" }),
      ApiResponse({ status: 201, description: "The tag was cloned successfully", type: Tag }),
      ApiResponse({ status: 404, description: "Source tag not found" })
    ),
};