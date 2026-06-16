import { IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { TeamFilterDTO } from "./team-filter.dto";
import { TeamSortDTO } from "./team-sort.dto";
import { TeamPaginationDTO } from "./team-pagination.dto";

//?filters[teamName]=team1&sorts[createdAt]=DESC&sorts[updatedAt]=DESC&pagination[limit]=5&pagination[page]=1
export class TeamQueryDTO {
  @IsOptional()
  @ValidateNested()
  @Type(() => TeamFilterDTO)
  filters!: TeamFilterDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => TeamSortDTO)
  sorts!: TeamSortDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => TeamPaginationDTO)
  pagination!: TeamPaginationDTO;
}