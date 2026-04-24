import { BaseFilterDto as BaseFilterDTO } from "src/common/dto/base-filter.dto";
import {
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  IsArray,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { WebsiteCrawlerFilter } from "src/domains/audit-engine/discovery/repositories/crawler-website.repository";

export class WebsiteFilterDTO
  extends BaseFilterDTO
  implements Partial<Record<keyof WebsiteCrawlerFilter, any>>
{
  @IsNumber()
  @Type(() => Number)
  tagIsssd?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tagId?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  tagsId?: number[];

  @IsOptional()
  @IsString()
  tagName?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  websiteId?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isDone?: boolean;

  @IsOptional()
  @IsString()
  searchTerm?: string;
}
