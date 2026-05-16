import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiExtraModels, getSchemaPath, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";

import { Evaluation } from "./entities/evaluation.entity";
import { CreateWebsiteDto } from "src/domains/inventory/website/dto/create-website.dto";
import { EvaluationRequestDTO } from "./dto/EvaluationRequest.dto";


export const EvaluationDocs = {
  controller: () =>
    applyDecorators(
      ApiBearerAuth(),
      ApiTags("evaluations"),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  findAll: () =>
    applyDecorators(
       ApiOperation({ summary: "Get all evaluations that you are authorized to view" }),
       ApiQuery({ type: EvaluationRequestDTO })
    ),

  findOne: () =>
      applyDecorators(
        ApiOperation({
           summary: "Get evaluation results",
         }),
         ApiResponse({
           status: 200,
           description: "Success",
           type: Evaluation,
         })
    ),
    findPageEvaluationDetails: () =>
    applyDecorators(
      ApiOperation({
         summary: "Get evaluations details for a specific page",
       }),
       ApiResponse({
         status: 200,
         description: "Success",
         type: [Evaluation],
       })
    ),  
  
  create: () =>
    applyDecorators(
      ApiOperation({ summary: "Create a new website" }),
      ApiBody({ type: CreateWebsiteDto }),
      ApiResponse({ status: 201, description: "Website created successfully", type: CreateWebsiteDto }),
      ApiResponse({ status: 400, description: "Bad Request - Invalid input data" }),
     ApiResponse({ status: 403, description: "Forbidden - Insufficient permissions" }),
    ),

  uploadExternalEvaluation: () =>
    applyDecorators(
     ApiOperation({
    summary:
      "Upload external evaluation results from the AccessMonitor Extension on My Monitor",
  }),
  ApiResponse({
    status: 200,
    description: "Success",
    type: Evaluation,
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