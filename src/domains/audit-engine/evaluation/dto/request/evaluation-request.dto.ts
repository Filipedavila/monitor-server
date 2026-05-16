import { IsOptional, ValidateNested } from "class-validator";
import { EvaluationFilterDTO } from "./evaluation-filter.dto";
import { EvaluationSortDTO } from "./evaluation-sort.dto";
import { EvaluationPaginationDTO } from "./evaluation-pagination.dto";
import {  Type } from "class-transformer";

//1?filters.pageId=1&sorts[createdAt]=DESC&sorts[score]=ASC&pagination.limit=5&pagination.page=1
export class EvaluationQueryDTO {
  @IsOptional()
  @ValidateNested()
  @Type(() => EvaluationFilterDTO)
  filters?: EvaluationFilterDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvaluationSortDTO) 
  sorts?: EvaluationSortDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvaluationPaginationDTO)
  pagination?: EvaluationPaginationDTO;
}