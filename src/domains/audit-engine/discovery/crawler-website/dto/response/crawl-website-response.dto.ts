import { Expose, Type } from "class-transformer";
import { CrawlPageResponseDTO } from "./crawl-page-response.dto";

export class CrawlWebsiteResponseDTO {
  @Expose()
  id: number;

  @Expose()
  uri: string;

  @Expose()
  @Type(() => CrawlPageResponseDTO)
  pages?: CrawlPageResponseDTO[];
}
