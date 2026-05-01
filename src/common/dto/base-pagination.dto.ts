import {
  IsOptional,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { PAGINATION_CONFIG } from "../constants/pagination.constants";


export class BasePaginationDTO<T> {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION_CONFIG.MAX_LIMIT)
  limit?: number = PAGINATION_CONFIG.DEFAULT_LIMIT;
}
