import { Expose } from 'class-transformer';

export class CrawlPageResponseDTO {
  @Expose()
  crawlerId: number;

  @Expose()
  url: string;
}
