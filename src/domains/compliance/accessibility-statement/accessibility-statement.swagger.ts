import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiParam 
} from "@nestjs/swagger";

export const AccessibilityStatementDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("accessibility-statement"),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  findOne: () =>
    applyDecorators(
      ApiOperation({ summary: "Find accessibility statement by website name" }),
      ApiParam({ name: "name", type: String }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAll: () =>
    applyDecorators(
      ApiOperation({ summary: "Get list of all accessibility statements" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findOneById: () =>
    applyDecorators(
      ApiOperation({ summary: "Find accessibility statement by ID" }),
      ApiParam({ name: "id", type: Number }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllByYear: () =>
    applyDecorators(
      ApiOperation({ summary: "Get accessibility statements grouped by age/year" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllByConformance: () =>
    applyDecorators(
      ApiOperation({ summary: "Get accessibility statements grouped by conformance" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllBySeal: () =>
    applyDecorators(
      ApiOperation({ summary: "Get accessibility statements grouped by seal" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllByState: () =>
    applyDecorators(
      ApiOperation({ summary: "Get accessibility statements grouped by state" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllByDirectoryState: () =>
    applyDecorators(
      ApiOperation({ summary: "Get directory accessibility statements grouped by state" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllByDirectorySeal: () =>
    applyDecorators(
      ApiOperation({ summary: "Get directory accessibility statements grouped by seal" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllByDirectoryConformity: () =>
    applyDecorators(
      ApiOperation({ summary: "Get directory accessibility statements grouped by conformity" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllByDirectoryWebsite: () =>
    applyDecorators(
      ApiOperation({ summary: "Get OPAW table for directory websites" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findNumberOfEvaluationByType: () =>
    applyDecorators(
      ApiOperation({ summary: "Get number of evaluations grouped by type" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),
};