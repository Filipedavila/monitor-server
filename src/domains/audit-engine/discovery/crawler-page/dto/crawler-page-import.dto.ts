import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber } from 'class-validator';

export class CrawlerPageImportDTO {
  @ApiProperty({
    type: Number,
    description: 'IDs das crawlers pages para importação',
    example: [1],
  })
  @IsArray({ message: 'Os IDs do Crawler devem ser um array de números válidos.' })
  @ArrayMinSize(1, { message: 'Deve haver pelo menos um ID do Crawler.' })
  @IsNumber({}, { each: true, message: 'Cada ID do Crawler deve ser um número válido.' })
  @Type(() => Number)
  crawlerPageIds: number[];
}
