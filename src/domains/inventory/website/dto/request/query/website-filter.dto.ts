import {
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  IsArray,
} from "class-validator";
import { Website } from "../../../website.entity";
import { BaseFilterDTO } from "src/common/dto/request/base-filter.dto";

export class WebsiteFilterDTO
  extends BaseFilterDTO<Website>
  implements  Pick<Website, 'title' | 'baseUrl' | 'isInObservatory'>
{
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  baseUrl: string;

  @IsBoolean()
  @IsOptional()
  isInObservatory: boolean;
}
