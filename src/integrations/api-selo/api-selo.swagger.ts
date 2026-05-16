import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags 
} from "@nestjs/swagger";

export const APISeloDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("apiselo"),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  getAllStamps: () =>
    applyDecorators(
      ApiOperation({
        summary: "Retrieve digital stamp information for all websites",
      }),
      ApiResponse({
        status: 200,
        description: "The information was retrieved",
        type: Boolean,
      }),
      HttpCode(200)
    ),
};