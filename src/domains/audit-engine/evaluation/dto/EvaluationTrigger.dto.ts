import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, Min, ValidateIf } from 'class-validator';
export class EvaluationTriggerDTO {
  @IsNotEmpty()
  @IsEnum(['GLOBAL', 'DIRECTORY', 'INSTITUTION', 'TAGS', 'WEBSITE'])
  triggerType: string;

  @ValidateIf((dto: EvaluationTriggerDTO) =>
    ['DIRECTORY', 'INSTITUTION', 'TAGS', 'WEBSITE'].includes(dto.triggerType),
  )
  @IsNotEmpty({ message: 'targetIds should not be empty' })
  @IsArray({ message: 'targetIds must be an array of numbers' })
  @Type(() => Number)
  @IsInt({ each: true, message: 'Each targetId must be an integer' })
  @Min(1, { each: true, message: 'Each targetId must be at least 1' })
  targetIds: number[];
}
