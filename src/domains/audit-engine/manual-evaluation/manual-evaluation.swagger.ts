import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBasicAuth, 
  ApiParam, 
  ApiBody 
} from "@nestjs/swagger";
import { EvaluationAspect } from "./manual-evaluation.entity";

export const ManualEvaluationDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("manual-evaluation"),
      ApiBasicAuth(),
      ApiResponse({ status: 403, description: "Forbidden" }),
      ApiResponse({ status: 500, description: "Internal Server Error" })
    ),

  create: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Create a new aspect evaluation",
        description: "Supports content, functional, or transaction aspect types" 
      }),
      ApiParam({ name: 'type', enum: EvaluationAspect }),
      ApiBody({ 
        schema: { 
          type: 'object', 
          properties: { jsonData: { type: 'object' } },
          required: ['jsonData']
        } 
      }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  findAllByAspect: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all evaluations for a specific aspect type" }),
      ApiParam({ name: 'type', enum: EvaluationAspect }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllByWebsite: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all evaluations for a specific website" }),
      ApiParam({ name: 'id', description: 'The unique ID of the website' }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),
};