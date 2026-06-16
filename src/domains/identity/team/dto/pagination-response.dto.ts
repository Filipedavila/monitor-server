import { PaginationResponse } from "src/core/types";
import { TeamDTO } from "./team.dto";

export class TeamPaginationResponse implements PaginationResponse<TeamDTO> {
  data: TeamDTO[];
  count: number;
}