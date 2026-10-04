import { IsIn, IsOptional, ValidateNested } from "class-validator";
import { BaseSortDto, SortItem } from "src/common/dto/request/base-sort.dto";
import { Type, Transform } from "class-transformer";
import { Directory } from "../../../directory.entity";
export class DirectorySortItem extends SortItem {
  @IsIn(["id", "tagId", "tagName", "websiteId", "isDone", "createdAt"])
  declare field: string;

  @IsIn(["ASC", "DESC", "asc", "desc"])
  declare order: "ASC" | "DESC" | "asc" | "desc";
}

export class DirectorySortDTO extends BaseSortDto<Directory> {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DirectorySortItem)
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return value;
    return value.reduce((acc, item) => {
      if (item.field && item.order) {
        acc[item.field] = item.order.toUpperCase();
      }
      return acc;
    }, {});
  })
  declare readonly sort?: Record<string, "ASC" | "DESC">;

  getAllowedFields(): string[] {
    return ["id", "tagId", "tagName", "websiteId", "isDone", "createdAt"];
  }
}
