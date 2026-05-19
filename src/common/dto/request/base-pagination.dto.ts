import {
  IsOptional,
  IsInt,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { IsMaxOffsetLimit } from "src/core/validators/max-limit-pag.validator";


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
  @IsMaxOffsetLimit()
  limit?: number = 100;
}
