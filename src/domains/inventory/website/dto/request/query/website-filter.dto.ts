import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import { BaseFilterDTO } from 'src/common/dto/request/base-filter.dto';
import { Website } from '../../../website.entity';

export class WebsiteFilterDTO
  extends BaseFilterDTO<Website>
  implements Pick<Website, 'title' | 'baseUrl' | 'institutionId'>
{
  @IsOptional()
  @IsString({ message: 'Title must be a valid string.' })
  @MinLength(1, { message: 'Title cannot be empty.' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Base URL must be a valid string.' })
  baseUrl: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Institution ID must be an integer.' })
  @IsPositive({ message: 'Institution ID must be a positive number.' })
  institutionId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Directory ID must be an integer.' })
  @IsPositive({ message: 'Directory ID must be a positive number.' })
  directoryId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Tag ID must be an integer.' })
  @IsPositive({ message: 'Tag ID must be a positive number.' })
  tagId: number;

  @IsOptional()
  @IsString({ message: 'Search term must be a valid string.' })
  @MinLength(4, { message: 'Search term must be at least 4 characters long.' })
  searchTerm: string;
}
