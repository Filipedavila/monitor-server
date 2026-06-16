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
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { DeleteTagsDto } from "./dto/delete-tag.dto";
import { ImportTagDto } from "./dto/import-tag.dto";

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
      ApiBody({ type: CreateTagDto }),
      ApiOperation({ summary: "Create a new tag with optional multi-entity mappings" }),
      ApiResponse({ status: 201, description: "The tag was successfully created", type: Tag }) 
    ),

  update: () =>
    applyDecorators(
      ApiBody({ type: UpdateTagDto }),
      ApiOperation({ summary: "Update a specific tag description/meta" }),
      ApiResponse({ status: 200, description: "The tag was updated", type: Tag })
    ),

  deleteBulk: () =>
    applyDecorators(
      ApiBody({ type: DeleteTagsDto }),
      ApiOperation({ summary: "Delete a list of tags in batch (Transaction and Chunking safe)" }),
      ApiResponse({ status: 204, description: "The tags were deleted successfully" }),
      ApiResponse({ status: 400, description: "Invalid payloads or entities constraint block" })
    ),

  clone: () => 
    applyDecorators(
      ApiBody({ type: ImportTagDto }),
      ApiOperation({ summary: "Clone/Duplicate the relational scope of an existing tag to a new tag" }),
      ApiResponse({ status: 201, description: "The tag was cloned successfully", type: Tag }),
      ApiResponse({ status: 404, description: "Source tag not found" })
    ),
};