import { IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { WebsiteFilterDTO } from "./website-filter.dto";
import { WebsiteSortDTO } from "./website-sort.dto";
import { WebsitePaginationDTO } from "./website-pagination.dto";

export class CrawlerWebsiteRequestDTO {
  @IsOptional()
  @ValidateNested()
  @Type(() => WebsiteFilterDTO)
  filters: WebsiteFilterDTO = {};

  @IsOptional()
  @ValidateNested()
  @Type(() => WebsiteSortDTO)
  sorts?: WebsiteSortDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => WebsitePaginationDTO)
  pagination?: WebsitePaginationDTO;
}
