import { Expose, Type } from "class-transformer";
import { UserDTO } from "../../user/dto/user.dto";
import { WebsiteDTO } from "src/domains/inventory/website/dto/website.dto";

export class TeamDTO {
  @Expose()
  id: number;
  @Expose()
  teamName: string;
  @Expose()
  createdAt: Date;
  @Expose()
  updatedAt: Date;
}



export class TeamDetailsDTO extends TeamDTO {
  @Expose()
  @Type(() => WebsiteDTO)

  websites: WebsiteDTO[];
  @Expose()
  @Type(() => UserDTO)
  users: UserDTO[];
}