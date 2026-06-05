import { ConflictException } from '@nestjs/common';

export class FieldConflictException extends ConflictException {
  constructor(fields: Record<string, string>) {
    super({
      statusCode: 409,
      error: 'Conflict',
      message: 'One or more fields already exist.',
      fields: Object.entries(fields).map(([name, reason]) => ({
        name,
        reason,
      })),
    });
  }
}