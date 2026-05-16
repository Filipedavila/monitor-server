import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBasicAuth, 
  ApiParam 
} from "@nestjs/swagger";
import { Page } from "./page.entity";

export const PageDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("page"),
      ApiBasicAuth(),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  reEvaluate: () =>
    applyDecorators(
      ApiOperation({ summary: "Reevaluate a specific page" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  reEvaluateMyMonitor: () =>
    applyDecorators(
      ApiOperation({ summary: "Reevaluate a specific page from My Monitor" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  findAll: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all pages" }),
      ApiResponse({ status: 200, description: "Success", type: [Page] }),
      HttpCode(200)
    ),

  create: () =>
    applyDecorators(
      ApiOperation({ summary: "Create a new page" }),
      ApiResponse({ status: 201, description: "Success", type: Boolean })
    ),

  update: () =>
    applyDecorators(
      ApiOperation({ summary: "Update a specific page" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  delete: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete a specific page" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  info: () =>
    applyDecorators(
      ApiOperation({ summary: "Find a specific page info" }),
      ApiResponse({ status: 200, description: "Success", type: Page }),
      HttpCode(200)
    ),

  count: () =>
    applyDecorators(
      ApiOperation({ summary: "Count pages by search term" }),
      ApiResponse({ status: 200, description: "Success", type: Number }),
      HttpCode(200)
    ),

  findAllPaged: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all pages with pagination and search" }),
      ApiResponse({ status: 200, description: "Success", type: Array }),
      HttpCode(200)
    ),
};