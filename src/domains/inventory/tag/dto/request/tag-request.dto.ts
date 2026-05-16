import { IsOptional, ValidateNested } from "class-validator";
import { ResourceQueryDto } from "src/common/dto/request/query-request.dto";
import { TagFilterDTO } from "./tag-filter.dto";
import { TagSortDTO } from "./tag-sort.dto";
import { TagPaginationDTO } from "./tag-pagination.dto";
import { Tag } from "../../tag.entity";
export class TagRequestDTO extends ResourceQueryDto<Tag, TagFilterDTO, TagSortDTO, TagPaginationDTO> {

      @IsOptional()
      @ValidateNested()
      filters: TagFilterDTO;

      @IsOptional()
      @ValidateNested()
      sorts: TagSortDTO;
    
      @IsOptional()
      @ValidateNested()
      pagination: TagPaginationDTO;
  
}
  