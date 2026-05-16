import { IsIn, IsOptional, ValidateNested } from "class-validator";
import { BaseSortDto, SortItem } from "src/common/dto/request/base-sort.dto";
import { Type, Transform } from "class-transformer";
import { Website } from "../../../website.entity";
export class WebsiteSortItem extends SortItem {
  @IsIn(["id", "tagId", "tagName", "websiteId", "isDone", "createdAt"])
  declare field: string;

  @IsIn(["ASC", "DESC", "asc", "desc"])
  declare order: "ASC" | "DESC" | "asc" | "desc";
}

export class WebsiteSortDTO extends BaseSortDto<Website> {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WebsiteSortItem)
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
