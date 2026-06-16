import { BaseFilterDTO } from "src/common/dto/request/base-filter.dto";

import { IsNumber, IsOptional, IsString } from "class-validator";
import { Team } from "../../team.entity";

export class TeamFilterDTO
  extends BaseFilterDTO<Team>
  implements Partial<Pick<Team, "id" | "teamName">>
{
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  teamName?: string;

  @IsOptional()
  @IsString()
  searchTerm?: string;
}