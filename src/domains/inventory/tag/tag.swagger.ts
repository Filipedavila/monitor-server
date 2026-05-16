import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBasicAuth, 
  ApiParam 
} from "@nestjs/swagger";
import { Tag } from "./tag.entity";

export const TagDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("tag"),
      ApiBasicAuth(),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  create: () =>
    applyDecorators(
      ApiOperation({ summary: "Create a new tag" }),
      ApiResponse({ status: 201, description: "The tag was created", type: Boolean }),
      HttpCode(201)
    ),

  update: () =>
    applyDecorators(
      ApiOperation({ summary: "Update a specific tag" }),
      ApiResponse({ status: 200, description: "The tag was updated", type: Boolean }),
      HttpCode(200)
    ),

  delete: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete a specific tag" }),
      ApiResponse({ status: 200, description: "The tag was deleted", type: Boolean }),
      HttpCode(200)
    ),

  deleteBulk: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete a list of tags" }),
      ApiResponse({ status: 200, description: "The tags were deleted", type: Boolean }),
      HttpCode(200)
    ),

  deletePagesBulk: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete all pages from a specific tag" }),
      ApiResponse({ status: 200, description: "The pages were deleted", type: Boolean }),
      HttpCode(200)
    ),

  createStudy: () =>
    applyDecorators(
      ApiOperation({ summary: "Create study monitor tag" }),
      ApiResponse({ status: 200, description: "The study monitor tag was created", type: Boolean }),
      HttpCode(200)
    ),

  removeStudy: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete study monitor tag" }),
      ApiResponse({ status: 200, description: "The study monitor tag was deleted", type: [Tag] }),
      HttpCode(200)
    ),

  import: () =>
    applyDecorators(
      ApiOperation({ summary: "Import tag to AMS" }),
      ApiResponse({ status: 200, description: "The tag was imported", type: Boolean }),
      HttpCode(200)
    ),

  exists: () =>
    applyDecorators(
      ApiOperation({ summary: "Check if tag exists by name" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  findAll: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all tags" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  userTagWebsitesStudy: () =>
    applyDecorators(
      ApiOperation({ summary: "Find websites from a specific user tag study monitor" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  userTagWebsites: () =>
    applyDecorators(
      ApiOperation({ summary: "Find websites from a specific user tag" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  userWebsitePages: () =>
    applyDecorators(
      ApiOperation({ summary: "Find pages from a specific user tag" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  tagWebsitePages: () =>
    applyDecorators(
      ApiOperation({ summary: "Find a specific tag by name" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  info: () =>
    applyDecorators(
      ApiOperation({ summary: "Find a specific tag by id" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  allOfficial: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all AMS tags" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  totalStudyMonitor: () =>
    applyDecorators(
      ApiOperation({ summary: "Find the number of study monitor tags" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  totalObservatory: () =>
    applyDecorators(
      ApiOperation({ summary: "Find the number observatory tags" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  studyMonitorUserTags: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all study monitor tags from a specific user" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  studyMonitorTagData: () =>
    applyDecorators(
      ApiOperation({ summary: "Find tag data from a specific tag" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  studyMonitorWebsiteData: () =>
    applyDecorators(
      ApiOperation({ summary: "Find tag data from a specific tag and website" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  count: () =>
    applyDecorators(
      ApiOperation({ summary: "Count tags by search term" }),
      ApiResponse({ status: 200, description: "Success", type: Number }),
      HttpCode(200)
    ),

  findAllPaged: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all tags with pagination and search" }),
      ApiResponse({ status: 200, description: "Success", type: Array }),
      HttpCode(200)
    ),
};