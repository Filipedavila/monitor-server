import { IsOptional, ValidateNested } from "class-validator";
      import { ResourceQueryDto } from "src/common/dto/request/query-request.dto";
import { InstitutionFilterDTO } from "./institution-filter.dto";
import {  InstitutionSortDTO } from "./institution-sort.dto";
import { Institution } from "../../institution.entity";
import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";

export class InstitutionRequestDTO  extends ResourceQueryDto<Institution,InstitutionFilterDTO, InstitutionSortDTO, BasePaginationDTO> {

      @IsOptional()
      @ValidateNested()  
      filters?: InstitutionFilterDTO;

      @IsOptional()
      @ValidateNested()
      sorts?: InstitutionSortDTO;  
    
      @IsOptional()
      @ValidateNested()
      pagination: BasePaginationDTO;
  
}
  