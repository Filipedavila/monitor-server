import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

export const AnalyticsDocs = {
  controller: () =>
    applyDecorators(
      ApiTags('analytics'),
      ApiBearerAuth(),
      ApiResponse({
        status: 401,
        description: 'Unauthorized - Missing or invalid JWT token',
      }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - Insufficient permissions or role mismatch (FGA / RBAC)',
      }),
    ),

  getOverview: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get platform-wide admin overview metrics',
        description:
          'Aggregates macro operational metrics across AMS, Observatory, MyMonitor and AccessMonitor platforms.',
      }),
      ApiResponse({
        status: 200,
        description: 'Global analytics overview metrics retrieved successfully',
      }),
    ),

  getGlobalMetrics: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get system-wide global telemetry and evaluation counts',
        description:
          'Retrieves high-level counts including processed, waiting and failed evaluations.',
      }),
      ApiResponse({
        status: 200,
        description: 'Global metrics calculated successfully',
      }),
    ),

  exportAnalytics: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Export analytics dataset as a streamable file',
        description:
          'Streams aggregated data chunked on-the-fly based on selected context and file format (e.g., CSV, JSON, XLSX).',
      }),
      ApiParam({
        name: 'context',
        required: true,
        description: 'Analytical scope context to export',
        example: 'observatory',
      }),
      ApiParam({
        name: 'format',
        required: true,
        description: 'Export serialization file format',
        example: 'csv',
      }),
      ApiProduces(
        'text/csv',
        'application/json',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/octet-stream',
      ),
      ApiResponse({
        status: 200,
        description: 'File stream successfully initiated (Transfer-Encoding: chunked)',
        schema: {
          type: 'string',
          format: 'binary',
        },
      }),
      ApiResponse({
        status: 400,
        description: 'Invalid export context or unsupported file format',
      }),
    ),
};
