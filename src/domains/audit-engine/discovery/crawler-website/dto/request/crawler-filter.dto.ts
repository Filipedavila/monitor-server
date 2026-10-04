import { BaseFilterDTO } from 'src/common/dto/request/base-filter.dto';
import { IsOptional, IsNumber, IsUrl, IsEnum, IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { CrawlerStatus, CrawlerWebsite } from '../../entities/crawler-website.entity';
import { CrawlerPage } from '../../../crawler-page/crawler-page.entity';

export class CrawlerFilterDTO
  extends BaseFilterDTO<CrawlerWebsite>
  implements Pick<CrawlerWebsite & CrawlerPage, 'websiteId' | 'status'>
{
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id: number;
  @IsOptional()
  @Type(() => Number)
  websiteId: number;

  @IsOptional()
  @IsUrl()
  baseUrl: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxDepth?: number;

  @IsOptional()
  @IsString({ message: 'searchTerm must be a string' })
  @IsString({ message: 'searchTerm must be a string' })
  @Length(3, 255, { message: 'searchTerm must be between 3 and 255 characters' })
  searchTerm: string;

  @IsOptional()
  @IsEnum(CrawlerStatus, {
    message: 'Invalid status - only accepts status: ' + Object.values(CrawlerStatus).join(', '),
  })
  status: CrawlerStatus;
}
