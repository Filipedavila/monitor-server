import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBasicAuth 
} from "@nestjs/swagger";
import { Observatory } from "./observatory.entity";

export const ObservatoryDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("observatory"),
      ApiBasicAuth(),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  findAll: () =>
    applyDecorators(
      ApiOperation({ summary: "Get all observatory data" }),
      ApiResponse({ status: 200, description: "Success", type: Observatory }),
      HttpCode(200)
    ),

  getData: () =>
    applyDecorators(
      ApiOperation({ summary: "Get latest observatory data" }),
      ApiResponse({ status: 200, description: "Success", type: Observatory }),
      HttpCode(200)
    ),

  generateData: () =>
    applyDecorators(
      ApiOperation({ summary: "Generate observatory data" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(204)
    ),

  getSyncStatus: () =>
    applyDecorators(
      ApiOperation({ summary: "Get current sync status" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  isSyncRunning: () =>
    applyDecorators(
      ApiOperation({ summary: "Check if sync is running" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  getCurrentRunningSyncStatus: () =>
    applyDecorators(
      ApiOperation({ summary: "Get current running sync status with progress" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),
};