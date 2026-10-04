import { BaseFilterDTO } from "src/common/dto/request/base-filter.dto";
import { Evaluation } from "../../entities/evaluation.entity";
import {  IsEnum, IsNumber, IsOptional, IsString } from "class-validator";



export class EvaluationFilterDTO extends BaseFilterDTO<Evaluation> implements Required<Pick<Evaluation,  'pageTitle' | 'score' | 'A' | 'AA' | 'AAA'  | 'tagCount'>> {

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
  @IsNumber()
  tagCount: number;
  
}
