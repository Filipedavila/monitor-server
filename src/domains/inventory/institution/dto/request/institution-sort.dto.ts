import { BaseSortDto } from "src/common/dto/request/base-sort.dto";
import { IsIn, IsString, ValidateNested, IsOptional, IsArray } from "class-validator";
import { Type } from "class-transformer";
import { Institution } from "../../institution.entity";

export class InstitutionSortItem {
  @IsIn(["id", "shortName", "longName", "createdAt", "updatedAt"])
  @IsString()
  field: keyof Institution; 

  @IsIn(["ASC", "DESC", "asc", "desc"])
  @IsString()
  order: "ASC" | "DESC" | "asc" | "desc";
}
export class InstitutionSortDTO extends BaseSortDto<Institution> {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstitutionSortItem) 
  sorts?: InstitutionSortItem[];
    getAllowedFields(): (keyof Institution)[] {
        return ["id", "shortName", "longName", "createdAt", "updatedAt"];
    }
}