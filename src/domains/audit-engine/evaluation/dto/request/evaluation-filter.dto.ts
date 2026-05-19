import { BaseFilterDTO } from "src/common/dto/request/base-filter.dto";
import { Evaluation, EvaluationContext } from "../../entities/evaluation.entity";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class EvaluationFilterDTO extends BaseFilterDTO<Evaluation> implements Required<Pick<Evaluation, 'pageId' | 'pageTitle' | 'score' | 'A' | 'AA' | 'AAA' | 'context' | 'tagCount'>> {
  @IsOptional()
  @IsNumber()
  pageId: number;

  @IsOptional()
  @IsString()
  pageTitle: string;

  @IsOptional()
  @IsString()
  score: string;

  @IsOptional()
  @IsNumber()
  A: number;

  @IsOptional()
  @IsNumber()
  AA: number;

  @IsOptional()
  @IsNumber()
  AAA: number;

  @IsOptional()
  @IsString()
  context: EvaluationContext;


  @IsOptional()
  @IsNumber()
  tagCount: number;

}
