import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { FieldConflictException } from 'src/common/exceptions/conflict.exception';

@Catch(FieldConflictException)
export class FieldConflictExceptionFilter implements ExceptionFilter {
  catch(exception: FieldConflictException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    
    const exceptionResponse = exception.getResponse() as any;

    const responseBody: Record<string, any> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      conflict:  typeof exceptionResponse === 'object' ? exceptionResponse.message : exceptionResponse,
    };

    if (exceptionResponse && typeof exceptionResponse === 'object' && 'fields' in exceptionResponse) {
      responseBody.fields = exceptionResponse.fields;
    }

    response.status(status).json(responseBody);
  }
}