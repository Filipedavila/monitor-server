import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBasicAuth, 
  ApiParam 
} from "@nestjs/swagger";
import { Directory } from "./directory.entity";
import { Tag } from "src/domains/inventory/tag/tag.entity";
import { Website } from "src/domains/inventory/website/website.entity";

export const DirectoryDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("directory"),
      ApiBasicAuth(),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  reEvaluate: () =>
    applyDecorators(
      ApiOperation({ summary: "Reevaluate all pages from a directory" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  findAll: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all directories" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  create: () =>
    applyDecorators(
      ApiOperation({ summary: "Create a new directory" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  exists: () =>
    applyDecorators(
      ApiOperation({ summary: "Check if directory name exists" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  update: () =>
    applyDecorators(
      ApiOperation({ summary: "Update a specific directory" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  delete: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete a specific directory" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  deleteBulk: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete a list directories" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  deletePagesBulk: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete all pages from a list directories" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  totalObservatory: () =>
    applyDecorators(
      ApiOperation({ summary: "Find number of observatory directories" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  info: () =>
    applyDecorators(
      ApiOperation({ summary: "Find a specific directory info" }),
      ApiResponse({ status: 200, description: "Success", type: Directory }),
      HttpCode(200)
    ),

  tags: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all tags from a specific dirctory" }),
      ApiResponse({ status: 200, description: "Success", type: [Tag] }),
      HttpCode(200)
    ),

  websites: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all websites from a specific dirctory" }),
      ApiResponse({ status: 200, description: "Success", type: [Website] }),
      HttpCode(200)
    ),

  pages: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all pages from a specific dirctory" }),
      ApiResponse({ status: 200, description: "Success", type: [Website] }),
      HttpCode(200)
    ),

  count: () =>
    applyDecorators(
      ApiOperation({ summary: "Count directories by search term" }),
      ApiResponse({ status: 200, description: "Success", type: Number }),
      HttpCode(200)
    ),

  findAllPaged: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all directories with pagination and search" }),
      ApiResponse({ status: 200, description: "Success", type: Array }),
      HttpCode(200)
    ),
};