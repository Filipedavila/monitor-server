import { Expose, Transform, Type } from 'class-transformer';

export class CrawlWebsitesResponseDTO {
  @Expose()
  @Type(() => CrawlWebsiteResponseDTO)
  data: CrawlWebsiteResponseDTO[];

  @Expose()
  meta: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
  };
}

export class CrawlWebsiteResponseDTO {
  @Expose()
  id: number;

  @Expose()
  websiteId: number;

  @Expose()
  baseUrl: string;

  @Expose()
  @Transform(({ obj }) => ({
    maxDepth: obj.Max_Depth,
    maxPages: obj.Max_Pages,
  }))
  settings: {
    maxDepth: number;
    maxPages: number;
  };

  @Expose()
  @Type(() => Number)
  @Transform(({ value }) => value === 1)
  isDone: boolean;

  @Expose()
  @Type(() => Date)
  createdAt: Date;
}
