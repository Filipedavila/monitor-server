import { BaseFilterDTO } from "src/common/dto/request/base-filter.dto";

import { IsNumber, IsOptional, IsString } from "class-validator";
import { Evaluation, EvaluationContext } from "src/domains/audit-engine/evaluation/entities/evaluation.entity";

export class EvaluationFilterDTO extends BaseFilterDTO<Evaluation> 
implements Partial<Pick<Evaluation, 'pageId' | 'pageTitle' | 'score' | 'A' | 'AA' | 'AAA' | 'context' | 'tagCount'>> {
  @IsOptional()
  @IsNumber()
  pageId?: number;

  @IsOptional()
  @IsString()
  pageTitle?: string;

  @IsOptional()
  @IsString()
  score?: string;

  @IsOptional()
  @IsNumber()
  A?: number;

  @IsOptional()
  @IsNumber()
  AA?: number;

  @IsOptional()
  @IsNumber()
  AAA?: number;

  @IsOptional()
  @IsString()
  context?: EvaluationContext;

  @IsOptional()
  @IsNumber()
  elementCount?: number;

  @IsOptional()
  @IsNumber()
  tagCount?: number;

}
