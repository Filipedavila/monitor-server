import { Type } from "class-transformer";
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from "class-validator";


export class SortItem {
  @IsString()
  field: string; 

  @IsString()
  @IsIn(["ASC", "DESC", "asc", "desc"])
  order: "ASC" | "DESC" | "asc" | "desc";
}
export abstract class BaseSortDto<T> {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortItem)
  sortItems?: SortItem[];


  abstract getAllowedFields(): string[];

  toSafeOrder(): Record<string, "ASC" | "DESC"> {
    const allowed = this.getAllowedFields();
    return (this.sortItems || []).reduce((acc, item) => {
      if (allowed.includes(item.field)) {
        acc[item.field] = item.order.toUpperCase() as "ASC" | "DESC";
      }
      return acc;
    }, {});
  }
}