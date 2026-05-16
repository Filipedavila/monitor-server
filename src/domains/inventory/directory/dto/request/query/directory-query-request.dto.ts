import { IsOptional, ValidateNested } from "class-validator";
import { DirectoryFilterDTO } from "./directory-filter.dto";
import { DirectorySortDTO } from "./directory-sort.dto";
import { DirectoryPaginationDTO } from "./directory-pagination.dto";
import { Directory } from "../../../directory.entity";
import { ResourceQueryDto } from "src/common/dto/request/query-request.dto";

export class DirectoryQueryRequestDTO extends ResourceQueryDto<Directory, DirectoryFilterDTO, DirectorySortDTO, DirectoryPaginationDTO> {
  @IsOptional()
  @ValidateNested()
  filters: DirectoryFilterDTO ;

  @IsOptional()
  @ValidateNested()
  sorts: DirectorySortDTO;

  @IsOptional()
  @ValidateNested()
  pagination: DirectoryPaginationDTO;
}
