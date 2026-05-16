import {  BaseFilterDTO } from "src/common/dto/request/base-filter.dto";
import {
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  
  IsUrl,
} from "class-validator";
import { Type } from "class-transformer";
import { WebsiteCrawlerFilter } from "src/domains/audit-engine/discovery/repositories/crawler-website.repository";
import { CrawlerWebsite } from "../../entities/crawler-website.entity";
import { CrawlerPage } from "../../entities/crawler-page.entity";

export class CrawlerFilterDTO
  extends BaseFilterDTO<CrawlerWebsite>
   implements Pick<CrawlerWebsite & CrawlerPage, 'tagId' | 'websiteId' | 'isDone' | 'url' | 'crawlWebsiteId' | 'url_hash'>{


  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tagId: number;

  @IsOptional()
  @Type(() => Number)
  websiteId: number;

  @IsOptional()
  @IsString()
  tagName?: string;

  @IsOptional()
  @IsUrl()
  baseUrl: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxDepth?: number;

  @IsOptional()
  @IsString()
  url: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  crawlWebsiteId: number;

  @IsOptional()
  @IsString()
  url_hash: string;

  @IsOptional()
  @IsBoolean()
  isDone: boolean;

}
