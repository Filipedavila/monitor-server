import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      timestamp: new Date().toISOString(),
      error: typeof exceptionResponse === 'object' 
        ? (exceptionResponse as any).message 
        : exceptionResponse,
      path: ctx.getRequest().url,
    });
  }
}