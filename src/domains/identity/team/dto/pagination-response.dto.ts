import { PaginationResponse } from "@common/repositories/base.repository";
import { TeamDTO } from "./team.dto";

export class TeamPaginationResponse implements PaginationResponse<TeamDTO> {
  data: TeamDTO[];
  meta: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
  };  
}