import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBasicAuth 
} from "@nestjs/swagger";

export const ObservatoryDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("observatory"),
      ApiBasicAuth(),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  getGlobalMetrics: () =>
    applyDecorators(
      ApiOperation({ summary: "Get all observatory global metrics" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  getWebsiteMetrics: () =>
    applyDecorators(
      ApiOperation({ summary: "Get observatory metrics for a specific website" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    )

};