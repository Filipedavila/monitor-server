import { IsOptional, ValidateNested } from "class-validator";
      import { ResourceQueryDto } from "src/common/dto/request/query-request.dto";
import { OrganizationFilterDTO } from "./organization-filter.dto";
import {  OrganizationSortDTO } from "./organization-sort.dto";
import { OrganizationPaginationDTO } from "./organization-pagination.dto";
import { Organization } from "../../organization.entity";

export class OrganizationRequestDTO  extends ResourceQueryDto<Organization,OrganizationFilterDTO, OrganizationSortDTO, OrganizationPaginationDTO> {

      @IsOptional()
      @ValidateNested()  
      filters?: OrganizationFilterDTO;

      @IsOptional()
      @ValidateNested()
      sorts?: OrganizationSortDTO;  
    
      @IsOptional()
      @ValidateNested()
      pagination: OrganizationPaginationDTO;
  
}
  