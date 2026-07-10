import { IsOptional, ValidateNested } from "class-validator";
import { UserFilterDTO } from "./user-filter.dto";

import {  Type } from "class-transformer";
import { UserSortDTO } from "./user-sort.dto";
import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";

//1?filters[username]=user1&sorts[createdAt]=DESC&sorts[updatedAt]=DESC&pagination[limit]=5&pagination[page]=1
export class UserQueryDTO {
  @IsOptional()
  @ValidateNested()
  @Type(() => UserFilterDTO)
  filters!: UserFilterDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserSortDTO) 
  sorts!: UserSortDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => BasePaginationDTO)
  pagination: BasePaginationDTO;
}