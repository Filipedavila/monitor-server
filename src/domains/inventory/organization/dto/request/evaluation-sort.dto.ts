import { BaseSortDto } from "src/common/dto/request/base-sort.dto";
import { Evaluation } from "src/domains/audit-engine/evaluation/entities/evaluation.entity"; 
import { IsIn, IsString, ValidateNested, IsOptional, IsArray } from "class-validator";
import { Type } from "class-transformer";

export class EvaluationSortItem {
  @IsIn(["id", "pageId", "context", "createdAt", "updatedAt"])
  @IsString()
  field: keyof Evaluation; 

  @IsIn(["ASC", "DESC", "asc", "desc"])
  @IsString()
  order: "ASC" | "DESC" | "asc" | "desc";
}
export class EvaluationSortDTO extends BaseSortDto<Evaluation> {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationSortItem) 
  sorts?: EvaluationSortItem[];
    getAllowedFields(): (keyof Evaluation)[] {
        return ["id", "pageId", "context", "createdAt", "updatedAt"];
    }
}