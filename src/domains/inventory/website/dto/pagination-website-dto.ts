import { IsOptional, IsInt, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class PaginationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size: number = 50;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  page: number = 0;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  direction?: "asc" | "desc";

  @IsOptional()
  @IsString()
  search?: string;
}
