import { IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CrawlerFilterDTO } from "./crawler-filter.dto";
import { CrawlerSortDTO } from "./crawler-sort.dto";
import { CrawlerPaginationDTO } from "./crawler-pagination.dto";

export class CrawlerRequestDTO {
  @IsOptional()
  @ValidateNested()
  @Type(() => CrawlerFilterDTO)
  filters: CrawlerFilterDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => CrawlerSortDTO)
  sorts?: CrawlerSortDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => CrawlerPaginationDTO)
  pagination?: CrawlerPaginationDTO;
}
