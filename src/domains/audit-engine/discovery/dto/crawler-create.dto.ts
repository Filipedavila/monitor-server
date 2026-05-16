import { Type } from "class-transformer";
import {
  IsArray,
  IsNumber,
  IsOptional,
  Min,
  IsInt,
  Max,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CrawlerCreateDTO {
  @ApiProperty({ default: 0 })
  @IsInt({ message: "maxDepth must be an integer" })
  @Min(0, { message: "maxDepth must be a non-negative integer" })
  @Type(() => Number)
  maxDepth: number = 0;

  @ApiProperty({ default: 9999 })
  @IsInt({ message: "maxPages must be an integer" })
  @Min(1, { message: "maxPages must be at least 1" })
  @Type(() => Number)
  maxPages: number = 9999;

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  websites_ids: number[] = [];

  @ApiProperty({ default: 0 })
  @IsInt({ message: "waitJS must be an integer" })
  @Min(0, { message: "waitJS must be a non-negative integer" })
  @Type(() => Number)
  waitJS: number = 0;

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray({ message: "tagsId must be an array" })
  @IsInt({ each: true, message: "each tagId must be an integer" })
  @Type(() => Number)
  tagsId?: number[];
}
