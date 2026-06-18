import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBearerAuth, 
  ApiParam,
  ApiBody,
  ApiQuery
} from "@nestjs/swagger";
import { OrganizationDTO } from "./dto/organization.dto";
import { OrganizationRequestDTO } from "./dto/request/organization-request.dto";
import { CreateOrganizationDTO } from "./dto/create-organization.dto";
import { UpdateOrganizationDTO } from "./dto/update-organization.dto";

export const OrganizationDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("Organizations"),
      ApiBearerAuth(),
      ApiResponse({ status: 401, description: "Unauthorized - Token inválido ou ausente" }),
      ApiResponse({ status: 403, description: "Forbidden - Falta de permissões de Role" })
    ),

  findAllPaged: () =>
    applyDecorators(
      ApiOperation({
        summary: "Find entities by search term with pagination and sorting in AMS",
      }),
      ApiQuery({ type: OrganizationRequestDTO }),
      ApiResponse({ 
        status: 200, 
        description: "Success", 
        schema: {
          properties: {
            items: { type: "array", items: { $ref: "#/components/schemas/OrganizationDTO" } },
            total: { type: "number" },
            page: { type: "number" },
            size: { type: "number" }
          }
        }
      }),
      HttpCode(200)
    ),

  getOne: () =>
    applyDecorators(
      ApiOperation({ summary: "Find entity info by ID" }),
      ApiParam({ name: "organizationId", type: "number", description: "ID único da organização" }),
      ApiResponse({ status: 200, description: "Success", type: OrganizationDTO }),
      ApiResponse({ status: 404, description: "Organization not found" }),
      HttpCode(200)
    ),

  create: () =>
    applyDecorators(
      ApiOperation({ summary: "Create a new entity" }),
      ApiBody({ type: CreateOrganizationDTO, description: "Dados necessários para criar uma organização" }),
      ApiResponse({ status: 201, description: "A new entity was created successfully", type: OrganizationDTO }),
      ApiResponse({ status: 400, description: "Bad Request - Erro de validação de DTO" }),
      HttpCode(201)
    ),

  update: () =>
    applyDecorators(
      ApiOperation({ summary: "Update a specific entity" }),
      ApiBody({ type: UpdateOrganizationDTO, description: "Campos modificáveis da organização" }),
      ApiResponse({ status: 200, description: "The entity was updated successfully", type: OrganizationDTO }),
      ApiResponse({ status: 404, description: "Organization not found" }),
      HttpCode(200)
    ),

  delete: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete a specific entity" }),
      ApiParam({ name: "organizationId", type: "number", description: "ID único da organização" }),
      ApiResponse({ status: 200, description: "The entity was deleted successfully" }),
      ApiResponse({ status: 404, description: "Organization not found" }),
      HttpCode(200)
    ),
};