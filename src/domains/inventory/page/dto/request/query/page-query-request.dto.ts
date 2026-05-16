import { IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { PageFilterDTO } from "./page-filter.dto";
import { PageSortDTO } from "./page-sort.dto";
import { PagePaginationDTO } from "./page-pagination.dto";
import { ResourceQueryDto } from "src/common/dto/request/query-request.dto";
import { Page } from "../../../page.entity";


export class PageQueryRequestDTO extends ResourceQueryDto<Page ,PageFilterDTO, PageSortDTO, PagePaginationDTO> {
  @IsOptional()
  @ValidateNested()
  @Type(() => PageFilterDTO)
  filters: PageFilterDTO = {};

  @IsOptional()
  @ValidateNested()
  @Type(() => PageSortDTO)
  sorts: PageSortDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => PagePaginationDTO)
  pagination: PagePaginationDTO;
}
