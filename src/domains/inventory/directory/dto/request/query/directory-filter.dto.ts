import { IsOptional, IsNumber, IsBoolean, IsString } from 'class-validator';
import { BaseFilterDTO } from 'src/common/dto/request/base-filter.dto';
import { Directory } from '../../../directory.entity';

export class DirectoryFilterDTO
  extends BaseFilterDTO<Directory>
  implements Pick<Directory, 'id' | 'name' | 'isInObservatory'>
{
  @IsNumber()
  @IsOptional()
  id: number;

  @IsString()
  @IsOptional()
  name: string;

  @IsBoolean()
  @IsOptional()
  isInObservatory: boolean;

  @IsString()
  @IsOptional()
  searchTerm: string;
}
