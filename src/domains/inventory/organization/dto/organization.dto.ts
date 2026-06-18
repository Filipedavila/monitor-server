import { Expose } from "class-transformer";

export class OrganizationDTO {
  @Expose()
  id: number;
  @Expose()
  shortName: string;
  @Expose()
  longName: string;
  }

