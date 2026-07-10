import { IsOptional, ValidateNested } from "class-validator";
import { ResourceQueryDto } from "src/common/dto/request/query-request.dto";
import { TagFilterDTO } from "./tag-filter.dto";
import { TagSortDTO } from "./tag-sort.dto";
import { Tag } from "../../tag.entity";
import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";

export class TagRequestDTO extends ResourceQueryDto<Tag, TagFilterDTO, TagSortDTO, BasePaginationDTO> {

      @IsOptional()
      @ValidateNested()
      filters: TagFilterDTO;

      @IsOptional()
      @ValidateNested()
      sorts: TagSortDTO;
    
      @IsOptional()
      @ValidateNested()
      pagination: BasePaginationDTO;
  
}
  