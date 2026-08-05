import { IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CrawlerPageFilterDTO } from "./crawler-filter.dto";
import { CrawlerSortDTO } from "./crawler-sort.dto";
import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";

export class CrawlerRequestDTO {
  @IsOptional()
  @ValidateNested()
  @Type(() => CrawlerPageFilterDTO)
  filters: CrawlerPageFilterDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => CrawlerSortDTO)
  sorts?: CrawlerSortDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => BasePaginationDTO)
  pagination: BasePaginationDTO;
}
