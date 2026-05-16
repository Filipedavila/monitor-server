import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBasicAuth, 
  ApiParam 
} from "@nestjs/swagger";
import { Organization } from "./organization.entity";
import { Website } from "src/domains/inventory/website/website.entity";
import { Page } from "src/domains/inventory/page/page.entity";

export const OrganizationDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("entity"),
      ApiBasicAuth(),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  reEvaluate: () =>
    applyDecorators(
      ApiOperation({ summary: "Reevaluate all pages from an entity list" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  totalObservatory: () =>
    applyDecorators(
      ApiOperation({ summary: "Find number of entities in Observatory" }),
      ApiResponse({ status: 200, description: "Success", type: Number }),
      HttpCode(200)
    ),

  count: () =>
    applyDecorators(
      ApiOperation({ summary: "Find entity by search term in AMS" }),
      ApiResponse({ status: 200, description: "Success", type: Number }),
      HttpCode(200)
    ),

  findAllPaged: () =>
    applyDecorators(
      ApiOperation({
        summary: "Find entity by search term, size, page, sort and sort direction in AMS",
      }),
      ApiResponse({ status: 200, description: "Success", type: Number }),
      HttpCode(200)
    ),

  info: () =>
    applyDecorators(
      ApiOperation({ summary: "Find entity info by id" }),
      ApiResponse({ status: 200, description: "Success", type: Organization }),
      HttpCode(200)
    ),

  create: () =>
    applyDecorators(
      ApiOperation({ summary: "Create a new entity" }),
      ApiResponse({ status: 200, description: "A new entity was created", type: Organization }),
      HttpCode(200)
    ),

  update: () =>
    applyDecorators(
      ApiOperation({ summary: "Update a specific entity" }),
      ApiResponse({ status: 200, description: "The entity was updated", type: Organization }),
      HttpCode(200)
    ),

  delete: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete a specific entity" }),
      ApiResponse({ status: 200, description: "The entity was deleted", type: Boolean }),
      HttpCode(200)
    ),

  deleteBulk: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete a list of entities" }),
      ApiResponse({ status: 200, description: "The entity list was deleted", type: Boolean }),
      HttpCode(200)
    ),

  deletePagesBulk: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete all pages from a list of entities" }),
      ApiResponse({ status: 200, description: "The page list was deleted", type: Boolean }),
      HttpCode(200)
    ),

  existsShortName: () =>
    applyDecorators(
      ApiOperation({ summary: "Check if entity exists by short-name" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  existsLongName: () =>
    applyDecorators(
      ApiOperation({ summary: "Check if entity exists by long-name" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  websites: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all the websites in a specific entity" }),
      ApiResponse({ status: 200, description: "Success", type: [Website] }),
      HttpCode(200)
    ),

  pages: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all the pages in a specific entity" }),
      ApiResponse({ status: 200, description: "Success", type: [Page] }),
      HttpCode(200)
    ),
};