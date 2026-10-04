import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CrawlerPageDTO {
  @ApiProperty({
    description: 'O ID da página do crawler',
    example: 456,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'O ID do crawler para filtrar os resultados',
    example: 123,
  })
  @Expose()
  crawlerId: number;

  @ApiProperty({
    description: 'A URL da página do crawler',
    example: 'https://example.com/page',
  })
  @Expose()
  url: string;
}
