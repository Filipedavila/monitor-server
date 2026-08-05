import { Expose, Type } from "class-transformer";

export class CrawlPageResponseDTO {
  @Expose()
  id: number;

  @Expose()
  uri: string;

  @Expose()
  websiteId: number;
}
