import { IsOptional, ValidateNested } from "class-validator";
import { ResourceQueryDto } from "src/common/dto/request/query-request.dto";
import { EvaluationFilterDTO } from "./evaluation-filter.dto";
import { EvaluationSortDTO } from "./evaluation-sort.dto";
import { EvaluationPaginationDTO } from "./evaluation-pagination.dto";

export class EvaluationRequestDTO {

      @IsOptional()
      @ValidateNested()  
      filters?: EvaluationFilterDTO;

      @IsOptional()
      @ValidateNested()
      sorts?: EvaluationSortDTO;
    
      @IsOptional()
      @ValidateNested()
      pagination?: EvaluationPaginationDTO;
  
}
  