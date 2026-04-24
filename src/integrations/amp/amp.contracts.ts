import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

export const AmpDocs = {
  evaluateUrl: () =>
    applyDecorators(
      ApiOperation({ summary: "Evaluate page via url" }),
      ApiResponse({
        status: 200,
        description: "Success",
        type: Boolean,
      }),
    ),

  evaluateHtml: () =>
    applyDecorators(
      ApiOperation({ summary: "Evaluate html code" }),
      ApiResponse({
        status: 200,
        description: "Success",
        type: Boolean,
      }),
    ),
};
export interface AmpContract {
  evaluateUrl: (req: any, url: string) => Promise<boolean>;
  evaluateHtml: (req: any) => Promise<boolean>;
}
