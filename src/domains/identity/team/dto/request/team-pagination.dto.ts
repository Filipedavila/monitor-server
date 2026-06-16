import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";
import { BasePagination } from "src/common/interfaces/types";
import { Team } from "../../team.entity";

export class TeamPaginationDTO
  extends BasePaginationDTO<Team>
  implements BasePagination {}