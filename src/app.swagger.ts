import { applyDecorators, HttpCode } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

export const AppDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("admin"),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  getObservatoryStats: () =>
    applyDecorators(
      ApiOperation({ summary: "Get Observatory aggregated statistics" }),
      ApiResponse({
        status: 200,
        description: "Observatory statistics",
        type: Object,
      }),
      HttpCode(200)
    ),

  getTotalStats: () =>
    applyDecorators(
      ApiOperation({ summary: "Get total aggregated statistics" }),
      ApiResponse({
        status: 200,
        description: "Total statistics",
        type: Object,
      }),
      HttpCode(200)
    ),

  getMyMonitorStats: () =>
    applyDecorators(
      ApiOperation({ summary: "Get MyMonitor aggregated statistics" }),
      ApiResponse({
        status: 200,
        description: "MyMonitor statistics",
        type: Object,
      }),
      HttpCode(200)
    ),

  getTotalsData: () =>
    applyDecorators(
      ApiOperation({
        summary: "Get total observatory-style data including all systems",
      }),
      ApiResponse({
        status: 200,
        description: "Complete observatory-style statistics for all systems (observatory + mymonitor + AMS)",
        type: Object,
      }),
      HttpCode(200)
    ),

  getTotalsPracticesData: () =>
    applyDecorators(
      ApiOperation({ summary: "Get totals practice table data" }),
      ApiResponse({
        status: 200,
        description: "Success - Returns practice table with accessibility test results",
      }),
      HttpCode(200)
    ),
};