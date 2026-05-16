import { BaseSortDto } from "src/common/dto/request/base-sort.dto";
import { Evaluation } from "../../entities/evaluation.entity";
import { IsIn, IsString, ValidateNested, IsOptional, IsArray } from "class-validator";
import { Type } from "class-transformer";
type EvaluationSortableFields = "id" | "pageId" | "context" | "createdAt" | "updatedAt" | "score";
export class EvaluationSortItem {
  @IsIn(["id", "pageId", "context", "createdAt", "updatedAt","score"])
  @IsString()
  field: EvaluationSortableFields; 

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
        return ["id", "pageId", "context", "createdAt", "updatedAt","score"];
    }
}