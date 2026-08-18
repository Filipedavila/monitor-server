import {  BaseFilterDTO } from "src/common/dto/request/base-filter.dto";
import {
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  
  IsUrl,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { CrawlerPage } from "../../../crawler-page/crawler-page.entity";

export class CrawlerPageFilterDTO
  extends BaseFilterDTO<CrawlerPage>
   implements Pick<CrawlerPage,  | 'url' | 'crawlerWebsiteId' >{


  @IsOptional()
  @Type(() => String)
  @IsUrl({},{message:""})
  url: string;

  @IsOptional()
  @Type(() => Number)
  crawlerWebsiteId: number;


}
