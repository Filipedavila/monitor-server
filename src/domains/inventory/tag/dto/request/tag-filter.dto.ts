import { BaseFilterDTO } from "src/common/dto/request/base-filter.dto";
import { IsArray, IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { Tag} from "../../tag.entity";
import { ContextEnum } from "src/domains/inventory/context/context.enum";

export class TagFilterDTO extends BaseFilterDTO<Tag> implements Partial<Pick<Tag, 'id' | 'name' | 'createdAt' | 'createdById' | 'updatedAt'>> {

  @IsOptional()
  @IsNumber({},{ message: "id must be a number" })
  id?: number;

  @IsOptional()
  @IsString({ message: "name must be a string" })
  name?: string;

  @IsOptional()
  @IsDate( { message: "createdAt must be a valid date" })
  createdAt?: Date;

  @IsOptional()
  @IsArray({message: "websites must be an array of numbers"})
  @IsNumber({}, { each: true, message: "each website must be a number" })
  websites?: number[];


  @IsOptional()
  @IsArray({message: "directories must be an array of numbers"})
  @IsNumber({}, { each: true, message: "each directory must be a number" })
  directories?: number[];

  @IsOptional()
  @IsEnum(ContextEnum, { message: "context must be a valid TagContext" })
  context: ContextEnum;

  @IsOptional()
  @IsString({ message: "searchTerm must be a string" })
  searchTerm?: string;
}
