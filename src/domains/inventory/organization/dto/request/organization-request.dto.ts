import { IsOptional, ValidateNested } from "class-validator";
      import { ResourceQueryDto } from "src/common/dto/request/query-request.dto";
import { OrganizationFilterDTO } from "./organization-filter.dto";
import {  OrganizationSortDTO } from "./organization-sort.dto";
import { Organization } from "../../organization.entity";
import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";

export class OrganizationRequestDTO  extends ResourceQueryDto<Organization,OrganizationFilterDTO, OrganizationSortDTO, BasePaginationDTO> {

      @IsOptional()
      @ValidateNested()  
      filters?: OrganizationFilterDTO;

      @IsOptional()
      @ValidateNested()
      sorts?: OrganizationSortDTO;  
    
      @IsOptional()
      @ValidateNested()
      pagination: BasePaginationDTO;
  
}
  