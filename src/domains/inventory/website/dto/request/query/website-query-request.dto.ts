import { IsOptional, ValidateNested } from "class-validator";
import { WebsiteFilterDTO } from "./website-filter.dto";
import { WebsiteSortDTO } from "./website-sort.dto";
import { WebsitePaginationDTO } from "./website-pagination.dto";

export class WebsiteQueryRequestDTO {
  @IsOptional()
  @ValidateNested()
  filters: WebsiteFilterDTO ;

  @IsOptional()
  @ValidateNested()
  sorts?: WebsiteSortDTO;

  @IsOptional()
  @ValidateNested()
  pagination?: WebsitePaginationDTO;
}
