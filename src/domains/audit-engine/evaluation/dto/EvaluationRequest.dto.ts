import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional } from "class-validator";
export class EvaluationRequestDTO {

  @IsInt()
  websiteId: number;

  @IsArray()
  @IsInt({ each: true })
  pagesIds: number[];

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  userId?: number;
}
