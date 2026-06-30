
import { IsOptional, ValidateNested } from "class-validator";
import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";
import { BaseSortDto } from "src/common/dto/request/base-sort.dto";
import { BaseFilter } from "../../interfaces/types";
import { BaseFilterDTO } from "./base-filter.dto";


export abstract class ResourceQueryDto<T = any, F = BaseFilterDTO<T>, S  = BaseSortDto<T>, P = BasePaginationDTO> {
  @IsOptional()
  @ValidateNested()
  abstract filters?: F;

  @IsOptional()
  @ValidateNested()
  abstract sorts?: S;

  @IsOptional()
  @ValidateNested()
  abstract pagination: P;
}