import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBasicAuth 
} from "@nestjs/swagger";

export const GovUserDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("gov-user"),
      ApiBasicAuth(),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  create: () =>
    applyDecorators(
      ApiOperation({ summary: "Create GovUser" }),
      ApiResponse({ status: 200, description: "GovUser created", type: Object }),
      HttpCode(200)
    ),

  findAll: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all GovUsers" }),
      ApiResponse({ status: 200, description: "Success", type: [Object] }),
      HttpCode(200)
    ),

  exists: () =>
    applyDecorators(
      ApiOperation({ summary: "Check if a specific GovUser exists" }),
      ApiResponse({ status: 200, description: "Success", type: [Object] }),
      HttpCode(200)
    ),

  findOne: () =>
    applyDecorators(
      ApiOperation({ summary: "Find a GovUser by id" }),
      ApiResponse({ status: 200, description: "Success", type: Object }),
      HttpCode(200)
    ),

  update: () =>
    applyDecorators(
      ApiOperation({ summary: "Update a specific GovUser" }),
      ApiResponse({ status: 200, description: "The specific GovUser was updated", type: Object }),
      HttpCode(200)
    ),

  remove: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete a specific GovUser" }),
      ApiResponse({ status: 200, description: "The specific GovUser was deleted", type: Object }),
      HttpCode(200)
    ),

  total: () =>
    applyDecorators(
      ApiOperation({ summary: "Find total number of GovUsers" }),
      ApiResponse({ status: 200, description: "Success", type: Number }),
      HttpCode(200)
    ),

  countSearch: () =>
    applyDecorators(
      ApiOperation({ summary: "Count GovUsers by search term" }),
      ApiResponse({ status: 200, description: "Success", type: Number }),
      HttpCode(200)
    ),

  findAllPaged: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all GovUsers with pagination and search" }),
      ApiResponse({ status: 200, description: "Success", type: Array }),
      HttpCode(200)
    ),
};