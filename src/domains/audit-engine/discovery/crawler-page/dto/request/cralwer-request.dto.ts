import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CrawlerPageFilterDTO } from './crawler-page-filter.dto';
import { CrawlerPageSortDTO } from './crawler-page-sort.dto';
import { BasePaginationDTO } from 'src/common/dto/request/base-pagination.dto';

export class CrawlerRequestDTO {
  @IsOptional()
  @ValidateNested()
  @Type(() => CrawlerPageFilterDTO)
  filters: CrawlerPageFilterDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => CrawlerPageSortDTO)
  sorts?: CrawlerPageSortDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => BasePaginationDTO)
  pagination: BasePaginationDTO;
}
