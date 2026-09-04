import {  BaseFilterDTO } from "src/common/dto/request/base-filter.dto";
import {
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  IsArray,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { WebsiteCrawlerFilter } from "src/domains/audit-engine/discovery/crawler-website/crawler-website.repository";
import { Page } from "../../../page.entity";

export class PageFilterDTO
  extends BaseFilterDTO<Page>
  implements Partial<Record<keyof Page, any>>
{

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
