import { Expose, Type } from 'class-transformer';
import { CrawlerPageDTO } from './crawler-page.dto';

export class CrawlPagesResponseDTO {
  @Expose()
  @Type(() => CrawlerPageDTO)
  data: CrawlerPageDTO[];

  @Expose()
  meta: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
  };
}
