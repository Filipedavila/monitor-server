import { Expose } from "class-transformer";

export class WebsiteDTO {
  @Expose()
  id: number;
  @Expose()
  baseUrl: string;
  @Expose()
  createdAt: Date;
  @Expose()
  updatedAt: Date;
}