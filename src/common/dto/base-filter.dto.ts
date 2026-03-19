import { IsOptional, IsInt, IsArray, ArrayMinSize } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class BaseFilterDto {
  @IsOptional()
  @Transform(({ value }) => {
    const rawValues = Array.isArray(value) ? value : [value];

    const cleanNumbers = rawValues
                        .map(v => Number(v))
                        .filter(v => !isNaN(v) && v > 0); 

    return [...new Set(cleanNumbers)];
  })  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  @Type(() => Number)
  ids?: number[];

}