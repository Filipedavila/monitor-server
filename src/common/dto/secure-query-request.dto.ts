
import { IsOptional, ValidateNested } from "class-validator";
import { BasePaginationDto } from "./base-pagination.dto";

export abstract class SecureResourceQueryDto<F  , S, P = BasePaginationDto> {
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