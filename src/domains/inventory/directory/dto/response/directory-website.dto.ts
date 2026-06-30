import { Expose } from "class-transformer";

export class DirectoryWebsiteDTO {
  @Expose()
  id: number;
  @Expose()
  title: string;
  @Expose()
  baseUrl: string;
  @Expose()
  tags?: string[];
}