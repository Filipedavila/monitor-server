import {
  IsOptional,
  IsNumber,
  IsString
} from "class-validator";
import { Website } from "../../../website.entity";
import { BaseFilterDTO } from "src/common/dto/request/base-filter.dto";

export class WebsiteFilterDTO
  extends BaseFilterDTO<Website>
  implements  Pick<Website, 'title' | 'baseUrl' | 'institutionId' >
{
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  baseUrl: string;

  @IsOptional()
  @IsNumber()
  institutionId: number;


  @IsString()
  @IsOptional()
  searchTerm: string;
}
