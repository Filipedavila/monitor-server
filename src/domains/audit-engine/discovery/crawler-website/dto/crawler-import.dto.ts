import { Type } from 'class-transformer';
import { IsArray, Min, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CrawlerImportDTO {
  @ApiProperty({ type: [Number], required: false })
  @IsArray({ message: 'crawlerIds must be an array' })
  @IsNotEmpty({ message: 'crawlerIds should not be empty' })
  @IsInt({ each: true, message: 'each crawlerId must be an integer' })
  @Type(() => Number)
  crawlerIds: number[];
}
