import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response } from 'express';
import { DbUniqueConstraint, UNIQUE_CONSTRAINT_MAPPINGS } from './db-unique-constraints.type';

const POSTGRES_UNIQUE_VIOLATION_CODE = '23505';
const POSTGRES_FOREIGN_KEY_VIOLATION_CODE = '23503'; // <-- Código para FK violations

@Catch(QueryFailedError)
export class DbConstraintExceptionFilter implements ExceptionFilter {
  catch(
    exception: QueryFailedError & { code?: string; detail?: string; constraint?: string },
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // 1. Tratamento de Unique Constraints (23505)
    if (exception.code === POSTGRES_UNIQUE_VIOLATION_CODE) {
      const detail = exception.detail || '';
      const mapConflict: Record<string, string> = {};
      const constraints = Object.values(DbUniqueConstraint) as DbUniqueConstraint[];

      for (const constraint of constraints) {
        if (detail.includes(constraint)) {
          const mapping = UNIQUE_CONSTRAINT_MAPPINGS[constraint];
          mapConflict[mapping.property] = mapping.message;
        }
      }

      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: 'Duplicate key value violates unique constraint',
        errors: mapConflict,
      });
    }

    // 2. Tratamento de Foreign Key Constraints (23503)
    if (exception.code === POSTGRES_FOREIGN_KEY_VIOLATION_CODE) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'A referenced entity (foreign key) does not exist or cannot be modified.',
        constraint: exception.constraint || 'unknown_fk',
      });
    }

    // 3. Fallback genérico para outras falhas de base de dados
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
