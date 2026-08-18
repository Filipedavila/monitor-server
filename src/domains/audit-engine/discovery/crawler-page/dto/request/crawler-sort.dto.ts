import { IsIn, IsOptional, ValidateNested } from "class-validator";
import { BaseSortDto, SortItem } from "src/common/dto/request/base-sort.dto";
import { Type, Transform } from "class-transformer";
import { CrawlerPage } from "../../crawler-page.entity";
export class WebsiteSortItem extends SortItem {
  @IsIn(["id", "url", "tagName", "websiteId", "isDone", "createdAt"])
  declare field: string;

  @IsIn(["ASC", "DESC", "asc", "desc"])
  declare order: "ASC" | "DESC" | "asc" | "desc";
}

export class CrawlerSortDTO extends BaseSortDto<CrawlerPage> {
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
    return ["id", "baseUrl","createdAt", "updatedAt"];
  }
}
