import { BaseSortDto } from "src/common/dto/request/base-sort.dto";
import { IsIn, IsString, ValidateNested, IsOptional, IsArray } from "class-validator";
import { Type } from "class-transformer";
import { Tag } from "../../tag.entity";

export class TagSortItem {
  @IsIn(["id", "name", "createdAt", "createdById", "updatedAt", "context"])
  @IsString()
  field: keyof Tag; 

  @IsIn(["ASC", "DESC", "asc", "desc"])
  @IsString()
  order: "ASC" | "DESC" | "asc" | "desc";
}
export class TagSortDTO extends BaseSortDto<Tag> {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagSortItem) 
  sorts?: TagSortItem[];
    getAllowedFields(): (keyof Tag)[] {
        return ["id", "name", "createdAt", "createdById", "updatedAt", "context"];
    }
}