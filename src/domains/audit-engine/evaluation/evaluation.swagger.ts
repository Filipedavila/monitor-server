import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { Evaluation } from './entities/evaluation.entity';
import { EvaluationQueryDTO } from './dto/request/evaluation-request.dto';
import { EvaluationTriggerDTO } from './dto/evaluation-trigger.dto';

export const EvaluationDocs = {
  controller: () =>
    applyDecorators(
      ApiBearerAuth(),
      ApiTags('evaluations'),
      ApiResponse({ status: 403, description: 'Forbidden' }),
    ),

  findAll: () =>
    applyDecorators(
      ApiOperation({ summary: 'Get all evaluations that you are authorized to view' }),
      ApiQuery({ type: EvaluationQueryDTO }),
    ),

  findOne: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get a specific evaluation result',
      }),
      ApiResponse({
        status: 200,
        description: 'Evaluation retrieved successfully',
        type: Evaluation,
      }),
      ApiResponse({ status: 404, description: 'Evaluation not found' }),
    ),

  findPageEvaluationDetails: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get evaluation details (JSON or HTML) for a specific page',
      }),
      ApiResponse({
        status: 200,
        description: 'Evaluation details streamed successfully',
      }),
      ApiResponse({ status: 404, description: 'Evaluation not found' }),
    ),

  uploadExternalEvaluation: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'Upload external evaluation results from the AccessMonitor Extension on My Monitor',
      }),
      ApiResponse({
        status: 201,
        description: 'External evaluation uploaded successfully',
        type: Evaluation,
      }),
      ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ),

  evaluate: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Trigger an evaluation for the given targets',
      }),
      ApiBody({ type: EvaluationTriggerDTO }),
      ApiResponse({
        status: 201,
        description: 'Evaluation triggered successfully',
      }),
      ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ),

  delete: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Delete a specific evaluation',
      }),
      ApiResponse({
        status: 200,
        description: 'Evaluation deleted successfully',
      }),
      ApiResponse({ status: 404, description: 'Evaluation not found' }),
    ),
};
