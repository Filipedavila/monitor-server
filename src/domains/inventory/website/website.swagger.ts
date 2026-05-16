import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiExtraModels, getSchemaPath, ApiBearerAuth } from "@nestjs/swagger";
import { CreateWebsiteDto } from "./dto/create-website.dto";
import { UpdateWebsiteDto } from "./dto/update-website.dto";


export const WebsiteDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("websites"),
      ApiBearerAuth(),
      
    ),

  findAll: () =>
    applyDecorators(
       ApiOperation({ summary: "List websites with pagination and security filters" })
    ),

  findOne: () =>
      applyDecorators(
       ApiOperation({ summary: "Get detailed website information" })
    ),

  create: () =>
    applyDecorators(
      ApiOperation({ summary: "Create a new website" }),
      ApiBody({ type: CreateWebsiteDto }),
      ApiResponse({ status: 201, description: "Website created successfully", type: CreateWebsiteDto }),
      ApiResponse({ status: 400, description: "Bad Request - Invalid input data" }),
     ApiResponse({ status: 403, description: "Forbidden - Insufficient permissions" }),
    ),

  update: () =>
    applyDecorators(
      ApiOperation({
        summary: "Update website metadata and permissions",
        description: "Update the details and permissions of an existing website"
      }),
      ApiBody({ type: UpdateWebsiteDto }),
      ApiResponse({
        status: 200,
        description: "Website updated successfully",
    
      })
    ),
    delete: () =>
    applyDecorators(
      ApiOperation({
        summary: "Delete one or more websites",
        description: "Permanently delete websites that the user has permission to edit"
      }),
      ApiBody({
        schema: {
          type: 'object',
          properties: {
            ids: {
              type: 'array',
              items: { type: 'number' },
              example: [1, 2, 3]
            }
          }
        }
      }),
      ApiResponse({
        status: 200,
        description: "Websites deleted successfully",
      }),
      ApiResponse({ status: 403, description: "Forbidden - Insufficient permissions" }),
    ),
};