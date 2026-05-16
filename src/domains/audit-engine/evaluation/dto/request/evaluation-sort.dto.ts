import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class EvaluationSortDTO {
  private static readonly ALLOWED_FIELDS = ["id", "pageId", "context", "createdAt", "updatedAt", "score"];

  @IsOptional()
  @Transform(({ value }) => {

    const result: Record<string, 'ASC' | 'DESC'> = {};

    const items = Array.isArray(value) ? value : [value];

    items.forEach((item) => {
      if (typeof item === 'string' && item.includes(':')) {
        const [field, order] = item.split(':');
        
        if (EvaluationSortDTO.ALLOWED_FIELDS.includes(field)) {
          const normalizedOrder = order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
          result[field] = normalizedOrder;
        }
      }
    });

    return Object.keys(result).length > 0 ? result : undefined;
  })
  sorts?: Record<string, 'ASC' | 'DESC'>;
}