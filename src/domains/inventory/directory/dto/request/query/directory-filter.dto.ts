import {
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  IsArray,
} from "class-validator";
import { BaseFilterDTO } from "src/common/dto/request/base-filter.dto";
import { Directory } from "../../../directory.entity";

export class DirectoryFilterDTO
  extends BaseFilterDTO<Directory>
  implements  Pick<Directory, 'id' | 'name'  | 'showInObservatory'>
{
  @IsNumber()
  @IsOptional()
  id: number;
  
  @IsString()
  @IsOptional()
  name: string;


  @IsBoolean()
  @IsOptional()
  showInObservatory: boolean;

  @IsString()
  @IsOptional()
  searchTerm: string;

}
