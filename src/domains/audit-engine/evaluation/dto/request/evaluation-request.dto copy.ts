import { IsOptional, ValidateNested } from "class-validator";
import { EvaluationFilterDTO } from "./evaluation-filter.dto";
import { EvaluationSortDTO } from "./evaluation-sort.dto";
import { EvaluationPaginationDTO } from "./evaluation-pagination.dto";
import { Type } from "class-transformer";

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
  