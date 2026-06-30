import { IsArray, IsEnum, IsNotEmpty, IsOptional, ValidateNested } from "class-validator";
import { EvaluationFilterDTO } from "./evaluation-filter.dto";
import { EvaluationSortDTO } from "./evaluation-sort.dto";
import {  Type } from "class-transformer";
import { ContextEnum } from "src/domains/inventory/context/context.enum";
import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";

//1?filters[pageId]=1&sorts[createdAt]=DESC&sorts[updatedAt]=DESC&pagination[limit]=5&pagination[page]=1
export class EvaluationQueryDTO {
  @IsOptional()
  @ValidateNested()
  @Type(() => EvaluationFilterDTO)
  filters: EvaluationFilterDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvaluationSortDTO) 
  sorts: EvaluationSortDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => BasePaginationDTO)
  pagination: BasePaginationDTO;

  @IsNotEmpty({ message: "Contexts are required" })
  @IsArray({message: "Contexts must be an array"})
  @IsEnum(ContextEnum, { each: true, message: "Each context must be a valid Context Enum value." })
  contexts!: ContextEnum[];
}