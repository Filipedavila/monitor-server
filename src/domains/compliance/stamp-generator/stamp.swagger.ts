import { applyDecorators } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBasicAuth 
} from "@nestjs/swagger";

export const StampDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("stamp"),
      ApiBasicAuth(),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  generateAll: () =>
    applyDecorators(
      ApiOperation({ summary: "Generate digital stamp for all websites" }),
      ApiResponse({
        status: 200,
        description: "The stamps were generated",
        type: Boolean,
      })
    ),

  generateSpecific: () =>
    applyDecorators(
      ApiOperation({ summary: "Generate digital stamp for a specific website" }),
      ApiResponse({
        status: 200,
        description: "The stamp was generated",
        type: Boolean,
      })
    ),
};