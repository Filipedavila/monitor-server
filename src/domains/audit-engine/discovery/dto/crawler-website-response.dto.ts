import { Expose, Transform, Type } from "class-transformer";
import { CrawlPageResponseDTO } from "./response/crawl-page-response.dto";

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
  @Expose({ name: "CrawlWebsiteId" })
  id: number;

  @Expose()
  WebsiteId: number;

  @Expose({ name: "StartingUrl" })
  url: string;

  @Expose()
  @Transform(({ obj }) => ({
    maxDepth: obj.Max_Depth,
    maxPages: obj.Max_Pages,
  }))
  settings: {
    maxDepth: number;
    maxPages: number;
  };

  @Expose({ name: "Done" })
  @Type(() => Number)
  @Transform(({ value }) => value === 1)
  isDone: boolean;

  @Expose({ name: "Creation_Date" })
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => CrawlPageResponseDTO)
  pagesCrawled?: CrawlPageResponseDTO[];

  @Expose()
  @Type(() => Number)
  pageCount?: number;
}
