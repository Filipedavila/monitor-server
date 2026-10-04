import { Type } from 'class-transformer';
import { IsArray, Min, IsInt, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CrawlerWebsiteImportDTO {
  @ApiProperty({ type: [Number], required: true })
  @IsArray({ message: 'crawlerIds must be an array' })
  @ArrayMinSize(1, { message: 'crawlerIds must contain at least one element' })
  @Min(1, { each: true, message: 'crawlerIds must be at least 1' })
  @IsInt({ each: true })
  @Type(() => Number)
  crawlerIds: number[];
}
