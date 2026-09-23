import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsNotEmpty, Min, ValidateIf } from 'class-validator';

export enum EvaluationTriggerType {
  GLOBAL = 'GLOBAL',
  DIRECTORY = 'DIRECTORY',
  INSTITUTION = 'INSTITUTION',
  TAGS = 'TAGS',
  WEBSITE = 'WEBSITE',
  PAGE = 'PAGE',
}

const TARGETED_TRIGGER_TYPES = [
  EvaluationTriggerType.DIRECTORY,
  EvaluationTriggerType.INSTITUTION,
  EvaluationTriggerType.TAGS,
  EvaluationTriggerType.WEBSITE,
  EvaluationTriggerType.PAGE,
] as const;

export class EvaluationTriggerDTO {
  @IsNotEmpty()
  @IsEnum(EvaluationTriggerType, {
    message: `triggerType must be one of: ${Object.values(EvaluationTriggerType).join(', ')}`,
  })
  triggerType!: EvaluationTriggerType;

  @ValidateIf((dto: EvaluationTriggerDTO) =>
    (TARGETED_TRIGGER_TYPES as readonly string[]).includes(dto.triggerType),
  )
  @IsNotEmpty({ message: 'targetIds should not be empty' })
  @IsArray({ message: 'targetIds must be an array of numbers' })
  @ArrayMinSize(1, { message: 'targetIds must contain at least one target id' })
  @Type(() => Number)
  @IsInt({ each: true, message: 'Each targetId must be an integer' })
  @Min(1, { each: true, message: 'Each targetId must be at least 1' })
  targetIds?: number[];
}
