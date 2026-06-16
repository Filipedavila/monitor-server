import { BaseSortDto } from "src/common/dto/request/base-sort.dto";
import { IsIn, IsString, ValidateNested, IsOptional, IsArray } from "class-validator";
import { Type } from "class-transformer";
import { Organization } from "../../organization.entity";

export class OrganizationSortItem {
  @IsIn(["id", "shortName", "longName", "createdAt", "updatedAt"])
  @IsString()
  field: keyof Organization; 

  @IsIn(["ASC", "DESC", "asc", "desc"])
  @IsString()
  order: "ASC" | "DESC" | "asc" | "desc";
}
export class OrganizationSortDTO extends BaseSortDto<Organization> {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganizationSortItem) 
  sorts?: OrganizationSortItem[];
    getAllowedFields(): (keyof Organization)[] {
        return ["id", "shortName", "longName", "createdAt", "updatedAt"];
    }
}