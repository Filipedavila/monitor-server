import { BaseFilterDTO } from "src/common/dto/request/base-filter.dto";
import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";
import { Tag } from "../../tag.entity";

export class TagFilterDTO extends BaseFilterDTO<Tag> implements Partial<Pick<Tag, 'id' | 'name' | 'createdAt' | 'createdById' | 'updatedAt'>> {

  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @IsOptional()
  @IsNumber()
  createdById?: number;
  
  @IsOptional()
  @IsDate()
  updatedAt?: Date;

  @IsOptional()
  @IsDate()
  createdAtFrom?: Date;

  @IsOptional()
  @IsDate()
  createdAtTo?: Date;
  
  @IsOptional()
  @IsDate()
  updatedAtFrom?: Date;

  @IsOptional()
  @IsDate()
  updatedAtTo?: Date; 



}
