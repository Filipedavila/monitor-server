import { IsOptional, ValidateNested } from "class-validator";
import { AccessibilityStatementFilterDTO } from "./accessibility-statement-filter.dto";

import {  Type } from "class-transformer";
import { AccessibilityStatementSortDTO } from "./accessibility-statement-sort.dto";
import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";

//1?filters[seal]=GOLD&sorts[createdAt]=DESC&sorts[updatedAt]=DESC&pagination[limit]=5&pagination[page]=1
export class AccessibilityStatementQueryDTO {
  @IsOptional()
  @ValidateNested()
  @Type(() => AccessibilityStatementFilterDTO)
  filters!: AccessibilityStatementFilterDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => AccessibilityStatementSortDTO) 
  sorts!: AccessibilityStatementSortDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => BasePaginationDTO)
  pagination: BasePaginationDTO;
}